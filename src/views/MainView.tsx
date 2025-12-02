import { FC } from 'react';
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
import { OnboardingView } from './OnboardingView';
import { cn } from '../components/ui/utils';

export const MainView: FC = () => {
    const { 
        currentView, 
        workspaces,
        activePage,
        isWorkspacesLoading,
        isDataSourcesLoading
    } = useDashboard();
    
    const renderCurrentView = () => {
        switch(currentView) {
            case 'onboarding': return <OnboardingView />;
            case 'dashboard':
                const allPages = workspaces.flatMap(ws => ws.pages || []);
                if (!activePage) {
                    if (allPages.length > 0) {
                        return <DashboardHomeView />;
                    } else {
                         // Fallback if showEmptyState didn't catch it (shouldn't happen with new logic)
                         return <EmptyStateView />;
                    }
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
    
    // Show loading state if data is still loading
    if (isWorkspacesLoading || isDataSourcesLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-transparent">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Logic: If user has no workspaces, show Empty State.
    // Exception: If we are in 'onboarding' view, show that instead.
    const showEmptyState = workspaces.length === 0 && currentView !== 'onboarding';
    
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

    if (currentView === 'onboarding') {
        return (
             <div className="h-screen bg-transparent">
                <OnboardingView />
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
            <main className={cn("flex-1 relative overflow-hidden rounded-xl")}>
                <div key={`${currentView}-${activePage?.id || 'no-page'}`} className="absolute inset-0">
                    {renderCurrentView()}
                </div>
            </main>
        </div>
    );
};