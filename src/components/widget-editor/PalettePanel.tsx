import React, { useState, useMemo, useCallback, useEffect } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Field, FieldType, Pill, AggregationType, ChartType, DND_ITEM_TYPE, AiChatMessage, FieldDragItem, WidgetState, ContextMenuItem } from '../../utils/types';
import * as aiService from '../../services/aiService';
import { Button, Checkbox, ColorPicker, HelpIcon, Shelf, ToggleSwitch, Tooltip, ChartTypeSelector, cn, inputClasses, textareaClasses } from '../ui';
import { Database, Layout, Paintbrush, Settings, Sparkle, Search, RefreshCw, Type, Hash, Clock, Columns, List, Filter, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEmptyImage } from 'react-d-html5-backend';
import { useDrag } from 'react-dnd';
import { FieldInfoPopover } from '../ui/FieldInfoPopover';
import { COLOR_PALETTES } from '../../utils/constants';
import { generateTitle } from '../../utils/dataUtils';
import Slider from 'rc-slider';

const PaletteTabButton: React.FC<{ tabId: string; activeTab: string; setActiveTab: (id: string) => void; children: React.ReactNode; }> = ({ tabId, activeTab, setActiveTab, children }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 p-3 text-xs font-semibold transition-colors relative border-b-2",
            activeTab === tabId ? 'text-primary border-primary' : 'text-muted-foreground hover:text-foreground border-transparent'
        )}
    >
        {children}
    </button>
);

const SelectableFieldRow: React.FC<{ field: Field }> = ({ field }) => {
    const { editingWidgetState, toggleFieldInEditorShelves } = useDashboard();
    
    const isChecked = useMemo(() => {
        if (!editingWidgetState) return false;
        const allPills = _.flatMap(Object.values(editingWidgetState.shelves), shelf => Array.isArray(shelf) ? shelf : []);
        return allPills.some(p => p.name === field.name);
    }, [editingWidgetState, field.name]);

    const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
        type: DND_ITEM_TYPE.FIELD,
        item: { name: field.name, simpleName: field.simpleName, type: field.type, isCalculated: field.isCalculated, formula: field.formula } as FieldDragItem,
        collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }));

    useEffect(() => { dragPreview(getEmptyImage(), { captureDraggingState: true }); }, [dragPreview]);

    const getIcon = () => {
        switch(field.type) {
            case FieldType.MEASURE: return <Hash size={14} className="text-green-500" />;
            case FieldType.DATETIME: return <Clock size={14} className="text-purple-500" />;
            default: return <Type size={14} className="text-blue-500" />;
        }
    };
    
    return (
        <div ref={drag as any} className={cn("flex items-center gap-2 bg-secondary/50 border border-transparent rounded-lg p-2 transition-colors cursor-grab", isChecked && "bg-primary/10 border-primary/30", isDragging && "opacity-30")}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleFieldInEditorShelves(field)} aria-label={`Select ${field.simpleName}`} />
            <div className="flex-grow flex items-center gap-2 truncate">
                {getIcon()}
                <FieldInfoPopover field={field} isDragging={isDragging}>
                    <span className="font-medium text-sm text-foreground truncate cursor-help">{field.simpleName}</span>
                </FieldInfoPopover>
            </div>
        </div>
    );
};

