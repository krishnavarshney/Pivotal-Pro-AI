

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import _ from 'lodash';
import Slider from 'rc-slider';
import { useDashboard } from '../../contexts/DashboardProvider';
// FIX: Imported 'ChartType' to resolve 'Cannot find name' error.
import { WidgetState, FieldType, WhatIfResult, ChartType } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { inputClasses, labelClasses, cn } from '../ui/utils';
import { Brain, CheckCircle, Target, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { formatValue } from '../../utils/dataProcessing/formatting';
import * as aiService from '../../services/aiService';
import { notificationService } from '../../services/notificationService';
import { motion, AnimatePresence } from 'framer-motion';
import { EChartsComponent } from '../charts/EChartsComponent';
import { WidgetSkeleton } from '../ui/WidgetSkeleton';

const MotionDiv = motion.div;

interface ModifiedVariable {
    name: string;
    simpleName: string;
    type: FieldType;
    baselineValue: number;
    multiplier: number; // 1.0 is no change, 1.1 is +10%
}

const WhatIfResultDisplay: React.FC<{ result: WhatIfResult; baseline: number }> = ({ result, baseline }) => {
    const sensitivityData = result.sensitivityAnalysis
        .map(item => ({
            ...item,
            fill: item.impact > 0 ? 'var(--color-positive)' : 'var(--color-negative)',
        }))
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    const maxImpact = Math.max(...sensitivityData.map(d => Math.abs(d.impact)), 0);

    const change = result.predictedValue - baseline;
    const percentChange = baseline !== 0 ? (change / Math.abs(baseline)) * 100 : 0;
    const isPositive = change >= 0;

    return (
        <div
            className="space-y-6"
            style={{
                '--color-positive': 'hsl(142 76% 46%)',
                '--color-negative': 'hsl(0 84% 60%)',
            } as React.CSSProperties}
        >
            <div className="text-center p-6 bg-secondary/50 rounded-xl border border-border">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Predicted Outcome</h4>
                <p className="text-6xl font-bold font-display text-primary my-2 tracking-tighter">
                    {formatValue(result.predictedValue)}
                </p>
                <div className={cn("mt-2 text-lg font-semibold flex items-center justify-center gap-2", isPositive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]')}>
                    {isPositive ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                    <span>{formatValue(change)}</span>
                    <span>({formatValue(percentChange, { decimalPlaces: 1, suffix: '%' })})</span>
                </div>
                <p className="text-muted-foreground text-xs mt-2">
                    95% confidence interval: {formatValue(result.confidenceInterval[0])} to {formatValue(result.confidenceInterval[1])}
                </p>
            </div>

            <div>
                <h4 className="font-bold text-lg text-foreground mb-3 font-display">Key Drivers of Change</h4>
                <div className="bg-card rounded-xl border p-4 h-64">
                     <EChartsComponent
                        widget={{ chartType: ChartType.BAR, shelves: {}, isStacked: true } as any}
                        data={{
                            type: 'chart',
                            labels: sensitivityData.map(d => d.variable),
                            datasets: [
                                { label: 'Positive Impact', data: sensitivityData.map(d => d.impact > 0 ? d.impact : 0) },
                                { label: 'Negative Impact', data: sensitivityData.map(d => d.impact < 0 ? d.impact : 0) }
                            ],
                            // FIX: Added chartType to the data object.
                            chartType: ChartType.BAR
                        } as any}
                        onElementClick={() => {}}
                        onElementContextMenu={() => {}}
                    />
                </div>
            </div>
        </div>
    );
};


export const WhatIfAnalysisModal: React.FC<{ isOpen: boolean; onClose: () => void; widgetId: string | null }> = ({ isOpen, onClose, widgetId }) => {
    const { activePage, blendedData, aiConfig } = useDashboard();
    
    const widget = useMemo(() => activePage?.widgets.find(w => w.id === widgetId), [activePage, widgetId]);
    
    const [targetMetric, setTargetMetric] = useState<string>('');
    const [modifiedVariables, setModifiedVariables] = useState<ModifiedVariable[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<WhatIfResult | null>(null);

    const availableMetrics = useMemo(() => widget?.shelves.values.filter(p => p.type === FieldType.MEASURE) || [], [widget]);
    
    const allPillsInWidget = useMemo(() => {
        if (!widget) return [];
        return _.uniqBy([...widget.shelves.columns, ...widget.shelves.rows, ...widget.shelves.values], 'name');
    }, [widget]);

    const availableVariables = useMemo(() => {
        return allPillsInWidget.filter(p => p.type === FieldType.MEASURE && p.name !== targetMetric);
    }, [allPillsInWidget, targetMetric]);

    const baselineValue = useMemo(() => {
        if (!targetMetric) return 0;
        const values = blendedData.map(row => row[targetMetric]).filter(v => typeof v === 'number');
        return _.mean(values) || 0;
    }, [blendedData, targetMetric]);
    
    useEffect(() => {
        if (widget) {
            const initialTarget = availableMetrics[0]?.name || '';
            setTargetMetric(initialTarget);
            
            const initialVariables = allPillsInWidget
                .filter(p => p.type === FieldType.MEASURE && p.name !== initialTarget)
                .slice(0, 3) // Start with up to 3 variables
                .map(pill => {
                    const values = blendedData.map(row => row[pill.name]).filter(v => typeof v === 'number');
                    return {
                        name: pill.name,
                        simpleName: pill.simpleName,
                        type: pill.type,
                        baselineValue: _.mean(values) || 0,
                        multiplier: 1.0
                    };
                });
            setModifiedVariables(initialVariables);
        } else {
            setTargetMetric('');
            setModifiedVariables([]);
        }
    }, [widget, availableMetrics]);

    const runSimulation = useCallback(_.debounce(async (currentTarget: string, currentVars: ModifiedVariable[]) => {
        if (!widget || !currentTarget || currentVars.length === 0 || !aiConfig) return;
        setIsLoading(true);
        try {
            const scenarioConfig = {
                targetMetric: currentTarget,
                modifiedVariables: Object.fromEntries(currentVars.map(v => [v.name, v.multiplier]))
            };
            // FIX: Added 'chartType' property to the data object to satisfy type requirements.
            const whatIfResult = await aiService.getAiWhatIfAnalysis(aiConfig, widget, {type: 'chart', labels: [], datasets: [], chartType: widget.chartType}, scenarioConfig);
            setResult(whatIfResult);
        } catch (e) {
            notificationService.error(`Simulation failed: ${(e as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }, 500), [widget, aiConfig]);

    useEffect(() => {
        runSimulation(targetMetric, modifiedVariables);
    }, [targetMetric, modifiedVariables, runSimulation]);

    if (!isOpen || !widget) return null;
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent containerClassName="w-[95%] max-w-4xl" className="h-[80vh] flex flex-col p-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Brain size={20}/>"What-If" Scenario Builder</DialogTitle>
                    <DialogDescription>Simulate how changes to input variables might affect a key metric for '{widget.title}'.</DialogDescription>
                </DialogHeader>

                <main className="flex-grow grid grid-cols-1 md:grid-cols-[1fr,2fr] min-h-0">
                    {/* Controls Panel */}
                    <aside className="p-4 border-r border-border flex flex-col gap-6 overflow-y-auto">
                        <div>
                            <label className={cn(labelClasses, "flex items-center gap-2 mb-2")}><Target size={16}/> Target Metric</label>
                            <select value={targetMetric} onChange={e => setTargetMetric(e.target.value)} className={inputClasses}>
                                {availableMetrics.map(p => <option key={p.id} value={p.name}>{p.simpleName}</option>)}
                            </select>
                        </div>

                        <div className="space-y-6">
                             <label className={cn(labelClasses, "flex items-center gap-2")}><SlidersHorizontal size={16}/> Input Variables</label>
                            {modifiedVariables.map(variable => (
                                <div key={variable.name}>
                                    <div className="flex justify-between items-baseline mb-1">
                                         <label className="font-medium text-sm text-foreground">{variable.simpleName}</label>
                                         <span className="font-mono text-sm text-primary font-semibold">
                                            {((variable.multiplier - 1) * 100) >= 0 ? '+' : ''}{((variable.multiplier - 1) * 100).toFixed(0)}%
                                         </span>
                                    </div>
                                    <Slider
                                        min={0.5} max={1.5} step={0.01}
                                        value={variable.multiplier}
                                        onChange={(val) => setModifiedVariables(vars => vars.map(v => v.name === variable.name ? {...v, multiplier: val as number} : v))}
                                    />
                                     <div className="text-xs text-muted-foreground text-right mt-1">
                                        {`Avg: ${formatValue(variable.baselineValue, {decimalPlaces: 2})} → ${formatValue(variable.baselineValue * variable.multiplier, {decimalPlaces: 2})}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Results Panel */}
                    <section className="p-6 bg-secondary/30 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <MotionDiv key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                                    <WidgetSkeleton chartType={ChartType.KPI}/>
                                </MotionDiv>
                            ) : result ? (
                                <MotionDiv key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <WhatIfResultDisplay result={result} baseline={baselineValue} />
                                </MotionDiv>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                                    <p>Adjust variables to see the simulation results.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </section>
                </main>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};
