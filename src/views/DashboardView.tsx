

import React, { useState, useMemo, useEffect, useRef, FC, ReactElement, MouseEvent, KeyboardEvent, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { 
    Settings, Sparkles, Save, Upload, Download, Filter, Trash2, Copy, Table, BookOpen, X, 
    Undo2, Redo2, AlertCircle, MoreVertical, RotateCw, Pencil, 
    Users, Aperture, Search, Puzzle, Share2, LogOut, BarChart, Timer, 
    GripVertical, ShieldCheck, Bookmark, MessageSquare, ChevronDown, LineChart, AreaChart,
    PieChart, AppWindow, Grid, Construction, BarChartHorizontal, Box, Dot,
    Layout as LayoutIcon, Info, SlidersHorizontal
} from 'lucide-react';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { Widget } from '../components/dashboard/Widget';
import { useDashboard } from '../contexts/DashboardProvider';
import { WidgetState, WidgetLayout, ChartType, Pill, FilterCondition, AggregationType, DND_ITEM_TYPE, FieldType, Bookmark as BookmarkType, ContextMenuItem, Field } from '../utils/types';
import { Button } from '../components/ui/Button';
import { Popover } from '../components/ui/Popover';
import { ShelfPill } from '../components/ui/Pill';
import { inputClasses, cn, Checkbox } from '../components/ui';
import { Tooltip } from '../components/ui/Tooltip';
import { DataProcessor } from '../components/common/DataProcessor';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import _ from 'lodash';
import { useSidebar, SidebarTrigger } from '../components/ui/sidebar';
import { GettingStartedView } from './GettingStartedView';
import { processWidgetData, generateTitle } from '../utils/dataProcessing/widgetProcessor';
import { useAuth } from '../contexts/AuthProvider';
import { HelpIcon } from '../components/ui/HelpIcon';
import { ThemeSwitcher } from '../components/dashboard/ThemeSwitcher';
import Slider from 'rc-slider';
import { formatValue } from '../utils/dataProcessing/formatting';

const ResponsiveGridLayout = WidthProvider(Responsive);

const NlpFilterBar: FC = () => {
    const { handleNlpFilterQuery } = useDashboard();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            handleNlpFilterQuery(query.trim());
            setQuery('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 max-w-lg relative">
            <Sparkles size={18} className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors", isFocused ? "text-primary" : "text-muted-foreground")} />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Filter with AI... (e.g., 'show corporate segment in the east region')"
                className={cn(
                    inputClasses,
                    "pl-10 h-9 w-full transition-all duration-300",
                    isFocused && "animate-border-glow shadow-lg shadow-primary/10"
                )}
                style={{'--glow-color': 'hsl(var(--primary-values))'} as React.CSSProperties}
            />
        </form>
    );
};


const GlobalFilterShelf: FC = () => {
    const { activePage, setGlobalFilters, openPageFiltersModal, crossFilter, setCrossFilter, openFilterConfigModal, newlyAddedPillId } = useDashboard();
    
    const globalFilters = activePage?.globalFilters || [];

    const handleRemovePill = (index: number) => {
        setGlobalFilters(pills => pills.filter((_, i) => i !== index));
    };

    const handlePillClick = (pill: any, index: number) => {
        openFilterConfigModal(pill, (updatedPill) => {
            setGlobalFilters(pills => {
                const newPills = [...pills];
                newPills[index] = updatedPill;
                return newPills;
            });
        });
    };
    

    return (
        <div className="glass-panel rounded-lg px-3 py-2 border border-border">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-shrink-0">
                     <Button variant="outline" size="sm" onClick={openPageFiltersModal} title="Add or edit filters that affect all widgets on this page.">
                        <span className="icon-hover-anim"><Filter size={14} /></span> Page Filters
                    </Button>
                    <HelpIcon helpText="Page Filters apply to all widgets on this dashboard page. Cross-filters are temporary filters created by clicking on data points within a widget." />
                </div>
                <div className="flex-grow flex items-center gap-2 flex-wrap min-h-[32px]">
                     <AnimatePresence>
                    {globalFilters.map((pill, index) => (
                         <motion.div 
                            key={pill.id} 
                            layout
                            initial={{opacity:0, scale:0.5}} 
                            animate={{opacity:1, scale:1}} 
                            exit={{opacity:0, scale:0.5}}
                         >
                            <ShelfPill
                                pill={pill}
                                index={index}
                                shelfId="globalFilters"
                                onRemove={() => handleRemovePill(index)}
                                onClick={() => handlePillClick(pill, index)}
                                onMovePill={() => {}}
                                onContextMenu={() => {}}
                                isNew={pill.id === newlyAddedPillId}
                            />
                         </motion.div>
                    ))}
                     {crossFilter && (
                         <motion.div initial={{opacity:0, scale:0.5}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.5}}>
                            <div className="group relative">
                                <ShelfPill
                                    pill={crossFilter.filter}
                                    index={0}
                                    shelfId="globalFilters"
                                    onRemove={() => setCrossFilter(null)}
                                    onClick={() => {}}
                                    onMovePill={() => {}}
                                    onContextMenu={() => {}}
                                />
                                 <div className="absolute -top-2 -left-2 p-1 bg-primary text-primary-foreground rounded-full animate-border-glow">
                                    <span className="icon-hover-anim"><Aperture size={12} strokeWidth={3}/></span>
                                </div>
                            </div>
                         </motion.div>
                     )}
                     </AnimatePresence>
                </div>
                <NlpFilterBar />
            </div>
        </div>
    );
}


export const DashboardView: FC = () => {
    const {
        activePage,
        widgets,
        layouts,
        setLayouts,
        scrollToWidgetId,
        setScrollToWidgetId,
        dashboardMode
    } = useDashboard();
    const MotionDiv = motion.div;

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

    if (!activePage) {
        return <div className="h-full w-full flex items-center justify-center text-muted-foreground">No active page found. Please add a page.</div>
    }

    if (activePage.widgets.length === 0) {
        return <GettingStartedView />;
    }
    
    const onLayoutChange = (layout: WidgetLayout[], newLayouts: { [key: string]: WidgetLayout[] }) => {
        if (Object.keys(newLayouts).length > 0 && !_.isEqual(layouts, newLayouts)) {
             setLayouts(newLayouts);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-transparent p-4 gap-4">
            <DashboardHeader />
            <GlobalFilterShelf />
            <div id="dashboard-grid" className={cn("flex-grow overflow-auto bg-grid rounded-xl", dashboardMode === 'comment' && 'cursor-crosshair')}>
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
                    isDraggable={true}
                    isResizable={true}
                    className="layout"
                    useCSSTransforms={true}
                >
                    {widgets.map(widget => (
                        <div key={widget.id} id={`widget-wrapper-${widget.id}`} className="flex flex-col h-full">
                            <Widget widget={widget} />
                        </div>
                    ))}
                </ResponsiveGridLayout>
            </div>
        </div>
    );
};
