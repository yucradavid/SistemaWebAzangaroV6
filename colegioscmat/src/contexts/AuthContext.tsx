import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../lib/database.types';

interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false); // Track if we've done the first load

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Only show loading on the very first load
        loadProfile(session.user.id, !initialLoadDone.current);
        initialLoadDone.current = true;
      } else {
        setLoading(false);
        initialLoadDone.current = true;
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Never show global loading after initial load, regardless of event type
          // The initial load flag protects us from window focus triggers
          await loadProfile(session.user.id, false);
        } else {
          setProfile(null);
          // Only set loading to false if we're not in the middle of initial load
          if (initialLoadDone.current) {
            setLoading(false);
          }
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string, showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      // Solo actualizar el estado si los datos han cambiado realmente
      // Esto evita re-renders innecesarios en componentes que usan el profile
      setProfile(current => {
        if (!data) return null;
        if (!current) return data;
        // Comparar campos clave para ver si hay cambios reales
        if (current.id === data.id &&
          current.role === data.role &&
          current.full_name === data.full_name &&
          current.email === data.email &&
          current.avatar_url === data.avatar_url) {
          return current; // Mantener la misma referencia
        }
        return data; // Hay cambios, usar la nueva data
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error };
      if (!data.user) return { error: new Error('No user returned') };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          role,
          full_name: fullName,
          email,
          is_active: true,
        });

      if (profileError) return { error: profileError };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
