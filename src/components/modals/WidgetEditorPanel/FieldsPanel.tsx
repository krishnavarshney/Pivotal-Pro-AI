import React, { useState, useMemo, useEffect, useCallback, FC } from 'react';
import { useDashboard } from '../../../contexts/DashboardProvider';
import { Field, FieldType, AiChatMessage, DND_ITEM_TYPE, FieldDragItem } from '../../../utils/types';
import * as aiService from '../../../services/aiService';
import { Sparkle, Search, RefreshCw, Type, Hash, Clock } from 'lucide-react';
import { Button } from '../../ui/Button';
import { FieldInfoPopover } from '../../ui/FieldInfoPopover';
import { textareaClasses, inputClasses, cn } from '../../ui/utils';
import { Checkbox } from '../../ui/Checkbox';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import _ from 'lodash';
import { notificationService } from '../../../services/notificationService';

const SelectableFieldRow: FC<{ field: Field }> = ({ field }) => {
    const { editingWidgetState, toggleFieldInEditorShelves, blendedData } = useDashboard();
    
    const isChecked = useMemo(() => {
        if (!editingWidgetState) return false;
        const allPills = _.flatMap(Object.values(editingWidgetState.shelves), shelf => Array.isArray(shelf) ? shelf : []);
        return allPills.some(p => p.name === field.name);
    }, [editingWidgetState, field.name]);

    const handleToggle = () => {
        toggleFieldInEditorShelves(field);
    };

    const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
        type: DND_ITEM_TYPE.FIELD,
        item: { name: field.name, simpleName: field.simpleName, type: field.type, isCalculated: field.isCalculated, formula: field.formula } as FieldDragItem,
        collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }));

    useEffect(() => {
        dragPreview(getEmptyImage(), { captureDraggingState: true });
    }, [dragPreview]);

    const getIcon = () => {
        switch(field.type) {
            case FieldType.MEASURE: return <Hash size={14} className="text-green-500" />;
            case FieldType.DATETIME: return <Clock size={14} className="text-purple-500" />;
            default: return <Type size={14} className="text-blue-500" />;
        }
    };
    
    return (
        <div className={cn(
            "flex items-center gap-2 bg-card border border-border rounded-lg p-2 transition-colors",
            isChecked && "bg-primary/10 border-primary/50",
            isDragging && "opacity-30"
        )}>
            <Checkbox 
                checked={isChecked}
                onCheckedChange={handleToggle}
                aria-label={`Select ${field.simpleName}`}
            />
            <div ref={drag as any} className="flex-grow flex items-center gap-2 cursor-grab truncate">
                {getIcon()}
                <FieldInfoPopover field={field} isDragging={isDragging} blendedData={blendedData}>
                    <span className="font-medium text-sm text-foreground truncate cursor-help">{field.simpleName}</span>
                </FieldInfoPopover>
            </div>
        </div>
    );
};


export const FieldsPanel: FC = () => {
    const { 
        blendedFields, 
        aiConfig, 
        populateEditorFromAI, 
        widgetEditorAIPrompt, 
        setWidgetEditorAIPrompt,
        blendedData
    } = useDashboard();
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [fieldSearch, setFieldSearch] = useState('');

    const filteredFields = useMemo(() => {
        const lowerSearch = fieldSearch.toLowerCase();
        return {
            dimensions: blendedFields.dimensions.filter(f => f.simpleName.toLowerCase().includes(lowerSearch)),
            measures: blendedFields.measures.filter(f => f.simpleName.toLowerCase().includes(lowerSearch)),
        };
    }, [blendedFields, fieldSearch]);

    const handleGenerateClick = useCallback(async (prompt: string) => {
        if (!aiConfig) {
            notificationService.error("AI is not configured.");
            return;
        }
        if (!prompt.trim()) return;
        setIsGenerating(true);
        try {
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            const explicitPrompt = `Generate a visualization for: ${prompt}`;
            const chatHistory: AiChatMessage[] = [{ id: '1', role: 'user', content: explicitPrompt }];
            const { chartSuggestion } = await aiService.getChatResponse(aiConfig, chatHistory, allFields, blendedData.slice(0, 5));
            if (chartSuggestion) {
                populateEditorFromAI(chartSuggestion);
                notificationService.success("AI suggestion applied.");
            } else {
                notificationService.info("AI could not generate a chart from the prompt.");
            }
        } catch (e) {
            notificationService.error(`AI failed: ${(e as Error).message}`);
        } finally {
            setIsGenerating(false);
        }
    }, [aiConfig, blendedFields, blendedData, populateEditorFromAI]);
    
    useEffect(() => {
        if (widgetEditorAIPrompt) {
            setAiPrompt(widgetEditorAIPrompt);
            handleGenerateClick(widgetEditorAIPrompt);
            setWidgetEditorAIPrompt(null);
        }
    }, [widgetEditorAIPrompt, handleGenerateClick, setWidgetEditorAIPrompt]);
    
    return (
        <div className="flex flex-col h-full bg-secondary/50">
            <div className="p-4 border-b border-border space-y-3">
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., Show me total profit by product category" className={cn(textareaClasses, "text-sm")} rows={3} />
                <Button onClick={() => handleGenerateClick(aiPrompt)} disabled={isGenerating || !aiPrompt.trim()} className="w-full ai-feature-style">
                    {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkle size={16} />} {isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
            </div>
            <div className="p-4 border-b border-border">
                <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Search fields..." value={fieldSearch} onChange={e => setFieldSearch(e.target.value)} className={`${inputClasses} pl-8 h-9`} /></div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {filteredFields.dimensions.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-xs text-blue-500 uppercase tracking-wider mb-2 px-1">Dimensions</h4>
                        <div className="space-y-2">{filteredFields.dimensions.map(f => <SelectableFieldRow key={f.name} field={f} />)}</div>
                    </div>
                )}
                 {filteredFields.measures.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-xs text-green-500 uppercase tracking-wider mb-2 px-1">Measures</h4>
                        <div className="space-y-2">{filteredFields.measures.map(f => <SelectableFieldRow key={f.name} field={f} />)}</div>
                    </div>
                )}
            </div>
        </div>
    );
};