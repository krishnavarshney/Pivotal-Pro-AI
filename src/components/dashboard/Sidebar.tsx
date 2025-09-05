import React, { useMemo, useState, ReactNode, FC } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Plus, Sparkle, FileText, Database, Home, Table2, BookOpen, SlidersHorizontal, Share2, Settings, MessageSquare, BrainCircuit, Lightbulb, ChevronsUpDown, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { Popover } from '../ui/Popover';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, SidebarHeader, SidebarContent, useSidebar, SidebarFooter } from '../ui/sidebar.tsx';
import { PageMenuItem, ParametersPanel } from './SidebarPanels';
import { ThemeSwitcher } from './ThemeSwitcher';
import { CurrentView } from '../../utils/types';
import { useAuth } from '../../contexts/AuthProvider';

// FIX: Add aliasing for motion components to fix TypeScript errors.
const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

const WorkspaceSwitcher: FC = () => {
    const { user, logout } = useAuth();
    const { workspaces, activePage, setView } = useDashboard();
    const { isCollapsed } = useSidebar();
    const [isOpen, setIsOpen] = useState(false);

    const activeWorkspace = useMemo(() => {
        return workspaces.find(ws => ws.pages.some(p => p.id === activePage?.id));
    }, [workspaces, activePage]);

    if (isCollapsed) {
        return (
            <div className="w-full py-2">
                <Tooltip content={user?.name || 'Profile'} placement="right" align="center">
                    <div className="w-10 h-10 mx-auto bg-secondary rounded-lg flex items-center justify-center font-bold text-secondary-foreground">
                        {user?.initials || 'P'}
                    </div>
                </Tooltip>
            </div>
        );
    }
    
    return (
        <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} trigger={
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent text-left"
            >
                <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center font-bold text-secondary-foreground flex-shrink-0">
                    {user?.initials || 'P'}
                </div>
                <div className="flex-grow truncate">
                    <p className="font-semibold text-sm text-foreground truncate">{activeWorkspace?.name || 'My Workspace'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.name || '...'}</p>
                </div>
                <ChevronsUpDown size={16} className="text-muted-foreground flex-shrink-0" />
            </button>
        } contentClassName="w-[260px] p-2">
            {({ close }) => (
                <div className="space-y-1">
                    <div className="p-2 border-b border-border mb-1">
                        <p className="text-sm font-semibold">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <button onClick={() => { setView('settings'); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><Settings size={16} /></span> Settings</button>
                    <div className="p-2">
                        <ThemeSwitcher />
                    </div>
                    <div className="h-px bg-border my-1" />
                    <button onClick={() => { logout(); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><LogOut size={16} /></span> Sign Out</button>
                </div>
            )}
        </Popover>
    );
};

const NavItem: FC<{ icon: ReactNode; label: string; isActive?: boolean; disabled?: boolean; onClick: () => void; isPage?: boolean; }> = ({ icon, label, isActive = false, disabled, onClick, isPage = false }) => {
    const { isCollapsed } = useSidebar();

    const content = (
         <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                isActive 
                    ? "text-foreground bg-accent" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                isCollapsed ? "justify-center" : "justify-start",
                isPage ? "py-1.5" : "py-2",
            )}
        >
            <AnimatePresence>
                {isActive && (
                    <MotionDiv
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 h-5 w-1 bg-primary rounded-r-full"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                )}
            </AnimatePresence>
            <span className="icon-hover-anim inline-block w-5 h-5 flex-shrink-0">
                {icon}
            </span>
            <AnimatePresence>
                {!isCollapsed && (
                    <MotionSpan
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto', transition: { delay: 0.1, duration: 0.2 } }}
                        exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                        className="truncate"
                    >
                        {label}
                    </MotionSpan>
                )}
            </AnimatePresence>
        </button>
    );

    if (isCollapsed) {
        return <Tooltip content={label} placement="right" align="center">{content}</Tooltip>;
    }

    return content;
};

const SectionHeader: FC<{ children: ReactNode }> = ({ children }) => {
    const { isCollapsed } = useSidebar();
    if (isCollapsed) return <div className="h-4" />;
    return <h2 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-4 pt-4 pb-1">{children}</h2>;
};

const SidebarInternalContent: FC = () => {
    const { 
        setView, 
        currentView,
        dataSources, 
        addPage,
        activePage,
        setActivePageId,
        workspaces,
        openInsightHub,
        openChatModal,
        openParameterModal,
        openAddDataSourceModal,
    } = useDashboard();
    const { isCollapsed, setMobileOpen } = useSidebar();
    
    const activeWorkspace = useMemo(() => {
        return workspaces.find(ws => ws.pages.some(p => p.id === activePage?.id));
    }, [workspaces, activePage]);


    const handleNavigation = (view: CurrentView, options?: any) => {
        setView(view, options);
        setMobileOpen(false);
    };
    
    const handleHomeNavigation = () => {
        setActivePageId(null);
        setView('dashboard');
        setMobileOpen(false);
    };

    return (
        <>
            <SidebarHeader className="p-3">
                <WorkspaceSwitcher />
            </SidebarHeader>
            
             <SidebarContent className="p-2 space-y-4">
                <div>
                    <SectionHeader>Analysis</SectionHeader>
                    <div className="space-y-1 p-2">
                        <NavItem icon={<Home size={20} />} label="Dashboards" onClick={handleHomeNavigation} isActive={currentView === 'dashboard' && !activePage}/>
                         {activeWorkspace?.pages.map(p => <PageMenuItem key={p.id} page={p} onNavigate={() => setMobileOpen(false)} />)}
                         <NavItem icon={<Plus size={20} />} label="New Page" onClick={addPage} isPage />
                    </div>
                     <div className="space-y-1 p-2">
                        <NavItem icon={<Table2 size={20} />} label="Data Explorer" onClick={() => handleNavigation('explorer', { initialFilters: [], initialSearchTerm: '' })} disabled={dataSources.size === 0} isActive={currentView === 'explorer'}/>
                        <NavItem icon={<BookOpen size={20} />} label="Data Stories" onClick={() => handleNavigation('stories')} disabled={dataSources.size === 0} isActive={currentView === 'stories'}/>
                        <NavItem icon={<BrainCircuit size={20} />} label="Predictive Studio" onClick={() => handleNavigation('predictive')} disabled={dataSources.size === 0} isActive={currentView === 'predictive'}/>
                        <NavItem icon={<Lightbulb size={20} />} label="Insight Hub" onClick={openInsightHub} />
                        <NavItem icon={<MessageSquare size={20} />} label="Chat with AI" onClick={openChatModal} />
                    </div>
                </div>
                <div>
                    <SectionHeader>Data Management</SectionHeader>
                    <div className="space-y-1 p-2">
                        <NavItem icon={<Database size={20} />} label="Data Sources" onClick={() => handleNavigation('datasources')} isActive={currentView === 'datasources'}/>
                        <NavItem icon={<Share2 size={20} />} label="Data Modeler" onClick={() => handleNavigation('modeler')} isActive={currentView === 'modeler'}/>
                        <NavItem icon={<FileText size={20} />} label="Data Studio" onClick={() => handleNavigation('studio')} disabled={dataSources.size === 0} isActive={currentView === 'studio'}/>
                    </div>
                </div>
                <div>
                    <SectionHeader>Configuration</SectionHeader>
                    <div className="space-y-1 p-2">
                        <NavItem icon={<SlidersHorizontal size={20} />} label="Parameters" onClick={openParameterModal} />
                    </div>
                </div>
            </SidebarContent>
            
            <SidebarFooter className="p-4">
                 <Button onClick={openAddDataSourceModal} variant="default" className="w-full">
                     <Plus /> {!isCollapsed && <span className="truncate">Add Data Source</span>}
                </Button>
            </SidebarFooter>
        </>
    );
};

export const AppSidebar: FC = () => {
    return (
        <Sidebar>
            <SidebarInternalContent />
        </Sidebar>
    );
};