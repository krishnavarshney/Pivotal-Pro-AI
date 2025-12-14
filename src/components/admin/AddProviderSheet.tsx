import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Loader2, CheckCircle2, ChevronRight, AlertCircle, ArrowLeft } from "lucide-react";
import * as adminService from "../../services/adminService";
import { cn } from "../ui/utils";
import { motion, AnimatePresence } from 'framer-motion';

// Icons import (Dynamic loading or static map)
// Assuming vite can handle dynamic imports or we list them. 
// For safety/speed, I'll map the known ones.
import AnthropicIcon from '../icons/anthropic.svg';
import GeminiIcon from '../icons/gemini-color.svg';
import MetaIcon from '../icons/meta-color.svg';
import OllamaIcon from '../icons/ollama.svg';
import OpenAiIcon from '../icons/openai.svg';
// Fallbacks for others
import GenericIcon from '../icons/mistral-color.svg'; 

const PROVIDERS = [
    { id: 'gemini', name: 'Google Gemini', icon: GeminiIcon, type: 'api' },
    { id: 'openai', name: 'OpenAI', icon: OpenAiIcon, type: 'api' },
    { id: 'anthropic', name: 'Anthropic', icon: AnthropicIcon, type: 'api' },
    { id: 'ollama', name: 'Ollama', icon: OllamaIcon, type: 'local' },
    { id: 'openrouter', name: 'OpenRouter', icon: OpenAiIcon, type: 'aggregator' }, // reusing openai icon for now or generic
    { id: 'meta', name: 'Meta Llama', icon: MetaIcon, type: 'api' },
];

interface AddProviderSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddProviderSheet: React.FC<AddProviderSheetProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        apiKey: '',
        baseUrl: '',
        models: [] as string[]
    });
    const [fetchedModels, setFetchedModels] = useState<{id: string, name: string}[]>([]);
    const [fetchError, setFetchError] = useState('');

    const reset = () => {
        setStep(1);
        setFormData({ name: '', type: '', apiKey: '', baseUrl: '', models: [] });
        setFetchedModels([]);
        setFetchError('');
    };

    const handleTypeSelect = (typeId: string) => {
        const provider = PROVIDERS.find(p => p.id === typeId);
        setFormData(prev => ({ 
            ...prev, 
            type: typeId, 
            name: provider ? provider.name : '',
            baseUrl: typeId === 'ollama' ? 'http://localhost:11434' : ''
        }));
        setStep(2);
    };

    const handleFetchModels = async () => {
        setLoading(true);
        setFetchError('');
        try {
            const result = await adminService.fetchProviderModels(formData.type, {
                apiKey: formData.apiKey,
                baseUrl: formData.baseUrl
            });
            // @ts-ignore
            setFetchedModels(result.models || []);
            if (result.models?.length > 0) {
                // Auto select all or let user choose? For MVP, auto-select is easiest.
                // setFormData(prev => ({ ...prev, models: result.models.map((m: any) => m.id) }));
            } else {
                 setFetchError('No models found.');
            }
        } catch (error: any) {
            setFetchError(error.message || 'Failed to fetch models');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Save provider with config
            await adminService.createProvider({
                ...formData,
                // If models were fetched, store them in config
                config: {
                    models: fetchedModels.map(m => m.id) 
                }
            });
            onSuccess();
            onClose();
            reset();
        } catch (error) {
            console.error("Failed to create provider:", error);
        } finally {
            setLoading(false);
        }
    };

    const isOllama = formData.type === 'ollama';
    const isOpenRouter = formData.type === 'openrouter';
    const needsModelFetch = isOllama || isOpenRouter;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => { if (!open) reset(); onClose(); }}>
            <SheetContent className="w-[400px] sm:w-[540px] glass-panel border-l border-white/10">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl">Connect Provider</SheetTitle>
                    <SheetDescription>
                        {step === 1 ? "Select an AI provider to integrate." : "Configure connection details."}
                    </SheetDescription>
                </SheetHeader>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {PROVIDERS.map((provider) => (
                                <button
                                    key={provider.id}
                                    onClick={() => handleTypeSelect(provider.id)}
                                    className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/5 bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 transition-all gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-background p-2 group-hover:scale-110 transition-transform">
                                        <img src={provider.icon} alt={provider.name} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="font-medium text-sm">{provider.name}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="mb-2 -ml-2 text-muted-foreground">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Providers
                            </Button>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Provider Type</Label>
                                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                                        {/* @ts-ignore */}
                                        <img src={PROVIDERS.find(p => p.id === formData.type)?.icon} className="w-6 h-6" />
                                        <span className="font-medium">{PROVIDERS.find(p => p.id === formData.type)?.name}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input 
                                        id="name" 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Production Gemini"
                                    />
                                </div>

                                {!isOllama && (
                                    <div className="space-y-2">
                                        <Label htmlFor="apiKey">API Key</Label>
                                        <Input 
                                            id="apiKey" 
                                            type="password" 
                                            value={formData.apiKey} 
                                            onChange={e => setFormData({...formData, apiKey: e.target.value})} 
                                            placeholder="sk-..."
                                        />
                                    </div>
                                )}

                                {isOllama && (
                                    <div className="space-y-2">
                                        <Label htmlFor="baseUrl">Ollama Base URL</Label>
                                        <Input 
                                            id="baseUrl" 
                                            value={formData.baseUrl} 
                                            onChange={e => setFormData({...formData, baseUrl: e.target.value})} 
                                            placeholder="http://localhost:11434"
                                        />
                                    </div>
                                )}

                                {needsModelFetch && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>Available Models</Label>
                                            <Button size="sm" variant="outline" onClick={handleFetchModels} disabled={loading}>
                                                {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                                Fetch Models
                                            </Button>
                                        </div>
                                        
                                        {fetchError && (
                                            <p className="text-destructive text-sm flex items-center gap-1">
                                                <AlertCircle size={12} /> {fetchError}
                                            </p>
                                        )}

                                        {fetchedModels.length > 0 && (
                                            <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 bg-secondary/20">
                                                {fetchedModels.map(model => (
                                                    <div key={model.id} className="text-sm py-1 px-2 border-b border-border/50 last:border-0 flex items-center gap-2">
                                                        <CheckCircle2 size={12} className="text-green-500" />
                                                        {model.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => onClose()}>Cancel</Button>
                                <Button onClick={handleSubmit} disabled={loading || (needsModelFetch && fetchedModels.length === 0 && !fetchError)}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Provider
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SheetContent>
        </Sheet>
    );
};
