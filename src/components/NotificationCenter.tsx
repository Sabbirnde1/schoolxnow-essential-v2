import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Calendar, FileText, AlertCircle, Users, BookOpen, Clock, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'schedule_change' | 'exam_date' | 'assignment_deadline' | 'attendance_reminder' | 'grade_updated' | 'announcement';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
  related_id?: string;
  related_type?: string;
  action_url?: string;
}

interface NotificationSettings {
  email_enabled: boolean;
  inapp_enabled: boolean;
  push_enabled: boolean;
  schedule_changes: boolean;
  exam_reminders: boolean;
  assignment_reminders: boolean;
  attendance_reminders: boolean;
  grade_updates: boolean;
  announcements: boolean;
  reminder_advance_days: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export function NotificationCenter() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    inapp_enabled: true,
    push_enabled: false,
    schedule_changes: true,
    exam_reminders: true,
    assignment_reminders: true,
    attendance_reminders: true,
    grade_updates: true,
    announcements: true,
    reminder_advance_days: 1,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
  });

  useEffect(() => {
    if (profile?.user_id) {
      fetchNotifications();
      loadSettings();
      subscribeToNotifications();
    }
  }, [profile?.user_id]);

  const fetchNotifications = async () => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      if (data) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: profile.user_id,
          settings: newSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const subscribeToNotifications = () => {
    if (!profile?.user_id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.user_id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if enabled
          if (settings.push_enabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: '/logo.png',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile.user_id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        saveSettings({ ...settings, push_enabled: true });
      }
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'schedule_change':
        return <Calendar className={iconClass} />;
      case 'exam_date':
        return <FileText className={iconClass} />;
      case 'assignment_deadline':
        return <Clock className={iconClass} />;
      case 'attendance_reminder':
        return <Users className={iconClass} />;
      case 'grade_updated':
        return <BookOpen className={iconClass} />;
      case 'announcement':
        return <AlertCircle className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'low':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Notification Settings</DialogTitle>
                  </DialogHeader>
                  <NotificationSettingsForm 
                    settings={settings} 
                    onSave={saveSettings}
                    onRequestPermission={requestNotificationPermission}
                  />
                </DialogContent>
              </Dialog>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          {notification.priority === 'urgent' && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={clearAllNotifications}
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Clear All
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}

interface NotificationSettingsFormProps {
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
  onRequestPermission: () => void;
}

function NotificationSettingsForm({ settings, onSave, onRequestPermission }: NotificationSettingsFormProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSave(localSettings);
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inapp">In-App Notifications</Label>
              <p className="text-xs text-muted-foreground">Show notifications in the app</p>
            </div>
            <Switch
              id="inapp"
              checked={localSettings.inapp_enabled}
              onCheckedChange={(checked) => updateSetting('inapp_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              id="email"
              checked={localSettings.email_enabled}
              onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push">Browser Push Notifications</Label>
              <p className="text-xs text-muted-foreground">Show desktop notifications</p>
            </div>
            <div className="flex items-center gap-2">
              {!('Notification' in window) ? (
                <span className="text-xs text-muted-foreground">Not supported</span>
              ) : Notification.permission === 'denied' ? (
                <span className="text-xs text-red-600">Blocked</span>
              ) : Notification.permission === 'default' ? (
                <Button size="sm" onClick={onRequestPermission}>
                  Enable
                </Button>
              ) : (
                <Switch
                  id="push"
                  checked={localSettings.push_enabled}
                  onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="schedule">Schedule Changes</Label>
            <Switch
              id="schedule"
              checked={localSettings.schedule_changes}
              onCheckedChange={(checked) => updateSetting('schedule_changes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="exams">Exam Reminders</Label>
            <Switch
              id="exams"
              checked={localSettings.exam_reminders}
              onCheckedChange={(checked) => updateSetting('exam_reminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="assignments">Assignment Deadlines</Label>
            <Switch
              id="assignments"
              checked={localSettings.assignment_reminders}
              onCheckedChange={(checked) => updateSetting('assignment_reminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="attendance">Attendance Reminders</Label>
            <Switch
              id="attendance"
              checked={localSettings.attendance_reminders}
              onCheckedChange={(checked) => updateSetting('attendance_reminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="grades">Grade Updates</Label>
            <Switch
              id="grades"
              checked={localSettings.grade_updates}
              onCheckedChange={(checked) => updateSetting('grade_updates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="announcements">Announcements</Label>
            <Switch
              id="announcements"
              checked={localSettings.announcements}
              onCheckedChange={(checked) => updateSetting('announcements', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reminder Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="advance">Remind Me In Advance</Label>
            <Select
              value={localSettings.reminder_advance_days.toString()}
              onValueChange={(value) => updateSetting('reminder_advance_days', parseInt(value))}
            >
              <SelectTrigger id="advance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">On the day</SelectItem>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="2">2 days before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quiet Hours</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Don't send notifications during these hours
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start" className="text-xs">From</Label>
                <input
                  id="quiet-start"
                  type="time"
                  value={localSettings.quiet_hours_start}
                  onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="quiet-end" className="text-xs">To</Label>
                <input
                  id="quiet-end"
                  type="time"
                  value={localSettings.quiet_hours_end}
                  onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
