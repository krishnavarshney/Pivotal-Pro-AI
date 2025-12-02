

import { useState, useRef, useEffect, FC, KeyboardEvent } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Dialog, DialogOverlay, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { textareaClasses } from '../ui/utils';
import { ChatBubble } from '../ui/ChatBubble';
// FIX: Changed 'PaperPlaneTilt' import from 'lucide-react' to 'phosphor-react'.
import { Sparkle, Trash2, X, Brain } from 'lucide-react';
import { PaperPlaneTilt } from 'phosphor-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WidgetState, AiChatMessage } from '../../utils/types';

export const ChatModal: FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { aiChatHistory, sendAiChatMessage, clearAiChatHistory, openConfirmationModal, chatContext, setChatContext, widgets } = useDashboard();
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const MotionDiv = motion.div;

    const widgetInContext = chatContext ? widgets.find((w: WidgetState) => w.id === chatContext.widgetId) : null;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiChatHistory]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const handleSend = () => {
        if (input.trim()) {
            sendAiChatMessage(input.trim(), chatContext);
            setInput('');
        }
    };
    
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const handleClearChat = () => {
        openConfirmationModal({
            title: "Clear Chat History?",
            message: "Are you sure you want to delete this conversation?",
            onConfirm: clearAiChatHistory,
        });
    };
    
    const lastAiMessage = [...aiChatHistory].reverse().find(m => m.role === 'assistant');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent
                containerClassName="w-[95%] max-w-3xl"
                className="max-h-[85vh] h-[85vh] flex flex-col p-0"
                hideCloseButton
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 glass-header border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkle size={22} className="text-primary"/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground font-display">AI Assistant</h3>
                            <p className="text-sm text-muted-foreground">Ask questions about your data.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {aiChatHistory.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleClearChat}>
                                <Trash2 size={16} /> Clear Chat
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}><X size={16}/></Button>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-secondary/30">
                    <div className="space-y-6">
                        {aiChatHistory.length === 0 && (
                             <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-16">
                                <Brain size={48} className="opacity-30 mb-4" />
                                <h3 className="text-xl font-semibold text-foreground">How can I help you analyze your data?</h3>
                                <p className="max-w-sm mx-auto mt-2">You can ask for summaries, trends, or even request a new chart.</p>
                            </div>
                        )}
                        {aiChatHistory.map((message: AiChatMessage) => <ChatBubble key={message.id} message={message} />)}
                        <div ref={chatEndRef} />
                    </div>
                </main>
                
                <footer className="p-4 border-t border-border/50 glass-header flex-shrink-0 space-y-3 bg-background/50 backdrop-blur-sm">
                    <AnimatePresence>
                    {lastAiMessage && lastAiMessage.followUpSuggestions && (
                        <MotionDiv 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex flex-wrap items-center gap-2"
                        >
                            {lastAiMessage.followUpSuggestions.map((suggestion: string, i: number) => (
                                <Button key={i} variant="outline" size="sm" onClick={() => sendAiChatMessage(suggestion, chatContext)} className="rounded-full text-xs border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors">
                                    {suggestion}
                                </Button>
                            ))}
                        </MotionDiv>
                    )}
                    </AnimatePresence>
                    {widgetInContext && (
                        <div className="bg-primary/5 border border-primary/20 text-foreground p-2 rounded-lg text-sm flex items-center justify-between gap-2 shadow-sm">
                           <div className="flex items-center gap-2 overflow-hidden">
                             <span className="font-semibold text-primary whitespace-nowrap">Context:</span>
                             <span className="text-foreground/90 truncate font-medium">{widgetInContext.title}</span>
                           </div>
                           <button onClick={() => setChatContext(null)} className="p-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"><X size={14}/></button>
                        </div>
                    )}
                    <div className="relative group">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={widgetInContext ? `Ask about "${widgetInContext.title}"...` : "Ask the AI anything about your data..."}
                            className={`${textareaClasses} pr-12 min-h-[50px] max-h-[200px] resize-none py-3 shadow-sm border-border/60 focus:border-primary/50 focus:ring-primary/20 bg-background`}
                            rows={1}
                        />
                        <Button
                            size="icon"
                            className="absolute right-2 bottom-2 h-8 w-8 transition-all duration-200"
                            onClick={handleSend}
                            disabled={!input.trim()}
                        >
                            <PaperPlaneTilt size={16} weight="fill" />
                        </Button>
                    </div>
                </footer>
            </DialogContent>
        </Dialog>
    );
};
