import React, { FC } from 'react';
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


export const MainView: FC = () => {
    const { 
        currentView, 
        dataSources,
        workspaces
    } = useDashboard();
    
    const renderCurrentView = () => {
        switch(currentView) {
            case 'dashboard':
                const allPages = workspaces.flatMap(ws => ws.pages || []);
                if (allPages.length > 1) {
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
            default: return <DashboardHomeView />;
        }
    }
    
    const showEmptyState = dataSources.size === 0;
    const allPages = workspaces.flatMap(ws => ws.pages || []);
    const showGettingStarted = !showEmptyState && currentView === 'dashboard' && allPages.length === 1 && allPages[0].widgets.length === 0;

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
            <main className="flex-1 relative overflow-hidden rounded-xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentView}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        {renderCurrentView()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};