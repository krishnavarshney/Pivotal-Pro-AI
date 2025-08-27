import React, { useState } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { ThemeConfig } from '../../utils/types';
import { CheckCircle, Sun, Moon, Palette, PencilSimple } from 'phosphor-react';
import { Button } from '../../components/ui/Button';
import { cn, inputClasses } from '../../components/ui/utils';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/Sheet';
import Slider from 'rc-slider';
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

const THEME_CATEGORIES = {
  "Professional": [
    { id: 'pivotal-pro', name: 'Pivotal Pro', colors: ['#4A47E5', '#00A8B5', '#F7B801', '#E54F6D', '#7A54C7'] },
    { id: 'graphite', name: 'Graphite', colors: ['#475569', '#94a3b8', '#e2e8f0', '#0f172a', '#3b82f6'] },
    { id: 'executive', name: 'Executive', colors: ['#382d25', '#a1887f', '#d7ccc8', '#c89b78', '#5d4037'] },
  ],
  "Modern & Minimal": [
    { id: 'bauhaus', name: 'Bauhaus', colors: ['#e11d48', '#f59e0b', '#3b82f6', '#4ade80', '#111827'] },
    { id: 'neobrutalist', name: 'Neobrutalist', colors: ['#030712', '#f9fafb', '#f43f5e', '#3b82f6', '#16a34a'] },
  ],
  "Creative & Bold": [
    { id: 'synthwave', name: 'Synthwave', colors: ['#d946ef', '#14b8a6', '#f472b6', '#0ea5e9', '#8b5cf6'] },
    { id: 'evergreen', name: 'Evergreen', colors: ['#166534', '#ca8a04', '#c2410c', '#15803d', '#a16207'] },
  ],
  "Artistic": [
    { id: 'playful', name: 'Playful', colors: ['oklch(0.89 0.18 95.47)', 'oklch(0.67 0.13 61.58)', 'oklch(0.65 0.13 81.66)', 'oklch(0.75 0.15 84.05)', 'oklch(0.77 0.14 91.27)'] },
    { id: 'terracotta', name: 'Terracotta', colors: ['oklch(0.51 0.19 27.52)', 'oklch(0.47 0.15 25.06)', 'oklch(0.40 0.13 25.81)', 'oklch(0.56 0.15 49.06)', 'oklch(0.47 0.12 46.52)'] },
    { id: 'amethyst', name: 'Amethyst', colors: ['oklch(0.48 0.20 260.47)', 'oklch(0.56 0.24 260.92)', 'oklch(0.40 0.16 259.61)', 'oklch(0.43 0.16 259.82)', 'oklch(0.29 0.07 261.20)'] },
    { id: 'sakura', name: 'Sakura', colors: ['oklch(0.31 0.11 327.10)', 'oklch(0.37 0.14 323.40)', 'oklch(0.59 0.22 11.39)', 'oklch(0.77 0.13 222.66)', 'oklch(0.69 0.14 160.27)'] },
    { id: 'geist-minimal', name: 'Geist Minimal', colors: ['oklch(0.43 0.04 42.00)', 'oklch(0.92 0.07 76.67)', 'oklch(0.93 0 0)', 'oklch(0.94 0.05 75.02)', 'oklch(0.43 0.04 42.00)'] },
    { id: 'industrial', name: 'Industrial', colors: ['oklch(0.56 0.13 42.95)', 'oklch(0.69 0.16 290.29)', 'oklch(0.88 0.03 91.64)', 'oklch(0.88 0.04 298.21)', 'oklch(0.56 0.13 41.94)'] },
  ]
};

const ThemeOptionCard: React.FC<{ name: string; isSelected: boolean; onClick: () => void; children: React.ReactNode; }> = ({ name, isSelected, onClick, children }) => (
    <div
        onClick={onClick}
        className={cn(
            "p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer relative",
            isSelected ? 'border-primary bg-primary/10 shadow-lg' : 'border-border bg-card hover:border-primary/50'
        )}
    >
        {isSelected && <CheckCircle size={20} weight="fill" className="absolute top-3 right-3 text-primary" />}
        <h3 className="text-md font-bold text-foreground">{name}</h3>
        <div className="flex items-center gap-2 mt-3">{children}</div>
    </div>
);

