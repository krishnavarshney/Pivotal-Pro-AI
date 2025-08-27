import React, { useMemo } from 'react';
import _ from 'lodash';
import { useDashboard } from '../contexts/DashboardProvider';
import { ViewHeader } from '../components/common/ViewHeader';
import { Home, MoreVertical, Edit, Copy, Trash2, LayoutGrid, FileText, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardPage, WidgetState, Workspace, WidgetLayout } from '../utils/types';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui';

const ResponsiveGridLayout = WidthProvider(Responsive);

const MiniatureLayout: React.FC<{ widgets: WidgetState[], layouts: { [key: string]: WidgetLayout[] } }> = ({ widgets, layouts }) => {
    // A simplified, non-interactive preview of the dashboard layout
    return (
        <div className="w-full h-full bg-grid overflow-hidden relative pointer-events-none">
            <ResponsiveGridLayout
                layouts={layouts}
                breakpoints={{ lg: 1200 }}
                cols={{ lg: 24 }}
                rowHeight={4} // Scaled down row height
                isDraggable={false}
                isResizable={false}
                isDroppable={false}
                compactType={null}
                preventCollision={true}
                margin={[4, 4]} // Scaled down margin
                className="opacity-70"
            >
                {(widgets || []).map(widget => (
                    <div key={widget.id} className="bg-card/80 rounded-sm border border-border/50" />
                ))}
            </ResponsiveGridLayout>
        </div>
    );
};

const DashboardCard: React.FC<{
    page: DashboardPage;
    workspace: Workspace;
}> = ({ page, workspace }) => {
    const { setView, setActivePageId, removePage, duplicatePage, openInputModal, updatePage, openConfirmationModal } = useDashboard();
    
    const handleNavigate = () => {
        setActivePageId(page.id);
        setView('dashboard');
    };

    const handleRename = () => {
        openInputModal({
            title: "Rename Dashboard",
            inputLabel: "New Dashboard Name",
            initialValue: page.name,
            onConfirm: (newName) => updatePage(page.id, { name: newName }),
        });
    };

    const handleDelete = () => {
        openConfirmationModal({
            title: `Delete "${page.name}"?`,
            message: "This action cannot be undone and will permanently delete the dashboard.",
            onConfirm: () => removePage(page.id),
        });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group relative bg-card rounded-xl border border-border shadow-sm transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1 flex flex-col"
        >
            <div className="absolute top-2 right-2 z-10">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100">
                            <MoreVertical size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleRename}><Edit size={14} className="mr-2" /> Rename</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicatePage(page.id)}><Copy size={14} className="mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={handleDelete}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <button onClick={handleNavigate} className="flex-grow flex flex-col text-left">
                <div className="h-48 bg-secondary/30 flex items-center justify-center p-2 border-b border-border">
                    <div className="w-full h-full bg-background p-1 rounded-sm border border-border/50 shadow-inner">
                        <MiniatureLayout widgets={page.widgets} layouts={page.layouts} />
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-bold text-foreground truncate">{page.name}</h3>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1.5">
                         <div className="flex items-center gap-2">
                            <FileText size={14} />
                            <span>{workspace.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={14} />
                            <span>{page.widgets.length} widget{page.widgets.length !== 1 && 's'}</span>
                        </div>
                    </div>
                </div>
            </button>
        </motion.div>
    );
};

export const DashboardHomeView: React.FC = () => {
    const { workspaces, addPage } = useDashboard();
    
    const allPagesWithWorkspaces = useMemo(() => {
        return workspaces.flatMap(ws => (ws.pages || []).map(p => ({ page: p, workspace: ws })));
    }, [workspaces]);

    return (
        <div className="h-full flex flex-col bg-background">
            <ViewHeader icon={<Home size={24} />} title="Dashboards" showBackToDashboard={false}>
                <Button onClick={addPage}>
                    <Plus size={16} /> Create New Page
                </Button>
            </ViewHeader>
            <main className="flex-grow p-6 overflow-y-auto bg-secondary/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allPagesWithWorkspaces.map(({ page, workspace }) => (
                        <DashboardCard key={page.id} page={page} workspace={workspace} />
                    ))}
                </div>
            </main>
        </div>
    );
};