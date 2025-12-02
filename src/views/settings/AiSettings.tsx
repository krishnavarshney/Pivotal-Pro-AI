import React, { useState, useEffect } from 'react';
import * as aiService from '../../services/aiService';
import { notificationService } from '../../services/notificationService';
import { useDashboard } from '../../contexts/DashboardProvider';
import { AIConfig, AIProviderType } from '../../utils/types';
import { Button } from '../../components/ui/Button';
import { cn, inputClasses } from '../../components/ui/utils';
import { CheckCircle, X, Key, Globe, Cpu } from 'phosphor-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

import GeminiIconSrc from '../../components/icons/gemini-color.svg';
import OpenAIIconSrc from '../../components/icons/openai.svg';
import AnthropicIconSrc from '../../components/icons/anthropic.svg';
import OllamaIconSrc from '../../components/icons/ollama.svg';
import MetaIconSrc from '../../components/icons/meta-color.svg';
import MistralIconSrc from '../../components/icons/mistral-color.svg';
import DeepSeekIconSrc from '../../components/icons/deepseek-color.svg';
import QwenIconSrc from '../../components/icons/qwen-color.svg';
import GrokIconSrc from '../../components/icons/grok.svg';

// --- Icons ---
const IconImg = ({ src, alt, className }: { src: string, alt: string, className?: string }) => (
    <img src={src} alt={alt} className={className} />
);

const getModelIcon = (provider: AIProviderType, modelName: string) => {
    const name = modelName.toLowerCase();
    const className = "w-5 h-5";

    if (provider === 'ollama') {
        if (name.includes('llama') || name.includes('meta')) return <IconImg src={MetaIconSrc} alt="Meta" className={className} />;
        if (name.includes('mistral') || name.includes('mixtral')) return <IconImg src={MistralIconSrc} alt="Mistral" className={className} />;
        if (name.includes('gemma')) return <IconImg src={GeminiIconSrc} alt="Gemma" className={className} />;
        if (name.includes('deepseek')) return <IconImg src={DeepSeekIconSrc} alt="DeepSeek" className={className} />;
        if (name.includes('qwen')) return <IconImg src={QwenIconSrc} alt="Qwen" className={className} />;
        if (name.includes('grok')) return <IconImg src={GrokIconSrc} alt="Grok" className={className} />;
        if (name.includes('phi')) return <IconImg src={OpenAIIconSrc} alt="Phi" className={className} />; // Microsoft usually, but using OpenAI as placeholder or generic
    }

    switch (provider) {
        case 'gemini': return <IconImg src={GeminiIconSrc} alt="Gemini" className={className} />;
        case 'openai': return <IconImg src={OpenAIIconSrc} alt="OpenAI" className={className} />;
        case 'anthropic': return <IconImg src={AnthropicIconSrc} alt="Anthropic" className={className} />;
        case 'ollama': return <IconImg src={OllamaIconSrc} alt="Ollama" className={className} />;
        default: return <Cpu className={className} />;
    }
};

const ProviderIcon = ({ provider, className }: { provider: AIProviderType, className?: string }) => {
    switch (provider) {
        case 'gemini': return <IconImg src={GeminiIconSrc} alt="Gemini" className={className} />;
        case 'openai': return <IconImg src={OpenAIIconSrc} alt="OpenAI" className={className} />;
        case 'anthropic': return <IconImg src={AnthropicIconSrc} alt="Anthropic" className={className} />;
        case 'ollama': return <IconImg src={OllamaIconSrc} alt="Ollama" className={className} />;
        default: return <Cpu className={className} />;
    }
};

// --- Components ---

