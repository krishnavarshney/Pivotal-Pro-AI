
import React, { useEffect, useState, FC } from 'react';
import { Lightbulb, Sparkle, TrendUp, ChartBar, BookOpen, WarningCircle, ArrowClockwise } from 'phosphor-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent } from '../ui/Dialog';
import { FormattedInsight } from '../ui/FormattedInsight';
import { Badge } from '../ui/Badge';
import { cn } from '../ui/utils';
import { AiInsight, ProactiveInsight } from '../../utils/types';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

const InsightCard: FC<{ insight: AiInsight }> = ({ insight }) => {
    const { openEditorWithAIPrompt } = useDashboard();

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-secondary p-6 rounded-2xl space-y-4 border border-border/40"
        >
            <div>
                <h4 className="font-bold text-lg text-foreground mb-2 font-display">Summary</h4>
                <FormattedInsight text={insight.summary} />
            </div>
            {insight.keyTakeaways.length > 0 && (
                <div className="pt-4 border-t border-border/20">
                    <h4 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2 font-display"><TrendUp weight="bold" /> Key Takeaways</h4>
                    <ul className="list-none pl-1 space-y-2 text-sm text-foreground/90">
                        {insight.keyTakeaways.map((takeaway, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                                <span>{takeaway}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {insight.nextSteps.length > 0 && (
                 <div className="pt-4 border-t border-border/20">
                    <h4 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2 font-display"><ChartBar weight="bold" /> Actionable Next Steps</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {insight.nextSteps.map((step, i) => (
                            <button
                                key={i}
                                onClick={() => openEditorWithAIPrompt(step.description)}
                                className="p-4 bg-background/50 rounded-lg text-left hover:bg-primary/10 hover:border-primary/50 border border-border transition-all duration-200 group"
                            >
                                <p className="text-sm font-semibold text-foreground/90 group-hover:text-primary">{step.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </MotionDiv>
    );
};

const ProactiveInsightCard: FC<{ insight: ProactiveInsight }> = ({ insight }) => {
    const { openEditorWithAIPrompt } = useDashboard();
    const severityMap = {
        high: { class: 'bg-red-500/10 border-red-500/30 text-red-500', icon: <WarningCircle weight="fill"/> },
        medium: { class: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500', icon: <WarningCircle /> },
        low: { class: 'bg-sky-500/10 border-sky-500/30 text-sky-500', icon: <Lightbulb /> },
    };

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-card border border-border rounded-xl p-4 space-y-3"
        >
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-foreground pr-4">{insight.title}</h4>
                <Badge className={cn("capitalize", severityMap[insight.severity].class)}>
                    {severityMap[insight.severity].icon} {insight.severity}
                </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{insight.summary}</p>
            <div className="flex flex-wrap gap-2 pt-2">
                {insight.involvedFields.map(field => <Badge key={field} variant="secondary">{field}</Badge>)}
            </div>
            <div className="pt-3 border-t border-border/50">
                 <Button size="sm" variant="outline" onClick={() => openEditorWithAIPrompt(insight.suggestedChartPrompt)}>
                    <ChartBar /> Investigate
                </Button>
            </div>
        </MotionDiv>
    );
};


export const AiAssistantModal: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { 
        insightsByPage, 
        isGeneratingInsights, 
        generateDashboardInsights,
        runProactiveAnalysis,
        proactiveInsights,
        activePage,
        setHasNewInsights,
        generateStoryFromInsights
    } = useDashboard();
    
    const [activeTab, setActiveTab] = useState<'proactive' | 'analysis'>('proactive');
    
    const pageDashboardInsights = activePage ? insightsByPage.get(activePage.id) || [] : [];
    const pageProactiveInsights = activePage ? proactiveInsights.get(activePage.id) || [] : [];
    
    useEffect(() => {
        if (isOpen) {
            setHasNewInsights(false); // Mark as "read"
            if (activePage && !proactiveInsights.has(activePage.id) && !isGeneratingInsights) {
                runProactiveAnalysis();
            }
        }
    }, [isOpen, activePage, proactiveInsights, isGeneratingInsights, runProactiveAnalysis, setHasNewInsights]);
    
    const handleManualAnalysis = () => {
        if (activePage && !isGeneratingInsights) {
            generateDashboardInsights();
        }
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 bg-transparent border-none shadow-none">
                 <div className="h-full flex flex-col bg-card rounded-2xl overflow-hidden border border-border/50">
                    <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border/50">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Sparkle size={22} weight="bold" className="text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground font-display">AI Assistant</h3>
                                <p className="text-sm text-muted-foreground">Your intelligent data analysis partner.</p>
                            </div>
                        </div>
                    </header>

                    <div className="flex-shrink-0 border-b border-border/50 flex items-center p-2 bg-secondary/30">
                        <button onClick={() => setActiveTab('proactive')} className={cn('flex-1 text-center py-2 px-4 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2', activeTab === 'proactive' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground')}>
                           <Lightbulb /> Proactive Insights
                        </button>
                        <button onClick={() => setActiveTab('analysis')} className={cn('flex-1 text-center py-2 px-4 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2', activeTab === 'analysis' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground')}>
                            <TrendUp /> Dashboard Analysis
                        </button>
                    </div>

                    <main className="flex-grow p-6 min-h-0 overflow-y-auto bg-secondary/30">
                        <AnimatePresence mode="wait">
                            <MotionDiv
                                key={activeTab}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isGeneratingInsights && (
                                    <div className="space-y-4">
                                        {[...Array(2)].map((_, i) => (
                                            <div key={i} className="bg-card p-6 rounded-xl space-y-4 animate-pulse">
                                                <div className="h-4 bg-muted rounded w-1/4"></div>
                                                <div className="space-y-2">
                                                    <div className="h-3 bg-muted rounded w-full"></div>
                                                    <div className="h-3 bg-muted rounded w-5/6"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!isGeneratingInsights && activeTab === 'proactive' && (
                                    <div className="space-y-4">
                                        {pageProactiveInsights.length > 0 && (
                                            <Button onClick={() => generateStoryFromInsights(pageProactiveInsights)} className="w-full mb-4 ai-feature-style">
                                                <BookOpen /> Create Story from These Insights
                                            </Button>
                                        )}
                                        {pageProactiveInsights.map(insight => <ProactiveInsightCard key={insight.id} insight={insight} />)}
                                        {pageProactiveInsights.length === 0 && (
                                             <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                                <h3 className="text-xl font-semibold text-foreground font-display">No significant insights found yet.</h3>
                                                <p className="max-w-md mx-auto mt-2 text-muted-foreground">The AI continuously monitors your data. Check back later or try regenerating.</p>
                                                <Button size="lg" onClick={runProactiveAnalysis} className="mt-6">
                                                    <ArrowClockwise /> Scan for Insights Now
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isGeneratingInsights && activeTab === 'analysis' && (
                                    <div className="space-y-4">
                                        {pageDashboardInsights.map((insight, i) => <InsightCard key={insight.id} insight={insight} />)}
                                        {pageDashboardInsights.length === 0 && (
                                             <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                                <h3 className="text-xl font-semibold text-foreground font-display">Ready for a Dashboard Summary?</h3>
                                                <p className="max-w-md mx-auto mt-2 text-muted-foreground">Let the AI analyze your entire dashboard to generate key takeaways and actionable suggestions.</p>
                                                <Button size="lg" onClick={handleManualAnalysis} className="mt-6">
                                                    <Sparkle /> Generate Dashboard Analysis
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </MotionDiv>
                        </AnimatePresence>
                    </main>

                    <footer className="p-4 border-t border-border/50 flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button onClick={activeTab === 'proactive' ? runProactiveAnalysis : handleManualAnalysis} disabled={isGeneratingInsights}>
                             <ArrowClockwise size={16}/> {isGeneratingInsights ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                    </footer>
                </div>
            </DialogContent>
        </Dialog>
    );
};