import React, { useState } from 'react';
import * as aiService from '../../services/aiService';
import { useDashboard } from '../../contexts/DashboardProvider';
import { AIConfig } from '../../utils/types';
import { Button } from '../../components/ui/Button';
import { cn, inputClasses } from '../../components/ui/utils';
import { Sparkle, Robot, CheckCircle, X } from 'phosphor-react';
import { motion, AnimatePresence } from 'framer-motion';

const SectionCard: React.FC<{title: string, description?: string, children: React.ReactNode, className?: string}> = ({title, description, children, className}) => (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm", className)}>
        <div className="p-6">
            <h3 className="text-lg font-semibold font-display text-foreground">{title}</h3>
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        <div className="p-6 border-t border-border">
            {children}
        </div>
    </div>
);

export const AiSettings: React.FC = () => {
    const { aiConfig, saveAiConfig } = useDashboard();
    const [activeTab, setActiveTab] = useState<'gemini' | 'ollama'>(aiConfig?.provider || 'gemini');
    
    // Ollama State
    const [ollamaEndpoint, setOllamaEndpoint] = useState(aiConfig?.provider === 'ollama' ? aiConfig.ollamaConfig?.endpoint || 'http://localhost:11434' : 'http://localhost:11434');
    const [ollamaModels, setOllamaModels] = useState<string[]>(aiConfig?.provider === 'ollama' ? [aiConfig.ollamaConfig?.model || ''] : []);
    const [selectedOllamaModel, setSelectedOllamaModel] = useState(aiConfig?.provider === 'ollama' ? aiConfig.ollamaConfig?.model || '' : '');
    const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleTestAndLoadOllama = async () => {
        setOllamaStatus('loading');
        try {
            const models = await aiService.fetchOllamaModels(ollamaEndpoint);
            if (models.length > 0) {
                setOllamaModels(models);
                if(!models.includes(selectedOllamaModel)) {
                    setSelectedOllamaModel(models[0]);
                }
                setOllamaStatus('success');
            } else {
                setOllamaStatus('error');
                setOllamaModels([]);
            }
        } catch (e) {
            setOllamaStatus('error');
            setOllamaModels([]);
        }
    };

    const handleSave = () => {
        let newConfig: AIConfig | null = null;
        if (activeTab === 'gemini') {
            newConfig = { provider: 'gemini' };
        } else {
            if (!selectedOllamaModel) {
                alert('Please load and select an Ollama model.'); return;
            }
            newConfig = { provider: 'ollama', ollamaConfig: { endpoint: ollamaEndpoint.trim(), model: selectedOllamaModel } };
        }
        
        if (newConfig) {
            saveAiConfig(newConfig);
            alert('AI configuration saved!');
        }
    };
    
    const TabButton: React.FC<{ tabId: 'gemini' | 'ollama', children: React.ReactNode }> = ({ tabId, children }) => (
        <button type="button" onClick={() => setActiveTab(tabId)} className={`flex-1 flex justify-center items-center gap-2 p-3 font-semibold text-sm transition-colors ${activeTab === tabId ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {children}
        </button>
    );
    
    const MotionDiv = motion.div as any;

    return (
        <SectionCard title="AI Provider" description="Configure the AI model used for insights and chart generation.">
            <div className="flex border-b border-border mb-6">
                <TabButton tabId="gemini"><Sparkle weight="fill"/> Google Gemini</TabButton>
                <TabButton tabId="ollama"><Robot /> Local (Ollama)</TabButton>
            </div>

            <AnimatePresence mode="wait">
                <MotionDiv key={activeTab} initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-10}}>
                    {activeTab === 'gemini' && (
                        <div>
                            <p className="text-muted-foreground text-sm">
                                Pivotal Pro uses Google's Gemini family of models for its AI capabilities. The API key for Gemini is automatically managed.
                            </p>
                             <p className="mt-4 text-xs bg-secondary p-3 rounded-lg border border-border">
                                The current model is set to <span className="font-semibold text-primary">gemini-2.5-flash</span> for a balance of speed and intelligence.
                            </p>
                        </div>
                    )}
                    {activeTab === 'ollama' && (
                        <div className="space-y-4">
                             <div>
                                <label className="text-sm font-medium text-muted-foreground">Ollama Endpoint</label>
                                <input type="text" value={ollamaEndpoint} onChange={e => setOllamaEndpoint(e.target.value)} className={`${inputClasses} mt-1`} />
                            </div>
                            <Button variant="secondary" onClick={handleTestAndLoadOllama} disabled={ollamaStatus === 'loading'}>
                                {ollamaStatus === 'loading' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>}
                                Test Connection & Load Models
                            </Button>
                            {ollamaStatus === 'success' && <div className="flex items-center gap-2 text-sm text-green-500"><CheckCircle weight="fill"/> Connection successful!</div>}
                            {ollamaStatus === 'error' && <div className="flex items-center gap-2 text-sm text-red-500"><X weight="bold"/> Failed to connect to Ollama.</div>}
                             {ollamaModels.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Select Model</label>
                                    <select value={selectedOllamaModel} onChange={e => setSelectedOllamaModel(e.target.value)} className={`${inputClasses} mt-1`}>
                                        {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </MotionDiv>
            </AnimatePresence>
            <div className="mt-6 pt-6 border-t border-border flex justify-end">
                <Button onClick={handleSave}>Save AI Configuration</Button>
            </div>
        </SectionCard>
    );
};
