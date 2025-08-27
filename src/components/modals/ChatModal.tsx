import React, { useState, useRef, useEffect, FC, KeyboardEvent } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Dialog, DialogOverlay, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { textareaClasses, cn } from '../ui/utils';
import { ChatBubble } from '../ui/ChatBubble';
import { ChatTeardropDots, PaperPlaneTilt, Trash, X } from 'phosphor-react';

export const ChatModal: FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { aiChatHistory, sendAiChatMessage, clearAiChatHistory, openConfirmationModal, chatContext, setChatContext, widgets } = useDashboard();
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const widgetInContext = chatContext ? widgets.find(w => w.id === chatContext.widgetId) : null;

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent
                containerClassName="w-[95%] max-w-3xl"
                className="max-h-[85vh] flex flex-col p-0"
                hideCloseButton
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 glass-header border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <ChatTeardropDots size={22} weight="bold" className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground font-display">AI Chat Assistant</h3>
                            <p className="text-sm text-muted-foreground">Ask questions about your data.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {aiChatHistory.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleClearChat}>
                                <Trash size={16} /> Clear Chat
                            </Button>
                        )}
                    </div>
                </header>

                <main className="flex-grow p-4 md:p-6 min-h-0 overflow-y-auto bg-secondary/30">
                    {widgetInContext && (
                        <div className="bg-primary/10 border border-primary/20 text-primary-foreground p-2 rounded-lg mb-4 text-sm flex items-center justify-between gap-2">
                           <div className="flex items-center gap-2">
                             <span className="font-semibold text-primary">Context:</span>
                             <span className="text-primary/90 truncate">{widgetInContext.title}</span>
                           </div>
                           <button onClick={() => setChatContext(null)} className="p-1 rounded-full hover:bg-primary/20"><X size={14} className="text-primary"/></button>
                        </div>
                    )}
                    <div className="space-y-6">
                        {aiChatHistory.map(message => <ChatBubble key={message.id} message={message} />)}
                        <div ref={chatEndRef} />
                    </div>
                </main>
                
                <footer className="p-4 border-t border-border/50 glass-header flex-shrink-0">
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={widgetInContext ? `Ask about "${widgetInContext.title}"...` : "Ask the AI anything about your data..."}
                            className={`${textareaClasses} pr-12`}
                            rows={1}
                            style={{ maxHeight: '150px' }}
                        />
                        <Button
                            size="icon"
                            className="absolute right-2 bottom-2 h-9 w-9"
                            onClick={handleSend}
                            disabled={!input.trim()}
                        >
                            <PaperPlaneTilt size={18} weight="fill" />
                        </Button>
                    </div>
                </footer>
            </DialogContent>
        </Dialog>
    );
};