import React, { useState, useEffect, useMemo, useRef, FC, ReactNode } from 'react';
import _ from 'lodash';
import { 
    Search, Plus, SunMoon, File, BarChart, Table, Database, Share, Settings, BookOpen, Timer, SlidersHorizontal, Lightbulb, Command, Palette
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { SearchableItem } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent } from '../ui/Dialog';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedStars } from '../../views/auth/AnimatedStars';
import { COLOR_PALETTES, THEME_DEFINITIONS } from '../../utils/constants';

interface ItemGroup {
    // FIX: Correctly type `title` to match `SearchableItem['category']` to resolve the type predicate error.
    title: SearchableItem['category'];
    items: SearchableItem[];
}

const Kbd: FC<{ children: ReactNode }> = ({ children }) => (
    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
      {children}
    </kbd>
);

const CommandPalettePreview: FC<{ item: SearchableItem | null }> = ({ item }) => {
    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Command size={48} />
                <p className="mt-4 text-sm">Details about the selected command will appear here.</p>
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col h-full">
            <div className="text-primary text-4xl mb-4">{item.icon}</div>
            <h3 className="text-xl font-bold font-display text-foreground">{item.title}</h3>
            {item.context && <p className="text-sm text-primary font-semibold mt-1">{item.context}</p>}
            <p className="text-muted-foreground mt-3 flex-grow">{item.description}</p>
            {item.shortcut && (
                 <div className="mt-4 flex items-center gap-2">
                    {item.shortcut.map(key => <Kbd key={key}>{key}</Kbd>)}
                </div>
            )}
        </div>
    );
};


