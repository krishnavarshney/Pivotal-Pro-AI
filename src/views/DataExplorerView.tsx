import React, { useState, useMemo, useEffect, useRef, useCallback, FC, MouseEvent } from 'react';
import { useDashboard } from '../contexts/DashboardProvider';
import { Field, FieldType, Pill, FilterCondition, AggregationType } from '../utils/types';
import { Search, Filter, Type, Hash, X, MoreVertical, ArrowUpAZ, ArrowDownAZ, EyeOff, Columns, Info, Check, Table, Database, SlidersHorizontal, List, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { inputClasses } from '../components/ui/utils';
import { Popover } from '../components/ui/Popover';
import { FieldInfoPopover } from '../components/ui/FieldInfoPopover';
import { Tooltip } from '../components/ui/Tooltip';
import { Sheet, SheetContent } from '../components/ui/Sheet';
import _ from 'lodash';
import { formatValue } from '../utils/dataProcessing/formatting';
import { calculateNumericStats, calculateDimensionStats, createHistogramData } from '../utils/dataProcessing/statistics';
import { applyFilters } from '../utils/dataProcessing/filtering';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHeader } from '../components/common/ViewHeader';
import { useSidebar } from '../components/ui/sidebar.tsx';

const ROW_HEIGHT = 40;

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
            className={`w-full text-left p-2.5 flex items-center gap-2.5 rounded-lg transition-colors text-sm ${isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent'}`}
        >
            <span className="icon-hover-anim">{getIcon()}</span>
            <span className="truncate flex-grow">{field.simpleName}</span>
        </button>
    );
};

