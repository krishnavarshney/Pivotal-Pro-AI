import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { useAuth } from '../../contexts/AuthProvider';
import { CommentThread } from './CommentThread';
import { DashboardComment } from '../../utils/types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../ui/utils';

export const CommentOverlay: React.FC = () => {
    const { 
        dashboardMode, 
        activePage, 
        addComment, 
        updateComment, 
        deleteComment,
        activeCommentThread,
        setActiveCommentThread,
        setDashboardMode
    } = useDashboard();
    const { user } = useAuth();

    if (dashboardMode !== 'comment' || !activePage) return null;

    const handleCanvasClick = (e: React.MouseEvent) => {
        // Prevent creating a comment if clicking on an existing pin or thread
        if ((e.target as HTMLElement).closest('.comment-pin') || (e.target as HTMLElement).closest('.comment-thread')) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newComment: DashboardComment = {
            id: uuidv4(),
            widgetId: 'canvas', // Global canvas comment
            position: { x, y },
            messages: []
        };

        // We don't add it to state yet, we just open the thread for the first message
        // Actually, let's add it with a placeholder or handle it in the thread component
        // For simplicity, let's add it immediately but maybe filter out empty ones later?
        // Better: Set it as active thread, but don't save to global state until first message.
        // For now, let's just add it.
        addComment(activePage.id, newComment);
        setActiveCommentThread(newComment);
    };

    const handleReply = (text: string) => {
        if (!activeCommentThread || !user) return;

        const newMessage = {
            id: uuidv4(),
            author: user.name || 'User',
            text,
            timestamp: new Date().toISOString()
        };

        const updatedComment = {
            ...activeCommentThread,
            messages: [...activeCommentThread.messages, newMessage]
        };

        updateComment(activePage.id, updatedComment);
        setActiveCommentThread(updatedComment);
    };

    return (
        <div 
            className="absolute inset-0 z-40 cursor-crosshair"
            onClick={handleCanvasClick}
        >
            {/* Existing Pins */}
            {(activePage.comments || []).map(comment => (
                <motion.button
                    key={comment.id}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    className={cn(
                        "absolute w-8 h-8 -ml-4 -mt-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 comment-pin",
                        activeCommentThread?.id === comment.id ? "bg-primary text-primary-foreground z-50 scale-110 ring-4 ring-primary/20" : "bg-muted text-muted-foreground hover:bg-primary/20"
                    )}
                    style={{ left: comment.position.x, top: comment.position.y }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveCommentThread(comment);
                    }}
                >
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-current opacity-50" />
                    {comment.messages[0]?.author.charAt(0).toUpperCase() || '?'}
                </motion.button>
            ))}

            {/* Active Thread */}
            <AnimatePresence>
                {activeCommentThread && (
                    <div className="comment-thread" onClick={e => e.stopPropagation()}>
                        <CommentThread 
                            comment={activeCommentThread}
                            onClose={() => setActiveCommentThread(null)}
                            onReply={handleReply}
                            onResolve={() => {
                                deleteComment(activePage.id, activeCommentThread.id);
                                setActiveCommentThread(null);
                            }}
                            onDelete={() => {
                                deleteComment(activePage.id, activeCommentThread.id);
                                setActiveCommentThread(null);
                            }}
                        />
                    </div>
                )}
            </AnimatePresence>
            {/* Exit Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setDashboardMode('view');
                }}
                className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-sm transition-colors z-50 flex items-center gap-2 pointer-events-auto"
            >
                <X size={16} /> Exit Comment Mode
            </button>
        </div>
    );
};