export const CommandPaletteModal: FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { 
        workspaces, 
        activePage, 
        setActivePageId, 
        setView, 
        openWidgetEditorModal, 
        openWidgetEditorForNewWidget,
        setScrollToWidgetId, 
        toggleThemeMode,
        openPerformanceAnalyzer,
        openAddControlModal,
        dataSources,
        setThemeConfig,
        setDashboardDefaults,
        setChartLibrary,
    } = useDashboard();
    
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const activeItemRef = useRef<HTMLButtonElement>(null);
    const MotionDiv = motion.div;

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const allItems = useMemo((): SearchableItem[] => {
        const actionItems: SearchableItem[] = [
            { id: 'action-add-widget', category: 'Actions', title: 'Create new widget', description: 'Open the widget editor to build a new visualization.', icon: <Plus />, action: () => openWidgetEditorForNewWidget() },
            { id: 'action-add-control', category: 'Actions', title: 'Add Dashboard Control', description: 'Add a filter or parameter control to the current dashboard.', icon: <SlidersHorizontal />, action: openAddControlModal },
            // FIX: Property 'openInsightHub' does not exist on type 'DashboardContextProps'. Changed to use setView.
            { id: 'action-open-ai', category: 'Actions', title: 'Open Insight Hub', description: 'Use AI to find proactive insights and analyze your dashboard.', icon: <Lightbulb />, action: () => setView('insightHub') },
            { id: 'action-open-performance', category: 'Actions', title: 'Performance Analyzer', description: 'Check the performance and load times of widgets on the current page.', icon: <Timer />, action: openPerformanceAnalyzer },
        ];

        const quickSettingItems: SearchableItem[] = [
            ...THEME_DEFINITIONS.flatMap(theme =>
                (['light', 'dark'] as const).map((mode): SearchableItem => ({
                    id: `theme-${theme.id}-${mode}`,
                    category: 'Quick Settings',
                    title: `Theme: Set to ${theme.name} (${_.capitalize(mode)})`,
                    description: `Change the application's appearance to the ${theme.name} theme in ${mode} mode.`,
                    icon: <Palette />,
                    action: () => setThemeConfig(c => ({ ...c, name: theme.id, mode: mode })),
                }))
            ),
            ...Object.keys(COLOR_PALETTES).map((paletteName): SearchableItem => ({
                id: `palette-${paletteName}`,
                category: 'Quick Settings',
                title: `Colors: Set palette to ${paletteName}`,
                description: `Change the default color palette for charts to ${paletteName}.`,
                icon: <Palette />,
                action: () => setDashboardDefaults(d => ({ ...d, colorPalette: paletteName })),
            })),
            ...(['echarts', 'apexcharts', 'recharts'] as const).map((engine): SearchableItem => ({
                id: `engine-${engine}`,
                category: 'Quick Settings',
                title: `Engine: Set charting to ${_.capitalize(engine)}`,
                description: `Change the underlying chart rendering library to ${_.capitalize(engine)}.`,
                icon: <BarChart />,
                action: () => setChartLibrary(engine),
            })),
            { id: 'action-toggle-theme-mode', category: 'Quick Settings', title: 'Toggle Light/Dark Mode', description: 'Switch between light and dark themes for the application.', icon: <SunMoon />, action: toggleThemeMode },
        ];
        
        const navigationItems: SearchableItem[] = [
            { id: 'view-explorer', category: 'Navigation', title: 'Go to Data Explorer', description: 'Explore, filter, and sort your raw data.', icon: <Table />, action: () => setView('explorer') },
            { id: 'view-studio', category: 'Navigation', title: 'Go to Data Studio', description: 'Prepare and transform your data sources.', icon: <Database />, action: () => dataSources.size > 0 && setView('studio', { sourceId: dataSources.keys().next().value }) },
            { id: 'view-modeler', category: 'Navigation', title: 'Go to Data Modeler', description: 'Create relationships and joins between your data sources.', icon: <Share />, action: () => setView('modeler') },
            { id: 'view-stories', category: 'Navigation', title: 'Go to Data Stories', description: 'View and create narrative presentations from your dashboards.', icon: <BookOpen />, action: () => setView('stories') },
            { id: 'view-settings', category: 'Navigation', title: 'Open Settings', description: 'Configure application settings like theme and AI provider.', icon: <Settings />, action: () => setView('settings') },
        ];
        
        const dashboardItems: SearchableItem[] = [];
        workspaces.forEach(ws => {
            if(!ws || !ws.pages) return;
            ws.pages.forEach(page => {
                dashboardItems.push({ id: `page-${page.id}`, category: 'Dashboards', title: page.name, context: `Workspace: ${ws.name}`, description: `Navigate to the '${page.name}' dashboard.`, icon: <File />, action: () => setActivePageId(page.id) });
            });
        });

        const widgetItems: SearchableItem[] = [];
        if(activePage) {
            activePage.widgets.forEach(widget => {
                widgetItems.push({ id: `widget-${widget.id}`, category: 'Widgets', title: `Jump to: ${widget.title}`, context: `Page: ${activePage.name}`, description: 'Scroll to this widget on the current dashboard.', icon: <BarChart />, action: () => setScrollToWidgetId(widget.id) });
            });
        }
        
        return _.uniqBy([...actionItems, ...quickSettingItems, ...navigationItems, ...dashboardItems, ...widgetItems], 'id');
    }, [workspaces, activePage, dataSources, openWidgetEditorModal, openWidgetEditorForNewWidget, setView, setActivePageId, setScrollToWidgetId, toggleThemeMode, openPerformanceAnalyzer, openAddControlModal, setThemeConfig, setDashboardDefaults, setChartLibrary]);
    
    const filteredGroups = useMemo((): ItemGroup[] => {
        const itemsToFilter = query ? allItems.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase()) ||
            item.context?.toLowerCase().includes(query.toLowerCase())
        ) : allItems;

        
        const groupOrder = ['Actions', 'Quick Settings', 'Dashboards', 'Widgets', 'Navigation'] as const;
        
        const grouped = _.groupBy(itemsToFilter, 'category') as { [key in SearchableItem['category']]?: SearchableItem[] };
        
        return groupOrder
            .map(title => ({
                title,
                items: grouped[title],
            }))
            .filter((group): group is ItemGroup => group.items !== undefined && group.items.length > 0);
    }, [query, allItems]);

    const flatFilteredItems = useMemo(() => filteredGroups.flatMap(g => g.items), [filteredGroups]);
    
    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    useEffect(() => {
        activeItemRef.current?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(i => (i + 1) % (flatFilteredItems.length || 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(i => (i - 1 + (flatFilteredItems.length || 0)) % (flatFilteredItems.length || 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = flatFilteredItems[activeIndex];
                if (item) {
                    item.action();
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatFilteredItems, activeIndex, onClose]);

    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent
                containerClassName="w-[95%] max-w-4xl max-h-[70vh] h-full top-[15vh] translate-y-0"
                className="p-0 overflow-hidden shadow-2xl"
            >
                <div className="command-palette-container w-full h-full flex relative">
                    <AnimatedStars />
                    <div className="w-full h-full flex z-10">
                        <div className="w-full md:w-1/2 flex flex-col border-r border-border/20">
                            <div className="flex items-center gap-3 p-4 border-b border-border/20 flex-shrink-0">
                                <Search size={20} className="text-muted-foreground"/>
                                <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Type a command or search..." className="w-full bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"/>
                                <Kbd>esc</Kbd>
                            </div>
                            <div className="flex-grow overflow-y-auto">
                                <AnimatePresence mode="wait">
                                    <MotionDiv
                                        key={query ? 'results' : 'suggestions'}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {filteredGroups.length === 0 ? (
                                            <p className="text-center text-muted-foreground p-8">No results found.</p>
                                        ) : (
                                            filteredGroups.map(group => (
                                                <div key={group.title} className="p-2">
                                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase px-3 py-1">{group.title}</h3>
                                                    {group.items.map(item => {
                                                        const isSelected = flatFilteredItems[activeIndex]?.id === item.id;
                                                        return (
                                                            <button
                                                                ref={isSelected ? activeItemRef : null}
                                                                key={item.id}
                                                                onClick={() => { item.action(); onClose(); }}
                                                                className={cn('w-full flex justify-between items-center text-left p-3 rounded-lg transition-colors duration-100 relative', isSelected && 'bg-primary/10 command-palette-item--active')}
                                                            >
                                                                <div className="flex items-center gap-3 truncate">
                                                                    <div className={cn("flex-shrink-0", isSelected ? 'text-primary' : 'text-muted-foreground')}>{item.icon}</div>
                                                                    <div className="truncate">
                                                                        <p className={cn("truncate", isSelected ? "text-primary font-semibold" : "text-foreground")}>{item.title}</p>
                                                                        {item.context && <p className="text-xs text-muted-foreground truncate">{item.context}</p>}
                                                                    </div>
                                                                </div>
                                                                {isSelected && <div className="flex items-center gap-2 flex-shrink-0"><Kbd>↵</Kbd></div>}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            ))
                                        )}
                                    </MotionDiv>
                                </AnimatePresence>
                            </div>
                        </div>
                         <div className="hidden md:block w-1/2 command-palette-preview">
                            <CommandPalettePreview item={flatFilteredItems[activeIndex] || null} />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};