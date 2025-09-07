import React from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Sparkle, Pencil, Database, Share2, BookOpen, Brain, CheckCircle, ArrowRight } from 'lucide-react';
import { GettingStartedGuideItem } from '../../utils/types';
import { TOURS } from '../../utils/onboardingTours';

const guideItems: Omit<GettingStartedGuideItem, 'id' | 'view'>[] = [
    {
        icon: <Sparkle size={24} />,
        title: "Let AI Build a Dashboard",
        description: "Analyze your data and automatically generate a complete, insightful dashboard.",
    },
    {
        icon: <Pencil size={24} />,
        title: "Build a Widget Manually",
        description: "Craft your own visualizations with the powerful drag-and-drop editor.",
    },
    {
        icon: <Database size={24} />,
        title: "Prepare Your Data",
        description: "Clean, transform, and create calculated fields in the Data Studio.",
    },
    {
        icon: <Share2 size={24} />,
        title: "Connect Multiple Datasets",
        description: "Visually join different data sources together in the Data Modeler.",
    },
    {
        icon: <BookOpen size={24} />,
        title: "Tell a Data Story",
        description: "Weave your charts into a compelling, slide-by-slide narrative.",
    },
    {
        icon: <Brain size={24} />,
        title: "Run Predictive Models",
        description: "Use machine learning to forecast outcomes and find key drivers in your data.",
    }
];

export const GettingStartedGuideModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { 
        startOnboardingTour, 
        onboardingState, 
        openAiInsightStarterModal, 
        setView,
        openWidgetEditorModal,
        dataSources
    } = useDashboard();
    
    const firstSourceId = dataSources.keys().next().value;

    const handleAction = (title: string) => {
        onClose();
        switch(title) {
            case "Let AI Build a Dashboard":
                openAiInsightStarterModal();
                break;
            case "Build a Widget Manually":
                openWidgetEditorModal();
                startOnboardingTour('widgetEditor');
                break;
            case "Prepare Your Data":
                if(firstSourceId) setView('studio', { sourceId: firstSourceId });
                startOnboardingTour('dataStudio');
                break;
            case "Connect Multiple Datasets":
                setView('modeler');
                startOnboardingTour('dataModeler');
                break;
            case "Tell a Data Story":
                setView('stories');
                startOnboardingTour('stories');
                break;
            case "Run Predictive Models":
                setView('predictive');
                startOnboardingTour('predictive');
                break;
        }
    }
    
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent containerClassName="w-[95%] max-w-4xl" className="max-h-[85vh] flex flex-col p-0">
                 <DialogHeader className="text-center">
                    <DialogTitle className="text-3xl font-display">Getting Started Guide</DialogTitle>
                    <DialogDescription>Explore the core features of Pivotal Pro AI. Complete a tour to check it off your list.</DialogDescription>
                </DialogHeader>
                <main className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-secondary/30">
                    {guideItems.map(item => {
                        const tourName = TOURS[item.title.toLowerCase().replace(/ /g, '') as keyof typeof TOURS] ? item.title.toLowerCase().replace(/ /g, '') : null;
                        const isCompleted = tourName ? onboardingState.completedTours.includes(tourName as any) : false;
                        return (
                            <div key={item.title} className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col items-start text-left relative">
                                {isCompleted && <CheckCircle size={20} className="absolute top-4 right-4 text-green-500" />}
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                                <p className="text-sm text-muted-foreground mt-2 flex-grow">{item.description}</p>
                                <Button variant="ghost" className="text-primary mt-6 -ml-3" onClick={() => handleAction(item.title)}>
                                    Show Me How <ArrowRight size={16} className="ml-1" />
                                </Button>
                            </div>
                        )
                    })}
                </main>
                 <div className="p-4 border-t border-border flex justify-end">
                    <Button onClick={onClose}>I'm Ready to Explore</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};