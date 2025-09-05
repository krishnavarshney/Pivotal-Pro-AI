import React, { FC, ReactNode } from 'react';
import { useDashboard } from '../contexts/DashboardProvider';
import { Pencil, Sparkles, Table, Database, BookOpen, Share2, ArrowRight, Brain } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../components/ui/utils';
// FIX: Corrected framer-motion import for Variants and aliased motion components.
import { motion, Variants } from 'framer-motion';

// FIX: Add aliasing for motion components to fix TypeScript errors.
const MotionDiv = motion.div as any;
const MotionH1 = motion.h1 as any;
const MotionP = motion.p as any;

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
        },
    },
};

const FeatureCard: FC<{
    icon: ReactNode;
    title: string;
    description: string;
    actionText: string;
    onClick: () => void;
    isPrimary?: boolean;
    className?: string;
}> = ({ icon, title, description, actionText, onClick, isPrimary = false, className }) => {
    return (
    <MotionDiv
        variants={itemVariants}
        whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
        className={cn(`bg-card rounded-xl border border-border shadow-md p-4 text-left flex flex-col group`, className)}
    >
        <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-primary transition-colors duration-300 ${isPrimary ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-secondary group-hover:bg-accent'}`}>
                <span className="icon-hover-anim">{icon}</span>
            </div>
        </div>
        <div className="flex-grow mt-4">
            <h3 className="text-md font-bold font-display text-foreground">{title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
        </div>
        <Button
            variant={isPrimary ? 'default' : 'secondary'}
            onClick={onClick}
            className={cn("w-full mt-6", isPrimary && "animate-highlight-pulse")}
        >
            {actionText} <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
    </MotionDiv>
)};

export const GettingStartedView: FC = () => {
    const { openWidgetEditorModal, openInsightHub, setView, dataSources, openAiInsightStarterModal } = useDashboard();
    const source = dataSources.values().next().value;
    const firstSourceId = source?.id;

    return (
        <div className="absolute inset-0 h-full w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-background">
            <div className="text-center w-full max-w-5xl mx-auto">
                <MotionDiv
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="icon-hover-anim inline-block"><Sparkles size={32} className="text-primary mx-auto mb-4" /></span>
                    <MotionH1 className="text-2xl sm:text-4xl font-bold font-display text-foreground">
                        Your Analysis Journey Begins Now
                    </MotionH1>
                    <MotionP className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mt-4">
                        You've successfully loaded <span className="font-semibold text-primary">{source?.name || 'your data'}</span>. Here are a few ways to get started and uncover insights.
                    </MotionP>
                </MotionDiv>

                <MotionDiv
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <FeatureCard
                        icon={<Sparkles size={24} />}
                        title="Build with AI"
                        description="Let AI analyze your entire dataset and automatically generate a complete, insightful dashboard for you."
                        actionText="Create AI Dashboard"
                        onClick={openAiInsightStarterModal}
                        isPrimary={true}
                        className="sm:col-span-2"
                    />
                    <FeatureCard
                        icon={<Pencil size={24} />}
                        title="Build Manually"
                        description="Use the powerful drag-and-drop editor for full control over your charts, tables, and KPIs."
                        actionText="Create a Widget"
                        onClick={() => openWidgetEditorModal()}
                        isPrimary={false}
                    />
                    
                     <FeatureCard
                        icon={<Table size={24} />}
                        title="Data Explorer"
                        description="Inspect, sort, and filter your raw data in a familiar spreadsheet-like interface."
                        actionText="Explore Data"
                        onClick={() => setView('explorer')}
                    />

                    <FeatureCard
                        icon={<Database size={24} />}
                        title="Data Studio"
                        description="Clean, prepare, and transform your dataset. Create calculated fields and new columns."
                        actionText="Prepare Data"
                        onClick={() => firstSourceId && setView('studio', { sourceId: firstSourceId })}
                    />

                    <FeatureCard
                        icon={<BookOpen size={24} />}
                        title="Data Stories"
                        description="Weave your visualizations into a compelling narrative to present and share your findings."
                        actionText="Create a Story"
                        onClick={() => setView('stories')}
                    />
                    
                    <FeatureCard
                        icon={<Share2 size={24} />}
                        title="Data Modeler"
                        description="Visually join multiple data sources together to create a unified view of your data."
                        actionText="Model Data"
                        onClick={() => setView('modeler')}
                    />
                    
                    <FeatureCard
                        icon={<Brain size={24} />}
                        title="Predictive Studio"
                        description="Build machine learning models like regression to predict outcomes and understand key drivers in your data."
                        actionText="Launch Studio"
                        onClick={() => setView('predictive')}
                    />
                </MotionDiv>
            </div>
        </div>
    );
};