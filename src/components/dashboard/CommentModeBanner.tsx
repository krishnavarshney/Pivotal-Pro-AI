import React, { FC } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';

export const CommentModeBanner: FC = () => {
    const { setDashboardMode } = useDashboard();

    return (
        <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
        >
            <div className="glass-panel rounded-xl p-3 flex items-center gap-4 shadow-lg border border-border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <p className="font-semibold text-foreground">Comment Mode</p>
                    <p className="text-sm text-muted-foreground">Click on a widget to add a comment.</p>
                </div>
                <Button onClick={() => setDashboardMode('view')} className="ml-4">
                    Exit Mode
                </Button>
            </div>
        </motion.div>
    );
};
