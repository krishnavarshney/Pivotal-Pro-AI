import React, { useState, useCallback, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardProvider';
import { notificationService } from '../../../services/notificationService';
import * as aiService from '../../../services/aiService';
import { AiChatMessage } from '../../../utils/types';
import { Sparkle, RefreshCw } from 'lucide-react';
import { cn } from '../../ui/utils';
import { inputClasses } from '../../ui/utils';

export const AiPromptBar: React.FC = () => {
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
    const [isFocused, setIsFocused] = useState(false);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleGenerateClick(aiPrompt);
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 max-w-lg relative">
            <div className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", isGenerating ? "animate-spin" : "", isFocused ? "text-primary" : "text-muted-foreground")}>
                {isGenerating ? <RefreshCw size={18} /> : <Sparkle size={18} />}
            </div>
            <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Build with AI... (e.g., 'Show total profit by product category')"
                className={cn(
                    inputClasses,
                    "pl-10 h-11 w-full transition-all duration-300 !bg-card/50",
                    isFocused && "animate-border-glow !bg-card shadow-lg shadow-primary/10"
                )}
                style={{'--glow-color': 'hsl(var(--primary-values))'} as React.CSSProperties}
                disabled={isGenerating}
            />
        </form>
    );
};