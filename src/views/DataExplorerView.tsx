import React, { useState, useMemo, useEffect, FC, MouseEvent } from 'react';
import { useDashboard } from '../contexts/DashboardProvider';
import { Field, FieldType, Pill, ChartType } from '../utils/types';
import { Search, Filter, Type, Hash, X, Check, Database, List, Clock, Info, Columns, ChevronDown, BarChart2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { inputClasses, cn } from '../components/ui/utils';
import { Sheet, SheetContent } from '../components/ui/Sheet';
import _ from 'lodash';
import { formatValue } from '../utils/dataProcessing/formatting';
import { calculateNumericStats, calculateDimensionStats, createHistogramData } from '../utils/dataProcessing/statistics';
import { applyFilters } from '../utils/dataProcessing/filtering';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, YAxis, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHeader } from '../components/common/ViewHeader';
import { useSidebar } from '../components/ui/sidebar.tsx';
import { DataTable } from '../components/ui/DataTable';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../components/ui/DataTableColumnHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { WidgetSkeleton } from '../components/ui/WidgetSkeleton';

// Helper to clean column names
const getCleanName = (name: string) => {
    if (!name) return '';
    const parts = name.split(/[./]/);
    return parts[parts.length - 1];
};

const SchemaField: FC<{
    field: Field;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ field, isSelected, onSelect }) => {
    const getIcon = () => {
        switch (field.type) {
            case FieldType.DIMENSION: return <Type size={16} className="text-blue-500 flex-shrink-0"/>;
            case FieldType.MEASURE: return <Hash size={16} className="text-green-500 flex-shrink-0"/>;
            case FieldType.DATETIME: return <Clock size={16} className="text-purple-500 flex-shrink-0"/>;
            default: return <Info size={16} className="text-gray-500 flex-shrink-0"/>;
        }
    }
    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full text-left p-2.5 flex items-center gap-2.5 rounded-lg transition-all text-sm group relative overflow-hidden",
                isSelected 
                    ? "bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary/20" 
                    : "hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <span className="icon-hover-anim relative z-10">{getIcon()}</span>
            <span className="truncate flex-grow relative z-10">{getCleanName(field.simpleName)}</span>
            {isSelected && (
                <motion.div 
                    layoutId="active-field-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                />
            )}
        </button>
    );
};