const FieldProfile: FC<{ field: Field, data: any[] }> = ({ field, data }) => {
    const columnData = useMemo(() => data.map(row => row[field.name]), [data, field.name]);
    const stats = useMemo(() => field.type === FieldType.MEASURE ? calculateNumericStats(columnData) : calculateDimensionStats(columnData), [columnData, field.type]);
    const chartData = useMemo(() => {
        if (!stats) return null;
        if (field.type === FieldType.MEASURE) {
            const histogram = createHistogramData(columnData as number[], 10);
            return histogram.labels.map((label, i) => ({ name: label, value: histogram.data[i] }));
        } else {
            const topValues = (stats as any).topValues.slice(0, 5);
            return topValues.map((item: any) => ({ name: formatValue(item.value, {maximumFractionDigits: 1}), value: item.count })).reverse();
        }
    }, [field, stats, columnData]);

    if (!stats) return null;
    const completeness = stats.count / (stats.count + stats.missing);

    return (
        <div className="p-3 space-y-4">
            <div className="h-24">
                {chartData && (
                    <ResponsiveContainer width="100%" height="100%">
                        {field.type === FieldType.MEASURE ? (
                             <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        ) : (
                            <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => String(value).length > 10 ? String(value).substring(0, 10) + '...' : value} />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} barSize={8}>
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill="hsl(var(--primary))" opacity={1 - (index / (chartData.length * 1.5))} />)}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
            <div className="space-y-3 text-xs text-muted-foreground">
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <span>Completeness</span>
                        <span className="font-mono text-foreground font-semibold">{formatValue(completeness * 100, { suffix: '%', decimalPlaces: 0 })}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${completeness * 100}%` }}></div></div>
                </div>
                 <div className="flex justify-between items-center pt-1">
                    <span>Unique Values</span>
                    <span className="font-mono font-semibold text-foreground">{formatValue((stats as any).unique)}</span>
                </div>
            </div>
        </div>
    );
}

const SchemaPanel: FC<{
    fields: Field[],
    data: any[],
    visibleColumns: string[],
    onToggleColumn: (fieldName: string) => void,
}> = ({ fields, data, visibleColumns, onToggleColumn }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [isManaging, setIsManaging] = useState(false);

    const filteredFields = useMemo(() => fields.filter(f => f.simpleName.toLowerCase().includes(searchTerm.toLowerCase())), [fields, searchTerm]);

    const MotionDiv = motion.div as any;

    return (
        <aside className="w-[320px] bg-card border-r border-border flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-border flex-shrink-0">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" placeholder="Search fields..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputClasses} pl-8 h-9`} />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-2">
                <AnimatePresence mode="wait">
                    <MotionDiv
                        key={isManaging ? 'manage' : 'explore'}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        {isManaging ? (
                            <div className="space-y-1 p-1.5">
                                {fields.map(f => (
                                    <label key={f.name} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer">
                                        <input type="checkbox" checked={visibleColumns.includes(f.name)} onChange={() => onToggleColumn(f.name)} className="h-4 w-4 rounded border-border text-primary focus:ring-ring" />
                                        <span className="text-sm">{f.simpleName}</span>
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
            <div className="p-3 border-t border-border flex-shrink-0">
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
    <aside className="w-[320px] bg-card border-l border-border flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border flex-shrink-0">
            <h3 className="text-base font-bold text-foreground">Active Filters</h3>
        </div>
        <div className="flex-grow overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
            {filters.map(pill => (
                <MotionDiv key={pill.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div onClick={() => onEditFilter(pill)} className="p-2.5 rounded-lg bg-secondary border border-border cursor-pointer hover:border-primary/50 group">
                        <div className="flex items-start justify-between">
                            <p className="font-semibold text-sm text-foreground">{pill.simpleName}</p>
                            <button onClick={(e) => { e.stopPropagation(); onRemoveFilter(pill.id); }} className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100" aria-label={`Remove filter on ${pill.simpleName}`}><span className="icon-hover-anim"><X size={12}/></span></button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{pill.filter?.condition} {formatValue(pill.filter?.values)}</p>
                    </div>
                </MotionDiv>
            ))}
            </AnimatePresence>
            {filters.length === 0 && (
                <div className="text-center text-sm text-muted-foreground p-8">No filters applied.</div>
            )}
        </div>
        <div className="p-3 border-t border-border flex-shrink-0">
            <Button variant="outline" className="w-full" onClick={onAddFilter}><span className="icon-hover-anim"><Filter size={16}/></span> Add Filter</Button>
        </div>
    </aside>
)};

const DataGrid: FC<{
    visibleFields: Field[];
    filteredData: any[];
    sort: { key: string, order: 'asc' | 'desc' } | null;
    openColumnMenu: (event: MouseEvent, field: Field) => void;
}> = ({ visibleFields, filteredData, sort, openColumnMenu }) => {
    const { blendedData } = useDashboard();
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const onScroll = (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop);
    const totalRows = filteredData.length;
    const itemsToRender = useMemo(() => containerRef.current ? Math.ceil(containerRef.current.clientHeight / ROW_HEIGHT) + 5 : 20, [containerRef.current?.clientHeight]);
    const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
    const visibleRows = useMemo(() => filteredData.slice(startIndex, Math.min(totalRows, startIndex + itemsToRender)), [filteredData, startIndex, itemsToRender]);
    const paddingTop = startIndex * ROW_HEIGHT;

    return (
        <main className="flex-grow overflow-auto" onScroll={onScroll} ref={containerRef}>
            <div style={{ height: totalRows * ROW_HEIGHT }}>
                 <table className="min-w-full text-sm text-left border-collapse" style={{ paddingTop }}>
                    <thead className="sticky top-0 z-10">
                        <tr>
                            {visibleFields.map(field => (
                                <th key={field.name} scope="col" className="group px-4 h-[44px] whitespace-nowrap bg-secondary text-foreground border-b-2 border-border border-r border-border last:border-r-0">
                                    <div className="flex items-center justify-between h-full">
                                        <div className="flex items-center gap-1.5">
                                            <FieldInfoPopover field={field} blendedData={blendedData}><span className="font-semibold">{field.simpleName}</span></FieldInfoPopover>
                                            {sort?.key === field.name && (sort.order === 'asc' ? <ArrowUpAZ className="text-primary"/> : <ArrowDownAZ className="text-primary"/>)}
                                        </div>
                                        <Tooltip content="Column options">
                                            <button onClick={(e) => openColumnMenu(e, field)} className="p-1 rounded text-muted-foreground opacity-60 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-opacity" aria-label={`Options for ${field.simpleName} column`}><span className="icon-hover-anim"><MoreVertical /></span></button>
                                        </Tooltip>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.map((row, index) => (
                            <tr key={startIndex + index} className="text-foreground hover:bg-accent" style={{height: ROW_HEIGHT}}>
                                {visibleFields.map(field => (
                                    <td key={field.name} className="px-4 whitespace-nowrap border-b border-r border-border" title={formatValue(row[field.name])}>
                                        {formatValue(row[field.name])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export const DataExplorerView: FC = () => {
    const { dataSources, relationships, blendedData, blendedFields, setView, explorerState, openContextMenu, openFilterConfigModal, openSelectFieldModal } = useDashboard();
    const [sort, setSort] = useState<{ key: string, order: 'asc' | 'desc' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [activeFilters, setActiveFilters] = useState<Pill[]>(explorerState?.initialFilters || []);
    const { isMobile } = useSidebar();
    const [isSchemaOpen, setSchemaOpen] = useState(false);
    const [isFiltersOpen, setFiltersOpen] = useState(false);

    const { dataForExplorer, fieldsForExplorer } = useMemo(() => ({ dataForExplorer: blendedData, fieldsForExplorer: blendedFields }), [blendedData, blendedFields]);
    const allFields = useMemo(() => [...fieldsForExplorer.dimensions, ...fieldsForExplorer.measures], [fieldsForExplorer]);

    useEffect(() => {
        if (allFields.length > 0) setVisibleColumns(allFields.map(f => f.name).slice(0, 10));
    }, [allFields]);

    const filteredData = useMemo(() => {
        let data = applyFilters(dataForExplorer, activeFilters);
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            data = data.filter(row => visibleColumns.some(col => String(row[col]).toLowerCase().includes(lowerSearch)));
        }
        if (sort) data = _.orderBy(data, [sort.key], [sort.order]);
        return data;
    }, [dataForExplorer, activeFilters, searchTerm, sort, visibleColumns]);

    const visibleFields = useMemo(() => visibleColumns.map(name => allFields.find(f => f.name === name)).filter(Boolean) as Field[], [allFields, visibleColumns]);

    const handleSort = (key: string) => setSort(prev => (prev?.key === key && prev.order === 'asc') ? { key, order: 'desc' } : { key, order: 'asc' });
    const removeFilter = (pillId: string) => setActiveFilters(f => f.filter(p => p.id !== pillId));
    const editFilter = (pill: Pill) => openFilterConfigModal(pill, (updatedPill) => setActiveFilters(f => f.map(p => p.id === updatedPill.id ? updatedPill : p)));
    const addFilter = () => openSelectFieldModal(); // The provider needs to be updated to handle adding filters here

    const openColumnMenu = (event: MouseEvent, field: Field) => {
        event.preventDefault();
        openContextMenu(event.clientX, event.clientY, [
            { label: 'Sort Ascending', icon: <ArrowUpAZ size={16} />, onClick: () => handleSort(field.name) },
            { label: 'Sort Descending', icon: <ArrowDownAZ size={16} />, onClick: () => handleSort(field.name) },
            { label: '---', onClick: ()=>{}},
            { label: 'Hide Column', icon: <EyeOff size={16} />, onClick: () => setVisibleColumns(cols => cols.filter(c => c !== field.name)) },
        ]);
    };

    const commonHeader = (
        <ViewHeader icon={<Database size={24} />} title="Data Explorer">
            {isMobile && (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setSchemaOpen(true)} aria-label="Open fields panel"><List size={16}/></Button>
                    <Button variant="outline" size="icon" onClick={() => setFiltersOpen(true)} aria-label="Open filters panel"><Filter size={16}/></Button>
                </div>
            )}
             <div className="relative flex-grow max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search data..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputClasses} pl-9`} />
            </div>
            <span className="text-sm text-muted-foreground hidden lg:block">{filteredData.length.toLocaleString()} of {dataForExplorer.length.toLocaleString()} rows</span>
        </ViewHeader>
    );

    const schemaPanel = <SchemaPanel fields={allFields} data={dataForExplorer} visibleColumns={visibleColumns} onToggleColumn={f => setVisibleColumns(c => c.includes(f) ? c.filter(n => n !== f) : [...c, f])} />;
    const filtersPanel = <FiltersPanel filters={activeFilters} onRemoveFilter={removeFilter} onEditFilter={editFilter} onAddFilter={addFilter} />;

    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            {commonHeader}
            <div className="flex-grow flex min-h-0">
                {!isMobile && schemaPanel}
                <DataGrid visibleFields={visibleFields} filteredData={filteredData} sort={sort} openColumnMenu={openColumnMenu} />
                {!isMobile && filtersPanel}
                {isMobile && (
                    <>
                        <Sheet open={isSchemaOpen} onOpenChange={setSchemaOpen}>
                            <SheetContent side="left" className="w-[320px] p-0 flex flex-col">{schemaPanel}</SheetContent>
                        </Sheet>
                        <Sheet open={isFiltersOpen} onOpenChange={setFiltersOpen}>
                            <SheetContent side="right" className="w-[320px] p-0 flex flex-col">{filtersPanel}</SheetContent>
                        </Sheet>
                    </>
                )}
            </div>
        </div>
    );
};