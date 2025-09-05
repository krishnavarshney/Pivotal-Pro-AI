import React, { FC } from 'react';
// FIX: Add aliasing for motion component to fix TypeScript errors.
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../contexts/DashboardProvider';
import { AppSidebar } from '../components/dashboard/Sidebar';
import { DashboardView } from './DashboardView';
import { DataExplorerView } from './DataExplorerView';
import { DataStoryView } from './DataStoryView';
import { DataStudioView } from './DataStudioView';
import { DataModelerView } from './DataModelerView';
import { SettingsView } from './SettingsView';
import { EmptyStateView } from './EmptyStateView';
import { TemplateLibraryView } from './TemplateLibraryView';
import { PredictiveStudioView } from './PredictiveStudioView';
import { DataSourcesView } from './DataSourcesView';
import { DashboardHomeView } from './DashboardHomeView';
import { AdminView } from './AdminView';
import { InsightHubView } from './InsightHubView';
import { cn } from '../components/ui/utils';

// FIX: Add aliasing for motion component to fix TypeScript errors.
const MotionDiv = motion.div as any;

export const MainView: FC = () => {
    const { 
        currentView, 
        dataSources,
        workspaces,
        activePage,
    } = useDashboard();
    
    const renderCurrentView = () => {
        switch(currentView) {
            case 'dashboard':
                const allPages = workspaces.flatMap(ws => ws.pages || []);
                if (!activePage && allPages.length > 0) {
                    return <DashboardHomeView />;
                }
                return <DashboardView />;
            case 'admin': return <AdminView />;
            case 'datasources': return <DataSourcesView />;
            case 'explorer': return <DataExplorerView />;
            case 'stories': return <DataStoryView />;
            case 'studio': return <DataStudioView />;
            case 'modeler': return <DataModelerView />;
            case 'settings': return <SettingsView />;
            case 'templates': return <TemplateLibraryView />;
            case 'predictive': return <PredictiveStudioView />;
            case 'insightHub': return <InsightHubView />;
            default: return <DashboardHomeView />;
        }
    }
    
    const showEmptyState = dataSources.size === 0;
    const allPages = workspaces.flatMap(ws => ws.pages || []);
    // FIX: The Getting Started view should only show when a specific page is active, not when navigating to the home view.
    const showGettingStarted = !showEmptyState && currentView === 'dashboard' && activePage && allPages.length === 1 && activePage.widgets.length === 0;

    if (showEmptyState) {
        return (
            <div className="h-screen bg-transparent">
                <EmptyStateView />
            </div>
        );
    }

    if (showGettingStarted) {
        return (
             <div className="flex h-screen bg-transparent p-4 gap-4">
                <AppSidebar />
                <main className="flex-1 relative overflow-hidden rounded-xl">
                    <DashboardView />
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-transparent p-4 gap-4">
            <AppSidebar />
            <main className={cn("flex-1 relative overflow-hidden rounded-xl transition-all duration-300 ease-in-out")}>
                <AnimatePresence mode="wait">
                    <MotionDiv
                        key={currentView}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        {renderCurrentView()}
                    </MotionDiv>
                </AnimatePresence>
            </main>
        </div>
    );
};