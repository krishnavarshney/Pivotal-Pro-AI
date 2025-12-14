import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { Badge } from '../ui/Badge';
import * as adminService from '../../services/adminService';
import { notificationService } from '../../services/notificationService';
import { RefreshCw, Plus, Trash2, AlertCircle, CheckCircle2, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../ui/utils';
import { AddProviderSheet } from './AddProviderSheet';

import AnthropicIcon from '../icons/anthropic.svg';
import GeminiIcon from '../icons/gemini-color.svg';
import MetaIcon from '../icons/meta-color.svg';
import OllamaIcon from '../icons/ollama.svg';
import OpenAiIcon from '../icons/openai.svg';
import GenericIcon from '../icons/mistral-color.svg';

export const AdminProviders: React.FC = () => {
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchProviders = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.getProviders();
            setProviders(data);
        } catch (err) {
            notificationService.error("Failed to load providers");
            setError('Failed to load providers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleToggle = async (id: number, enabled: boolean) => {
        try {
            // Optimistic update
            setProviders(current =>
                current.map(p => p.id === id ? { ...p, enabled } : p)
            );
            await adminService.toggleProvider(id, enabled);
            notificationService.success(`Provider ${enabled ? 'enabled' : 'disabled'}`);
        } catch (err) {
            notificationService.error("Failed to update provider");
            fetchProviders(); // Revert
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this provider?')) return;
        try {
            await adminService.deleteProvider(id);
            notificationService.success("Provider deleted");
            fetchProviders();
        } catch (err) {
            notificationService.error("Failed to delete provider");
        }
    };

    // Helper function for icons based on provider type
    const getProviderIcon = (type: string) => {
        const t = type?.toLowerCase() || '';
        let src = GenericIcon;
        if (t.includes('gemini') || t.includes('google')) src = GeminiIcon;
        else if (t.includes('openai')) src = OpenAiIcon;
        else if (t.includes('anthropic')) src = AnthropicIcon;
        else if (t.includes('ollama')) src = OllamaIcon;
        else if (t.includes('meta') || t.includes('llama')) src = MetaIcon;
        
        return <img src={src} alt={type} className="w-8 h-8 object-contain" />;
    };

    // Helper function for connection status
    const getConnectionStatus = (provider: any) => {
        const check = provider.checks?.[0];
        const isHealthy = check?.status === 'OK';

        if (isHealthy) {
            return (
                <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 size={14} /> Connected
                </span>
            );
        } else if (check) {
            return (
                <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle size={14} /> {check.status}
                </span>
            );
        } else {
            return (
                <span className="flex items-center gap-1 text-yellow-500">
                    <Wifi size={14} /> No check data
                </span>
            );
        }
    };

    if (loading && providers.length === 0) return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
                <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
            ))}
         </div>
    );

    if (error && providers.length === 0) return (
        <div className="text-center text-red-500 p-4">
            <p>{error}</p>
            <Button onClick={fetchProviders} className="mt-4">Retry</Button>
        </div>
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Model Providers</h2>
                    <p className="text-muted-foreground mt-2">Manage AI model connections and priorities.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowAddModal(true)} className="gap-2 shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4" /> Add Provider
                    </Button>
                    <Button onClick={fetchProviders} variant="outline" size="sm" className="gap-2">
                        <RefreshCw size={14} /> Refresh
                    </Button>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                {providers.map((provider) => (
                    <motion.div
                        key={provider.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                         <div className={cn(
                            "group relative overflow-hidden rounded-xl border p-6 transition-all hover:shadow-lg",
                            "bg-card text-card-foreground glass-panel", // Using glass-panel from index.css
                             provider.enabled ? "border-primary/20 shadow-md shadow-primary/5" : "border-border/50 opacity-80 grayscale-[0.5]"
                        )}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", provider.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                        {getProviderIcon(provider.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold leading-none tracking-tight">{provider.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">{provider.type}</Badge>
                                        </div>
                                    </div>
                                </div>
                                <ToggleSwitch
                                    enabled={provider.enabled}
                                    onChange={(val) => handleToggle(provider.id, val)}
                                    label={`Toggle ${provider.name}`}
                                />
                            </div>

                            <div className="mt-6 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-xs">
                                     {getConnectionStatus(provider)}
                                </div>
                                 <div className="flex items-center gap-2">
                                     <span className={cn(
                                         "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border",
                                         provider.priority > 5 ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" : "border-yellow-500/30 text-yellow-500 bg-yellow-500/10"
                                     )}>
                                         Priority {provider.priority}
                                     </span>
                                     <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(provider.id);
                                        }}
                                     >
                                         <Trash2 size={14} />
                                     </Button>
                                 </div>
                            </div>
                            
                            {/* Decorative background glow */}
                            <div className={cn(
                                "absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-70 pointer-events-none",
                                provider.enabled ? "bg-primary/10 opacity-30" : "opacity-0"
                            )} />
                        </div>
                    </motion.div>
                ))}
            </motion.div>
            
            <AddProviderSheet 
                isOpen={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                onSuccess={fetchProviders} 
            />
        </div>
    );
};
