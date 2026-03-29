import { useState, useEffect } from 'react';
import { Send, MessageSquare, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
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

interface Student {
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

interface Conversation {
  student: Student;
  messages: Message[];
  unreadCount: number;
  lastMessage: Message | null;
}

export function TeacherMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (selectedStudent) {
      loadMessages(selectedStudent.id);
      markMessagesAsRead(selectedStudent.id);
    }
  }, [selectedStudent]);

  async function loadConversations() {
    if (!user) return;

    try {
      setLoading(true);

      // Verificar si el usuario es admin/director/coordinator
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const isAdminRole = ['admin', 'director', 'coordinator'].includes(profileData?.role || '');

      if (!isAdminRole) {
        // Obtener docente (solo si no es admin)
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (teacherError) throw teacherError;

        if (!teacherData) {
          console.warn('No teacher record found');
          setLoading(false);
          return;
        }
      }

      // Obtener estudiantes del docente
      const { data: studentsData, error: studentsError } = await supabase
        .from('course_assignments')
        .select(`
          course:courses(
            section:sections(
              students(
                id,
                first_name,
                last_name,
                student_code,
                section:sections(
                  section_letter,
                  grade_level:grade_levels(name)
                )
              )
            )
          )
        `)
        .eq('teacher_id', teacherData.id);

      if (studentsError) throw studentsError;

      // Extraer estudiantes únicos
      const studentsSet = new Set<string>();
      const studentsList: Student[] = [];

      studentsData?.forEach((assignment) => {
        const section = assignment.course?.section;
        if (section && section.students) {
          section.students.forEach((student: Student) => {
            if (!studentsSet.has(student.id)) {
              studentsSet.add(student.id);
              studentsList.push(student);
            }
          });
        }
      });

      // Cargar mensajes para cada estudiante
      const { data: allMessages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name)
        `)
        .in(
          'student_id',
          studentsList.map((s) => s.id)
        )
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Agrupar mensajes por estudiante
      const conversationsList: Conversation[] = studentsList.map((student) => {
        const studentMessages = (allMessages || []).filter(
          (m) => m.student_id === student.id
        );
        const unreadCount = studentMessages.filter(
          (m) => !m.is_read && m.sender_role === 'guardian'
        ).length;
        const lastMessage = studentMessages.length > 0 ? studentMessages[studentMessages.length - 1] : null;

        return {
          student,
          messages: studentMessages,
          unreadCount,
          lastMessage,
        };
      });

      // Ordenar por última actividad
      conversationsList.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      });

      setConversations(conversationsList);

      // Seleccionar primera conversación si hay
      if (conversationsList.length > 0 && !selectedStudent) {
        setSelectedStudent(conversationsList[0].student);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
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
        .eq('sender_role', 'guardian')
        .eq('is_read', false);

      // Actualizar conversaciones
      loadConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim() || !selectedStudent || !user) return;

    try {
      setSending(true);

      const { error } = await supabase.from('messages').insert({
        student_id: selectedStudent.id,
        sender_role: 'teacher',
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedStudent.id);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Mensajes</h1>
          <p className="text-[#334155] mt-1">
            Comunicación con apoderados
            {totalUnread > 0 && ` - ${totalUnread} no leídos`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de conversaciones */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold text-[#0F172A]">
              Conversaciones ({conversations.length})
            </h2>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-[#CBD5E1] mx-auto mb-2" />
                <p className="text-sm text-[#64748B]">No hay conversaciones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.student.id}
                    onClick={() => setSelectedStudent(conv.student)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedStudent?.id === conv.student.id
                        ? 'bg-[#3B82F6] text-white'
                        : 'hover:bg-[#F8FAFC]'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm">
                        {conv.student.first_name} {conv.student.last_name}
                      </h3>
                      {conv.unreadCount > 0 && (
                        <Badge variant="error" className="text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`text-xs ${selectedStudent?.id === conv.student.id ? 'text-blue-100' : 'text-[#64748B]'
                        }`}
                    >
                      {conv.student.section.grade_level.name} - Sección{' '}
                      {conv.student.section.section_letter}
                    </p>
                    {conv.lastMessage && (
                      <p
                        className={`text-xs mt-1 truncate ${selectedStudent?.id === conv.student.id
                            ? 'text-blue-100'
                            : 'text-[#94A3B8]'
                          }`}
                      >
                        {conv.lastMessage.content.substring(0, 40)}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2">
          {selectedStudent ? (
            <>
              <CardHeader className="border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0F172A]">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h2>
                    <p className="text-sm text-[#64748B]">
                      {selectedStudent.section.grade_level.name} - Sección{' '}
                      {selectedStudent.section.section_letter}
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
                        Inicia la conversación con el apoderado
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isTeacher = message.sender_role === 'teacher';
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isTeacher ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${isTeacher
                                ? 'bg-[#3B82F6] text-white'
                                : 'bg-[#F1F5F9] text-[#0F172A]'
                              }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${isTeacher ? 'text-blue-100' : 'text-[#64748B]'
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
                    className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
                    rows={2}
                    placeholder="Escribe tu mensaje..."
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
                <p className="text-[#64748B]">Selecciona una conversación para comenzar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
