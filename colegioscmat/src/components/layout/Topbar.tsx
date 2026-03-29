import { Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/Badge';
import { NotificationBell } from './NotificationBell';

export function Topbar() {
  const { profile } = useAuth();

  return (
    <header className="bg-white border-b border-[#CBD5E1] px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#334155]" />
            <input
              type="text"
              placeholder="Buscar estudiante, curso..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#CBD5E1] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />

          <div className="flex items-center gap-3 pl-4 border-l border-[#CBD5E1]">
            <div className="text-right">
              <p className="text-sm font-medium text-[#0F172A]">{profile?.full_name}</p>
              <Badge variant="info" size="sm">
                {profile?.role}
              </Badge>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A8A] to-[#C81E1E] flex items-center justify-center text-white font-semibold">
              {profile?.full_name?.charAt(0) || '?'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
