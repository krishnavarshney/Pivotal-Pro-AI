
import React, { useState, useRef, useEffect, FC } from 'react';
import _ from 'lodash';
import { motion } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardProvider';
import { useAuth } from '../../contexts/AuthProvider';
import { DashboardComment, DashboardCommentMessage } from '../../utils/types';
import { Button } from '../ui/Button';
import { textareaClasses } from '../ui/utils';
import { X, PaperPlaneTilt } from 'phosphor-react';

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

export const CommentThreadModal: FC<{ comment: DashboardComment | null; onClose: () => void; }> = ({ comment, onClose }) => {
    const { updateComment } = useDashboard();
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const dragConstraintsRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const MotionDiv = motion.div as any;
    const MotionHeader = motion.header as any;
    
    // Check if the first message is empty (i.e., this is a new thread)
    const isNewThread = comment && comment.messages.length === 1 && comment.messages[0].text === '';
    
    useEffect(() => {
        if (isNewThread) {
            // Focus the input for the first message
            inputRef.current?.focus();
        }
    }, [isNewThread, comment]);
    
    const handleSend = () => {
        if (!newMessage.trim() || !comment || !user) return;
        
        const message: DashboardCommentMessage = {
            id: _.uniqueId('msg_'),
            author: user.name,
            text: newMessage.trim(),
            timestamp: new Date().toISOString(),
        };
        
        // If it's a new thread, replace the initial empty message
        const updatedMessages = isNewThread ? [message] : [...comment.messages, message];

        updateComment(comment.id, updatedMessages);
        setNewMessage('');
    };
    
    if (!comment) return null;

    return (
        <div ref={dragConstraintsRef} className="fixed inset-0 pointer-events-none z-[60]">
             <MotionDiv
                drag
                dragConstraints={dragConstraintsRef}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9, x: `calc(50vw - 160px)`, y: `calc(50vh - 200px)` }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto absolute w-80 bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border flex flex-col"
            >
                <MotionHeader
                    drag
                    dragMomentum={false}
                    dragConstraints={dragConstraintsRef}
                    className="p-3 border-b border-border flex items-center justify-between cursor-grab active:cursor-grabbing"
                >
                    <h3 className="font-semibold text-sm">Comment Thread</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={onClose}><X size={16}/></Button>
                </MotionHeader>
                <div className="flex-grow p-3 space-y-3 max-h-80 overflow-y-auto">
                    {comment.messages.filter(msg => msg.text !== '').map(msg => (
                        <div key={msg.id} className="text-sm">
                            <div className="flex items-baseline justify-between">
                                <span className="font-semibold">{msg.author}</span>
                                <span className="text-xs text-muted-foreground">{formatTimeAgo(msg.timestamp)}</span>
                            </div>
                            <p className="text-foreground/90 whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    ))}
                </div>
                <footer className="p-3 border-t border-border">
                    <div className="relative">
                        <textarea 
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={isNewThread ? "Add your comment..." : "Reply..."}
                            rows={2}
                            className={`${textareaClasses} pr-10`}
                        />
                        <Button size="icon" className="absolute right-2 bottom-2 h-8 w-8" onClick={handleSend} disabled={!newMessage.trim()}>
                            <PaperPlaneTilt size={16} weight="fill"/>
                        </Button>
                    </div>
                </footer>
            </MotionDiv>
        </div>
    );
};
