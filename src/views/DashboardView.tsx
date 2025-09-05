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
import { useDashboard } from '../contexts/DashboardProvider';
import { WidgetState, WidgetLayout, ChartType, Pill, FilterCondition, AggregationType, DND_ITEM_TYPE, FieldType, Bookmark as BookmarkType, ContextMenuItem, Field } from '../utils/types';
import { Button } from '../components/ui/Button';
import { Popover } from '../components/ui/Popover';
import { ShelfPill } from '../components/ui/Pill';
import { inputClasses, cn } from '../components/ui/utils';
import { Checkbox } from '../components/ui/Checkbox';
import { Tooltip } from '../components/ui/Tooltip';
import { DataProcessor } from '../components/common/DataProcessor';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import _ from 'lodash';
import { useSidebar, SidebarTrigger } from '../components/ui/sidebar.tsx';
import { GettingStartedView } from './GettingStartedView';
import { processWidgetData, generateTitle } from '../utils/dataProcessing/widgetProcessor';
import { useAuth } from '../contexts/AuthProvider';
import { HelpIcon } from '../components/ui/HelpIcon';
import { ThemeSwitcher } from '../components/dashboard/ThemeSwitcher';
import Slider from 'rc-slider';
import { formatValue } from '../utils/dataProcessing/formatting';
import { BuilderSidebar } from '../components/dashboard/BuilderSidebar';

// FIX: Add aliasing for motion components to fix TypeScript errors.
const MotionButton = motion.button as any;

const ResponsiveGridLayout = WidthProvider(Responsive);

const chartIcons: Record<string, ReactElement> = {
    [ChartType.BAR]: <BarChart size={20} />,
    [ChartType.LINE]: <LineChart size={20} />,
    [ChartType.AREA]: <AreaChart size={20} />,
    [ChartType.PIE]: <PieChart size={20} />,
    [ChartType.SCATTER]: <AppWindow size={20} />,
    [ChartType.BUBBLE]: <Dot size={20} />,
    [ChartType.TABLE]: <Table size={20} />,
    [ChartType.TREEMAP]: <Grid size={20} />,
    [ChartType.DUAL_AXIS]: <BarChartHorizontal size={20} />,
    [ChartType.HEATMAP]: <Construction size={20} />,
    [ChartType.BOXPLOT]: <Box size={20} />,
    [ChartType.FUNNEL]: <Filter size={20} />,
    [ChartType.SANKEY]: <Share2 size={20} />,
};

const CompactChartTypeSelector: FC<{
    currentType: ChartType;
    onChange: (type: ChartType) => void;
    onClose: () => void;
}> = ({ currentType, onChange, onClose }) => {
    return (
        <div className="grid grid-cols-4 gap-2">
            {Object.values(ChartType)
                .filter(t => t !== ChartType.CONTROL && t !== ChartType.TABLE && t !== ChartType.KPI)
                .map(type => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => { onChange(type); onClose(); }}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-foreground ${currentType === type ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                        title={type}
                    >
                        <span className="icon-hover-anim">{chartIcons[type]}</span>
                        <span className="text-xs mt-1">{type}</span>
                    </button>
                ))
            }
        </div>
    );
};

const UserMenu: FC = () => {
    const { setView } = useDashboard();
    const { user, logout } = useAuth();
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);

    if (!user) return null;

    return (
        <Popover isOpen={isUserMenuOpen} onClose={() => setUserMenuOpen(false)} trigger={
            <button onClick={() => setUserMenuOpen(true)} className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm ring-2 ring-primary/50 hover:shadow-lg transition-shadow" aria-label={`Open user menu for ${user.name}`}>{user.initials}</button>
        } contentClassName="w-56 p-2" align="right">
            {({ close }) => (
                <div className="flex flex-col gap-1">
                    <div className="px-2 py-1 border-b border-border mb-1">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <button onClick={() => { setView('settings'); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><Settings size={16} /></span> Settings</button>
                    {user.role === 'ADMIN' && (
                        <button onClick={() => { setView('admin'); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><ShieldCheck size={16} /></span> Admin Dashboard</button>
                    )}
                    <div className="h-px bg-border my-1" />
                    <button onClick={() => { logout(); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><LogOut size={16} /></span> Sign Out</button>
                </div>
            )}
        </Popover>
    );
};

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
    
    // FIX: Add aliasing for motion component to fix TypeScript errors.
    const MotionDiv = motion.div as any;
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
                         <MotionDiv
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
                         </MotionDiv>
                    ))}
                     {crossFilter && (
                         <MotionDiv initial={{opacity:0, scale:0.5}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.5}}>
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
                         </MotionDiv>
                     )}
                     </AnimatePresence>
                </div>
                <NlpFilterBar />
            </div>
        </div>
    );
}

