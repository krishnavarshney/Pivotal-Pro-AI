import React, { useEffect, FC } from 'react';
import { useDashboard } from './contexts/DashboardProvider';
import { ModalsContainer } from './components/ModalsContainer';
import { MainView } from './views/MainView';
import { CustomDragLayer } from './components/ui/CustomDragLayer';
import { ToastContainer } from './components/ui/Toast';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { ContextMenu } from './components/ui/ContextMenu';
import { useAuth } from './contexts/AuthProvider';
import { AuthView } from './views/auth/AuthView';
import { AdminView } from './views/AdminView';
import { OnboardingManager } from './components/common/OnboardingManager';
import { UploadProgressModal } from './components/ui/UploadProgressModal';
import { useData } from './contexts/DataContext';

const UIManagers: FC = () => {
    const { loadingState, contextMenu, closeContextMenu } = useDashboard();
    const { uploadProgress, setUploadProgress } = useData();
    
    return (
        <>
            <CustomDragLayer />
            <ToastContainer />
            <OnboardingManager />
            {loadingState.isLoading && <LoadingOverlay message={loadingState.message} />}
            {contextMenu && <ContextMenu {...contextMenu} onClose={closeContextMenu} />}
            <UploadProgressModal 
                progress={uploadProgress} 
                onClose={() => setUploadProgress(null)} 
            />
        </>
    )
}

const App: FC = () => {
    const { 
        openCommandPalette, 
        currentView, 
        dashboardMode, 
        themeConfig, 
        dataSources, 
        onboardingState, 
        startOnboardingTour, 
        openGettingStartedModal,
        openWidgetEditorForNewWidget,
        setView
    } = useDashboard();
    const { isAuthenticated, user, isLoading } = useAuth();
    const prevDataSourceCount = React.useRef(dataSources.size);

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenGettingStartedModal');
        if (!hasSeen) {
            openGettingStartedModal();
        }
    }, [openGettingStartedModal]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

            if (isInput) return;

            // Command Palette: / or Ctrl+K
            if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
                e.preventDefault();
                openCommandPalette();
            }

            // Create Widget: Shift + N
            if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
                e.preventDefault();
                openWidgetEditorForNewWidget();
            }

            // Settings: Shift + S
            if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
                e.preventDefault();
                setView('settings');
            }
        };

        window.addEventListener('keydown', handler);
        return () => {
            window.removeEventListener('keydown', handler);
        };
    }, [openCommandPalette, openWidgetEditorForNewWidget, setView]);

    useEffect(() => {
        const body = document.body;
        body.classList.toggle('dark', themeConfig.mode === 'dark');
        body.dataset.theme = themeConfig.name;
    }, [themeConfig]);
    
    useEffect(() => {
        document.body.classList.toggle('comment-mode', dashboardMode === 'comment');
        document.body.classList.toggle('edit-mode', dashboardMode === 'edit');
    }, [dashboardMode]);
    
     useEffect(() => {
        // Trigger initial tour when the first data source is added
        if (dataSources.size > 0 && prevDataSourceCount.current === 0) {
            if (!onboardingState.completedTours.includes('dashboard')) {
                // startOnboardingTour('dashboard'); // Disabled in favor of the new welcome modal
            }
        }
        prevDataSourceCount.current = dataSources.size;
    }, [dataSources.size, onboardingState.completedTours, startOnboardingTour]);


    if (isLoading) {
        return <LoadingOverlay message="Authenticating..." />;
    }

    const renderContent = () => {
        if (!isAuthenticated) {
            return <AuthView />;
        }
        if (currentView === 'admin' && user?.role === 'ADMIN') {
            return <AdminView />;
        }
        return <MainView />;
    };

    return (
        <>
            {renderContent()}
            {isAuthenticated && <ModalsContainer />}
            <UIManagers />
        </>
    );
}

export default App;