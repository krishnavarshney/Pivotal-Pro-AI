import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import _ from 'lodash';
import { useDashboard } from '../contexts/DashboardProvider';
import { Transformation, TransformationType, Field, FieldType, ContextMenuItem, AiDataSuggestion, DND_ITEM_TYPE, StudioFieldDragItem, DataSource } from '../utils/types';
import { Button } from '../components/ui/Button';
import { Popover } from '../components/ui/Popover';
import { Tooltip } from '../components/ui/Tooltip';
import { Sheet, SheetContent } from '../components/ui/Sheet';
import { cn, inputClasses } from '../components/ui/utils';
import { X, Calculator, Braces, List, Undo2, CheckCircle, Database, Trash, Pencil, CaseSensitive, Hash, Type, Baseline, CircleSlash, Settings, Lightbulb, MoreVertical, ArrowLeftRight, Clock, Redo2, ArrowUpAZ, ArrowDownAZ, Copy, Plus, Columns3 as ColumnsIcon } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { applyTransformsToFields, applyTransformsToData } from '../utils/dataProcessing/transformations';
import * as aiService from '../services/aiService';
import { ViewHeader } from '../components/common/ViewHeader';
import { useSidebar } from '../components/ui/sidebar';
import { HelpIcon } from '../components/ui/HelpIcon';
import { DataStudioOnboarding } from './datastudios';
import { notificationService } from '../services/notificationService';

const formatTransformPayload = (transform: Transformation): string => {
    if (!transform.payload) return '';
    try {
        if (typeof transform.payload === 'object') {
             if (transform.type === TransformationType.CREATE_CATEGORICAL_COLUMN) {
                return `New field: ${transform.payload.newFieldName} (${(transform.payload.rules?.length || 0)} conditions)`;
             }
            return Object.entries(transform.payload)
                .map(([key, value]) => {
                    const valueStr = typeof value !== 'string' ? JSON.stringify(value) : value;
                    return `${_.startCase(key)}: ${valueStr}`;
                })
                .join(', ');
        }
        return String(transform.payload);
    } catch (e) {
        console.error("Error formatting transform payload:", e);
        return "Invalid payload";
    }
};

const getTransformIcon = (type: TransformationType): React.ReactElement => {
    switch (type) {
        case TransformationType.CREATE_CALCULATED_FIELD: return <Calculator size={16} />;
        case TransformationType.CREATE_CATEGORICAL_COLUMN: return <Braces size={16} />;
        case TransformationType.REMOVE_DUPLICATES: return <List size={16} />;
        case TransformationType.DELETE_FIELD: return <Trash size={16} className="text-red-500" />;
        case TransformationType.RENAME_FIELD: return <Pencil size={16} />;
        case TransformationType.CHANGE_TYPE: return <CaseSensitive size={16} />;
        case TransformationType.STANDARDIZE_TEXT: return <Baseline size={16} />;
        case TransformationType.HANDLE_NULLS: return <CircleSlash size={16} />;
        case TransformationType.SPLIT_COLUMN: return <ColumnsIcon size={16} />;
        case TransformationType.MERGE_COLUMNS: return <ArrowLeftRight size={16} />;
        case TransformationType.CONVERT_TO_DATETIME: return <Clock size={16} />;
        case TransformationType.DUPLICATE_FIELD: return <Copy size={16} />;
        default: return <Settings size={16} />;
    }
};

