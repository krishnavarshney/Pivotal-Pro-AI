

import React, { FC, ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { useSidebar, SidebarTrigger } from '../ui/sidebar.tsx';
import { Button } from '../ui/Button';

interface ViewHeaderProps {
    icon: ReactNode;
    title: string;
    children?: ReactNode;
    showBackToDashboard?: boolean;
}

export const ViewHeader: FC<ViewHeaderProps> = ({ icon, title, children, showBackToDashboard = true }) => {
    const { setView } = useDashboard();
    const { isMobile } = useSidebar();

    return (
        <header className="flex-shrink-0 min-h-[65px] flex flex-wrap gap-4 justify-between items-center glass-header px-6 border-b border-border/50 z-10">
            <div className="flex items-center gap-3">
                {isMobile ? <SidebarTrigger /> : (showBackToDashboard &&
                    <Button variant="secondary" onClick={() => setView('dashboard')} title="Back to Dashboard">
                        <ArrowLeft size={16}/> Back
                    </Button>
                )}
                <div className="flex items-center gap-3">
                    <span className="text-primary">{icon}</span>
                    <h2 className="text-xl font-bold font-display text-foreground truncate">{title}</h2>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {children}
            </div>
        </header>
    );
};