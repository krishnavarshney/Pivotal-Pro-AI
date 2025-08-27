import React, { FC } from 'react';
import { Robot, User, Sparkle, Plus, Copy, Check } from 'phosphor-react';
import { AiChatMessage } from '../../utils/types';
import { useDashboard } from '../../contexts/DashboardProvider';
import { FormattedInsight } from './FormattedInsight';
import { Button } from './Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Tooltip } from './Tooltip';
import { motion } from 'framer-motion';

export const ChatBubble: FC<{ message: AiChatMessage }> = ({ message }) => {
    const { createWidgetFromSuggestion } = useDashboard();
    const [copyStatus, copy] = useCopyToClipboard();
    const isUser = message.role === 'user';
    const isThinking = message.content === '...';
    const MotionDiv = motion.div as any;

    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`flex gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 self-start">
                    <Robot size={20} className="text-primary"/>
                </div>
            )}
             <div className="max-w-xl flex flex-col">
                <div className={`p-4 rounded-xl text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                    {isThinking ? (
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                             <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                             <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        </div>
                    ) : (
                        <FormattedInsight text={message.content} className={message.isStreaming ? 'typing-cursor' : ''} />
                    )}
                </div>

                 {!isThinking && !isUser && (
                    <div className="mt-2 flex items-center justify-between">
                        {message.chartSuggestion ? (
                             <div className="p-2 bg-secondary rounded-xl border border-border flex items-center justify-between gap-3 flex-grow">
                                <div className="flex items-center gap-2">
                                    <Sparkle size={16} weight="fill" className="text-primary" />
                                    <p className="text-sm font-semibold">AI suggestion</p>
                                </div>
                                <Button size="sm" onClick={() => createWidgetFromSuggestion(message.chartSuggestion!)}>
                                    <Plus size={14} /> Create Chart
                                </Button>
                            </div>
                        ) : <div />}
                        
                        <Tooltip content={copyStatus === 'success' ? 'Copied!' : 'Copy response'}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => copy(message.content)}>
                                {copyStatus === 'success' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>
             {isUser && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 self-start">
                    <User size={20} className="text-secondary-foreground"/>
                </div>
            )}
        </MotionDiv>
    );
};