const TransformationCard: React.FC<{ transform: Transformation; onRemove: (id: string) => void; isReordering: boolean; }> = ({ transform, onRemove, isReordering }) => {
    const icon = getTransformIcon(transform.type);
    
    return (
        <div className="p-3 bg-card rounded-lg group text-left shadow-sm border border-border relative">
            <div className={`absolute -left-4 top-1/2 -mt-px w-4 h-px bg-border group-first:hidden ${isReordering ? 'opacity-50' : ''}`} />
            <div className={`absolute -left-4 bottom-0 h-1/2 w-px bg-border group-last:hidden ${isReordering ? 'opacity-50' : ''}`} />
            <div className={`absolute -left-4 top-0 h-1/2 w-px bg-border group-first:hidden ${isReordering ? 'opacity-50' : ''}`} />
            
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 truncate pr-2">
                    <span className="flex-shrink-0 text-muted-foreground mt-0.5">{icon}</span>
                    <div className="truncate">
                        <p className="font-semibold text-sm text-card-foreground truncate flex items-center gap-2">
                            {transform.type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate" title={formatTransformPayload(transform)}>
                            {formatTransformPayload(transform)}
                        </p>
                    </div>
                </div>
                <button onClick={() => onRemove(transform.id)} className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" aria-label={`Remove ${transform.type} step`}>
                    <X size={14}/>
                </button>
            </div>
        </div>
    );
};

const AiSuggestionCard: React.FC<{ suggestion: AiDataSuggestion; onApply: () => void; }> = ({ suggestion, onApply }) => {
    return (
    <div className="p-3 rounded-lg group text-left shadow-sm ai-feature-style relative">
         <div className="absolute -left-4 top-1/2 -mt-px w-4 h-px bg-border group-first:hidden" />
        <div className="flex items-start gap-3">
            <span className="flex-shrink-0 text-primary mt-0.5"><Lightbulb size={16} /></span>
            <div>
                <p className="font-semibold text-sm text-foreground">{suggestion.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                <Button variant="secondary" onClick={onApply} className="text-xs py-1 px-2 mt-3 hover:bg-primary/20">Apply Suggestion</Button>
            </div>
        </div>
    </div>
)};

const AiSuggestionSkeleton: React.FC = () => (
    <div className="p-3 rounded-lg shadow-sm border border-border/50 bg-card animate-pulse">
        <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-muted mt-0.5"></div>
            <div className="flex-grow space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-3 w-full bg-muted rounded"></div>
                <div className="h-3 w-1/2 bg-muted rounded"></div>
                <div className="h-6 w-24 bg-muted rounded-md mt-1"></div>
            </div>
        </div>
    </div>
);

const DataSourceManagerPanel: React.FC<{
    sources: DataSource[];
    activeSourceId: string | null;
    onSelectSource: (id: string) => void;
    onRemoveSource: (id: string) => void;
    onAddSource: () => void;
}> = ({ sources, activeSourceId, onSelectSource, onRemoveSource, onAddSource }) => {
    const { openConfirmationModal } = useDashboard();
    
    const handleRemove = (e: React.MouseEvent, source: DataSource) => {
        e.stopPropagation();
        openConfirmationModal({
            title: `Remove ${source.name}?`,
            message: "This will delete the data source and affect all related widgets. This action cannot be undone.",
            onConfirm: () => onRemoveSource(source.id)
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 flex-shrink-0">
                <Button onClick={onAddSource} className="w-full"><Plus size={16} /> Add Data Source</Button>
            </div>
            <div className="flex-grow p-4 pt-0 overflow-y-auto space-y-2">
                {sources.map(source => (
                    <button
                        key={source.id}
                        onClick={() => onSelectSource(source.id)}
                        className={cn(
                            "w-full text-left p-3 flex items-center justify-between gap-2 rounded-lg border-border transition-colors group",
                            activeSourceId === source.id
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-card hover:bg-accent hover:border-border"
                        )}
                    >
                        <div className="flex items-center gap-3 truncate">
                            <Database size={16} className="flex-shrink-0" />
                            <span className="font-semibold truncate">{source.name}</span>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => handleRemove(e, source)}>
                                <Trash size={14} />
                            </Button>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};


const StudioSidebar: React.FC<{
    source: DataSource | null;
    transformations: Transformation[];
    transformedFields: { dimensions: Field[]; measures: Field[] };
    onRemoveTransform: (id: string) => void;
    onReorderTransforms: (transforms: Transformation[]) => void;
    openFieldContextMenu: (e: React.MouseEvent, field: Field) => void;
    allSources: DataSource[];
    onSourceChange: (id: string) => void;
    onRemoveSource: (id: string) => void;
    onAddSource: () => void;
}> = (props) => {
    const { addTransformation, openAddFieldModal, openMergeColumnsModal, aiConfig } = useDashboard();
    const { source, transformations, transformedFields, openFieldContextMenu, onReorderTransforms, allSources, onSourceChange, onRemoveSource, onAddSource } = props;
    const [activeTab, setActiveTab] = useState<'sources' | 'steps' | 'fields'>(source ? 'steps' : 'sources');
    const [fieldSearch, setFieldSearch] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState<AiDataSuggestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    const filteredFields = useMemo(() => {
        if (!fieldSearch) return transformedFields;
        const lower = fieldSearch.toLowerCase();
        return {
            dimensions: transformedFields.dimensions.filter(f => f.simpleName.toLowerCase().includes(lower)),
            measures: transformedFields.measures.filter(f => f.simpleName.toLowerCase().includes(lower)),
        };
    }, [transformedFields, fieldSearch]);

    const handleGenerateSuggestions = useCallback(async () => {
        if (!aiConfig || !source) return;
        setIsGenerating(true); setAiSuggestions([]);
        try {
            const suggestions = await aiService.getAiDataStudioSuggestions(aiConfig, [...source.fields.dimensions, ...source.fields.measures], source.data.slice(0, 10), transformations);
            setAiSuggestions(suggestions);
        } catch (error) { 
            notificationService.error("Error fetching AI suggestions."); } 
        finally { setIsGenerating(false); }
    }, [aiConfig, source, transformations]);

    const onSelectSource = (id: string) => {
        onSourceChange(id);
        setActiveTab('steps');
    };
    
    const MotionDiv = motion.div as any;
    const TabButton: React.FC<{tabId: 'sources' | 'fields' | 'steps', children: React.ReactNode, disabled?: boolean}> = ({ tabId, children, disabled }) => (
        <button onClick={() => setActiveTab(tabId)} disabled={disabled} className={`flex-1 flex justify-center items-center gap-2 p-3 font-semibold text-sm transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === tabId ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {children}
            {activeTab === tabId && <MotionDiv className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="studio-tab-underline" />}
        </button>
    );

    return (
        <div id="onboarding-sidebar" className="bg-card rounded-xl border border-border flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex-shrink-0">
                <div className="flex border-b border-border -mx-4 -mt-4 mb-4">
                    <TabButton tabId="sources"><Database/> Sources</TabButton>
                    <TabButton tabId="steps" disabled={!source}><List/> Steps</TabButton>
                    <TabButton tabId="fields" disabled={!source}><ColumnsIcon/> Fields</TabButton>
                </div>
                {activeTab === 'fields' && <input type="text" placeholder="Search fields..." value={fieldSearch} onChange={e => setFieldSearch(e.target.value)} className={`${inputClasses} h-9`} />}
            </div>
            <div className="flex-grow overflow-y-auto space-y-2">
                <AnimatePresence mode="wait">
                    <MotionDiv key={activeTab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full">
                        {activeTab === 'sources' && (
                            <DataSourceManagerPanel 
                                sources={allSources} 
                                activeSourceId={source?.id || null} 
                                onSelectSource={onSelectSource}
                                onRemoveSource={onRemoveSource}
                                onAddSource={onAddSource}
                            />
                        )}
                        {activeTab === 'fields' && (
                            <div className="space-y-4 p-4">
                                {filteredFields.dimensions.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-xs text-blue-500 uppercase tracking-wider mb-2 px-1">Dimensions</h4>
                                        {filteredFields.dimensions.map(f => <FieldRow key={f.name} field={f} onContextMenu={(e) => openFieldContextMenu(e, f)} />)}
                                    </div>
                                )}
                                {filteredFields.measures.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-xs text-green-500 uppercase tracking-wider mb-2 px-1">Measures</h4>
                                        {filteredFields.measures.map(f => <FieldRow key={f.name} field={f} onContextMenu={(e) => openFieldContextMenu(e, f)} />)}
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'steps' && (
                             <div className="space-y-2 p-4 pl-8">
                                {isGenerating && <><AiSuggestionSkeleton /><AiSuggestionSkeleton /></>}
                                {aiSuggestions.map((s, i) => <AiSuggestionCard key={`sugg-${i}`} suggestion={s} onApply={() => source && addTransformation(source.id, s.transformationType, s.payload)} />)}
                                
                                <Reorder.Group axis="y" values={transformations} onReorder={onReorderTransforms} onDragStart={() => setIsReordering(true)} onDragEnd={() => setIsReordering(false)} className="space-y-2">
                                    {transformations.map(t => (
                                        <Reorder.Item key={t.id} value={t} className="cursor-grab active:cursor-grabbing">
                                            <TransformationCard transform={t} onRemove={() => props.onRemoveTransform(t.id)} isReordering={isReordering} />
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                                {!isGenerating && transformations.length === 0 && aiSuggestions.length === 0 && <p className="text-center text-muted-foreground text-sm p-4">No transformations yet.</p>}
                            </div>
                        )}
                    </MotionDiv>
                </AnimatePresence>
            </div>
            <div id="onboarding-actions" className="p-4 border-t border-border flex-shrink-0 space-y-2">
                 <Button variant="outline" className="w-full ai-feature-style" onClick={handleGenerateSuggestions} disabled={!aiConfig || isGenerating || !source}>
                    <Lightbulb size={16} /> {isGenerating ? 'Analyzing...' : 'Get AI Suggestions'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full" onClick={() => source && openAddFieldModal(source.id, 'formula')} disabled={!source}><Calculator/> Calculated Field</Button>
                    <Button variant="outline" className="w-full" onClick={() => source && openAddFieldModal(source.id, 'grouping')} disabled={!source}><Braces/> Categorical Field</Button>
                </div>
            </div>
        </div>
    );
};

const FieldRow: React.FC<{field: Field, onContextMenu: (e: React.MouseEvent) => void}> = ({ field, onContextMenu }) => {
    const getIcon = () => {
        switch (field.type) {
            case FieldType.MEASURE: return <Hash className="text-green-500"/>;
            case FieldType.DATETIME: return <Clock className="text-purple-500"/>;
            case FieldType.DIMENSION:
            default: return <Type className="text-blue-500"/>;
        }
    };
    return (
        <div onContextMenu={onContextMenu} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-sm cursor-pointer">
            {getIcon()}
            <span className="font-medium text-foreground truncate">{field.simpleName}</span>
        </div>
    );
};

const DataGrid: React.FC<{
    fields: Field[];
    data: any[];
    sort: { key: string, order: 'asc' | 'desc' } | null;
    onSort: (key: string) => void;
    onColumnMenu: (e: React.MouseEvent, field: Field) => void;
}> = ({ fields, data, sort, onSort, onColumnMenu }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const ROW_HEIGHT = 36;
    const onScroll = (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop);
    
    const itemsToRender = useMemo(() => containerRef.current ? Math.ceil(containerRef.current.clientHeight / ROW_HEIGHT) + 5 : 20, [containerRef.current?.clientHeight]);
    const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
    const visibleRows = useMemo(() => data.slice(startIndex, Math.min(data.length, startIndex + itemsToRender)), [data, startIndex, itemsToRender]);
    const paddingTop = startIndex * ROW_HEIGHT;
    
    return (
        <div id="onboarding-datagrid" className="bg-card rounded-xl border border-border flex flex-col overflow-hidden">
            <div className="flex-grow overflow-auto" onScroll={onScroll} ref={containerRef}>
                <div style={{ height: data.length * ROW_HEIGHT }}>
                    <table className="min-w-full text-sm text-left border-collapse" style={{ paddingTop }}>
                        <thead className="sticky top-0 z-10 bg-secondary">
                            <tr>
                                {fields.map(field => (
                                    <th key={field.name} scope="col" className="group px-3 h-10 whitespace-nowrap font-semibold text-foreground border-b-2 border-r border-border last:border-r-0">
                                        <div className="flex items-center justify-between h-full">
                                            <button onClick={() => onSort(field.name)} className="flex items-center gap-1.5 hover:text-primary">
                                                <span>{field.simpleName}</span>
                                                {sort?.key === field.name && (sort.order === 'asc' ? <ArrowUpAZ className="text-primary"/> : <ArrowDownAZ className="text-primary"/>)}
                                            </button>
                                            <button onClick={(e) => onColumnMenu(e, field)} className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted hover:text-foreground transition-opacity" aria-label={`Options for ${field.simpleName} column`}><MoreVertical /></button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="relative">
                            {visibleRows.map((row, index) => (
                                <tr key={startIndex + index} className="text-foreground hover:bg-accent/50" style={{height: ROW_HEIGHT}}>
                                    {fields.map(field => (
                                        <td key={field.name} className="px-3 whitespace-nowrap border-b border-r border-border" title={String(row[field.name])}>
                                            <span className="truncate block">{String(row[field.name] ?? '–')}</span>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const UndoRedoButtons: React.FC = () => {
    const { undo, redo, canUndo, canRedo } = useDashboard();
    return (
        <div className="flex items-center gap-2">
            <Tooltip content={`Undo (${canUndo ? 'Enabled' : 'Disabled'})`}><Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo"><Undo2 size={16}/></Button></Tooltip>
            <Tooltip content={`Redo (${canRedo ? 'Enabled' : 'Disabled'})`}><Button variant="outline" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo"><Redo2 size={16}/></Button></Tooltip>
        </div>
    );
};

export const DataStudioView: React.FC = () => {
    const { 
        dataSources, 
        studioSourceId, 
        setView, 
        getTransformationsForSource, 
        applyTransformations, 
        addTransformation, 
        removeTransformation, 
        openConfirmationModal, 
        openContextMenu, 
        openInputModal, 
        openSplitColumnModal, 
        parameters, 
        isDataStudioOnboardingNeeded, 
        completeDataStudioOnboarding,
        importInputRef,
        removeDataSource,
    } = useDashboard();
    const { isMobile } = useSidebar();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [sort, setSort] = useState<{ key: string, order: 'asc' | 'desc' } | null>(null);

    const activeSource = useMemo(() => studioSourceId ? dataSources.get(studioSourceId) : null, [dataSources, studioSourceId]);
    const transformations = useMemo(() => activeSource ? getTransformationsForSource(activeSource.id) : [], [activeSource, getTransformationsForSource]);
    
    const { transformedFields, transformedData } = useMemo(() => {
        if (!activeSource) return { transformedFields: { dimensions: [], measures: [] }, transformedData: [] };
        const fields = applyTransformsToFields(activeSource, transformations);
        const data = applyTransformsToData(activeSource.data, transformations, [...activeSource.fields.dimensions, ...activeSource.fields.measures], parameters);
        let sortedData = data;
        if(sort) {
            sortedData = _.orderBy(data, [sort.key], [sort.order]);
        }
        return { transformedFields: fields, transformedData: sortedData };
    }, [activeSource, transformations, sort, parameters]);

    const handleSort = (key: string) => setSort(prev => (prev?.key === key && prev.order === 'asc' ? { key, order: 'desc' } : { key, order: 'asc' }));

    const openFieldContextMenu = (e: React.MouseEvent, field: Field) => {
        e.preventDefault();
        if (!activeSource) return;
        let items: ContextMenuItem[] = [
            { label: 'Sort Ascending', icon: <ArrowUpAZ/>, onClick: () => handleSort(field.name) },
            { label: 'Sort Descending', icon: <ArrowDownAZ/>, onClick: () => handleSort(field.name) },
            { label: '---', onClick: ()=>{}},
            { label: 'Rename...', icon: <Pencil/>, onClick: () => openInputModal({
                title: `Rename Field`,
                message: `Enter a new name for "${field.simpleName}".`,
                inputLabel: "New Field Name",
                initialValue: field.simpleName,
                actionLabel: "Rename",
                onConfirm: (newName) => addTransformation(activeSource.id, TransformationType.RENAME_FIELD, { oldName: field.name, newName })
            }) },
            { label: 'Duplicate...', icon: <Copy/>, onClick: () => openInputModal({ title: `Duplicate ${field.simpleName}`, inputLabel: "New Field Name", initialValue: `${field.simpleName}_copy`, onConfirm: (newName) => addTransformation(activeSource.id, TransformationType.DUPLICATE_FIELD, { fieldName: field.name, newFieldName: newName }) })},
            { label: 'Delete...', icon: <Trash/>, onClick: () => openConfirmationModal({ title: 'Delete Field?', message: `Delete "${field.simpleName}"?`, onConfirm: () => addTransformation(activeSource.id, TransformationType.DELETE_FIELD, { name: field.name }) }) },
        ];
        
        const typeChangeItems: ContextMenuItem[] = [{ label: '---', onClick:()=>{} }];
        if(field.type !== FieldType.MEASURE) typeChangeItems.push({ label: 'Change to Measure', icon: <Hash/>, onClick: () => addTransformation(activeSource.id, TransformationType.CHANGE_TYPE, { name: field.name, to: FieldType.MEASURE }) });
        if(field.type !== FieldType.DIMENSION) typeChangeItems.push({ label: 'Change to Dimension', icon: <Type/>, onClick: () => addTransformation(activeSource.id, TransformationType.CHANGE_TYPE, { name: field.name, to: FieldType.DIMENSION }) });
        if(field.type !== FieldType.DATETIME) typeChangeItems.push({ label: 'Convert to Date/Time', icon: <Clock/>, onClick: () => addTransformation(activeSource.id, TransformationType.CONVERT_TO_DATETIME, { fieldName: field.name }) });
        if(typeChangeItems.length > 1) items.push(...typeChangeItems);
        
        if (field.type === FieldType.DIMENSION) {
            items.push({ label: '---', onClick: ()=>{}},
                { label: 'Split Column...', icon: <ColumnsIcon/>, onClick: () => openSplitColumnModal(field, (payload) => addTransformation(activeSource.id, TransformationType.SPLIT_COLUMN, payload))},
                { label: 'Trim Whitespace', icon: <Baseline/>, onClick: () => addTransformation(activeSource.id, TransformationType.STANDARDIZE_TEXT, { fieldName: field.name, operation: 'trim' }) }
            );
        }
        items.push({ label: '---', onClick: ()=>{}}, { label: 'Fill Nulls...', icon: <CircleSlash/>, onClick: () => openInputModal({ title: `Fill Nulls in "${field.simpleName}"`, inputLabel: 'Value to fill with', onConfirm: (value) => addTransformation(activeSource.id, TransformationType.HANDLE_NULLS, { fieldName: field.name, strategy: 'value', value }) }) });
        openContextMenu(e.clientX, e.clientY, items);
    };

    if (dataSources.size === 0) {
        return (
            <div className="h-full w-full flex flex-col">
                 <ViewHeader icon={<Database size={24} />} title="Data Studio" />
                <div className="flex-grow flex items-center justify-center text-muted-foreground">
                    <p>Add a data source from the main sidebar to begin.</p>
                </div>
            </div>
        )
    }
    
    const allTransformedFields = [...transformedFields.dimensions, ...transformedFields.measures];

    return (
        <div className="h-full bg-background flex flex-col relative">
            <ViewHeader icon={<Database size={24} />} title="Data Studio" showBackToDashboard={!isMobile}>
                <div className="flex items-center gap-2">
                    {activeSource ? 
                        <span className="text-xl font-semibold font-display text-foreground">{activeSource.name}</span> 
                        : <span className="text-xl font-semibold font-display text-muted-foreground">Select a Source</span>
                    }
                </div>
                <div className="flex-grow" />
                <UndoRedoButtons />
                {isMobile ? (
                    <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)}><Settings size={16}/></Button>
                ) : (
                    <Button variant="secondary" onClick={() => setView('dashboard')}>Close & Save</Button>
                )}
            </ViewHeader>
            <main className="flex-grow p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 min-h-0">
                {!isMobile && (
                    <StudioSidebar 
                        source={activeSource} 
                        transformations={transformations}
                        transformedFields={transformedFields}
                        onRemoveTransform={(id) => activeSource && removeTransformation(activeSource.id, id)}
                        onReorderTransforms={(newTransforms) => activeSource && applyTransformations(activeSource.id, newTransforms)}
                        openFieldContextMenu={openFieldContextMenu}
                        allSources={Array.from(dataSources.values())}
                        onSourceChange={(id) => setView('studio', { sourceId: id })}
                        onRemoveSource={removeDataSource}
                        onAddSource={() => importInputRef.current?.click()}
                    />
                )}
                {isMobile && (
                    <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetContent side="left" className="w-[420px] max-w-[95vw] p-0 flex flex-col">
                             <StudioSidebar 
                                source={activeSource} 
                                transformations={transformations}
                                transformedFields={transformedFields}
                                onRemoveTransform={(id) => activeSource && removeTransformation(activeSource.id, id)}
                                onReorderTransforms={(newTransforms) => activeSource && applyTransformations(activeSource.id, newTransforms)}
                                openFieldContextMenu={openFieldContextMenu}
                                allSources={Array.from(dataSources.values())}
                                onSourceChange={(id) => setView('studio', { sourceId: id })}
                                onRemoveSource={removeDataSource}
                                onAddSource={() => importInputRef.current?.click()}
                            />
                        </SheetContent>
                    </Sheet>
                )}
                {activeSource ? (
                    <DataGrid 
                        fields={allTransformedFields}
                        data={transformedData}
                        sort={sort}
                        onSort={handleSort}
                        onColumnMenu={openFieldContextMenu}
                    />
                ) : (
                    <div className="bg-card rounded-xl border border-border flex items-center justify-center text-center text-muted-foreground p-8">
                        <div>
                            <Database size={48} className="mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground">No Data Source Selected</h3>
                            <p>Please select a data source from the sidebar to begin transformations.</p>
                        </div>
                    </div>
                )}
            </main>
            {isDataStudioOnboardingNeeded && <DataStudioOnboarding onComplete={completeDataStudioOnboarding} />}
        </div>
    );
};