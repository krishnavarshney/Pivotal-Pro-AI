

import React, { useState, FC, ReactNode } from 'react';
import { Palette, Bot, BarChart, Settings, AlertTriangle } from 'lucide-react';
import { ViewHeader } from '../components/common/ViewHeader';
import { cn } from '../components/ui/utils';
import { AnimatePresence, motion } from 'framer-motion';

import { AppearanceSettings } from './settings/AppearanceSettings';
import { AiSettings } from './settings/AiSettings';
import { DefaultsSettings } from './settings/DefaultsSettings';
import { EngineSettings } from './settings/EngineSettings';
import { DangerZone } from './settings/DangerZone';

// FIX: Add aliasing for motion component to fix TypeScript errors.
const MotionDiv = motion.div as any;

type SettingsTab = 'appearance' | 'ai' | 'defaults' | 'engine' | 'danger';

const TABS: { id: SettingsTab; label: string; icon: ReactNode }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'ai', label: 'AI Provider', icon: <Bot size={20} /> },
    { id: 'defaults', label: 'Defaults', icon: <BarChart size={20} /> },
    { id: 'engine', label: 'Chart Engine', icon: <Settings size={20} /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle size={20} /> },
];

export const SettingsView: FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

    const renderContent = () => {
        switch (activeTab) {
            case 'appearance': return <AppearanceSettings />;
            case 'ai': return <AiSettings />;
            case 'defaults': return <DefaultsSettings />;
            case 'engine': return <EngineSettings />;
            case 'danger': return <DangerZone />;
            default: return null;
        }
    };

    return (
        <div className="h-full bg-secondary/30 flex flex-col">
            <ViewHeader icon={<Settings size={24} />} title="Settings" />
            <div className="flex-grow flex flex-col md:flex-row min-h-0">
                <aside className="w-full md:w-64 flex-shrink-0 bg-background/50 border-b md:border-b-0 md:border-r border-border p-4">
                    <nav className="flex flex-row md:flex-col gap-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                                    activeTab === tab.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                )}
                            >
                                <span className="icon-hover-anim">{tab.icon}</span>
                                <span className="hidden md:inline">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-grow p-4 md:p-8 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <MotionDiv
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-4xl mx-auto"
                        >
                            {renderContent()}
                        </MotionDiv>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};