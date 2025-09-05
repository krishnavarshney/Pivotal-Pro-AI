import React, { FC } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { ToastNotification } from '../../utils/types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Warning, Info, XCircle, X } from 'phosphor-react';
import { Button } from './Button';

const icons = {
    success: <CheckCircle weight="fill" className="text-green-500" size={24} />,
    error: <XCircle weight="fill" className="text-red-500" size={24} />,
    info: <Info weight="fill" className="text-blue-500" size={24} />,
    warning: <Warning weight="fill" className="text-yellow-500" size={24} />,
};

const Toast: FC<{ notification: ToastNotification }> = ({ notification }) => {
    const { removeToast } = useDashboard();
    const MotionDiv = motion.div;

    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-4 rounded-xl bg-popover p-4 text-popover-foreground shadow-2xl border border-border"
        >
            <div className="flex-shrink-0 mt-0.5">{icons[notification.type]}</div>
            <div className="flex-grow">
                <p className="font-semibold text-sm">{notification.message}</p>
                {notification.description && <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>}
                {notification.action && (
                    <Button
                        size="sm"
                        variant="link"
                        className="p-0 h-auto mt-2 text-primary"
                        onClick={() => {
                            notification.action?.onClick();
                            removeToast(notification.id);
                        }}
                    >
                        {notification.action.label}
                    </Button>
                )}
            </div>
            <button onClick={() => removeToast(notification.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1 -mt-2 -mr-2">
                <X size={16} />
            </button>
        </MotionDiv>
    );
};

export const ToastContainer: FC = () => {
    const { toastNotifications } = useDashboard();

    return (
        <div className="fixed top-4 right-4 z-[200] pointer-events-none flex flex-col gap-3">
            <AnimatePresence>
                {toastNotifications.map(notification => (
                    <Toast key={notification.id} notification={notification} />
                ))}
            </AnimatePresence>
        </div>
    );
};