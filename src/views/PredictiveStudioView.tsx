import React, { useState, useMemo, useEffect } from 'react';
import _ from 'lodash';
import { useDashboard } from '../contexts/DashboardProvider';
import { Field, FieldType, PredictiveModelResult, PredictiveModelType } from '../utils/types';
import { ViewHeader } from '../components/common/ViewHeader';
import { Button, Card, CardContent, CardHeader, CardTitle, cn, FormattedInsight, inputClasses, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { Brain, CheckCircle, Info, Sparkle, Target, ListNumbers, NumberSquareOne, ChartBar, SlidersHorizontal, ArrowRight, ClockCounterClockwise } from 'phosphor-react';
import * as aiService from '../services/aiService';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import Slider from 'rc-slider';
import { formatValue } from '../utils/dataUtils';
import { motion, AnimatePresence, animate } from 'framer-motion';

const Step: React.FC<{ step: number; title: string; children: React.ReactNode; isComplete: boolean }> = ({ step, title, children, isComplete }) => (
    <div className="relative pl-8">
        <div className="absolute left-0 top-0 flex items-center">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm", isComplete ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                {isComplete ? <CheckCircle size={16} weight="fill" /> : step}
            </div>
        </div>
        <div className={cn("ml-4", !isComplete && "opacity-50")}>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <div className="mt-2">{children}</div>
        </div>
    </div>
);

const ModelHistoryPanel: React.FC<{
    models: PredictiveModelResult[];
    selectedModelId: string | null;
    onSelectModel: (id: string) => void;
}> = ({ models, selectedModelId, onSelectModel }) => (
    <aside className="w-full lg:w-80 flex-shrink-0 bg-background/50 border-l border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
            <ClockCounterClockwise size={18} />
            <h3 className="font-semibold">Session History</h3>
        </div>
        <div className="flex-grow overflow-y-auto p-2 space-y-2">
            {models.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground p-4">No models run in this session yet.</p>
            ) : (
                models.map(model => (
                    <button key={model.id} onClick={() => onSelectModel(model.id)} className={cn(
                        "w-full text-left p-3 rounded-lg border-2 transition-all",
                        selectedModelId === model.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent'
                    )}>
                        <p className="font-semibold truncate">{model.summary.modelType.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground truncate">Target: {model.summary.targetVariable}</p>
                    </button>
                ))
            )}
        </div>
    </aside>
);

const ModelResultsView: React.FC<{ model: PredictiveModelResult }> = ({ model }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const MotionDiv = motion.div as any;

    const TabButton: React.FC<{ tabId: string; children: React.ReactNode }> = ({ tabId, children }) => (
        <button onClick={() => setActiveTab(tabId)} className={cn("flex-1 flex justify-center items-center gap-2 p-3 font-semibold text-sm transition-colors relative", activeTab === tabId ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
            {children}
            {activeTab === tabId && <MotionDiv className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="model-tab-underline" />}
        </button>
    );
    
    return (
        <MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <h2 className="text-3xl font-bold font-display text-foreground">{model.summary.modelType.replace('_', ' ')} Results</h2>
            <p className="text-muted-foreground mt-1">Target: <span className="font-semibold text-primary">{model.summary.targetVariable}</span></p>

            <div className="mt-6 border-b border-border flex">
                <TabButton tabId="summary"><Info size={16}/> AI Summary</TabButton>
                <TabButton tabId="performance"><Target size={16}/> Performance</TabButton>
                <TabButton tabId="importance"><ListNumbers size={16}/> Feature Importance</TabButton>
                <TabButton tabId="coefficients"><NumberSquareOne size={16}/> Coefficients</TabButton>
                <TabButton tabId="simulator"><SlidersHorizontal size={16}/> Simulator</TabButton>
            </div>

             <div className="mt-6">
                <AnimatePresence mode="wait">
                    <MotionDiv key={activeTab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        {activeTab === 'summary' && <FormattedInsight text={model.summary.aiSummary} />}
                        {activeTab === 'performance' && <PerformanceView metrics={model.performanceMetrics} />}
                        {activeTab === 'importance' && <FeatureImportanceView importance={model.featureImportance} />}
                        {activeTab === 'coefficients' && <CoefficientsView coefficients={model.coefficients} />}
                        {activeTab === 'simulator' && <SimulatorView formula={model.summary.formula} coefficients={model.coefficients} />}
                    </MotionDiv>
                </AnimatePresence>
            </div>
        </MotionDiv>
    );
}

const PerformanceView: React.FC<{ metrics: PredictiveModelResult['performanceMetrics'] }> = ({ metrics }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map(metric => (
            <Card key={metric.name}>
                <CardHeader>
                    <CardTitle className="text-base">{metric.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold font-display text-primary">{formatValue(metric.value, { decimalPlaces: 3 })}</p>
                    <p className="text-xs text-muted-foreground mt-2">{metric.interpretation}</p>
                </CardContent>
            </Card>
        ))}
    </div>
);

const FeatureImportanceView: React.FC<{ importance: PredictiveModelResult['featureImportance'] }> = ({ importance }) => {
    const sortedImportance = useMemo(() => _.orderBy(importance, 'importance', 'desc'), [importance]);
    return (
        <Card>
            <CardHeader><CardTitle>Feature Importance</CardTitle></CardHeader>
            <CardContent>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={sortedImportance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                             <XAxis type="number" domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                             <YAxis type="category" dataKey="feature" width={120} />
                             <RechartsTooltip formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`} />
                             <Bar dataKey="importance" fill="hsl(var(--primary))" barSize={20} />
                         </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

const CoefficientsView: React.FC<{ coefficients: PredictiveModelResult['coefficients'] }> = ({ coefficients }) => (
    <Card>
        <CardHeader><CardTitle>Model Coefficients</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="text-right">Coefficient</TableHead>
                        <TableHead className="text-right">Std. Error</TableHead>
                        <TableHead className="text-right">P-value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {coefficients.map(c => (
                        <TableRow key={c.feature}>
                            <TableCell className="font-medium">{c.feature}</TableCell>
                            <TableCell className="text-right font-mono">{formatValue(c.coefficient, { decimalPlaces: 4 })}</TableCell>
                            <TableCell className="text-right font-mono">{formatValue(c.stdError, { decimalPlaces: 4 })}</TableCell>
                            <TableCell className="text-right font-mono">{c.pValue < 0.001 ? "< 0.001" : formatValue(c.pValue, { decimalPlaces: 3 })}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const SimulatorView: React.FC<{ formula: string; coefficients: PredictiveModelResult['coefficients'] }> = ({ formula, coefficients }) => {
    const { blendedData } = useDashboard();
    
    const features = useMemo(() => {
        return coefficients
            .filter(c => c.feature !== '(Intercept)')
            .map(c => {
                const values = blendedData.map(row => row[c.feature]).filter(v => typeof v === 'number');
                return {
                    name: c.feature,
                    min: _.min(values) ?? 0,
                    max: _.max(values) ?? 100,
                    avg: _.mean(values) ?? 50
                };
            });
    }, [coefficients, blendedData]);

    const [simValues, setSimValues] = useState<Record<string, number>>(() => 
        Object.fromEntries(features.map(f => [f.name, f.avg]))
    );

    const prediction = useMemo(() => {
        let result = coefficients.find(c => c.feature === '(Intercept)')?.coefficient ?? 0;
        for (const feature of features) {
            const coeff = coefficients.find(c => c.feature === feature.name)?.coefficient ?? 0;
            result += (simValues[feature.name] * coeff);
        }
        return result;
    }, [simValues, coefficients, features]);
    
    const handleSliderChange = (name: string, value: number | number[]) => {
        setSimValues(prev => ({...prev, [name]: Array.isArray(value) ? value[0] : value}));
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col items-center justify-center bg-card p-6 rounded-xl border">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Predicted Value</h4>
                <p className="text-6xl font-bold font-display text-primary my-2 tracking-tighter">
                    {formatValue(prediction, { decimalPlaces: 2 })}
                </p>
            </div>
            <div className="md:col-span-2 bg-card p-6 rounded-xl border space-y-4">
                 <h4 className="font-semibold text-foreground">Adjust Feature Values</h4>
                 <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
                    {features.map(f => (
                        <div key={f.name}>
                             <div className="flex justify-between items-baseline mb-1">
                                <label className="font-medium text-sm text-foreground">{f.name}</label>
                                <span className="font-mono text-sm text-primary font-semibold">{formatValue(simValues[f.name], { decimalPlaces: 2 })}</span>
                            </div>
                            <Slider min={f.min} max={f.max} value={simValues[f.name]} onChange={v => handleSliderChange(f.name, v)} step={(f.max - f.min) / 100} />
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export const PredictiveStudioView: React.FC = () => {
    const { blendedFields, blendedData, aiConfig, showToast, addPredictiveModel, predictiveModels } = useDashboard();
    const [modelType, setModelType] = useState<PredictiveModelType>('LINEAR_REGRESSION');
    const [target, setTarget] = useState<string>('');
    const [features, setFeatures] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<PredictiveModelResult | null>(null);

    const numericFields = useMemo(() => blendedFields.measures, [blendedFields]);
    const allFields = useMemo(() => [...blendedFields.dimensions, ...blendedFields.measures], [blendedFields]);
    const availableFeatures = useMemo(() => allFields.filter(f => f.name !== target), [allFields, target]);

    useEffect(() => {
        if (numericFields.length > 0 && !target) {
            setTarget(numericFields[0].name);
        }
    }, [numericFields, target]);
    
    useEffect(() => {
        if(predictiveModels.length > 0 && !selectedModel) {
            setSelectedModel(predictiveModels[predictiveModels.length - 1]);
        }
    }, [predictiveModels, selectedModel]);

    const handleRunAnalysis = async () => {
        if (!target || features.size === 0 || !aiConfig) return;
        setIsLoading(true);
        try {
            const targetField = numericFields.find(f => f.name === target);
            const featureFields = availableFeatures.filter(f => features.has(f.name));
            if (!targetField || featureFields.length === 0) throw new Error("Invalid field selection.");

            const result = await aiService.runPredictiveModel(aiConfig, modelType, targetField, featureFields, blendedData);
            addPredictiveModel(result);
            setSelectedModel(result);
        } catch (error) {
            showToast({ message: `Model run failed: ${(error as Error).message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const toggleFeature = (fieldName: string) => {
        setFeatures(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fieldName)) newSet.delete(fieldName);
            else newSet.add(fieldName);
            return newSet;
        });
    };

    return (
        <div className="h-full flex flex-col bg-secondary/30">
            <ViewHeader icon={<Brain size={24}/>} title="Predictive Studio" />
            <div className="flex-grow flex flex-col lg:flex-row min-h-0">
                {/* Configuration Panel */}
                <aside className="w-full lg:w-[400px] flex-shrink-0 bg-background/80 border-r border-border p-6 overflow-y-auto space-y-6">
                    <Step step={1} title="Choose Your Objective" isComplete={!!modelType}>
                         <select value={modelType} onChange={e => setModelType(e.target.value as PredictiveModelType)} className={inputClasses}>
                            <option value="LINEAR_REGRESSION">Linear Regression (Predict a Number)</option>
                         </select>
                    </Step>
                    <Step step={2} title="Select Target Variable" isComplete={!!target}>
                         <select value={target} onChange={e => setTarget(e.target.value)} className={inputClasses}>
                            {numericFields.map(f => <option key={f.name} value={f.name}>{f.simpleName}</option>)}
                         </select>
                    </Step>
                     <Step step={3} title="Select Feature Variables" isComplete={features.size > 0}>
                         <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2 bg-secondary/50">
                            {availableFeatures.map(f => (
                                <button key={f.name} onClick={() => toggleFeature(f.name)} className={cn("w-full text-left p-2 flex items-center gap-2 rounded-md text-sm", features.has(f.name) ? 'bg-primary/10 text-primary' : 'hover:bg-accent')}>
                                    <div className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center bg-card">{features.has(f.name) && <CheckCircle size={12} weight="fill" className="text-primary"/>}</div>
                                    <span>{f.simpleName}</span>
                                </button>
                            ))}
                         </div>
                    </Step>
                     <Button onClick={handleRunAnalysis} disabled={!target || features.size === 0 || isLoading} className="w-full text-lg h-12">
                        {isLoading ? <Sparkle className="animate-pulse" /> : <Sparkle />}
                        {isLoading ? 'Building Model...' : 'Run Analysis'}
                    </Button>
                </aside>

                {/* Results Panel */}
                <main className="flex-grow p-6 overflow-y-auto">
                    <AnimatePresence mode="wait">
                    {selectedModel ? (
                        <ModelResultsView key={selectedModel.id} model={selectedModel} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-center">
                            <div>
                                <Brain size={64} weight="light" className="mx-auto text-muted-foreground" />
                                <h2 className="mt-4 text-2xl font-bold font-display text-foreground">Predictive Modeling Studio</h2>
                                <p className="mt-2 max-w-md mx-auto text-muted-foreground">Configure your analysis on the left to build a model and see the results here.</p>
                            </div>
                        </div>
                    )}
                    </AnimatePresence>
                </main>
                
                {/* History Panel */}
                <ModelHistoryPanel models={predictiveModels} selectedModelId={selectedModel?.id || null} onSelectModel={(id) => setSelectedModel(predictiveModels.find(m => m.id === id) || null)} />
            </div>
        </div>
    );
};
