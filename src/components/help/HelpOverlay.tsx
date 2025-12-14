import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardProvider';
import { X, Lightbulb, MousePointerClick, Layout, Settings } from 'lucide-react';
import { cn } from '../ui/utils';

interface HelpBeacon {
    id: string;
    targetId: string; // ID of the element to highlight
    title: string;
    description: string;
    icon?: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const BEACONS: HelpBeacon[] = [
    { id: 'sidebar', targetId: 'app-sidebar', title: 'Navigation', description: 'Access different modules like Data Studio, Stories, and Settings.', icon: <Layout />, position: 'right' },
    { id: 'toolbar', targetId: 'dashboard-header', title: 'Toolbar', description: 'Filter data, change dates, and manage dashboard settings.', icon: <Settings />, position: 'bottom' },
    { id: 'widgets', targetId: 'dashboard-grid', title: 'Widgets', description: 'Visualize your data. Drag to reorder, resize, or click to edit.', icon: <MousePointerClick />, position: 'top' },
    { id: 'fab', targetId: 'floating-action-button', title: 'Quick Actions', description: 'Ask AI questions or create new widgets instantly.', icon: <Lightbulb />, position: 'left' },
];

export const HelpOverlay: React.FC = () => {
    const { isHelpModeActive, toggleHelpMode } = useDashboard();
    const [activeBeacon, setActiveBeacon] = useState<HelpBeacon | null>(null);
    const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') toggleHelpMode();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [toggleHelpMode]);

    useEffect(() => {
        if (activeBeacon) {
            const element = document.getElementById(activeBeacon.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setSpotlightStyle({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    opacity: 1,
                });
            }
        } else {
            setSpotlightStyle({ opacity: 0 });
        }
    }, [activeBeacon]);

    // Helper to calculate popover position based on beacon position
    const getPopoverStyle = (beacon: HelpBeacon) => {
        const element = document.getElementById(beacon.targetId);
        if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        const rect = element.getBoundingClientRect();
        const padding = 20;

        switch (beacon.position) {
            case 'left':
                return { top: rect.top, left: rect.left - 340, transform: 'none' }; // 320px width + padding
            case 'right':
                return { top: rect.top, left: rect.right + padding, transform: 'none' };
            case 'bottom':
                return { top: rect.bottom + padding, left: rect.left + (rect.width / 2) - 160, transform: 'none' }; // Center horizontally
            case 'top':
            default:
                // Default to centering if it's a large area like 'widgets', but maybe offset it?
                // For 'widgets' (top), let's put it slightly below the top edge of the spotlight
                return { top: rect.top + 100, left: rect.left + (rect.width / 2) - 160, transform: 'none' };
        }
    };

    if (!isHelpModeActive) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={toggleHelpMode}
            />

            {/* Spotlight Hole with Soft Edge */}
            <motion.div
                className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] rounded-xl pointer-events-none transition-all duration-300 ease-in-out ring-1 ring-white/20"
                style={spotlightStyle}
            >
                 <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] rounded-xl" />
            </motion.div>

            {/* Beacons */}
            {BEACONS.map((beacon) => {
                const element = document.getElementById(beacon.targetId);
                if (!element) return null;
                const rect = element.getBoundingClientRect();
                
                // Calculate beacon position based on target center
                // For 'widgets', we might want the beacon at the top-center, not dead center
                let top, left;
                
                if (beacon.id === 'widgets') {
                     top = rect.top + 40; // Near the top
                     left = rect.left + rect.width / 2;
                } else {
                     top = rect.top + rect.height / 2;
                     left = rect.left + rect.width / 2;
                }

                return (
                    <motion.button
                        key={beacon.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        className={cn(
                            "absolute w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.6)] z-50",
                            activeBeacon?.id === beacon.id && "ring-4 ring-primary/30"
                        )}
                        style={{ top, left, transform: 'translate(-50%, -50%)' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveBeacon(beacon);
                        }}
                    >
                        <div className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20" />
                        {beacon.icon || <Lightbulb size={16} />}
                    </motion.button>
                );
            })}

            {/* Info Popover */}
            <AnimatePresence>
                {activeBeacon && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-50 w-80 p-6 bg-background/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-foreground"
                        style={getPopoverStyle(activeBeacon)}
                    >
                        <button 
                            onClick={() => setActiveBeacon(null)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X size={16} />
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                {activeBeacon.icon}
                            </div>
                            <h3 className="text-lg font-bold">{activeBeacon.title}</h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            {activeBeacon.description}
                        </p>
                        <div className="mt-6 flex justify-end">
                            <button 
                                className="text-xs font-medium text-primary hover:underline"
                                onClick={() => setActiveBeacon(null)}
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exit Button */}
            <button
                onClick={toggleHelpMode}
                className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-sm transition-colors z-50 flex items-center gap-2"
            >
                <X size={16} /> Exit Help Mode
            </button>
        </div>
    );
};