const FieldProfile: FC<{ field: Field, data: any[] }> = ({ field, data }) => {
    const columnData = useMemo(() => data.map(row => row[field.name]), [data, field.name]);
    const stats = useMemo(() => field.type === FieldType.MEASURE ? calculateNumericStats(columnData) : calculateDimensionStats(columnData), [columnData, field.type]);
    
    const chartData = useMemo(() => {
        if (!stats) return null;
        if (field.type === FieldType.MEASURE) {
            const histogram = createHistogramData(columnData as number[], 15);
            return histogram.labels.map((label, i) => ({ name: label, value: histogram.data[i] }));
        } else {
            const topValues = (stats as any).topValues.slice(0, 8);
            return topValues.map((item: any) => ({ name: formatValue(item.value, {maximumFractionDigits: 1}), value: item.count })).reverse();
        }
    }, [field, stats, columnData]);

    if (!stats) return null;
    const completeness = stats.count / (stats.count + stats.missing);

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover px-3 py-2 rounded-lg shadow-lg text-xs z-50">
                    <p className="font-semibold text-popover-foreground mb-1">{label}</p>
                    <p className="text-primary">
                        Count: <span className="font-mono font-bold">{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 space-y-5 bg-card/30 rounded-lg shadow-sm mt-2 backdrop-blur-sm"
        >
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Distribution</h4>
                <Badge variant="secondary" className={cn(
                    "text-[10px] h-5 px-2 font-medium uppercase tracking-wider",
                    field.type === FieldType.DIMENSION ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20" :
                    field.type === FieldType.MEASURE ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20" :
                    "bg-secondary text-secondary-foreground"
                )}>
                    {field.type}
                </Badge>
            </div>
            
            <div className="h-40 w-full -ml-2">
                {chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                        {field.type === FieldType.MEASURE ? (
                             <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        ) : (
                            <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }} barCategoryGap={4}>
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={100} 
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                                    tickFormatter={(value) => String(value).length > 18 ? String(value).substring(0, 18) + '...' : value} 
                                />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                                <Bar 
                                    dataKey="value" 
                                    fill="hsl(var(--primary))" 
                                    radius={[0, 4, 4, 0]} 
                                    barSize={18} 
                                    animationDuration={800}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.5 + (index / chartData.length) * 0.5})`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                 <div className="bg-background/50 p-2.5 rounded-md transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Completeness</span>
                        <span className="font-mono text-xs font-bold text-foreground">{formatValue(completeness * 100, { suffix: '%', decimalPlaces: 0 })}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${completeness * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={cn("h-1.5 rounded-full", completeness > 0.9 ? "bg-green-500" : completeness > 0.5 ? "bg-yellow-500" : "bg-red-500")}
                        />
                    </div>
                </div>
                 <div className="bg-background/50 p-2.5 rounded-md transition-colors flex flex-col justify-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Unique Values</span>
                    <span className="font-mono text-lg font-bold text-foreground leading-none">{formatValue((stats as any).unique)}</span>
                </div>
            </div>
            
            {field.type === FieldType.MEASURE && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-secondary/30 p-2 rounded text-center transition-colors">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Min</div>
                        <div className="font-mono text-xs font-semibold">{formatValue((stats as any).min)}</div>
                    </div>
                    <div className="bg-secondary/30 p-2 rounded text-center transition-colors">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Avg</div>
                        <div className="font-mono text-xs font-semibold">{formatValue((stats as any).mean)}</div>
                    </div>
                    <div className="bg-secondary/30 p-2 rounded text-center transition-colors">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Max</div>
                        <div className="font-mono text-xs font-semibold">{formatValue((stats as any).max)}</div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const SchemaPanel: FC<{
    fields: Field[],
    data: any[],
    visibleColumns: string[],
    onToggleColumn: (field: string) => void
}> = ({ fields, data, visibleColumns, onToggleColumn }) => {
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [isManaging, setIsManaging] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const MotionDiv = motion.div as any;

    const filteredFields = useMemo(() => {
        if (!searchTerm) return fields;
        return fields.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.simpleName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [fields, searchTerm]);

    return (
    <aside className="w-[320px] bg-card flex flex-col flex-shrink-0 z-10 border-r border-border">
        <div className="p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <List size={16} className="text-primary" />
                    Fields
                </h3>
                <Badge variant="outline" className="font-mono text-[10px]">{fields.length}</Badge>
            </div>
            <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search fields..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputClasses} pl-8 h-9`} />
            </div>
        </div>
        <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
            <AnimatePresence mode="wait">
                <MotionDiv
                    key={isManaging ? 'manage' : 'explore'}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                    {isManaging ? (
                        <div className="space-y-1 p-1.5">
                            {fields.map(f => (
                                <label key={f.name} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors">
                                    <input type="checkbox" checked={visibleColumns.includes(f.name)} onChange={() => onToggleColumn(f.name)} className="h-4 w-4 rounded text-primary focus:ring-ring" />
                                    <span className="text-sm">{getCleanName(f.simpleName)}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredFields.map(f => (
                                <div key={f.name}>
                                    <SchemaField field={f} isSelected={selectedField?.name === f.name} onSelect={() => setSelectedField(selectedField?.name === f.name ? null : f)} />
                                    <AnimatePresence>
                                        {selectedField?.name === f.name && (
                                            <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <FieldProfile field={selectedField} data={data} />
                                            </MotionDiv>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </MotionDiv>
            </AnimatePresence>
        </div>
        <div className="p-3 flex-shrink-0 bg-card">
            <Button variant="secondary" className="w-full" onClick={() => setIsManaging(!isManaging)}>
                {isManaging ? <><span className="icon-hover-anim"><Check size={16}/></span> Done</> : <><span className="icon-hover-anim"><Columns size={16}/></span> Manage Columns ({visibleColumns.length}/{fields.length})</>}
            </Button>
        </div>
    </aside>
    );
};

const FiltersPanel: FC<{
    filters: Pill[],
    onRemoveFilter: (pillId: string) => void,
    onEditFilter: (pill: Pill) => void,
    onAddFilter: () => void,
}> = ({ filters, onRemoveFilter, onEditFilter, onAddFilter }) => {
    const MotionDiv = motion.div as any;
    return (
    <aside className="w-[320px] bg-card flex flex-col flex-shrink-0 z-10">
        <div className="p-4 flex-shrink-0">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Filter size={16} className="text-primary" />
                Active Filters
            </h3>
        </div>
        <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
            <AnimatePresence>
            {filters.map(pill => (
                <MotionDiv key={pill.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div onClick={() => onEditFilter(pill)} className="p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-all group">
                        <div className="flex items-start justify-between">
                            <p className="font-semibold text-sm text-foreground">{getCleanName(pill.simpleName)}</p>
                            <button onClick={(e) => { e.stopPropagation(); onRemoveFilter(pill.id); }} className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remove filter on ${pill.simpleName}`}><span className="icon-hover-anim"><X size={12}/></span></button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-background">{pill.filter?.condition}</Badge>
                            <p className="text-xs text-muted-foreground font-mono truncate">{formatValue(pill.filter?.values)}</p>
                        </div>
                    </div>
                </MotionDiv>
            ))}
            </AnimatePresence>
            {filters.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                        <Filter size={20} className="text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">No active filters</p>
                    <Button variant="link" size="sm" onClick={onAddFilter} className="mt-2 text-primary">
                        Add Filter
                    </Button>
                </div>
            )}
        </div>
        <div className="p-3 flex-shrink-0 bg-card">
            <Button variant="secondary" className="w-full" onClick={onAddFilter}>
                <span className="icon-hover-anim"><Filter size={16}/></span> Add Filter
            </Button>
        </div>
    </aside>
    );
};

const SchemaSkeleton = () => (
    <div className="w-[320px] bg-card flex flex-col flex-shrink-0 z-10">
        <div className="p-3 flex-shrink-0">
            <div className="h-9 bg-secondary/50 rounded-md animate-pulse" />
        </div>
        <div className="flex-grow p-2 space-y-2 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-10 bg-secondary/30 rounded-md animate-pulse" />
            ))}
        </div>
        <div className="p-3 flex-shrink-0">
            <div className="h-9 bg-secondary/50 rounded-md animate-pulse" />
        </div>
    </div>
);

const FiltersSkeleton = () => (
    <div className="w-[320px] bg-card flex flex-col flex-shrink-0 z-10">
        <div className="p-4 flex-shrink-0">
            <div className="h-6 w-32 bg-secondary/50 rounded-md animate-pulse" />
        </div>
        <div className="flex-grow p-3 space-y-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-secondary/30 rounded-lg animate-pulse" />
            ))}
        </div>
        <div className="p-3 flex-shrink-0">
            <div className="h-9 bg-secondary/50 rounded-md animate-pulse" />
        </div>
    </div>
);

export const DataExplorerView: FC = () => {
    const { blendedData, blendedFields, explorerState, openFilterConfigModal, openSelectFieldModal, dataSources } = useDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [activeFilters, setActiveFilters] = useState<Pill[]>(explorerState?.initialFilters || []);
    const { isMobile } = useSidebar();
    const [isSchemaOpen, setSchemaOpen] = useState(false);
    const [isFiltersOpen, setFiltersOpen] = useState(false);
    const [selectedSourceId, setSelectedSourceId] = useState<string>('blended');
    const [isLoading, setIsLoading] = useState(true);

    // Simulate API loading
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [selectedSourceId]);

    // Determine data and fields based on selection
    const { dataForExplorer, fieldsForExplorer } = useMemo(() => {
        if (selectedSourceId === 'blended') {
            return { dataForExplorer: blendedData, fieldsForExplorer: blendedFields };
        }
        const source = dataSources.get(selectedSourceId);
        if (source) {
            return { dataForExplorer: source.data, fieldsForExplorer: source.fields };
        }
        return { dataForExplorer: [], fieldsForExplorer: { dimensions: [], measures: [] } };
    }, [selectedSourceId, blendedData, blendedFields, dataSources]);

    const allFields = useMemo(() => [...fieldsForExplorer.dimensions, ...fieldsForExplorer.measures], [fieldsForExplorer]);

    // Initialize visible columns (max 50)
    useEffect(() => {
        if (allFields.length > 0) {
             // If we switched sources, reset visible columns
             // Default to showing all columns if <= 50, otherwise first 50
             const columnsToShow = allFields.map(f => f.name).slice(0, 50);
             setVisibleColumns(columnsToShow);
        }
    }, [allFields]); // Depend on allFields changing (which happens when source changes)

    const columnVisibility = useMemo<VisibilityState>(() => {
        const visibility: VisibilityState = {};
        allFields.forEach(f => {
            visibility[f.name] = visibleColumns.includes(f.name);
        });
        return visibility;
    }, [visibleColumns, allFields]);

    const handleColumnVisibilityChange = (updaterOrValue: any) => {
        const newVisibility = typeof updaterOrValue === 'function'
            ? updaterOrValue(columnVisibility)
            : updaterOrValue;
        
        const newVisibleColumns = Object.keys(newVisibility).filter(key => newVisibility[key]);
        setVisibleColumns(newVisibleColumns);
    };

    const columns = useMemo<ColumnDef<any>[]>(() => {
        return allFields.map(field => ({
            accessorFn: (row) => row[field.name],
            id: field.name,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title={getCleanName(field.simpleName)} />
            ),
            cell: (info) => <div className="truncate" title={formatValue(info.getValue())}>{formatValue(info.getValue())}</div>,
            enableSorting: true,
            enableHiding: true,
        }));
    }, [allFields]);

    const filteredData = useMemo(() => {
        let data = applyFilters(dataForExplorer, activeFilters);
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            data = data.filter(row => visibleColumns.some(col => String(row[col]).toLowerCase().includes(lowerSearch)));
        }
        return data;
    }, [dataForExplorer, activeFilters, searchTerm, visibleColumns]);

    const removeFilter = (pillId: string) => setActiveFilters(f => f.filter(p => p.id !== pillId));
    const editFilter = (pill: Pill) => openFilterConfigModal(pill, (updatedPill) => setActiveFilters(f => f.map(p => p.id === updatedPill.id ? updatedPill : p)));
    const addFilter = () => openSelectFieldModal();

    const dataSourceOptions = useMemo(() => {
        const options = [];
        if (blendedData.length > 0) {
            options.push({ id: 'blended', name: 'Blended Data', type: 'blended' });
        }
        dataSources.forEach(ds => {
            options.push({ id: ds.id, name: ds.name, type: ds.type });
        });
        return options;
    }, [dataSources, blendedData]);

    // Ensure selected source is valid
    useEffect(() => {
        if (selectedSourceId === 'blended' && blendedData.length === 0 && dataSources.size > 0) {
            setSelectedSourceId(dataSources.keys().next().value);
        }
    }, [dataSources, blendedData]);


    const commonHeader = (
        <ViewHeader icon={<Database size={24} />} title="Data Explorer">
            {isMobile && (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setSchemaOpen(true)} aria-label="Open fields panel"><List size={16}/></Button>
                    <Button variant="outline" size="icon" onClick={() => setFiltersOpen(true)} aria-label="Open filters panel"><Filter size={16}/></Button>
                </div>
            )}
            
            <div className="flex items-center gap-3 flex-1 max-w-3xl">
                {/* Data Source Selector */}
                <div className="w-[240px] flex-shrink-0">
                    <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                        <SelectTrigger className="h-9 bg-background hover:bg-accent/50 transition-colors">
                            <SelectValue placeholder="Select Data Source" />
                        </SelectTrigger>
                        <SelectContent>
                            {dataSourceOptions.map(opt => (
                                <SelectItem key={opt.id} value={opt.id}>
                                    <div className="flex items-center gap-2">
                                        {opt.type === 'blended' ? <SparklesIcon /> : <DatabaseIcon />}
                                        <span className="truncate">{opt.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative flex-grow">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" placeholder="Search data..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputClasses} pl-9 h-9`} />
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground hidden lg:flex bg-secondary/50 px-3 py-1.5 rounded-md">
                <BarChart2 size={14} />
                <span>{isLoading ? '...' : filteredData.length.toLocaleString()} rows</span>
            </div>
        </ViewHeader>
    );

    const schemaPanel = <SchemaPanel fields={allFields} data={dataForExplorer} visibleColumns={visibleColumns} onToggleColumn={f => setVisibleColumns(c => c.includes(f) ? c.filter(n => n !== f) : [...c, f])} />;
    const filtersPanel = <FiltersPanel filters={activeFilters} onRemoveFilter={removeFilter} onEditFilter={editFilter} onAddFilter={addFilter} />;

    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
            `}</style>
            {commonHeader}
            <div className="flex-grow flex min-h-0">
                {!isMobile && (isLoading ? <SchemaSkeleton /> : schemaPanel)}
                
                <div className="flex-grow overflow-hidden p-4 bg-secondary/10">
                    <div className="h-full rounded-xl bg-card shadow-sm overflow-hidden flex flex-col relative">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="skeleton"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-10 bg-card"
                                >
                                    <WidgetSkeleton chartType={ChartType.TABLE} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col"
                                >
                                    <DataTable 
                                        columns={columns} 
                                        data={filteredData} 
                                        columnVisibility={columnVisibility}
                                        onColumnVisibilityChange={handleColumnVisibilityChange}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {!isMobile && (isLoading ? <FiltersSkeleton /> : filtersPanel)}
                
                {isMobile && (
                    <>
                        <Sheet open={isSchemaOpen} onOpenChange={setSchemaOpen}>
                            <SheetContent side="left" className="w-[320px] p-0 flex flex-col">{isLoading ? <SchemaSkeleton /> : schemaPanel}</SheetContent>
                        </Sheet>
                        <Sheet open={isFiltersOpen} onOpenChange={setFiltersOpen}>
                            <SheetContent side="right" className="w-[320px] p-0 flex flex-col">{isLoading ? <FiltersSkeleton /> : filtersPanel}</SheetContent>
                        </Sheet>
                    </>
                )}
            </div>
        </div>
    );
};

// Simple icons for the selector
const DatabaseIcon = () => <Database size={14} className="text-blue-500" />;
const SparklesIcon = () => <div className="text-purple-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg></div>;