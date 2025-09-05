import React, { FC, ReactNode } from 'react';
// FIX: Replaced non-existent 'Warning' icon with 'AlertTriangle'.
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Popover } from '../ui/Popover';
import { Button } from '../ui/Button';
import { ToastNotification } from '../../utils/types';
import { cn } from '../ui/utils';

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (days > 1) return `${days} days ago`;
    if (days === 1) return `Yesterday`;
    if (hours > 1) return `${hours} hours ago`;
    if (minutes > 1) return `${minutes} minutes ago`;
    return "just now";
}

const notificationIcons: Record<ToastNotification['type'], ReactNode> = {
    success: <CheckCircle className="text-green-500" />,
    error: <XCircle className="text-red-500" />,
    info: <Info className="text-blue-500" />,
    // FIX: Replaced non-existent 'Warning' icon with 'AlertTriangle'.
    warning: <AlertTriangle className="text-yellow-500" />,
};

const NotificationItem: FC<{ notification: ToastNotification }> = ({ notification }) => (
    <div className="flex items-start gap-3 p-3 hover:bg-accent rounded-lg">
        {!notification.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
        <div className={cn("flex-shrink-0 mt-0.5", notification.read && "ml-3.5")}>
            {notificationIcons[notification.type]}
        </div>
        <div className="flex-grow">
            <p className="font-semibold text-sm text-foreground">{notification.message}</p>
            {notification.description && <p className="text-xs text-muted-foreground">{notification.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.timestamp)}</p>
        </div>
    </div>
);

const NotificationPanel: FC<{ close: () => void }> = ({ close }) => {
    const { allNotifications, clearAllNotifications } = useDashboard();
    
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {allNotifications.length > 0 && (
                     <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-destructive">
                        <Trash2 size={14} /> Clear All
                    </Button>
                )}
            </header>
            <div className="flex-grow overflow-y-auto">
                {allNotifications.length > 0 ? (
                    allNotifications.map(n => <NotificationItem key={n.id} notification={n} />)
                ) : (
                    <div className="text-center p-8 text-muted-foreground text-sm">
                        <Bell size={32} className="mx-auto mb-2" />
                        <p>You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const NotificationBell: FC = () => {
    const { 
        unreadNotificationCount,
        isNotificationPanelOpen,
        openNotificationPanel,
        closeNotificationPanel,
    } = useDashboard();

    return (
        <Popover
            isOpen={isNotificationPanelOpen}
            onClose={closeNotificationPanel}
            trigger={
                <Button variant="ghost" size="icon" onClick={openNotificationPanel} className="relative h-9 w-9 p-0">
                    <Bell size={18} />
                    {unreadNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-background">
                            {unreadNotificationCount}
                             <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-info-pulse"></span>
                        </span>
                    )}
                </Button>
            }
            contentClassName="w-80 h-[50vh] p-0 flex flex-col"
            align="right"
        >
            {({ close }) => <NotificationPanel close={close} />}
        </Popover>
    );
};