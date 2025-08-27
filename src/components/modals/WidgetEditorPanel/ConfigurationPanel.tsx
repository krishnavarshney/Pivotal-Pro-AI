import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import { Settings, Paintbrush, Sliders, Columns, List, Hash, Filter, Check, Type, AreaChart } from 'lucide-react';
import { useDashboard } from '../../../contexts/DashboardProvider';
import { WidgetState, TableSettings, FieldDragItem, Pill, FieldType, AggregationType, ChartType, ContextMenuItem, SectionSettings } from '../../../utils/types';
import { inputClasses, ChartTypeSelector, ToggleSwitch, Shelf, labelClasses, HelpIcon, ColorPicker } from '../../ui';
import { COLOR_PALETTES } from '../../../utils/constants';
import { EditorTabButton } from './EditorTabButton';
import { motion, AnimatePresence } from 'framer-motion';
import { generateTitle } from '../../../utils/dataUtils';
import Slider from 'rc-slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import { Label } from '../../ui/Label';


const SectionSettingsPanel: React.FC = () => {
    const { editingWidgetState, updateEditingWidget } = useDashboard();
    const widget = editingWidgetState;

    if (!widget || widget.displayMode !== 'section') return null;

    const settings = widget.sectionSettings || {};

    const handleSettingsChange = (update: Partial<SectionSettings>) => {
        updateEditingWidget(w => ({
            ...w,
            sectionSettings: {
                ...(w.sectionSettings || {}),
                ...update,
            },
        }));
    };
    
    const fontFamilies = ['var(--font-sans)', 'var(--font-display)', 'var(--font-mono)', 'Inter, sans-serif', 'Manrope, sans-serif', 'Roboto Mono, monospace', 'Playfair Display, serif'];

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-base font-semibold text-foreground mb-3">Text Formatting</h4>
                <div className="space-y-4">
                    <div>
                        <label className={labelClasses}>Font Family</label>
                        <select value={settings.fontFamily || 'var(--font-display)'} onChange={e => handleSettingsChange({ fontFamily: e.target.value })} className={`${inputClasses} mt-1`}>
                            {fontFamilies.map(f => <option key={f} value={f}>{f.replace(/var\(--font-|\)/g, '').split(',')[0]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClasses}>Font Size ({settings.fontSize || 18}px)</label>
                        <Slider min={12} max={48} step={1} value={settings.fontSize || 18} onChange={v => handleSettingsChange({ fontSize: v as number })} />
                    </div>
                    <div>
                        <label className={labelClasses}>Font Weight</label>
                        <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg mt-1">
                            <button onClick={() => handleSettingsChange({ fontWeight: 'normal' })} className={`flex-1 text-center py-1.5 px-3 rounded-md text-sm ${settings.fontWeight !== 'bold' ? 'bg-background shadow-sm' : ''}`}>Normal</button>
                            <button onClick={() => handleSettingsChange({ fontWeight: 'bold' })} className={`flex-1 text-center py-1.5 px-3 rounded-md text-sm ${settings.fontWeight === 'bold' ? 'bg-background shadow-sm' : ''}`}>Bold</button>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Text Align</label>
                        <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg mt-1">
                            <button onClick={() => handleSettingsChange({ textAlign: 'left' })} className={`flex-1 text-center py-1.5 px-3 rounded-md text-sm ${settings.textAlign === 'left' ? 'bg-background shadow-sm' : ''}`}>Left</button>
                            <button onClick={() => handleSettingsChange({ textAlign: 'center' })} className={`flex-1 text-center py-1.5 px-3 rounded-md text-sm ${settings.textAlign === 'center' ? 'bg-background shadow-sm' : ''}`}>Center</button>
                            <button onClick={() => handleSettingsChange({ textAlign: 'right' })} className={`flex-1 text-center py-1.5 px-3 rounded-md text-sm ${settings.textAlign === 'right' ? 'bg-background shadow-sm' : ''}`}>Right</button>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Text Color</label>
                        <ColorPicker color={settings.color} onChange={c => handleSettingsChange({ color: c })} />
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-base font-semibold text-foreground mb-3 pt-6 border-t border-border">Container Formatting</h4>
                <div className="space-y-4">
                    <div>
                        <label className={labelClasses}>Background Color</label>
                        <ColorPicker color={settings.backgroundColor} onChange={c => handleSettingsChange({ backgroundColor: c })} />
                    </div>
                    <div>
                        <label className={labelClasses}>Border Radius ({settings.borderRadius || 12}px)</label>
                        <Slider min={0} max={32} step={1} value={settings.borderRadius || 12} onChange={v => handleSettingsChange({ borderRadius: v as number })} />
                    </div>
                    <div>
                        <label className={labelClasses}>Vertical Padding ({settings.paddingY || 8}px)</label>
                        <Slider min={0} max={32} step={1} value={settings.paddingY || 8} onChange={v => handleSettingsChange({ paddingY: v as number })} />
                    </div>
                    <div>
                        <label className={labelClasses}>Shadow</label>
                        <select value={settings.shadow || 'none'} onChange={e => handleSettingsChange({ shadow: e.target.value as any })} className={`${inputClasses} mt-1`}>
                            <option value="none">None</option>
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large</option>
                            <option value="xl">Extra Large</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConfigurationPanel: React.FC = () => {
    const { 
        editingWidgetState,
        updateEditingWidget,
        openFilterConfigModal,
        openValueFormatModal,
        openContextMenu,
        blendedFields
    } = useDashboard();
    
    const [activeTab, setActiveTab] = useState<'configuration' | 'formatting' | 'settings'>('configuration');
    
    const localWidget = editingWidgetState;
    
    const handleUpdate = (update: Partial<WidgetState> | ((prevState: WidgetState) => WidgetState)) => {
        updateEditingWidget(update);
    };

    useEffect(() => {
        if (!localWidget || localWidget.displayMode === 'section' || localWidget.displayMode === 'control') return;

        const chartTypeValues = Object.values(ChartType);
        const defaultTitles = ['New Widget', 'AI Suggested Widget', 'New AI Widget', ...chartTypeValues];
        const isDefaultTitle = defaultTitles.includes(localWidget.title);

        const chartTypesForRegex = chartTypeValues.map(ct => `${ct}( Chart)?`).join('|');
        const isAutoGeneratedTitle = new RegExp(`^.+\\s\\|\\s(${chartTypesForRegex})$`).test(localWidget.title);

        if (isDefaultTitle || isAutoGeneratedTitle) {
            const newTitle = generateTitle(localWidget);
            if (newTitle !== localWidget.title) {
                 const debouncedUpdate = _.debounce(() => handleUpdate({ title: newTitle }), 300);
                 debouncedUpdate();
                 return () => debouncedUpdate.cancel();
            }
        }
    }, [localWidget?.shelves, localWidget?.chartType, localWidget?.title]);

    if (!localWidget) return null;

    if (localWidget.displayMode === 'section') {
        return (
            <div className="h-full flex flex-col p-4 gap-4">
                <div className="flex-shrink-0">
                    <label className="text-sm font-medium text-muted-foreground mb-1">Section Title</label>
                    <input type="text" value={localWidget.title} onChange={e => handleUpdate({ title: e.target.value })} className={`${inputClasses} text-base font-semibold`} />
                </div>
                 <div className="flex-grow overflow-y-auto -mr-4 pr-4">
                    <SectionSettingsPanel />
                </div>
            </div>
        );
    }

     if (localWidget.displayMode === 'control') {
        const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
        const targetField = allFields.find(f => f.name === localWidget.targetId);

        const handleFieldChange = (fieldName: string) => {
            const field = allFields.find(f => f.name === fieldName);
            if (field) {
                let display: WidgetState['controlSettings']['display'];
                if (field.type === FieldType.MEASURE) display = 'range';
                else if (field.type === FieldType.DATETIME) display = 'datepicker';
                else display = 'list';
                
                handleUpdate({
                    targetType: 'field',
                    targetId: field.name,
                    title: `Filter by ${field.simpleName}`,
                    controlSettings: { display }
                });
            }
        };
        
        const displayOptions = useMemo(() => {
            if (!targetField) return [];
            if (targetField.type === FieldType.MEASURE) return ['range'];
            if (targetField.type === FieldType.DATETIME) return ['datepicker'];
            return ['list', 'dropdown', 'tabs'];
        }, [targetField]);
        
        return (
            <div className="p-4 space-y-4">
                <div>
                    <Label>Field to Filter</Label>
                    <Select value={localWidget.targetId || ''} onValueChange={handleFieldChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a field..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allFields.map(f => (
                                <SelectItem key={f.name} value={f.name}>{f.simpleName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {targetField && (
                    <div>
                        <Label>Display As</Label>
                        <Select
                            value={localWidget.controlSettings?.display || ''}
                            onValueChange={(val) => handleUpdate(w => ({...w, controlSettings: { display: val as any }}))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select display type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {displayOptions.map(opt => (
                                    <SelectItem key={opt} value={opt}>{_.capitalize(opt)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        );
    }


    const handleTableSettingsUpdate = (update: Partial<TableSettings>) => {
        handleUpdate(w => ({ ...w, tableSettings: { ...w.tableSettings, ...update } }));
    };

    const handlePillUpdate = (shelfId: keyof WidgetState['shelves'], index: number, update: Partial<Pill>) => {
         handleUpdate(prev => {
             if(!prev) return prev;
             const newShelves = _.cloneDeep(prev.shelves);
             if (newShelves[shelfId]?.[index]) {
                newShelves[shelfId]![index] = { ...newShelves[shelfId]![index], ...update };
                return { ...prev, shelves: newShelves };
             }
             return prev;
        });
    };
    
    const handleDrop = (shelfId: keyof WidgetState['shelves'], item: FieldDragItem) => {
        const newPill: Pill = {
            id: _.uniqueId('pill_'), name: item.name, simpleName: item.simpleName, type: item.type,
            aggregation: item.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT,
            isCalculated: item.isCalculated, formula: item.formula,
        };
        const currentPills = localWidget.shelves[shelfId] || [];
        if (item.type === FieldType.DIMENSION && shelfId !== 'filters' && shelfId !== 'category') {
             const columns = localWidget.shelves.columns || [];
             const rows = localWidget.shelves.rows || [];
             if ([...columns, ...rows].some(p => p.name === item.name)) return;
        }
        const newPills = [...currentPills, newPill];
        handleUpdate({ shelves: { ...localWidget.shelves, [shelfId]: newPills } });
    };

    const handleRemovePill = (shelfId: keyof WidgetState['shelves'], index: number) => {
        handleUpdate(prev => {
            const newShelf = [...(prev.shelves[shelfId] || [])];
            newShelf.splice(index, 1);
            return { ...prev, shelves: { ...prev.shelves, [shelfId]: newShelf } };
        });
    };

    const handleMovePill = (dragIndex: number, hoverIndex: number, sourceShelf: keyof WidgetState['shelves'], targetShelf: keyof WidgetState['shelves']) => {
        handleUpdate(w => {
            const sourcePills = [...(w.shelves[sourceShelf] || [])];
            const draggedPill = sourcePills[dragIndex];
            if (!draggedPill) return w;
            
            sourcePills.splice(dragIndex, 1);
            if (sourceShelf === targetShelf) {
                sourcePills.splice(hoverIndex, 0, draggedPill);
                return { ...w, shelves: { ...w.shelves, [sourceShelf]: sourcePills } };
            } else {
                const targetPills = [...(w.shelves[targetShelf] || [])];
                targetPills.splice(hoverIndex, 0, draggedPill);
                return { ...w, shelves: { ...w.shelves, [sourceShelf]: sourcePills, [targetShelf]: targetPills } };
            }
        });
    };
    
    const handlePillClick = (shelfId: keyof WidgetState['shelves'], pill: Pill, index: number) => {
        if (shelfId === 'filters') {
            openFilterConfigModal(pill, (updatedPill) => handlePillUpdate('filters', index, updatedPill));
        }
    };
    
    const handlePillContextMenu = (e: React.MouseEvent, shelfId: 'values' | 'values2' | 'bubbleSize', pill: Pill, index: number) => {
        e.preventDefault();
        const items: ContextMenuItem[] = [
            ...Object.values(AggregationType).map(agg => ({
                label: agg,
                icon: pill.aggregation === agg ? <Check /> : <div className="w-4" />,
                onClick: () => handlePillUpdate(shelfId, index, { aggregation: agg }),
            })),
            { label: '---', onClick: () => {} },
            { label: 'Format...', icon: <Type />, onClick: () => {
                openValueFormatModal(pill, (newFormatting) => {
                    handlePillUpdate(shelfId, index, { formatting: newFormatting });
                });
            }}
        ];
        openContextMenu(e.clientX, e.clientY, items);
    };

    const isBubbleChart = localWidget.chartType === ChartType.BUBBLE;
    const isScatterChart = localWidget.chartType === ChartType.SCATTER;
    const isBubbleOrScatter = isBubbleChart || isScatterChart;
    const isDualAxis = localWidget.chartType === ChartType.DUAL_AXIS;

    const shelfIcons: Record<string, React.ReactNode> = {
        category: <List size={16} />,
        columns: <Columns size={16} />,
        rows: <List size={16} />,
        values: <Hash size={16} />,
        values2: <Hash size={16} />,
        filters: <Filter size={16} />,
    };

    const shelvesConfig = [
        { id: 'category', title: 'Category (Dimension)', helpText: 'Use a dimension to color-code bubbles or scatter points.', condition: () => isBubbleOrScatter, canDrop: (item: any) => (item.pill?.type || item.type) === FieldType.DIMENSION },
        { id: 'columns', title: isBubbleOrScatter ? 'X-Axis (Measure)' : 'Columns (X-axis / Groups)', helpText: 'Fields on this shelf create columns in a table or points along the X-axis of a chart.', condition: () => true, canDrop: (item: any) => isBubbleOrScatter ? (item.pill?.type || item.type) === FieldType.MEASURE : (item.pill?.type || item.type) === FieldType.DIMENSION },
        { id: 'rows', title: isBubbleOrScatter ? 'Y-Axis (Measure)' : 'Rows (Y-axis / Breakdowns)', helpText: 'Fields on this shelf create rows in a table or points along the Y-axis of a chart.', condition: () => true, canDrop: (item: any) => isBubbleOrScatter ? (item.pill?.type || item.type) === FieldType.MEASURE : (item.pill?.type || item.type) === FieldType.DIMENSION },
        { id: 'values', title: isBubbleChart ? 'Bubble Size (Measure)' : 'Values (Measures / Y1-axis)', helpText: 'Fields on this shelf determine the numeric values for your visualization, like bar height or line position.', condition: () => !isScatterChart, canDrop: (item: any) => (item.pill?.type || item.type) === FieldType.MEASURE },
        { id: 'values2', title: 'Values 2 (Y2-axis)', helpText: 'For Dual Axis charts, this creates a second Y-axis for comparing measures with different scales.', condition: () => isDualAxis, canDrop: (item: any) => (item.pill?.type || item.type) === FieldType.MEASURE },
        { id: 'filters', title: 'Filters', helpText: 'Apply filters to this widget only. To filter the whole page, use Page Filters on the dashboard.', condition: () => true, canDrop: () => true },
    ].filter(shelf => !shelf.condition || shelf.condition());

    return (
        <div className="h-full flex flex-col p-4 gap-4">
            <div className="flex-shrink-0 space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1">Widget Title</label>
                    <input type="text" placeholder="Widget Title" value={localWidget.title} onChange={e => handleUpdate({ title: e.target.value })} className={`${inputClasses} text-base font-semibold`} />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1">Chart Type</label>
                    <ChartTypeSelector chartType={localWidget.chartType} onChartTypeChange={(t) => handleUpdate({ chartType: t, displayMode: t === ChartType.TABLE ? 'table' : 'chart' })} />
                </div>
            </div>

            <div className="flex-shrink-0 border-b border-border flex">
                <EditorTabButton tabId="configuration" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Settings size={16}/>}>Configuration</EditorTabButton>
                <EditorTabButton tabId="formatting" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Paintbrush size={16}/>}>Formatting</EditorTabButton>
                <EditorTabButton tabId="settings" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Sliders size={16}/>}>Settings</EditorTabButton>
            </div>

            <div className="flex-grow overflow-y-auto -mr-4 pr-4">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                        {activeTab === 'configuration' && (
                            <div className="space-y-4">
                                {shelvesConfig.map(shelf => (
                                    <Shelf
                                        key={shelf.id} shelfId={shelf.id as any} title={shelf.title}
                                        helpText={shelf.helpText}
                                        icon={shelfIcons[shelf.id]}
                                        pills={localWidget.shelves[shelf.id as keyof typeof localWidget.shelves] || []}
                                        onDrop={(item) => handleDrop(shelf.id as keyof WidgetState['shelves'], item)}
                                        onRemovePill={(index) => handleRemovePill(shelf.id as keyof WidgetState['shelves'], index)}
                                        onUpdatePill={(index, update) => handlePillUpdate(shelf.id as keyof WidgetState['shelves'], index, update)}
                                        onMovePill={(dragIndex, hoverIndex, sourceShelf) => handleMovePill(dragIndex, hoverIndex, sourceShelf as keyof WidgetState['shelves'], shelf.id as keyof WidgetState['shelves'])}
                                        onPillClick={(pill, index) => handlePillClick(shelf.id as keyof WidgetState['shelves'], pill, index)}
                                        onPillContextMenu={(e, pill, index) => {
                                            if (['values', 'values2', 'bubbleSize'].includes(shelf.id)) {
                                                handlePillContextMenu(e, shelf.id as 'values' | 'values2' | 'bubbleSize', pill, index);
                                            }
                                        }}
                                        canDrop={shelf.canDrop}
                                    />
                                ))}
                            </div>
                        )}
                        {activeTab === 'formatting' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Color Palette</label>
                                    <select value={localWidget.colorPalette} onChange={e => handleUpdate({ colorPalette: e.target.value })} className={`${inputClasses} mt-1`}>
                                        {Object.keys(COLOR_PALETTES).map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                </div>
                                {localWidget.displayMode === 'chart' && localWidget.chartType !== ChartType.KPI && (
                                    <>
                                        <h4 className="text-base font-semibold text-foreground pt-4 border-t border-border">Chart Formatting</h4>
                                        <div className="space-y-4">
                                            <ToggleSwitch 
                                                label="Show Legend" 
                                                enabled={localWidget.chartSettings?.showLegend !== false} 
                                                onChange={val => handleUpdate(w => ({ ...w, chartSettings: { ...w.chartSettings, showLegend: val } }))} 
                                            />
                                            {localWidget.chartSettings?.showLegend !== false && (
                                                <div>
                                                    <label className={labelClasses}>Legend Position</label>
                                                    <select 
                                                        value={localWidget.chartSettings?.legendPosition || 'bottom'} 
                                                        onChange={e => handleUpdate(w => ({ ...w, chartSettings: { ...w.chartSettings, legendPosition: e.target.value as any } }))} 
                                                        className={`${inputClasses} mt-1`}
                                                    >
                                                        <option value="top">Top</option>
                                                        <option value="bottom">Bottom</option>
                                                        <option value="left">Left</option>
                                                        <option value="right">Right</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                {localWidget.displayMode === 'table' && (
                                    <>
                                        <h4 className="text-base font-semibold text-foreground pt-4 border-t border-border">Table Formatting</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className={labelClasses}>Table Theme</label>
                                                <select value={localWidget.tableSettings?.theme || 'default'} onChange={e => handleTableSettingsUpdate({ theme: e.target.value as any })} className={`${inputClasses} mt-1`}>
                                                    <option value="default">Default</option>
                                                    <option value="minimal">Minimal</option>
                                                    <option value="modern">Modern</option>
                                                    <option value="bold-header">Bold Header</option>
                                                </select>
                                            </div>
                                            <ToggleSwitch label="Striped Rows" enabled={localWidget.tableSettings?.striped !== false} onChange={val => handleTableSettingsUpdate({ striped: val })} />
                                            <ToggleSwitch label="Show Grid Lines" enabled={localWidget.tableSettings?.showGrid !== false} onChange={val => handleTableSettingsUpdate({ showGrid: val })} />
                                            <ToggleSwitch 
                                                label={
                                                    <div className="flex items-center gap-2">
                                                        Arrange Measures Vertically
                                                        <HelpIcon helpText="When enabled, measures become top-level headers. When disabled, dimensions are top-level headers." />
                                                    </div>
                                                }
                                                enabled={localWidget.tableSettings?.pivotMeasureLayout === 'vertical'} 
                                                onChange={val => handleTableSettingsUpdate({ pivotMeasureLayout: val ? 'vertical' : 'horizontal' })} 
                                            />
                                        </div>
                                        <h4 className="text-base font-semibold text-foreground pt-4 border-t border-border">Advanced Formatting</h4>
                                         <div className="space-y-4">
                                            <div><label className={labelClasses}>Header Background</label><ColorPicker color={localWidget.tableSettings?.headerBackgroundColor} onChange={c => handleTableSettingsUpdate({ headerBackgroundColor: c })} /></div>
                                            <div><label className={labelClasses}>Header Font Color</label><ColorPicker color={localWidget.tableSettings?.headerFontColor} onChange={c => handleTableSettingsUpdate({ headerFontColor: c })} /></div>
                                            <div><label className={labelClasses}>Header Border Color</label><ColorPicker color={localWidget.tableSettings?.headerBorderColor} onChange={c => handleTableSettingsUpdate({ headerBorderColor: c })} /></div>
                                            <div><label className={labelClasses}>Grid Color</label><ColorPicker color={localWidget.tableSettings?.gridColor} onChange={c => handleTableSettingsUpdate({ gridColor: c })} /></div>
                                            <div>
                                                <label className={labelClasses}>Header Font Size ({localWidget.tableSettings?.headerFontSize || 12}px)</label>
                                                <Slider min={10} max={20} step={1} value={localWidget.tableSettings?.headerFontSize || 12} onChange={v => handleTableSettingsUpdate({ headerFontSize: v as number })} />
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Grid Style</label>
                                                 <select value={localWidget.tableSettings?.gridStyle || 'solid'} onChange={e => handleTableSettingsUpdate({ gridStyle: e.target.value as any })} className={`${inputClasses} mt-1`}>
                                                    <option value="solid">Solid</option>
                                                    <option value="dashed">Dashed</option>
                                                    <option value="dotted">Dotted</option>
                                                </select>
                                            </div>
                                         </div>
                                    </>
                                )}
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="space-y-4">
                                <ToggleSwitch label="Enable Cross-Filtering" enabled={!!localWidget.isCrossFilterSource} onChange={val => handleUpdate({ isCrossFilterSource: val })} />
                                
                                { [ChartType.BAR, ChartType.LINE, ChartType.AREA].includes(localWidget.chartType) && (
                                    <>
                                        <h4 className="text-base font-semibold text-foreground pt-4 border-t border-border">Chart Settings</h4>
                                        <ToggleSwitch 
                                            label={
                                                <div className="flex items-center gap-2">
                                                    Stack Series
                                                    <HelpIcon helpText="When enabled, series are stacked on top of each other. Useful for part-to-whole analysis." />
                                                </div>
                                            }
                                            enabled={localWidget.isStacked ?? localWidget.chartType === ChartType.AREA}
                                            onChange={val => handleUpdate({ isStacked: val })}
                                        />
                                    </>
                                )}

                                <h4 className="text-base font-semibold text-foreground pt-4 border-t border-border">Subtotals</h4>
                                <ToggleSwitch label="Row Subtotals" enabled={!!localWidget.subtotalSettings.rows} onChange={val => handleUpdate(w => ({...w, subtotalSettings: {...w.subtotalSettings, rows: val}}))} />
                                <ToggleSwitch label="Column Totals" enabled={!!localWidget.subtotalSettings.columns} onChange={val => handleUpdate(w => ({...w, subtotalSettings: {...w.subtotalSettings, columns: val}}))} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