const SectionHeaderWidget: FC<{ widget: WidgetState }> = ({ widget }) => {
    const { saveWidget, openWidgetEditorModal, removeWidget } = useDashboard();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(widget.title);

    const handleTitleSave = () => {
        if (tempTitle.trim() && tempTitle !== widget.title) {
            saveWidget({ ...widget, title: tempTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleTitleSave();
        if (e.key === 'Escape') {
            setTempTitle(widget.title);
            setIsEditingTitle(false);
        }
    };
    
    const settings = widget.sectionSettings;
    const style: React.CSSProperties = {
        fontFamily: settings?.fontFamily,
        fontSize: settings?.fontSize ? `${settings.fontSize}px` : undefined,
        fontWeight: settings?.fontWeight,
        color: settings?.color,
        backgroundColor: settings?.backgroundColor,
        borderRadius: settings?.borderRadius ? `${settings.borderRadius}px` : undefined,
        paddingTop: settings?.paddingY ? `${settings.paddingY}px` : undefined,
        paddingBottom: settings?.paddingY ? `${settings.paddingY}px` : undefined,
        boxShadow: settings?.shadow && settings.shadow !== 'none' ? `var(--shadow-${settings.shadow})` : undefined,
        textAlign: settings?.textAlign,
    };

    return (
        <div style={style} className="rounded-lg flex flex-col h-full w-full group/widget overflow-hidden relative transition-all duration-200">
            <header className="drag-handle flex items-center p-2 h-full flex-shrink-0 gap-1 cursor-move">
                 <div className={cn("flex-grow flex items-center gap-2 group/title truncate nodrag", settings?.textAlign === 'center' && 'justify-center', settings?.textAlign === 'right' && 'justify-end')} onClick={(e) => { e.stopPropagation(); if (!isEditingTitle) setIsEditingTitle(true); }}>
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={tempTitle}
                            onChange={e => setTempTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleTitleKeyDown}
                            className="font-bold text-lg text-foreground bg-transparent border-b-2 border-primary focus:outline-none w-full cursor-text"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center gap-3 cursor-text w-full truncate" title="Click to edit title">
                             <h3 className="font-bold text-lg text-foreground truncate" style={{
                                 fontSize: 'inherit',
                                 fontFamily: 'inherit',
                                 fontWeight: 'inherit',
                                 color: 'inherit'
                             }}>
                                {widget.title}
                            </h3>
                            <span className="icon-hover-anim"><Pencil size={16} className="opacity-0 group-hover/title:opacity-100 text-muted-foreground flex-shrink-0" /></span>
                        </div>
                    )}
                </div>
                <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover/widget:opacity-100 transition-opacity nodrag flex items-center gap-1">
                    <Button variant="secondary" size="sm" onClick={() => openWidgetEditorModal(widget.id)}>
                        <Pencil size={14} /> Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeWidget(widget.id)}>
                        <Trash2 size={14} />
                    </Button>
                </div>
            </header>
        </div>
    );
};