export const AppearanceSettings: React.FC = () => {
    const { themeConfig, setThemeName, toggleThemeMode, setThemeConfig } = useDashboard();
    const [isCustomizerOpen, setCustomizerOpen] = useState(false);
    const MotionDiv = motion.div as any;

    const handleCustomThemeChange = (prop: keyof NonNullable<ThemeConfig['custom']>, value: any) => {
        setThemeConfig(prev => ({
            ...prev,
            name: 'custom',
            custom: {
                ...(prev.custom || {}),
                [prop]: value,
            }
        }));
    };

    return (
        <div className="space-y-8">
            <SectionCard title="Color Mode" description="Choose between light and dark appearances for the application.">
                <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                    <label className="text-sm font-medium text-foreground">Interface Mode</label>
                    <div className="flex items-center bg-background rounded-lg p-1 shadow-inner">
                        <button onClick={() => themeConfig.mode !== 'light' && toggleThemeMode()} className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${themeConfig.mode === 'light' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}>
                            <Sun /> Light
                        </button>
                        <button onClick={() => themeConfig.mode !== 'dark' && toggleThemeMode()} className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${themeConfig.mode === 'dark' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}>
                            <Moon /> Dark
                        </button>
                    </div>
                </div>
            </SectionCard>
            
            <SectionCard title="Experience Changer" description="Select a pre-defined theme or create your own for a personalized look.">
                <div className="space-y-6">
                    {Object.entries(THEME_CATEGORIES).map(([category, themes]) => (
                        <div key={category}>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {themes.map(theme => (
                                    <ThemeOptionCard key={theme.id} name={theme.name} isSelected={themeConfig.name === theme.id} onClick={() => setThemeName(theme.id)}>
                                        {theme.colors.map(color => <div key={color} className="w-6 h-6 rounded-full border border-border" style={{backgroundColor: color}}></div>)}
                                    </ThemeOptionCard>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Customization</h4>
                        <ThemeOptionCard name="Custom Theme" isSelected={themeConfig.name === 'custom'} onClick={() => { setThemeName('custom'); setCustomizerOpen(true); }}>
                            <div className="w-10 h-6 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 border border-border"></div>
                            <span className="text-sm text-muted-foreground">Fine-tune your personal theme.</span>
                            <PencilSimple size={16} className="ml-auto text-muted-foreground"/>
                        </ThemeOptionCard>
                    </div>
                </div>
            </SectionCard>

            <Sheet open={isCustomizerOpen} onOpenChange={setCustomizerOpen}>
                <SheetContent className="w-[400px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2"><Palette /> Customize Your Theme</SheetTitle>
                    </SheetHeader>
                    <div className="p-6 space-y-6 overflow-y-auto">
                         <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-muted-foreground mb-2">Primary Color</label><ColorPicker color={themeConfig.custom?.primary} onChange={c => handleCustomThemeChange('primary', c)} /></div>
                            <div><label className="block text-sm font-medium text-muted-foreground mb-2">Accent Color</label><ColorPicker color={themeConfig.custom?.accent} onChange={c => handleCustomThemeChange('accent', c)} /></div>
                            <div><label className="block text-sm font-medium text-muted-foreground mb-2">Background Color</label><ColorPicker color={themeConfig.custom?.background} onChange={c => handleCustomThemeChange('background', c)} /></div>
                            <div><label className="block text-sm font-medium text-muted-foreground mb-2">Card Background</label><ColorPicker color={themeConfig.custom?.card} onChange={c => handleCustomThemeChange('card', c)} /></div>
                            <div><label className="block text-sm font-medium text-muted-foreground mb-2">Foreground Color</label><ColorPicker color={themeConfig.custom?.foreground} onChange={c => handleCustomThemeChange('foreground', c)} /></div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Border Radius ({themeConfig.custom?.radius || 0.75}rem)</label>
                                <Slider min={0} max={2} step={0.1} value={themeConfig.custom?.radius || 0.75} onChange={v => handleCustomThemeChange('radius', v as number)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Font Style</label>
                                <select value={themeConfig.custom?.font || 'sans'} onChange={e => handleCustomThemeChange('font', e.target.value as any)} className={inputClasses}>
                                    <option value="sans">Sans Serif (Inter)</option>
                                    <option value="serif">Serif (Playfair Display)</option>
                                    <option value="mono">Monospace (Space Mono)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};