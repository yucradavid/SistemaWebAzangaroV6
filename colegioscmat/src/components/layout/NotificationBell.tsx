import { useState, useEffect } from 'react';
import { Bell, X, Check, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'no_leida' | 'leida';
  created_at: string;
  read_at: string | null;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Suscribirse a nuevas notificaciones
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  async function loadNotifications() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => n.status === 'no_leida').length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'leida', read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'leida', read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'no_leida');

      if (error) throw error;

      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'evaluacion_publicada':
        return '📝';
      case 'justificacion_aprobada':
        return '✅';
      case 'justificacion_rechazada':
        return '❌';
      case 'pago_registrado':
        return '💳';
      case 'comunicado_nuevo':
        return '📢';
      case 'tarea_nueva':
        return '📚';
      case 'recordatorio_pago':
        return '🔔';
      default:
        return '📋';
    }
  }

  function formatTimeAgo(date: string) {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);

    if (diffInMins < 1) return 'Ahora';
    if (diffInMins < 60) return `Hace ${diffInMins} min`;
    if (diffInMins < 1440) return `Hace ${Math.floor(diffInMins / 60)} h`;
    return `Hace ${Math.floor(diffInMins / 1440)} días`;
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-gray-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <Badge variant="error">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Marcar todas
                  </Button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        notif.status === 'no_leida' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (notif.status === 'no_leida') {
                          markAsRead(notif.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-gray-900">
                              {notif.title}
                            </h4>
                            {notif.status === 'no_leida' && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(notif.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                <button className="text-sm text-blue-900 hover:underline font-medium">
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
