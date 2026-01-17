import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/lib/types';
import { Loader2, Bell, CheckCircle2, Clock, ArrowRight, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data as Notification[]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToNotifications() {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user?.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          toast.info('New notification received');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    toast.success('All notifications marked as read');
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const getNotificationLink = (notification: Notification) => {
    if (notification.related_task_id) {
      return `/tasks/${notification.related_task_id}`;
    }
    if (notification.related_change_id) {
      return `/change/${notification.related_change_id}`;
    }
    return '#';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'task_completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'change_completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      default:
        return <Bell className="w-5 h-5 text-info" />;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
              <Check className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <Card className="border-2">
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to={getNotificationLink(notification)}
                    onClick={() => !notification.read_at && markAsRead(notification.id)}
                    className={cn(
                      'flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors',
                      !notification.read_at && 'bg-primary/5'
                    )}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('font-medium', !notification.read_at && 'text-foreground')}>
                          {notification.title}
                        </p>
                        {!notification.read_at && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