const FilterControlWidget: FC<{ widget: WidgetState }> = ({ widget }) => {
    const { 
        blendedData, 
        blendedFields, 
        controlFilters, 
        setControlFilter,
        openWidgetEditorModal 
    } = useDashboard();
    
    const targetField = useMemo(() => {
        if (widget.targetType !== 'field' || !widget.targetId) return null;
        return [...blendedFields.dimensions, ...blendedFields.measures].find(f => f.name === widget.targetId);
    }, [widget.targetId, widget.targetType, blendedFields]);

    const displayType = widget.controlSettings?.display;
    const currentFilter = controlFilters.get(widget.id);

    if (!targetField) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <SlidersHorizontal size={24} className="text-muted-foreground mb-2" />
                <p className="font-semibold text-sm">Filter Control</p>
                <p className="text-xs text-muted-foreground">This control is not configured.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => openWidgetEditorModal(widget.id)}>
                    Configure Filter
                </Button>
            </div>
        );
    }
    
    if (displayType === 'range' && targetField.type === FieldType.MEASURE) {
        const { dataMin, dataMax } = useMemo(() => {
            const values = blendedData.map(row => row[targetField.name]).filter(v => typeof v === 'number');
            if (values.length === 0) return { dataMin: 0, dataMax: 100 };
            const min = _.min(values) || 0;
            const max = _.max(values) || 100;
            return { dataMin: min, dataMax: max };
        }, [blendedData, targetField]);

        const selectedRange = currentFilter?.filter?.values || [dataMin, dataMax];

        const debouncedSetControlFilter = useCallback(_.debounce((range: number[]) => {
            const filterPill: Pill = {
                id: widget.id,
                name: targetField.name,
                simpleName: targetField.simpleName,
                type: targetField.type,
                aggregation: AggregationType.COUNT,
                filter: {
                    condition: FilterCondition.BETWEEN,
                    values: range,
                },
            };
            setControlFilter(widget.id, filterPill);
        }, 200), [targetField, widget.id, setControlFilter]);
        
        return (
            <div className="p-6 h-full flex flex-col justify-center">
                <Slider
                    range
                    min={dataMin}
                    max={dataMax}
                    value={selectedRange}
                    onChange={(value) => debouncedSetControlFilter(value as number[])}
                    step={dataMax > dataMin ? (dataMax - dataMin) / 100 : 1}
                />
                <div className="flex justify-between text-xs font-mono mt-2 text-muted-foreground">
                    <span>{formatValue(selectedRange[0], { decimalPlaces: 2 })}</span>
                    <span>{formatValue(selectedRange[1], { decimalPlaces: 2 })}</span>
                </div>
            </div>
        );
    }

    if (displayType === 'datepicker' && targetField.type === FieldType.DATETIME) {
        const { dataMin, dataMax } = useMemo(() => {
            const dates = blendedData.map(row => row[targetField.name] ? new Date(row[targetField.name]).getTime() : null).filter(v => v !== null) as number[];
            if (dates.length === 0) return { dataMin: new Date(), dataMax: new Date() };
            return { dataMin: new Date(_.min(dates) as number), dataMax: new Date(_.max(dates) as number) };
        }, [blendedData, targetField]);
        
        const formatDateForInput = (date: Date | string | undefined) => {
            if (!date) return '';
            try { return new Date(date).toISOString().split('T')[0]; } catch { return ''; }
        };

        const selectedRange = currentFilter?.filter?.values || [dataMin, dataMax];
        const startDate = formatDateForInput(selectedRange[0]);
        const endDate = formatDateForInput(selectedRange[1]);

        const handleDateChange = (type: 'start' | 'end', value: string) => {
            const newStartDate = type === 'start' ? value : startDate;
            const newEndDate = type === 'end' ? value : endDate;
            if (new Date(newEndDate) < new Date(newStartDate)) return;

            const filterPill: Pill = {
                 id: widget.id,
                 name: targetField.name,
                 simpleName: targetField.simpleName,
                 type: targetField.type,
                 aggregation: AggregationType.COUNT,
                 filter: {
                     condition: FilterCondition.BETWEEN,
                     values: [new Date(newStartDate), new Date(newEndDate)],
                 },
            };
            setControlFilter(widget.id, filterPill);
        };
        
        return (
            <div className="p-3 space-y-2">
                 <div>
                    <label className="text-xs text-muted-foreground">Start Date</label>
                    <input type="date" value={startDate} onChange={e => handleDateChange('start', e.target.value)} className={cn(inputClasses, 'h-9')} />
                 </div>
                 <div>
                    <label className="text-xs text-muted-foreground">End Date</label>
                    <input type="date" value={endDate} onChange={e => handleDateChange('end', e.target.value)} className={cn(inputClasses, 'h-9')} />
                 </div>
            </div>
        );
    }
    
    const uniqueValues = useMemo(() => {
        if (!targetField || targetField.type !== FieldType.DIMENSION) return [];
        return _.sortBy(_.uniq(blendedData.map(row => row[targetField.name]).filter(v => v !== null && v !== undefined)));
    }, [blendedData, targetField]);

    const selectedValues = currentFilter?.filter?.values || [];

    const handleSelectionChange = (values: any[]) => {
        if (!targetField) return;

        if (values.length === 0) {
            setControlFilter(widget.id, null);
            return;
        }

        const filterPill: Pill = {
            id: widget.id,
            name: targetField.name,
            simpleName: targetField.simpleName,
            type: targetField.type,
            aggregation: AggregationType.COUNT,
            filter: {
                condition: FilterCondition.IS_ONE_OF,
                values: values,
            },
        };
        setControlFilter(widget.id, filterPill);
    };
    
    return (
        <div className="p-2 overflow-y-auto h-full">
            {uniqueValues.map(value => (
                <label key={String(value)} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                    <Checkbox 
                        checked={selectedValues.includes(value)}
                        onCheckedChange={(checked) => {
                            const newSelection = checked 
                                ? [...selectedValues, value] 
                                : selectedValues.filter(v => v !== value);
                            handleSelectionChange(newSelection);
                        }}
                    />
                    <span className="text-sm">{String(value)}</span>
                </label>
            ))}
        </div>
    );
};