const DataTab: React.FC = () => {
    const { blendedFields, aiConfig, showToast, populateEditorFromAI, widgetEditorAIPrompt, setWidgetEditorAIPrompt, blendedData } = useDashboard();
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [fieldSearch, setFieldSearch] = useState('');

    const filteredFields = useMemo(() => {
        const lowerSearch = fieldSearch.toLowerCase();
        return {
            dimensions: blendedFields.dimensions.filter(f => f.simpleName.toLowerCase().includes(lowerSearch)),
            measures: blendedFields.measures.filter(f => f.simpleName.toLowerCase().includes(lowerSearch)),
        };
    }, [blendedFields, fieldSearch]);

    const handleGenerateClick = useCallback(async (prompt: string) => {
        if (!aiConfig) { showToast({ message: "AI is not configured.", type: "error" }); return; }
        if (!prompt.trim()) return;
        setIsGenerating(true);
        try {
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            const explicitPrompt = `Generate a visualization for: ${prompt}`;
            const chatHistory: AiChatMessage[] = [{ id: '1', role: 'user', content: explicitPrompt }];
            const { chartSuggestion } = await aiService.getChatResponse(aiConfig, chatHistory, allFields, blendedData.slice(0, 5));
            if (chartSuggestion) {
                populateEditorFromAI(chartSuggestion);
                showToast({ message: "AI suggestion applied.", type: "success" });
            } else {
                showToast({ message: "AI could not generate a chart from the prompt.", type: "info" });
            }
        } catch (e) {
            showToast({ message: `AI failed: ${(e as Error).message}`, type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    }, [aiConfig, blendedFields, blendedData, showToast, populateEditorFromAI]);
    
    useEffect(() => {
        if (widgetEditorAIPrompt) {
            setAiPrompt(widgetEditorAIPrompt);
            handleGenerateClick(widgetEditorAIPrompt);
            setWidgetEditorAIPrompt(null);
        }
    }, [widgetEditorAIPrompt, handleGenerateClick, setWidgetEditorAIPrompt]);
    
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border/50 space-y-3">
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., Show me total profit by product category" className={cn(textareaClasses, "text-sm")} rows={3} />
                <Button onClick={() => handleGenerateClick(aiPrompt)} disabled={isGenerating || !aiPrompt.trim()} className="w-full ai-feature-style">
                    {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkle size={16} />} {isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
            </div>
            <div className="p-4 border-b border-border/50">
                <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Search fields..." value={fieldSearch} onChange={e => setFieldSearch(e.target.value)} className={`${inputClasses} pl-8 h-9`} /></div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {filteredFields.dimensions.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-xs text-blue-500 uppercase tracking-wider mb-2 px-1">Dimensions</h4>
                        <div className="space-y-2">{filteredFields.dimensions.map(f => <SelectableFieldRow key={f.name} field={f} />)}</div>
                    </div>
                )}
                 {filteredFields.measures.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-xs text-green-500 uppercase tracking-wider mb-2 px-1">Measures</h4>
                         <div className="space-y-2">{filteredFields.measures.map(f => <SelectableFieldRow key={f.name} field={f} />)}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PropertiesTab: React.FC = () => {
    const { editingWidgetState: localWidget, updateEditingWidget, openFilterConfigModal, openValueFormatModal, openContextMenu } = useDashboard();
    if (!localWidget) return null;

    const handleUpdate = (update: Partial<WidgetState> | ((prevState: WidgetState) => WidgetState)) => updateEditingWidget(update);
    const handlePillUpdate = (shelfId: keyof WidgetState['shelves'], index: number, update: Partial<Pill>) => {
         handleUpdate(prev => {
             if(!prev) return prev;
             const newShelves = _.cloneDeep(prev.shelves);
             if (newShelves[shelfId]?.[index]) { newShelves[shelfId]![index] = { ...newShelves[shelfId]![index], ...update }; return { ...prev, shelves: newShelves }; }
             return prev;
        });
    };
    const handleDrop = (shelfId: keyof WidgetState['shelves'], item: FieldDragItem) => {
        const newPill: Pill = { id: _.uniqueId('pill_'), name: item.name, simpleName: item.simpleName, type: item.type, aggregation: item.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT, isCalculated: item.isCalculated, formula: item.formula };
        if ((item.type === FieldType.DIMENSION || item.type === FieldType.DATETIME) && shelfId !== 'filters' && shelfId !== 'category' && [...(localWidget.shelves.columns || []), ...(localWidget.shelves.rows || [])].some(p => p.name === item.name)) return;
        handleUpdate(w => ({ ...w, shelves: { ...w.shelves, [shelfId]: [...(w.shelves[shelfId] || []), newPill] } }));
    };
    const handleRemovePill = (shelfId: keyof WidgetState['shelves'], index: number) => { handleUpdate(prev => { const newShelf = [...(prev.shelves[shelfId] || [])]; newShelf.splice(index, 1); return { ...prev, shelves: { ...prev.shelves, [shelfId]: newShelf } }; }); };
    const handleMovePill = (dragIndex: number, hoverIndex: number, sourceShelf: keyof WidgetState['shelves'], targetShelf: keyof WidgetState['shelves']) => {
        handleUpdate(w => {
            const sourcePills = [...(w.shelves[sourceShelf] || [])];
            const draggedPill = sourcePills.splice(dragIndex, 1)[0];
            if (!draggedPill) return w;
            if (sourceShelf === targetShelf) { sourcePills.splice(hoverIndex, 0, draggedPill); return { ...w, shelves: { ...w.shelves, [sourceShelf]: sourcePills } }; } 
            else { const targetPills = [...(w.shelves[targetShelf] || [])]; targetPills.splice(hoverIndex, 0, draggedPill); return { ...w, shelves: { ...w.shelves, [sourceShelf]: sourcePills, [targetShelf]: targetPills } }; }
        });
    };
    const handlePillClick = (shelfId: keyof WidgetState['shelves'], pill: Pill, index: number) => { if (shelfId === 'filters') openFilterConfigModal(pill, (updatedPill) => handlePillUpdate('filters', index, updatedPill)); };
    const handlePillContextMenu = (e: React.MouseEvent, shelfId: 'values' | 'values2' | 'bubbleSize', pill: Pill, index: number) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, [
            ...Object.values(AggregationType).map(agg => ({ label: agg, icon: pill.aggregation === agg ? <Check /> : <div className="w-4" />, onClick: () => handlePillUpdate(shelfId, index, { aggregation: agg }) })),
            { label: '---', onClick: () => {} },
            { label: 'Format...', icon: <Type />, onClick: () => openValueFormatModal(pill, (newFormatting) => handlePillUpdate(shelfId, index, { formatting: newFormatting })) }
        ]);
    };
    const shelvesConfig = [
        { id: 'category', title: 'Category', helpText: 'Color-code bubbles or scatter points.', condition: () => [ChartType.SCATTER, ChartType.BUBBLE].includes(localWidget.chartType), canDrop: (item: any) => (item.pill?.type || item.type) !== FieldType.MEASURE },
        { id: 'columns', title: 'Columns (X-axis)', helpText: 'Create columns or points on the X-axis.', condition: () => true, canDrop: (item: any) => ([ChartType.SCATTER, ChartType.BUBBLE].includes(localWidget.chartType)) ? (item.pill?.type || item.type) === FieldType.MEASURE : (item.pill?.type || item.type) !== FieldType.MEASURE },
        { id: 'rows', title: 'Rows (Y-axis)', helpText: 'Create rows or points on the Y-axis.', condition: () => true, canDrop: (item: any) => ([ChartType.SCATTER, ChartType.BUBBLE].includes(localWidget.chartType)) ? (item.pill?.type || item.type) === FieldType.MEASURE : (item.pill?.type || item.type) !== FieldType.MEASURE },
        { id: 'values', title: 'Values (Measures)', helpText: 'Determine numeric values for your visualization.', condition: () => true, canDrop: (item: any) => (item.pill?.type || item.type) === FieldType.MEASURE },
        { id: 'values2', title: 'Secondary Values (Y2)', helpText: 'For Dual Axis charts, create a second Y-axis.', condition: () => localWidget.chartType === ChartType.DUAL_AXIS, canDrop: (item: any) => (item.pill?.type || item.type) === FieldType.MEASURE },
        { id: 'filters', title: 'Filters', helpText: 'Apply filters to this widget only.', condition: () => true, canDrop: () => true },
    ];
    return (
        <div className="flex flex-col h-full">
            <div className="p-4"><ChartTypeSelector chartType={localWidget.chartType} onChartTypeChange={(t) => handleUpdate({ chartType: t, displayMode: t === ChartType.TABLE ? 'table' : 'chart' })} /></div>
            <div className="flex-grow p-4 pt-0 overflow-y-auto space-y-4">
                {shelvesConfig.filter(s => !s.condition || s.condition()).map(s => (
                    <Shelf key={s.id} shelfId={s.id as any} title={s.title} helpText={s.helpText} pills={localWidget.shelves[s.id as keyof typeof localWidget.shelves] || []} onDrop={(item) => handleDrop(s.id as any, item)} onRemovePill={(index) => handleRemovePill(s.id as any, index)} onUpdatePill={(index, update) => handlePillUpdate(s.id as any, index, update)} onMovePill={handleMovePill} onPillClick={(pill, index) => handlePillClick(s.id as any, pill, index)} onPillContextMenu={(e, pill, index) => { if (['values', 'values2'].includes(s.id)) handlePillContextMenu(e, s.id as any, pill, index); }} canDrop={s.canDrop} />
                ))}
            </div>
        </div>
    );
};

const FormatTab: React.FC = () => {
    const { editingWidgetState: localWidget, updateEditingWidget } = useDashboard();
    if (!localWidget) return null;
    return (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div>
                <label className="text-sm font-medium text-muted-foreground">Color Palette</label>
                <select value={localWidget.colorPalette} onChange={e => updateEditingWidget({ colorPalette: e.target.value })} className={`${inputClasses} mt-1`}>
                    {Object.keys(COLOR_PALETTES).map(name => <option key={name} value={name}>{name}</option>)}
                </select>
            </div>
            {localWidget.displayMode === 'table' && (
                <>
                    <div className="pt-4 border-t border-border/50"><h4 className="font-semibold text-foreground">Table Formatting</h4></div>
                    <ToggleSwitch label="Striped Rows" enabled={localWidget.tableSettings?.striped !== false} onChange={val => updateEditingWidget(w => w ? { ...w, tableSettings: { ...w.tableSettings, striped: val } } : null)} />
                    <ToggleSwitch label="Show Grid Lines" enabled={localWidget.tableSettings?.showGrid !== false} onChange={val => updateEditingWidget(w => w ? { ...w, tableSettings: { ...w.tableSettings, showGrid: val } } : null)} />
                    <ToggleSwitch label={<div className="flex items-center gap-2">Arrange Measures Vertically<HelpIcon helpText="Pivots the table to show measures as column headers." /></div>} enabled={localWidget.tableSettings?.pivotMeasureLayout === 'vertical'} onChange={val => updateEditingWidget(w => w ? { ...w, tableSettings: { ...w.tableSettings, pivotMeasureLayout: val ? 'vertical' : 'horizontal' } } : null)} />
                </>
            )}
        </div>
    );
};

const SettingsTab: React.FC = () => {
    const { editingWidgetState: localWidget, updateEditingWidget } = useDashboard();
    if (!localWidget) return null;
    return (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            <ToggleSwitch label="Enable Cross-Filtering" enabled={!!localWidget.isCrossFilterSource} onChange={val => updateEditingWidget({ isCrossFilterSource: val })} />
            {[ChartType.BAR, ChartType.LINE, ChartType.AREA].includes(localWidget.chartType) && (
                <div className="pt-4 border-t border-border/50">
                    <ToggleSwitch label={<div className="flex items-center gap-2">Stack Series<HelpIcon helpText="Stack series on top of each other for part-to-whole analysis." /></div>} enabled={localWidget.isStacked ?? localWidget.chartType === ChartType.AREA} onChange={val => updateEditingWidget({ isStacked: val })} />
                </div>
            )}
            <div className="pt-4 border-t border-border/50"><h4 className="font-semibold text-foreground">Subtotals</h4></div>
            <ToggleSwitch label="Row Subtotals" enabled={!!localWidget.subtotalSettings.rows} onChange={val => updateEditingWidget(w => w ? {...w, subtotalSettings: {...w.subtotalSettings, rows: val}} : null)} />
            <ToggleSwitch label="Column Totals" enabled={!!localWidget.subtotalSettings.columns} onChange={val => updateEditingWidget(w => w ? {...w, subtotalSettings: {...w.subtotalSettings, columns: val}} : null)} />
        </div>
    );
};


export const PalettePanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState('data');
    const MotionDiv = motion.div as any;

    const renderContent = () => {
        switch (activeTab) {
            case 'properties': return <PropertiesTab />;
            case 'format': return <FormatTab />;
            case 'settings': return <SettingsTab />;
            case 'data':
            default: return <DataTab />;
        }
    };
    
    return (
        <aside className="w-[384px] flex-shrink-0 bg-secondary/30 border-r border-border/50 flex flex-col">
            <div className="flex-shrink-0 border-b border-border/50 flex items-center bg-card">
                <PaletteTabButton tabId="data" activeTab={activeTab} setActiveTab={setActiveTab}><Database size={18} />Data</PaletteTabButton>
                <PaletteTabButton tabId="properties" activeTab={activeTab} setActiveTab={setActiveTab}><Layout size={18} />Properties</PaletteTabButton>
                <PaletteTabButton tabId="format" activeTab={activeTab} setActiveTab={setActiveTab}><Paintbrush size={18} />Format</PaletteTabButton>
                <PaletteTabButton tabId="settings" activeTab={activeTab} setActiveTab={setActiveTab}><Settings size={18} />Settings</PaletteTabButton>
            </div>
            <div className="flex-grow min-h-0">
                <AnimatePresence mode="wait">
                    <MotionDiv key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
                        {renderContent()}
                    </MotionDiv>
                </AnimatePresence>
            </div>
        </aside>
    );
};