const ProviderCard = ({ 
    provider, 
    isActive, 
    onClick, 
    isEnabled 
}: { 
    provider: AIProviderType, 
    isActive: boolean, 
    onClick: () => void,
    isEnabled: boolean
}) => {
    const getLabel = () => {
        switch (provider) {
            case 'gemini': return "Google Gemini";
            case 'openai': return "OpenAI";
            case 'anthropic': return "Anthropic";
            case 'ollama': return "Ollama";
        }
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 border text-left group relative overflow-hidden",
                isActive 
                    ? "bg-primary/5 border-primary shadow-sm" 
                    : "bg-card border-border hover:border-primary/50 hover:bg-accent/50"
            )}
        >
            <div className={cn(
                "p-2 rounded-lg transition-colors",
                isActive ? "bg-background text-primary shadow-sm" : "bg-muted text-muted-foreground group-hover:text-primary"
            )}>
                <ProviderIcon provider={provider} className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <div className="font-semibold text-sm flex items-center gap-2">
                    {getLabel()}
                    {isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {provider === 'ollama' ? 'Local Offline Models' : 'Cloud Provider'}
                </div>
            </div>
            {isActive && (
                <motion.div 
                    layoutId="activeIndicator"
                    className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full"
                />
            )}
        </button>
    );
};

