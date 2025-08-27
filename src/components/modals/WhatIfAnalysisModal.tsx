import React, { useState, useMemo, useEffect } from 'react';
import _ from 'lodash';
import Slider from 'rc-slider';
import { useDashboard } from '../../contexts/DashboardProvider';
import { WidgetState, FieldType, Field, Pill } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { inputClasses, labelClasses, cn } from '../ui/utils';
import { PuzzlePiece, CheckCircle, Target, Sliders, Hash, TextT } from 'phosphor-react';
import { formatValue } from '../../utils/dataProcessing/formatting';

interface ModifiedVariable {
    name: string;
    simpleName: string;
    type: FieldType;
    originalValue: number;
    percentageChange: number;
}

export const WhatIfAnalysisModal: React.FC<{ isOpen: boolean; onClose: () => void; widgetId: string | null }> = ({ isOpen, onClose, widgetId }) => {
    const { activePage, runWhatIfAnalysis, blendedData } = useDashboard();
    
    const widget = useMemo(() => activePage?.widgets.find(w => w.id === widgetId), [activePage, widgetId]);
    
    const [targetMetric, setTargetMetric] = useState<string>('');
    const [modifiedVariables, setModifiedVariables] = useState<ModifiedVariable[]>([]);

    const availableMetrics = useMemo(() => widget?.shelves.values.filter(p => p.type === FieldType.MEASURE) || [], [widget]);
    const availableVariables = useMemo(() => {
        if (!widget) return [];
        const allPills = [...widget.shelves.columns, ...widget.shelves.rows, ...widget.shelves.values];
        return _.uniqBy(allPills, 'name').filter(p => p.type === FieldType.MEASURE && p.name !== targetMetric);
    }, [widget, targetMetric]);
    
    useEffect(() => {
        if (widget) {
            setTargetMetric(availableMetrics[0]?.name || '');
        } else {
            setTargetMetric('');
            setModifiedVariables([]);
        }
    }, [widget, availableMetrics]);

    const toggleVariable = (pill: Pill) => {
        const isSelected = modifiedVariables.some(v => v.name === pill.name);
        if (isSelected) {
            setModifiedVariables(vars => vars.filter(v => v.name !== pill.name));
        } else {
            // In a real scenario, you'd calculate the baseline average from data. Here we use a placeholder.
            const baselineValue = _.mean(blendedData.map(row => row[pill.name]).filter(v => typeof v === 'number'));
            setModifiedVariables(vars => [...vars, { 
                name: pill.name, 
                simpleName: pill.simpleName,
                type: pill.type,
                originalValue: baselineValue || 0,
                percentageChange: 0 
            }]);
        }
    };
    
    const handleRun = () => {
        if (!widgetId || !targetMetric) return;
        const scenarioConfig = {
            targetMetric,
            modifiedVariables: Object.fromEntries(modifiedVariables.map(v => [v.name, 1 + v.percentageChange / 100]))
        };
        runWhatIfAnalysis(widgetId, scenarioConfig);
        onClose();
    };

    if (!isOpen || !widget) return null;
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><PuzzlePiece size={20}/>"What-If" Scenario Builder</DialogTitle>
                    <DialogDescription>Simulate how changes to input variables might affect a key metric.</DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="p-4 bg-secondary rounded-lg border">
                        <label className={cn(labelClasses, "flex items-center gap-2 mb-2")}><Target size={16}/> Select Target Metric</label>
                        <select value={targetMetric} onChange={e => setTargetMetric(e.target.value)} className={inputClasses}>
                            {availableMetrics.map(p => <option key={p.id} value={p.name}>{p.simpleName}</option>)}
                        </select>
                    </div>

                    <div className="p-4 bg-secondary rounded-lg border">
                        <label className={cn(labelClasses, "flex items-center gap-2 mb-2")}><Sliders size={16}/> Adjust Input Variables</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {availableVariables.map(pill => (
                                <button key={pill.id} onClick={() => toggleVariable(pill)} className={cn("p-2 rounded-md text-sm text-left flex items-center gap-2 border", modifiedVariables.some(v => v.name === pill.name) ? "bg-primary/10 border-primary" : "bg-background hover:bg-accent")}>
                                    <div className="w-4 h-4 rounded border flex items-center justify-center bg-card">{modifiedVariables.some(v => v.name === pill.name) && <CheckCircle size={12} weight="fill" className="text-primary"/>}</div>
                                    <span>{pill.simpleName}</span>
                                </button>
                            ))}
                        </div>
                        <div className="space-y-6">
                        {modifiedVariables.map(variable => (
                            <div key={variable.name}>
                                <div className="flex justify-between items-baseline mb-1">
                                     <label className="font-medium text-sm text-foreground">{variable.simpleName}</label>
                                     <span className="font-mono text-sm text-primary font-semibold">{variable.percentageChange >= 0 ? '+' : ''}{variable.percentageChange}%</span>
                                </div>
                                <Slider
                                    min={-50} max={50} step={1}
                                    value={variable.percentageChange}
                                    onChange={(val) => setModifiedVariables(vars => vars.map(v => v.name === variable.name ? {...v, percentageChange: val as number} : v))}
                                />
                                 <div className="text-xs text-muted-foreground text-right mt-1">
                                    {`Avg: ${formatValue(variable.originalValue, {decimalPlaces: 2})} → ${formatValue(variable.originalValue * (1 + variable.percentageChange / 100), {decimalPlaces: 2})}`}
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleRun} disabled={!targetMetric || modifiedVariables.length === 0}>Run Simulation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};