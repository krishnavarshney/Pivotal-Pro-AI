import React, { useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import _ from 'lodash';
import { AnimatePresence } from 'framer-motion';
import { useDashboard } from '../contexts/DashboardProvider';
import { WidgetLayout } from '../utils/types';
import { cn } from '../components/ui/utils';
import { GettingStartedView } from './GettingStartedView';
import { dashboardApiService } from '../services/dashboardApiService';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { GlobalFilterShelf } from '../components/dashboard/GlobalFilterShelf';
import { Widget } from '../components/dashboard/Widget';
import { FloatingActionButton } from '../components/dashboard/FloatingActionButton';
import { BulkActionsBar } from '../components/dashboard/BulkActionsBar';
import { Checkbox } from '../components/ui/Checkbox';
import { HelpOverlay } from '../components/help/HelpOverlay';
import { CommentOverlay } from '../components/comments/CommentOverlay';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const DashboardView: React.FC = () => {
    const {
        activePage,
        widgets,
        layouts,
        setLayouts,
        scrollToWidgetId,
        setScrollToWidgetId,
        dashboardMode,
        selectedWidgetIds,
        toggleWidgetSelection,
    } = useDashboard();

    useEffect(() => {
        if (scrollToWidgetId) {
            const element = document.getElementById(`widget-wrapper-${scrollToWidgetId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-widget');
                setTimeout(() => {
                    element.classList.remove('highlight-widget');
                    setScrollToWidgetId(null);
                }, 2000);
            } else {
                 setScrollToWidgetId(null);
            }
        }
    }, [scrollToWidgetId, setScrollToWidgetId]);
    
    useEffect(() => {
        const handleResize = _.debounce(() => {
            window.dispatchEvent(new Event('resize'));
        }, 150);
        
        handleResize();

        return () => handleResize.cancel();
    }, [layouts]);

    const onLayoutChange = useCallback((layout: WidgetLayout[], newLayouts: { [key: string]: WidgetLayout[] }) => {
        if (Object.keys(newLayouts).length > 0 && !_.isEqual(layouts, newLayouts) && activePage) {
            setLayouts(newLayouts);
        }
    }, [layouts, setLayouts, activePage]);

    if (!activePage) {
        return <div className="h-full w-full flex items-center justify-center text-muted-foreground">No active page found. Please add a page.</div>
    }

    if (activePage.widgets.length === 0) {
        return <GettingStartedView />;
    }

    return (
        <div className="h-full w-full flex flex-col bg-transparent p-4 gap-4 relative">
            
            {/* New Overlays */}
            <HelpOverlay />
            <CommentOverlay />

            <div className="flex-grow flex flex-col gap-4 min-w-0 min-h-0">
                <DashboardHeader />
                <GlobalFilterShelf />
                <div id="dashboard-grid" className={cn(
                    "flex-grow overflow-auto rounded-xl relative", // Added relative for overlay positioning
                    dashboardMode === 'comment' && 'cursor-crosshair',
                    dashboardMode === 'edit' && "bg-grid border-2 border-dashed border-border/50 p-2"
                )}>
                    <ResponsiveGridLayout
                        layouts={layouts}
                        onLayoutChange={onLayoutChange}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }}
                        rowHeight={30}
                        draggableHandle=".drag-handle"
                        draggableCancel=".nodrag"
                        isBounded={true}
                        resizeHandles={['sw', 'nw', 'se', 'ne']}
                        isDraggable={dashboardMode === 'edit'}
                        isResizable={dashboardMode === 'edit'}
                        className="layout"
                        useCSSTransforms={true}
                    >
                        {widgets.map(widget => {
                             const isSelected = selectedWidgetIds.includes(widget.id);
                             return (
                                 <div key={widget.id} id={`widget-wrapper-${widget.id}`} className={cn(
                                     "flex flex-col h-full relative group/widgetwrapper",
                                     dashboardMode === 'edit' && 'transition-all duration-200',
                                     dashboardMode === 'edit' && isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl z-10",
                                     dashboardMode === 'edit' && selectedWidgetIds.length > 0 && !isSelected && "opacity-70 hover:opacity-100"
                                 )}>
                                     {dashboardMode === 'edit' && (
                                         <div className="absolute -top-2 -left-2 z-20">
                                             <Checkbox
                                                 checked={isSelected}
                                                 onCheckedChange={() => toggleWidgetSelection(widget.id)}
                                                 className="h-5 w-5 bg-background border-2"
                                                 aria-label={`Select widget ${widget.title}`}
                                             />
                                         </div>
                                     )}
                                     <Widget widget={widget} />
                                 </div>
                             )
                        })}
                    </ResponsiveGridLayout>
                </div>
            </div>
            <FloatingActionButton />
            <AnimatePresence>
                {dashboardMode === 'edit' && selectedWidgetIds.length > 0 && <BulkActionsBar />}
            </AnimatePresence>
        </div>
    );
};