export const AiSettings: React.FC = () => {
    const { aiConfig, saveAiConfig } = useDashboard();
    
    const [localConfig, setLocalConfig] = useState<AIConfig | null>(null);
    const [activeTab, setActiveTab] = useState<AIProviderType>('gemini');
    const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (aiConfig) {
            setLocalConfig(JSON.parse(JSON.stringify(aiConfig)));
            setActiveTab(aiConfig.activeProvider);
        }
    }, [aiConfig]);

    if (!localConfig) return <div className="p-8 text-center text-muted-foreground">Loading configuration...</div>;

    const handleProviderToggle = (provider: AIProviderType, enabled: boolean) => {
        setLocalConfig(prev => {
            if (!prev) return null;
            return {
                ...prev,
                providers: {
                    ...prev.providers,
                    [provider]: { ...prev.providers[provider], enabled }
                }
            };
        });
    };

    const handleApiKeyChange = (provider: AIProviderType, key: string) => {
        setLocalConfig(prev => {
            if (!prev) return null;
            return {
                ...prev,
                providers: {
                    ...prev.providers,
                    [provider]: { ...prev.providers[provider], apiKey: key }
                }
            };
        });
    };

    const handleBaseUrlChange = (provider: AIProviderType, url: string) => {
        setLocalConfig(prev => {
            if (!prev) return null;
            return {
                ...prev,
                providers: {
                    ...prev.providers,
                    [provider]: { ...prev.providers[provider], baseUrl: url }
                }
            };
        });
    };

    const handleTestAndLoadOllama = async () => {
        setOllamaStatus('loading');
        const endpoint = localConfig.providers.ollama.baseUrl || 'http://localhost:11434';
        try {
            const models = await aiService.fetchOllamaModels(endpoint);
            if (models.length > 0) {
                setLocalConfig(prev => {
                    if (!prev) return null;
                    const newModels = models.map(m => ({ id: m, name: m, providerId: 'ollama' as AIProviderType }));
                    return {
                        ...prev,
                        providers: {
                            ...prev.providers,
                            ollama: { ...prev.providers.ollama, models: newModels }
                        }
                    };
                });
                setOllamaStatus('success');
            } else {
                setOllamaStatus('error');
            }
        } catch (e) {
            setOllamaStatus('error');
        }
    };

    const handleSetActiveModel = (provider: AIProviderType, modelId: string) => {
        setLocalConfig(prev => {
            if (!prev) return null;
            return {
                ...prev,
                activeProvider: provider,
                activeModelId: modelId
            };
        });
    };

    const handleSave = () => {
        if (localConfig) {
            if (!localConfig.providers[localConfig.activeProvider].enabled) {
                alert(`The active provider (${localConfig.activeProvider}) must be enabled.`);
                return;
            }
            saveAiConfig(localConfig);
            notificationService.success('AI configuration saved successfully');
        }
    };

    const currentProviderConfig = localConfig.providers[activeTab];

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Configuration</h1>
                <p className="text-muted-foreground text-lg">Manage your AI providers, models, and API keys.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar */}
                <div className="col-span-12 md:col-span-3 space-y-4">
                    <div className="space-y-2">
                        {(['gemini', 'openai', 'anthropic', 'ollama'] as AIProviderType[]).map(provider => (
                            <ProviderCard 
                                key={provider}
                                provider={provider}
                                isActive={activeTab === provider}
                                isEnabled={localConfig.providers[provider].enabled}
                                onClick={() => setActiveTab(provider)}
                            />
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-span-12 md:col-span-9 space-y-6">
                    <Card className="p-6 border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-semibold flex items-center gap-2">
                                    <ProviderIcon provider={activeTab} className="w-6 h-6" />
                                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings
                                </h2>
                                <p className="text-sm text-muted-foreground">Configure connection details and available models.</p>
                            </div>
                            <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border border-border/50">
                                <span className="text-sm font-medium text-muted-foreground pl-2">Status</span>
                                <ToggleSwitch 
                                    label=""
                                    enabled={currentProviderConfig.enabled} 
                                    onChange={(e) => handleProviderToggle(activeTab, e)} 
                                />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                {/* API Key / Endpoint Configuration */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Connection</h3>
                                    
                                    {activeTab === 'gemini' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">API Key (Optional)</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                <input 
                                                    type="password" 
                                                    placeholder="Using environment variable (default)" 
                                                    value={currentProviderConfig.apiKey || ''} 
                                                    onChange={e => handleApiKeyChange('gemini', e.target.value)} 
                                                    className={cn(inputClasses, "pl-10 font-mono text-sm")} 
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Leave blank to use the server-side API key configured in .env</p>
                                        </div>
                                    )}

                                    {(activeTab === 'openai' || activeTab === 'anthropic') && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">API Key</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                <input 
                                                    type="password" 
                                                    placeholder={`sk-...`} 
                                                    value={currentProviderConfig.apiKey || ''} 
                                                    onChange={e => handleApiKeyChange(activeTab, e.target.value)} 
                                                    className={cn(inputClasses, "pl-10 font-mono text-sm")} 
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Your API key is stored locally in your browser and never sent to our servers.</p>
                                        </div>
                                    )}

                                    {activeTab === 'ollama' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Endpoint URL</label>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                    <input 
                                                        type="text" 
                                                        value={currentProviderConfig.baseUrl || ''} 
                                                        onChange={e => handleBaseUrlChange('ollama', e.target.value)} 
                                                        className={cn(inputClasses, "pl-10 font-mono text-sm")} 
                                                        placeholder="http://localhost:11434"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Button variant="secondary" onClick={handleTestAndLoadOllama} disabled={ollamaStatus === 'loading'}>
                                                    {ollamaStatus === 'loading' ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                                    ) : (
                                                        <Cpu className="w-4 h-4 mr-2" />
                                                    )}
                                                    Fetch Models
                                                </Button>
                                                {ollamaStatus === 'success' && (
                                                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                                        <CheckCircle className="w-3 h-3 mr-1" weight="fill"/> Connected
                                                    </Badge>
                                                )}
                                                {ollamaStatus === 'error' && (
                                                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                                        <X className="w-3 h-3 mr-1" weight="bold"/> Connection Failed
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Model Selection */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Models</h3>
                                    
                                    {currentProviderConfig.models.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {currentProviderConfig.models.map(model => {
                                                const isActive = localConfig.activeModelId === model.id && localConfig.activeProvider === activeTab;
                                                return (
                                                    <div 
                                                        key={model.id}
                                                        onClick={() => handleSetActiveModel(activeTab, model.id)}
                                                        className={cn(
                                                            "relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 group",
                                                            isActive 
                                                                ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),1)]" 
                                                                : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "p-2 rounded-lg transition-colors",
                                                                isActive ? "bg-background text-primary" : "bg-muted text-muted-foreground"
                                                            )}>
                                                                {getModelIcon(activeTab, model.name)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-sm">{model.name}</div>
                                                                <div className="text-xs text-muted-foreground font-mono mt-0.5">{model.id}</div>
                                                            </div>
                                                        </div>
                                                        {isActive && (
                                                            <div className="absolute top-3 right-3">
                                                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
                                            <p className="text-muted-foreground">No models available. {activeTab === 'ollama' ? 'Click "Fetch Models" to load from your local instance.' : 'Please configure your API key.'}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-10 pt-6 border-t border-border flex justify-end">
                            <Button onClick={handleSave} size="lg" className="px-8">
                                Save Configuration
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
