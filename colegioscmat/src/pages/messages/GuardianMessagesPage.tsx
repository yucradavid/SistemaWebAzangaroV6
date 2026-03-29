import { useState, useEffect } from 'react';
import { Send, MessageSquare, User, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { GoBackButton } from '../../components/ui/GoBackButton';

interface Message {
  id: string;
  student_id: string;
  sender_role: 'teacher' | 'guardian';
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
  };
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  section: {
    section_letter: string;
    grade_level: {
      name: string;
    };
  };
}

export function GuardianMessagesPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadChildren();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      loadMessages(selectedChild.id);
      markMessagesAsRead(selectedChild.id);
    }
  }, [selectedChild]);

  async function loadChildren() {
    if (!user) return;

    try {
      setLoading(true);

      // Obtener apoderado
      const { data: guardianList, error: guardianError } = await supabase
        .from('guardians')
        .select('id')
        .eq('user_id', user.id);

      if (guardianError) throw guardianError;

      if (!guardianList || guardianList.length === 0) {
        console.warn('No guardian record found for this user');
        setLoading(false);
        return;
      }

      const guardianData = guardianList[0];

      // Obtener hijos del apoderado
      const { data: childrenData, error: childrenError } = await supabase
        .from('student_guardians')
        .select(`
          student:students(
            id,
            first_name,
            last_name,
            student_code,
            section:sections(
              section_letter,
              grade_level:grade_levels(name)
            )
          )
        `)
        .eq('guardian_id', guardianData.id);

      if (childrenError) throw childrenError;

      const childrenList = (childrenData || [])
        .filter((sg) => sg.student)
        .map((sg) => sg.student as Child);

      setChildren(childrenList);

      if (childrenList.length > 0) {
        setSelectedChild(childrenList[0]);
      }

      // Contar mensajes no leídos
      if (childrenList.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in(
            'student_id',
            childrenList.map((c) => c.id)
          )
          .eq('sender_role', 'teacher')
          .eq('is_read', false);

        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function markMessagesAsRead(studentId: string) {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('student_id', studentId)
        .eq('sender_role', 'teacher')
        .eq('is_read', false);

      // Actualizar solo el contador de no leídos sin recargar todo
      if (children.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in(
            'student_id',
            children.map((c) => c.id)
          )
          .eq('sender_role', 'teacher')
          .eq('is_read', false);

        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim() || !selectedChild || !user) return;

    try {
      setSending(true);

      const { error } = await supabase.from('messages').insert({
        student_id: selectedChild.id,
        sender_role: 'guardian',
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedChild.id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Loading />;

  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <Users className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
            <p className="text-center text-[#64748B]">No se encontraron hijos registrados</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Mensajes</h1>
          <p className="text-[#334155] mt-1">
            Comunicación con docentes
            {unreadCount > 0 && ` - ${unreadCount} no leídos`}
          </p>
        </div>
      </div>

      {/* Selector de hijo */}
      {children.length > 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#64748B]" />
              <h2 className="text-lg font-semibold text-[#0F172A]">Seleccionar Hijo</h2>
            </div>
          </CardHeader>
          <CardContent>
            <Select
              label="Hijo"
              value={selectedChild?.id || ''}
              onChange={(e) => {
                const child = children.find((c) => c.id === e.target.value);
                if (child) setSelectedChild(child);
              }}
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name} - {child.section.grade_level.name} Sección{' '}
                  {child.section.section_letter}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Chat */}
      <Card>
        {selectedChild ? (
          <>
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">
                    Conversación sobre {selectedChild.first_name} {selectedChild.last_name}
                  </h2>
                  <p className="text-sm text-[#64748B]">
                    {selectedChild.section.grade_level.name} - Sección{' '}
                    {selectedChild.section.section_letter}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mensajes */}
              <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-[#CBD5E1] mx-auto mb-2" />
                    <p className="text-sm text-[#64748B]">No hay mensajes aún</p>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Inicia la conversación con el docente
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isGuardian = message.sender_role === 'guardian';
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isGuardian ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${isGuardian
                              ? 'bg-[#10B981] text-white'
                              : 'bg-[#F1F5F9] text-[#0F172A]'
                            }`}
                        >
                          {!isGuardian && message.sender && (
                            <p className="text-xs font-semibold mb-1 text-[#64748B]">
                              {message.sender.full_name} (Docente)
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${isGuardian ? 'text-green-100' : 'text-[#64748B]'
                              }`}
                          >
                            {new Date(message.created_at).toLocaleString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input de mensaje */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-[#E2E8F0] p-4 flex gap-2"
              >
                <textarea
                  className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-none"
                  rows={2}
                  placeholder="Escribe tu mensaje al docente..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <CardContent className="py-24">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
              <p className="text-[#64748B]">Selecciona un hijo para ver los mensajes</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Información */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0F172A] mb-1">Sobre la mensajería</h3>
              <p className="text-sm text-[#64748B]">
                Puedes comunicarte directamente con los docentes de tus hijos de manera privada.
                Los mensajes se mantienen organizados por cada hijo para facilitar el seguimiento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
