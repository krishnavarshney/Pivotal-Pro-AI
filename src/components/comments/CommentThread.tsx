import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Check, MoreHorizontal, Trash2 } from 'lucide-react';
import { DashboardComment, DashboardCommentMessage } from '../../utils/types';
import { useAuth } from '../../contexts/AuthProvider';
import { cn } from '../ui/utils';
import { formatDistanceToNow } from 'date-fns';

interface CommentThreadProps {
    comment: DashboardComment;
    onClose: () => void;
    onReply: (text: string) => void;
    onResolve: () => void;
    onDelete: () => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ comment, onClose, onReply, onResolve, onDelete }) => {
    const { user } = useAuth();
    const [replyText, setReplyText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        onReply(replyText);
        setReplyText('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-50 w-80 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
                top: comment.position.y,
                left: comment.position.x + 40, // Offset to the right of the pin
                maxHeight: '400px'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-muted-foreground">Active Thread</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onResolve} className="p-1.5 hover:bg-green-500/10 hover:text-green-500 rounded-md transition-colors" title="Resolve">
                        <Check size={14} />
                    </button>
                    <button onClick={onDelete} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors" title="Delete">
                        <Trash2 size={14} />
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {comment.messages.map((msg, index) => (
                    <div key={msg.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0">
                            {msg.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-foreground">{msg.author}</span>
                                <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-border/50 bg-muted/30">
                <div className="relative">
                    <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply..."
                        className="w-full bg-background border border-border/50 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        autoFocus
                    />
                    <button 
                        type="submit"
                        disabled={!replyText.trim()}
                        className="absolute right-1 top-1 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={12} />
                    </button>
                </div>
            </form>
        </motion.div>
    );
};
