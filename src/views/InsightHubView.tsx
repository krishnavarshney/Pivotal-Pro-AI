import React, { useState, useMemo, FC, ReactNode } from 'react';
import _ from 'lodash';
import { useDashboard } from '../contexts/DashboardProvider';
import { ViewHeader } from '../components/common/ViewHeader';
import { Insight, InsightStatus, InsightType } from '../utils/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn, inputClasses } from '../components/ui/utils';
import {
    Lightbulb, RefreshCw, AlertTriangle, TrendingUp, Settings, Calendar, BarChart2, Users, Database,
    Bookmark, Trash2, ArrowRight, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

const insightTypeInfo: Record<InsightType, { icon: ReactNode; color: string }> = {
    [InsightType.ANOMALY]: { icon: <AlertTriangle size={20} />, color: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' },
    [InsightType.PREDICTION]: { icon: <TrendingUp size={20} />, color: 'text-blue-500 border-blue-500/30 bg-blue-500/10' },
    [InsightType.OPTIMIZATION]: { icon: <Settings size={20} />, color: 'text-green-500 border-green-500/30 bg-green-500/10' },
    [InsightType.FORECAST]: { icon: <Calendar size={20} />, color: 'text-pink-500 border-pink-500/30 bg-pink-500/10' },
    [InsightType.PERFORMANCE]: { icon: <BarChart2 size={20} />, color: 'text-purple-500 border-purple-500/30 bg-purple-500/10' },
    [InsightType.USAGE]: { icon: <Users size={20} />, color: 'text-orange-500 border-orange-500/30 bg-orange-500/10' },
};

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (days > 1) return `${days} days ago`;
    if (days === 1) return `Yesterday`;
    if (hours > 1) return `${hours} hours ago`;
    if (minutes > 1) return `${minutes} minutes ago`;
    return "just now";
}


const InsightCard: FC<{ insight: Insight }> = ({ insight }) => {
    const { updateInsightStatus, exploreInsight } = useDashboard();
    
    const confidenceColor = insight.confidence >= 85 ? 'bg-green-100 text-green-800' : insight.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
    const info = insightTypeInfo[insight.type];

    const handleSave = () => {
        const newStatus = insight.status === InsightStatus.SAVED ? InsightStatus.NEW : InsightStatus.SAVED;
        updateInsightStatus(insight.id, newStatus);
    };
    
    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="bg-card rounded-xl border border-border shadow-sm flex flex-col transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-0.5"
        >
            <header className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", info.color)}>
                        {info.icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">{insight.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                             <Badge variant="secondary" className={cn("capitalize", info.color)}>{insight.type.toLowerCase()}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                    <Badge className={cn("text-xs", confidenceColor)}>{insight.confidence}% Conf.</Badge>
                    <span className="text-xs text-muted-foreground mt-1">{formatTimeAgo(insight.timestamp)}</span>
                </div>
            </header>
            <div className="px-4 pb-4 flex-grow">
                <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/50">
                    {insight.description}
                </p>
            </div>
            <footer className="p-4 border-t border-border mt-auto flex items-center justify-between">
                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Database size={14} />
                    <span>{insight.dataSource}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSave}>
                        <Bookmark size={14} className={cn(insight.status === InsightStatus.SAVED && 'fill-current text-primary')} />
                        {insight.status === InsightStatus.SAVED ? 'Saved' : 'Save'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => updateInsightStatus(insight.id, InsightStatus.DISMISSED)}>
                        <Trash2 size={14} /> Dismiss
                    </Button>
                    <Button size="sm" onClick={() => exploreInsight(insight.suggestedChartPrompt)}>
                        Explore <ArrowRight size={14} />
                    </Button>
                </div>
            </footer>
        </MotionDiv>
    );
};

const EmptyState: FC<{ onGenerate: () => void; activeTab: string }> = ({ onGenerate, activeTab }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
        <Lightbulb size={48} className="opacity-30 mb-4" />
        <h3 className="text-xl font-semibold text-foreground">No Insights to Show</h3>
        <p className="max-w-sm mx-auto mt-2">
            {activeTab === 'all' 
                ? "Click 'Generate New Insights' to let AI analyze your data and find interesting patterns for you."
                : `You currently have no ${activeTab} insights. Check the 'All Insights' tab or generate new ones.`}
        </p>
        <Button size="lg" onClick={onGenerate} className="mt-6">
            <RefreshCw size={16} /> Generate Insights
        </Button>
    </div>
);

export const InsightHubView: FC = () => {
    const { insights, generateNewInsights, isGeneratingInsights } = useDashboard();
    const [activeTab, setActiveTab] = useState<'all' | 'new' | 'saved'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInsights = useMemo(() => {
        let notDismissed = insights.filter(i => i.status !== InsightStatus.DISMISSED);

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            notDismissed = notDismissed.filter(i => 
                i.title.toLowerCase().includes(lowerSearch) ||
                i.description.toLowerCase().includes(lowerSearch)
            );
        }

        switch (activeTab) {
            case 'new': return notDismissed.filter(i => i.status === InsightStatus.NEW);
            case 'saved': return notDismissed.filter(i => i.status === InsightStatus.SAVED);
            case 'all':
            default: return notDismissed;
        }
    }, [insights, activeTab, searchTerm]);

    const counts = useMemo(() => {
        const notDismissed = insights.filter(i => i.status !== InsightStatus.DISMISSED);
        return {
            all: notDismissed.length,
            new: notDismissed.filter(i => i.status === InsightStatus.NEW).length,
            saved: notDismissed.filter(i => i.status === InsightStatus.SAVED).length,
        }
    }, [insights]);

    const NavButton: FC<{ tabId: 'all' | 'new' | 'saved'; label: string; count: number; }> = ({ tabId, label, count }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={cn(
                "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                activeTab === tabId ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
        >
            <span>{label}</span>
            <Badge variant={activeTab === tabId ? 'default' : 'secondary'} className="ml-auto">{count}</Badge>
        </button>
    );

    return (
        <div className="h-full flex flex-col bg-background">
            <ViewHeader icon={<Lightbulb size={24} />} title="Insight Hub" showBackToDashboard={true}>
                <Button onClick={generateNewInsights} disabled={isGeneratingInsights} size="lg">
                    <RefreshCw size={16} className={isGeneratingInsights ? 'animate-spin' : ''} />
                    {isGeneratingInsights ? 'Generating...' : 'Generate New Insights'}
                </Button>
            </ViewHeader>
            
            <div className="flex-grow flex min-h-0">
                <aside className="w-64 flex-shrink-0 bg-background border-r border-border p-4 flex flex-col gap-6">
                    <div>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                            <input 
                                type="text"
                                placeholder="Search insights..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={cn(inputClasses, 'pl-9 h-9')}
                            />
                        </div>
                    </div>
                    <nav className="space-y-1">
                        <NavButton tabId="all" label="All Insights" count={counts.all} />
                        <NavButton tabId="new" label="New" count={counts.new} />
                        <NavButton tabId="saved" label="Saved" count={counts.saved} />
                    </nav>
                </aside>
                
                <main className="flex-grow p-6 overflow-y-auto bg-secondary/30">
                    <AnimatePresence>
                        {filteredInsights.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredInsights.map(insight => <InsightCard key={insight.id} insight={insight} />)}
                            </div>
                        ) : (
                             <EmptyState onGenerate={generateNewInsights} activeTab={activeTab} />
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};