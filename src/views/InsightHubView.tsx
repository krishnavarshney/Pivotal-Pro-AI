import React, { useState, useMemo, FC, ReactNode } from 'react';
import { useDashboard } from '../contexts/DashboardProvider';
import { ViewHeader } from '../components/common/ViewHeader';
import { Insight, InsightStatus, InsightType } from '../utils/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn, inputClasses } from '../components/ui/utils';
import {
    Lightbulb, RefreshCw, AlertTriangle, TrendingUp, BarChart2, Database,
    Bookmark, Trash2, Search, Sparkles, Clock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

const insightTypeInfo: Record<InsightType, { icon: ReactNode; color: string; bg: string; border: string }> = {
    [InsightType.ANOMALY]: { icon: <AlertTriangle size={18} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    [InsightType.TREND]: { icon: <TrendingUp size={18} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    [InsightType.CORRELATION]: { icon: <Zap size={18} />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    [InsightType.OUTLIER]: { icon: <AlertTriangle size={18} />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    [InsightType.DISTRIBUTION]: { icon: <BarChart2 size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
};

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (days > 1) return `${days}d ago`;
    if (days === 1) return `Yesterday`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
}

const ConfidenceRing: FC<{ score: number; size?: number }> = ({ score, size = 32 }) => {
    const validScore = typeof score === 'number' && !isNaN(score) ? Math.min(100, Math.max(0, score)) : 0;
    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (validScore / 100) * circumference;
    const colorClass = validScore >= 85 ? 'text-emerald-500' : validScore >= 70 ? 'text-amber-500' : 'text-rose-500';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    className="text-muted/20"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={colorClass}
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className="absolute text-[10px] font-bold text-muted-foreground">{validScore}%</span>
        </div>
    );
};

const InsightCard: FC<{ insight: Insight }> = ({ insight }) => {
    const { updateInsightStatus, inspectInsight } = useDashboard();
    const [isInspecting, setIsInspecting] = useState(false);
    
    const info = insightTypeInfo[insight.type] || { icon: <Lightbulb size={18} />, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };

    const handleSave = () => {
        const newStatus = insight.status === InsightStatus.SAVED ? InsightStatus.NEW : InsightStatus.SAVED;
        updateInsightStatus(insight.id, newStatus);
    };

    const handleInspect = async () => {
        setIsInspecting(true);
        await inspectInsight(insight);
        setIsInspecting(false);
    };

    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col overflow-hidden"
        >
            <div className={cn("absolute top-0 left-0 w-1 h-full", info.bg.replace('bg-', 'bg-gradient-to-b from-').replace('50', '500 to-transparent opacity-50'))} />
            
            <div className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", info.bg, info.color, "border", info.border)}>
                            {info.icon}
                        </div>
                        <div>
                            <Badge variant="outline" className={cn("mb-1 text-[10px] uppercase tracking-wider font-semibold", info.color, info.bg, info.border)}>
                                {(insight.type || 'Unknown')}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock size={12} />
                                <span>{formatTimeAgo(insight.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                         <ConfidenceRing score={insight.confidence} />
                         <span className="text-[10px] text-muted-foreground mt-0.5">Confidence</span>
                    </div>
                </div>

                <h3 className="font-bold text-lg text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
                    {insight.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
                    {insight.description}
                </p>

                <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        <Database size={12} />
                        <span className="truncate max-w-[100px]">{insight.dataSource}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                            onClick={handleSave}
                            title={insight.status === InsightStatus.SAVED ? "Unsave" : "Save for later"}
                        >
                            <Bookmark size={16} className={cn(insight.status === InsightStatus.SAVED && 'fill-current text-primary')} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={() => updateInsightStatus(insight.id, InsightStatus.DISMISSED)}
                            title="Dismiss"
                        >
                            <Trash2 size={16} />
                        </Button>
                        <Button 
                            size="sm" 
                            className="h-8 px-4 gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all rounded-full text-xs font-semibold"
                            onClick={handleInspect}
                            disabled={isInspecting}
                        >
                            {isInspecting ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <Zap size={14} className="fill-current" />
                            )}
                            {isInspecting ? 'Inspecting...' : 'Inspect'}
                        </Button>
                    </div>
                </div>
            </div>
        </MotionDiv>
    );
};

const EmptyState: FC<{ onGenerate: () => void; activeTab: string; isGenerating: boolean }> = ({ onGenerate, activeTab, isGenerating }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-20 animate-pulse" />
            <div className="bg-card p-6 rounded-full border border-border shadow-lg relative">
                {isGenerating ? (
                    <RefreshCw size={48} className="text-primary animate-spin" />
                ) : (
                    <Sparkles size={48} className="text-primary" />
                )}
            </div>
        </div>
        
        <h3 className="text-2xl font-bold text-foreground mb-2">
            {isGenerating ? "Analyzing your data..." : "Discover Hidden Insights"}
        </h3>
        
        <p className="max-w-md mx-auto text-muted-foreground mb-8 text-lg">
            {activeTab === 'all' 
                ? "Let AI analyze your data to find anomalies, trends, and opportunities you might have missed."
                : `You currently have no ${activeTab} insights. Check the 'All Insights' tab or generate new ones.`}
        </p>
        
        <Button size="lg" onClick={onGenerate} disabled={isGenerating} className="h-12 px-8 text-base shadow-lg hover:shadow-primary/25 transition-all">
            {isGenerating ? (
                <>
                    <RefreshCw size={18} className="mr-2 animate-spin" /> Generating...
                </>
            ) : (
                <>
                    <Sparkles size={18} className="mr-2" /> Generate New Insights
                </>
            )}
        </Button>
    </div>
);

const NavButton: FC<{ tabId: 'all' | 'new' | 'saved'; label: string; count: number; activeTab: string; setActiveTab: (tab: 'all' | 'new' | 'saved') => void }> = ({ tabId, label, count, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={cn(
            "w-full text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
            activeTab === tabId 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
    >
        <span className="flex items-center gap-2">
            {tabId === 'all' && <Lightbulb size={16} />}
            {tabId === 'new' && <Sparkles size={16} />}
            {tabId === 'saved' && <Bookmark size={16} />}
            {label}
        </span>
        <Badge 
            variant="secondary" 
            className={cn(
                "ml-auto transition-colors", 
                activeTab === tabId ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary-foreground/10'
            )}
        >
            {count}
        </Badge>
    </button>
);

export const InsightHubView: FC = () => {
    const { insights = [], generateNewInsights, isGeneratingInsights } = useDashboard();
    const [activeTab, setActiveTab] = useState<'all' | 'new' | 'saved'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const notDismissedInsights = useMemo(() => 
        (insights || []).filter((i: Insight) => i.status !== InsightStatus.DISMISSED), 
    [insights]);

    const filteredInsights = useMemo(() => {
        let result = notDismissedInsights;

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(i => 
                i.title.toLowerCase().includes(lowerSearch) ||
                i.description.toLowerCase().includes(lowerSearch)
            );
        }

        switch (activeTab) {
            case 'new': return result.filter(i => i.status === InsightStatus.NEW);
            case 'saved': return result.filter(i => i.status === InsightStatus.SAVED);
            case 'all':
            default: return result;
        }
    }, [notDismissedInsights, activeTab, searchTerm]);

    const counts = useMemo(() => ({
        all: notDismissedInsights.length,
        new: notDismissedInsights.filter(i => i.status === InsightStatus.NEW).length,
        saved: notDismissedInsights.filter(i => i.status === InsightStatus.SAVED).length,
    }), [notDismissedInsights]);

    return (
        <div className="h-full flex flex-col bg-background/95 backdrop-blur-sm">
            <ViewHeader icon={<Lightbulb size={24} className="text-primary" />} title="Insight Hub" showBackToDashboard={true}>
                <Button onClick={generateNewInsights} disabled={isGeneratingInsights} size="lg" className="shadow-sm">
                    <RefreshCw size={16} className={isGeneratingInsights ? 'animate-spin' : ''} />
                    {isGeneratingInsights ? 'Generating...' : 'Generate New Insights'}
                </Button>
            </ViewHeader>
            
            <div className="flex-grow flex flex-col md:flex-row min-h-0">
                <aside className="w-full md:w-72 flex-shrink-0 bg-card/50 border-b md:border-b-0 md:border-r border-border p-4 md:p-6 flex flex-col gap-4 md:gap-8 backdrop-blur-xl">
                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-1 hidden md:block">Filter & Search</h3>
                        <div className="relative mb-4 md:mb-6">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                            <input 
                                type="text"
                                placeholder="Search insights..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={cn(inputClasses, 'pl-10 h-10 bg-background border-border/50 focus:border-primary/50 transition-all')}
                            />
                        </div>
                        
                        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            <NavButton tabId="all" label="All Insights" count={counts.all} activeTab={activeTab} setActiveTab={setActiveTab} />
                            <NavButton tabId="new" label="New Discoveries" count={counts.new} activeTab={activeTab} setActiveTab={setActiveTab} />
                            <NavButton tabId="saved" label="Saved for Later" count={counts.saved} activeTab={activeTab} setActiveTab={setActiveTab} />
                        </nav>
                    </div>

                    <div className="mt-auto bg-primary/5 p-4 rounded-xl border border-primary/10 hidden md:block">
                        <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                            <Zap size={16} /> Pro Tip
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Click "Explore" on any insight to instantly generate a visualization in the Widget Editor.
                        </p>
                    </div>
                </aside>
                
                <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-secondary/20">
                    <div className="max-w-7xl mx-auto">
                        <AnimatePresence mode="wait">
                            {filteredInsights.length > 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                >
                                    {filteredInsights.map((insight: Insight) => <InsightCard key={insight.id} insight={insight} />)}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="h-full flex items-center justify-center"
                                >
                                    <EmptyState onGenerate={generateNewInsights} activeTab={activeTab} isGenerating={isGeneratingInsights} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};