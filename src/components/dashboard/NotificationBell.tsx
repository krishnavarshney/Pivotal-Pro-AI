import { FC, useState } from 'react';
import { Bell, Info, AlertTriangle, XCircle, CheckCircle, Trash2, CheckCheck } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Popover } from '../ui/Popover';
import { Button } from '../ui/Button';
import { ToastNotification } from '../../utils/types';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'framer-motion';

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (days > 1) return `${days}d ago`;
    if (days === 1) return `1d ago`;
    if (hours > 1) return `${hours}h ago`;
    if (hours === 1) return `1h ago`;
    if (minutes > 1) return `${minutes}m ago`;
    return "Just now";
}

const notificationConfig = {
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

const NotificationItem: FC<{ notification: ToastNotification }> = ({ notification }) => {
    const config = notificationConfig[notification.type];
    const Icon = config.icon;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                notification.read ? "hover:bg-secondary/50" : "bg-primary/5 hover:bg-primary/10"
            )}
        >
            {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 animate-pulse" />
            )}
            <div className={cn("p-2 rounded-lg flex-shrink-0", config.bg, notification.read && "ml-2")}>
                <Icon size={16} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">
                    {notification.message}
                </p>
                {notification.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.description}
                    </p>
                )}
                <p className="text-xs text-muted-foreground/70 mt-1.5">
                    {formatTimeAgo(notification.timestamp)}
                </p>
            </div>
        </motion.div>
    );
};

export const NotificationBell: FC = () => {
    const { 
        allNotifications,
        unreadNotificationCount,
        markAllNotificationsAsRead,
        clearAllNotifications,
    } = useDashboard();

    const [isOpen, setIsOpen] = useState(false);
    const hasNotifications = allNotifications.length > 0;
    const hasUnread = unreadNotificationCount > 0;

    return (
        <Popover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            trigger={
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative h-9 w-9">
                    <Bell size={18} />
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                            </span>
                        </span>
                    )}
                </Button>
            }
            contentClassName="w-[380px] p-0"
            align="end"
        >
            <div className="flex flex-col max-h-[500px]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
                    <div>
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {hasUnread && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {unreadNotificationCount} unread
                            </p>
                        )}
                    </div>
                    {hasNotifications && (
                        <div className="flex items-center gap-1">
                            {hasUnread && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={markAllNotificationsAsRead}
                                    className="h-8 text-xs"
                                >
                                    <CheckCheck size={14} className="mr-1" />
                                    Mark all read
                                </Button>
                            )}
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={clearAllNotifications}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                    {hasNotifications ? (
                        <div className="p-2 space-y-1">
                            <AnimatePresence>
                                {allNotifications.map(notification => (
                                    <NotificationItem 
                                        key={notification.id} 
                                        notification={notification} 
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                                <Bell size={24} className="text-muted-foreground" />
                            </div>
                            <p className="font-medium text-foreground mb-1">All caught up!</p>
                            <p className="text-sm text-muted-foreground">
                                No new notifications
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Popover>
    );
};
