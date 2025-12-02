
import React, { FC } from 'react';
// FIX: Changed 'Robot' import to 'Bot' as 'Robot' is not an exported member of 'lucide-react'.
import { User, Sparkle, Copy, Check } from 'lucide-react';
import { AiChatMessage, DashboardPage, WidgetState } from '../../utils/types';
import { useDashboard } from '../../contexts/DashboardProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Tooltip } from './Tooltip';
import { motion } from 'framer-motion';
import { EChartsComponent } from '../charts/EChartsComponent';
import { processWidgetData } from '../../utils/dataProcessing/widgetProcessor';

const ChartPreview: FC<{ suggestion: AiChatMessage['chartSuggestion'] }> = ({ suggestion }) => {
    const { pages, transferWidgetToPage, blendedData, blendedFields, globalFilters, crossFilter, parameters } = useDashboard();
    const [isTransferring, setIsTransferring] = React.useState(false);
    
    if (!suggestion) return null;

    // Convert AI field names to Pill objects
    const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
    
    // AI returns fields directly on suggestion object (suggestion.rows, suggestion.values), 
    // NOT under suggestion.shelves
    // Also: chart type is 'type' not 'chartType', and title may not exist
    const aiRows = (suggestion as any).rows || [];
    const aiColumns = (suggestion as any).columns || [];
    const aiValues = (suggestion as any).values || [];
    const chartType = (suggestion as any).type || suggestion.chartType || 'Bar';
    const chartTitle = suggestion.title || (suggestion as any).title || 
                      `${aiValues.join(', ')} by ${[...aiRows, ...aiColumns].join(', ')}`;
    
    const convertDimensionsToPills = (fieldNames: string[] | undefined): any[] => {
        if (!fieldNames) return [];
        return fieldNames.map(name => {
            const field = allFields.find(f => f.simpleName.toLowerCase() === name.toLowerCase());
            if (!field) {
                console.warn(`Field "${name}" not found in dataset`);
                return null;
            }
            return {
                name: field.name,
                simpleName: field.simpleName,
                type: field.type,
                aggregation: field.type === 'MEASURE' ? 'SUM' : 'COUNT'
            };
        }).filter(Boolean);
    };

    const convertValuesToPills = (values: any[] | undefined): any[] => {
        if (!values) return [];
        return values.map(v => {
            // Handle both string format and object format
            const fieldName = typeof v === 'string' ? v : v.name;
            const aggregation = typeof v === 'string' ? 'SUM' : (v.aggregation || 'SUM');
            
            const field = allFields.find(f => f.simpleName.toLowerCase() === fieldName.toLowerCase());
            if (!field) {
                console.warn(`Field "${fieldName}" not found in dataset`);
                return null;
            }
            return {
                name: field.name,
                simpleName: field.simpleName,
                type: field.type,
                aggregation: aggregation
            };
        }).filter(Boolean);
    };

    const widget: WidgetState = {
        id: 'preview',
        pageId: '',
        title: chartTitle,
        chartType: chartType as any,
        shelves: {
            columns: convertDimensionsToPills(aiColumns),
            rows: convertDimensionsToPills(aiRows),
            values: convertValuesToPills(aiValues),
            filters: [],
        },
        displayMode: chartType === 'Table' ? 'table' : 'chart',
        colorPalette: 'Pivotal Pro',
        subtotalSettings: { rows: false, columns: false, grandTotal: true },
        configuration: {},
        layouts: {},
    };

    // Process real data using the widget configuration
    const processedData = React.useMemo(() => {
        try {
            return processWidgetData(blendedData, widget, globalFilters || [], crossFilter, parameters || {});
        } catch (error) {
            console.error('Error processing widget data for preview:', error);
            return { type: 'chart', labels: ['No Data'], datasets: [{ label: 'Error', data: [0] }], chartType: widget.chartType };
        }
    }, [blendedData, widget.shelves, globalFilters, crossFilter, parameters]);

    const handleTransferToPage = async (pageId: string) => {
        console.log('=== TRANSFER DEBUG ===');
        console.log('Full AI suggestion:', suggestion);
        console.log('Chart type from suggestion:', suggestion.chartType, suggestion.type, (suggestion as any).chartType);
        console.log('Title from suggestion:', suggestion.title, (suggestion as any).title);
        
        setIsTransferring(true);
        try {
            await transferWidgetToPage(pageId, suggestion);
        } catch (error) {
            console.error('Failed to transfer widget:', error);
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <div className="mt-3 bg-secondary/50 p-3 rounded-lg border border-border/50">
            <h4 className="font-semibold text-xs mb-2 text-foreground">{suggestion.title}</h4>
            <div className="h-48 w-full">
                <EChartsComponent 
                    widget={widget} 
                    data={processedData}
                    onElementClick={() => {}} 
                    onElementContextMenu={() => {}}
                />
            </div>
            <div className="mt-2">
                <select
                    onChange={(e) => handleTransferToPage(e.target.value)}
                    disabled={isTransferring || !pages || pages.length === 0}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="">Transfer to Page...</option>
                    {pages && pages.map((page: DashboardPage) => (
                        <option key={page.id} value={page.id}>
                            {page.name}
                        </option>
                    ))}
                </select>
            </div>
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
                            <div className={`
                                    prose prose-sm dark:prose-invert max-w-none
                                    prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground
                                    prose-p:text-foreground/90 prose-p:leading-relaxed
                                    prose-strong:text-foreground prose-strong:font-semibold
                                    prose-ul:my-2 prose-li:my-0.5
                                    prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
                                    prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-lg
                                    ${message.isStreaming ? 'typing-cursor' : ''}
                                `}>
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        table: ({node, ...props}) => <div className="overflow-x-auto my-4 border rounded-lg"><table {...props} className="w-full text-sm text-left" /></div>,
                                        thead: ({node, ...props}) => <thead {...props} className="bg-muted/50 text-xs uppercase font-semibold" />,
                                        th: ({node, ...props}) => <th {...props} className="px-4 py-2 border-b border-border" />,
                                        td: ({node, ...props}) => <td {...props} className="px-4 py-2 border-b border-border/50" />,
                                        a: ({node, ...props}) => <a {...props} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" />,
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            </div>
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