const Widget: FC<{ widget: WidgetState }> = ({ widget }) => {
    const { 
        openWidgetEditorModal, openContextMenu, openDataLineageModal, 
        handleWidgetAddToStory, runWidgetAnalysis, runAdvancedAnalysis, saveWidget, 
        removeWidget, duplicateWidget, openWhatIfConfigModal, setFocusedWidgetId,
        dashboardMode, addComment, setActiveCommentThread, activePage,
        setChatContext, openChatModal
    } = useDashboard();
    // FIX: Add aliasing for motion component to fix TypeScript errors.
    const MotionDiv = motion.div as any;
    const MotionButton = motion.button as any;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChartTypePopoverOpen, setChartTypePopoverOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(widget.title);
    const widgetRef = useRef<HTMLDivElement>(null);
    
    const commentsForWidget = activePage?.comments?.filter(c => c.widgetId === widget.id) || [];

    const handleTitleSave = () => {
        if (tempTitle.trim() && tempTitle !== widget.title) {
            saveWidget({ ...widget, title: tempTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleTitleSave();
        if (e.key === 'Escape') {
            setTempTitle(widget.title);
            setIsEditingTitle(false);
        }
    };
    
    const handleWidgetClick = (e: MouseEvent<HTMLDivElement>) => {
        if (dashboardMode !== 'comment' || !widgetRef.current) return;
        
        const rect = widgetRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        addComment(widget.id, { x, y });
    };

    const handleViewToggle = (targetMode: 'chart' | 'table') => {
        let newChartType = widget.chartType;
        if (targetMode === 'table') {
            newChartType = ChartType.TABLE;
        } else if (targetMode === 'chart' && widget.chartType === ChartType.TABLE) {
            newChartType = ChartType.BAR; // Sensible default
        }
        
        const newWidgetState: WidgetState = {
            ...widget,
            displayMode: targetMode,
            chartType: newChartType
        };

        const chartTypeValues = Object.values(ChartType);
        const defaultTitles = ['New Widget', 'AI Suggested Widget', 'New AI Widget', ...chartTypeValues];
        const isDefaultTitle = defaultTitles.includes(widget.title);
        const chartTypesForRegex = chartTypeValues.map(ct => `${ct}( Chart)?`).join('|');
        const isAutoGeneratedTitle = new RegExp(`^.+\\s\\|\\s(${chartTypesForRegex})$`).test(widget.title);

        if (isDefaultTitle || isAutoGeneratedTitle) {
            newWidgetState.title = generateTitle(newWidgetState);
        }

        saveWidget(newWidgetState);
    };


    if (widget.displayMode === 'section') {
        return <SectionHeaderWidget widget={widget} />;
    }

    const menuItems: ContextMenuItem[] = [
        { label: 'Edit', icon: <Pencil size={16}/>, onClick: () => openWidgetEditorModal(widget.id) },
        { label: 'Focus', icon: <Search size={16}/>, onClick: () => setFocusedWidgetId(widget.id) },
        { label: 'Duplicate', icon: <Copy size={16}/>, onClick: () => duplicateWidget(widget.id) },
        { label: '---', onClick: () => {} },
        { label: 'Discuss with AI', icon: <MessageSquare size={16}/>, onClick: () => { setChatContext({ widgetId: widget.id }); openChatModal(); } },
        { label: 'AI Summary', icon: <Sparkles size={16}/>, onClick: () => runWidgetAnalysis(widget) },
        { label: 'Anomaly Detection', icon: <AlertCircle size={16}/>, onClick: () => runAdvancedAnalysis(widget.id, 'ANOMALY_DETECTION') },
        { label: 'Key Influencers', icon: <Users size={16}/>, onClick: () => runAdvancedAnalysis(widget.id, 'KEY_INFLUENCERS') },
        { label: 'Clustering', icon: <Aperture size={16}/>, onClick: () => runAdvancedAnalysis(widget.id, 'CLUSTERING') },
        { label: 'What-If Analysis', icon: <Puzzle size={16}/>, onClick: () => openWhatIfConfigModal(widget.id) },
        { label: '---', onClick: () => {} },
        { label: 'Add to Story', icon: <BookOpen size={16}/>, onClick: () => handleWidgetAddToStory(widget.id) },
        { label: 'Data Lineage', icon: <Share2 size={16}/>, onClick: () => openDataLineageModal(widget.id) },
        { label: '---', onClick: () => {} },
        { label: 'Delete', icon: <Trash2 size={16}/>, onClick: () => removeWidget(widget.id) },
    ];

    return (
        <MotionDiv ref={widgetRef} layoutId={`widget-container-${widget.id}`} onClick={handleWidgetClick} className="glass-panel rounded-xl flex flex-col h-full w-full group/widget overflow-hidden relative transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
             <header className="drag-handle flex items-center p-3 h-[52px] border-b border-border/50 flex-shrink-0 gap-1 cursor-move">
                <div className="nodrag cursor-default text-muted-foreground hover:text-foreground p-1 transition-colors duration-300 group-hover/widget:text-primary" title="Drag to move widget">
                    <span className="icon-hover-anim"><GripVertical /></span>
                </div>
                
                <div className="flex-grow flex items-center gap-1 group/title truncate nodrag" onClick={(e) => { e.stopPropagation(); if (!isEditingTitle) setIsEditingTitle(true); }}>
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={tempTitle}
                            onChange={e => setTempTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleTitleKeyDown}
                            className="font-semibold text-foreground text-sm truncate bg-transparent border-b border-primary focus:outline-none w-full max-w-sm cursor-text"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center gap-2 cursor-text w-full truncate" title="Click to edit title">
                            <h3 className="font-semibold text-foreground text-sm truncate">
                                {widget.title}
                            </h3>
                            <span className="icon-hover-anim"><Pencil size={14} className="opacity-0 group-hover/title:opacity-100 text-muted-foreground flex-shrink-0" /></span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-1 pl-2 nodrag">
                     <div className="p-0.5 bg-secondary rounded-lg flex items-center opacity-0 group-hover/widget:opacity-100 transition-opacity">
                        <Tooltip content="Chart View">
                            <button onClick={(e) => { e.stopPropagation(); handleViewToggle('chart'); }} className={cn("p-1.5 rounded-md cursor-pointer", widget.displayMode === 'chart' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-background/50')} aria-label="Switch to Chart View">
                                <span className="icon-hover-anim"><BarChart size={16} /></span>
                            </button>
                        </Tooltip>
                         <Tooltip content="Table View">
                            <button onClick={(e) => { e.stopPropagation(); handleViewToggle('table'); }} className={cn("p-1.5 rounded-md cursor-pointer", widget.displayMode === 'table' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-background/50')} aria-label="Switch to Table View">
                                <span className="icon-hover-anim"><Table size={16} /></span>
                            </button>
                        </Tooltip>
                    </div>
                    <AnimatePresence>
                        {widget.displayMode === 'chart' && widget.chartType !== ChartType.KPI && (
                            <MotionDiv initial={{opacity:0, width:0}} animate={{opacity:1, width:'auto'}} exit={{opacity:0, width:0}}>
                                <Popover
                                    isOpen={isChartTypePopoverOpen}
                                    onClose={() => setChartTypePopoverOpen(false)}
                                    trigger={
                                        <button onClick={(e) => { e.stopPropagation(); setChartTypePopoverOpen(true); }} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground opacity-0 group-hover/widget:opacity-100 transition-opacity cursor-pointer flex items-center gap-1" aria-label="Change chart type">
                                            <span className="icon-hover-anim">{chartIcons[widget.chartType]}</span>
                                            <ChevronDown size={12} />
                                        </button>
                                    }
                                    contentClassName="w-72 p-2"
                                    align="right"
                                >
                                     <CompactChartTypeSelector 
                                         currentType={widget.chartType}
                                         onChange={(newType) => saveWidget({...widget, chartType: newType})}
                                         onClose={() => setChartTypePopoverOpen(false)}
                                     />
                                </Popover>
                            </MotionDiv>
                        )}
                    </AnimatePresence>
                    <Popover
                        isOpen={isMenuOpen}
                        onClose={() => setIsMenuOpen(false)}
                        trigger={<button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground opacity-0 group-hover/widget:opacity-100 transition-opacity cursor-pointer" aria-label="Open widget menu"><MoreVertical/></button>}
                        contentClassName="w-48 p-1"
                        align="right"
                    >
                         {({ close }) => (
                            <div className="flex flex-col gap-1">
                                {menuItems.map((item, index) => item.label === '---' ? <div key={index} className="h-px bg-border my-1" /> : (
                                    <button key={index} onClick={() => { item.onClick(); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent disabled:opacity-50" disabled={item.disabled}>
                                        <span className="icon-hover-anim">{item.icon}</span> {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </Popover>
                </div>
            </header>
            <div className="flex-grow min-h-0 w-full">
                 {widget.displayMode === 'control' 
                    ? <FilterControlWidget widget={widget} /> 
                    : <DataProcessor widget={widget} />
                }
            </div>
             <AnimatePresence>
            {commentsForWidget.map(comment => (
                <MotionButton
                    key={comment.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.2, boxShadow: '0 0 10px hsl(var(--primary))' }}
                    onClick={(e: MouseEvent) => {
                        e.stopPropagation(); // prevent creating a new comment
                        setActiveCommentThread(comment);
                    }}
                    className="absolute z-10 w-6 h-6 rounded-full bg-primary shadow-lg flex items-center justify-center text-primary-foreground"
                    style={{
                        left: `${comment.position.x}%`,
                        top: `${comment.position.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                    aria-label="View comment thread"
                >
                    <MessageSquare size={14} />
                </MotionButton>
            ))}
            </AnimatePresence>
        </MotionDiv>
    );
};

const BookmarkMenu: FC = () => {
    const { activePage, addBookmark, applyBookmark, removeBookmark, openInputModal } = useDashboard();
    const [isBookmarkMenuOpen, setBookmarkMenuOpen] = useState(false);
    if (!activePage) return null;

    const handleAddBookmark = () => {
        openInputModal({
            title: "Create Bookmark",
            inputLabel: "Bookmark Name",
            initialValue: `Bookmark ${activePage.bookmarks.length + 1}`,
            onConfirm: addBookmark
        });
    };

    return (
        <Popover
            isOpen={isBookmarkMenuOpen}
            onClose={() => setBookmarkMenuOpen(false)}
            trigger={
                <Button variant="ghost" size="icon" onClick={() => setBookmarkMenuOpen(true)} aria-label="Open bookmarks menu" className="h-7 w-7">
                    <span className="icon-hover-anim"><Bookmark size={16}/></span>
                </Button>
            }
            contentClassName="w-72 p-2"
        >
            {({ close }) => (
                <div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {activePage.bookmarks.map(bm => (
                            <div key={bm.id} className="group flex items-center justify-between p-2 rounded hover:bg-accent">
                                <button onClick={() => {applyBookmark(bm as BookmarkType); close();}} className="truncate text-sm font-medium">{bm.name}</button>
                                <button onClick={() => removeBookmark(bm.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" aria-label={`Delete bookmark ${bm.name}`}><span className="icon-hover-anim"><Trash2 size={14}/></span></button>
                            </div>
                        ))}
                         {activePage.bookmarks.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">No bookmarks yet.</p>}
                    </div>
                    <div className="mt-2 pt-2 border-t border-border">
                        <Button size="sm" className="w-full" onClick={handleAddBookmark}>Create Bookmark from Current State</Button>
                    </div>
                </div>
            )}
        </Popover>
    )
};

const ActionsPopover: FC = () => {
    const { 
        activePage,
        openCreateTemplateModal,
        importInputRef,
        handleExportDashboard,
        openPerformanceAnalyzer,
        resetDashboard,
    } = useDashboard();
    const [isOpen, setIsOpen] = useState(false);

    if (!activePage) return null;

    const actions = [
        { label: 'Save Page as Template', icon: <Save size={16} />, onClick: () => openCreateTemplateModal(activePage) },
        { label: '---', onClick: () => {} },
        { label: 'Import Dashboard', icon: <Upload size={16} />, onClick: () => importInputRef.current?.click() },
        { label: 'Export Dashboard', icon: <Download size={16} />, onClick: handleExportDashboard },
        { label: '---', onClick: () => {} },
        { label: 'Performance Analyzer', icon: <Timer size={16} />, onClick: openPerformanceAnalyzer },
        { label: 'Reset Dashboard', icon: <RotateCw size={16} />, onClick: resetDashboard, isDestructive: true },
    ];

    return (
        <Popover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            trigger={
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} aria-label="Open dashboard actions menu" className="h-7 w-7">
                    <span className="icon-hover-anim"><MoreVertical /></span>
                </Button>
            }
            contentClassName="w-60 p-2"
            align="right"
        >
             {({ close }) => (
                <div className="flex flex-col gap-1">
                    {actions.map((action, index) => (
                         action.label === '---' ? <div key={index} className="h-px bg-border my-1" /> : (
                            <button
                                key={index}
                                onClick={() => { action.onClick(); close(); }}
                                className={cn(
                                    "w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent",
                                    (action as any).isDestructive && "text-destructive hover:bg-destructive/10"
                                )}
                            >
                                <span className="icon-hover-anim">{action.icon}</span> {action.label}
                            </button>
                        )
                    ))}
                </div>
            )}
        </Popover>
    );
};

const DashboardHeader: FC = () => {
    const { activePage, openCommandPalette, undo, redo, canUndo, canRedo, dashboardMode, setDashboardMode, isHelpModeActive, toggleHelpMode } = useDashboard();
    const { isMobile } = useSidebar();
    
    return (
        <div className="flex-shrink-0 grid grid-cols-3 items-center h-[65px] gap-4">
            {/* Left: Title */}
            <div className="flex items-center gap-3 justify-start">
                {isMobile && <SidebarTrigger />}
                <h1 className="text-2xl font-bold font-display text-foreground truncate">{activePage?.name || 'Dashboard'}</h1>
            </div>
            
            {/* Center: Command Palette */}
            <div className="flex justify-center">
                <button 
                    onClick={openCommandPalette}
                    className="w-full max-w-lg h-11 px-4 flex items-center gap-3 bg-card rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:shadow-md group"
                >
                    <Search size={16} className="group-hover:text-primary transition-colors" />
                    <span>Type a command or search...</span>
                    <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
                        ⌘K
                    </kbd>
                </button>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-2">
                 <div className="hidden md:flex items-center gap-1 p-1 border border-border rounded-lg bg-card">
                    <Tooltip content="Undo"><Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo" className="h-7 w-7"><Undo2 size={16}/></Button></Tooltip>
                    <Tooltip content="Redo"><Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo" className="h-7 w-7"><Redo2 size={16}/></Button></Tooltip>
                </div>

                <div className="hidden md:flex items-center gap-1 p-1 border border-border rounded-lg bg-card">
                    <Tooltip content="Comment Mode"><Button variant={dashboardMode === 'comment' ? 'outline' : 'ghost'} size="icon" onClick={() => setDashboardMode(m => m === 'comment' ? 'view' : 'comment')} aria-label="Toggle Comment Mode" className="h-7 w-7"><MessageSquare size={16} /></Button></Tooltip>
                    <Tooltip content="Help Mode"><Button variant={isHelpModeActive ? 'outline' : 'ghost'} size="icon" onClick={toggleHelpMode} aria-label="Toggle Help Mode" className="h-7 w-7"><Info size={16} /></Button></Tooltip>
                    <BookmarkMenu />
                    <ActionsPopover />
                </div>
                
                <div className="p-1 border border-border rounded-lg bg-card">
                    <ThemeSwitcher />
                </div>
                
                <UserMenu />
            </div>
        </div>
    );
};

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
    const MotionDiv = motion.div as any;

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
        <div className="h-full w-full flex flex-col bg-transparent p-4 gap-4 relative">
            {dashboardMode === 'edit' && <BuilderSidebar />}
            <div className="flex-grow flex flex-col gap-4 min-w-0">
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
        </div>
    );
};