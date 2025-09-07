
import React, { FC } from 'react';
// FIX: Changed 'Robot' import to 'Bot' as 'Robot' is not an exported member of 'lucide-react'.
import { Bot, User, Sparkle, Plus, Copy, Check } from 'lucide-react';
import { AiChatMessage } from '../../utils/types';
import { useDashboard } from '../../contexts/DashboardProvider';
import { FormattedInsight } from './FormattedInsight';
import { Button } from './Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Tooltip } from './Tooltip';
import { motion } from 'framer-motion';
import { EChartsComponent } from '../charts/EChartsComponent';
import { processWidgetData } from '../../utils/dataProcessing/widgetProcessor';

const ChartPreview: FC<{ suggestion: AiChatMessage['chartSuggestion'] }> = ({ suggestion }) => {
    const { populateEditorFromAI } = useDashboard();
    if (!suggestion) return null;

    const widget = {
        ...suggestion,
        id: 'preview',
        shelves: suggestion.shelves || { columns: [], rows: [], values: [] },
    } as any;

    return (
        <div className="mt-3 bg-secondary/50 p-3 rounded-lg border border-border/50">
            <h4 className="font-semibold text-xs mb-2 text-foreground">{suggestion.title}</h4>
            <div className="h-48 w-full">
                <EChartsComponent 
                    widget={widget} 
                    // FIX: Added 'chartType' to the data prop for EChartsComponent to satisfy type requirements.
                    data={{type: 'chart', labels: ['A', 'B', 'C'], datasets: [{label: 'Sample', data: [10, 20, 15]}], chartType: widget.chartType}} 
                    onElementClick={() => {}} 
                    onElementContextMenu={() => {}}
                />
            </div>
             <Button size="sm" onClick={() => populateEditorFromAI(suggestion)} className="w-full mt-2">
                <Plus size={14} /> Add to Dashboard
            </Button>
        </div>
    );
};


export const ChatBubble: FC<{ message: AiChatMessage }> = ({ message }) => {
    const [copyStatus, copy] = useCopyToClipboard();
    const isUser = message.role === 'user';
    const isThinking = message.content === '...';
    const MotionDiv = motion.div;

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
                    <Sparkle size={20} className="text-primary"/>
                </div>
            )}
             <div className="max-w-xl flex flex-col w-full">
                <div className={`p-4 rounded-xl text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                    {isThinking ? (
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                             <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                             <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        </div>
                    ) : (
                        <>
                            <FormattedInsight text={message.content} className={message.isStreaming ? 'typing-cursor' : ''} />
                            {message.chartSuggestion && <ChartPreview suggestion={message.chartSuggestion} />}
                        </>
                    )}
                </div>

                 {!isThinking && !isUser && (
                    <div className="mt-2 flex items-center justify-end">
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
