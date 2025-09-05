import React, { useState, useMemo, useEffect, FC, ReactNode } from 'react';
import _ from 'lodash';
import { useDashboard } from '../contexts/DashboardProvider';
import { notificationService } from '../services/notificationService';
import { Field, FieldType, PredictiveModelResult, PredictiveModelType, ChartType } from '../utils/types';
import { ViewHeader } from '../components/common/ViewHeader';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { cn, inputClasses } from '../components/ui/utils';
import { FormattedInsight } from '../components/ui/FormattedInsight';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Brain, Info, Sparkle, Target, SlidersHorizontal, ListChecks, LineChart, BarChart as BarChartIcon, CheckCircle, History, TrendingUp, ToggleLeft, Users, Clock } from 'lucide-react';
import { ListNumbers } from 'phosphor-react';
import * as aiService from '../services/aiService';
import { EChartsComponent } from '../components/charts/EChartsComponent';
import Slider from 'rc-slider';
import { formatValue } from '../utils/dataProcessing/formatting';
import { motion, AnimatePresence, animate } from 'framer-motion';

const MotionDiv = motion.div as any;

const Step: FC<{ step: number; title: string; children: React.ReactNode; isComplete: boolean; isEnabled: boolean; }> = ({ step, title, children, isComplete, isEnabled }) => (
    <div className={cn("relative pl-10 transition-opacity", !isEnabled && "opacity-50 pointer-events-none")}>
        <div className={cn("absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-2", isComplete ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border text-secondary-foreground")}>
            {isComplete ? <CheckCircle size={20} className="text-white"/> : step}
        </div>
        <div className="pl-4 pt-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <div className="mt-2 text-sm">{children}</div>
        </div>
        <div className={cn("absolute left-4 top-8 h-full border-l-2 border-dashed", isComplete ? "border-primary" : "border-border")} />
    </div>
);

const ModelTypeCard: FC<{
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    isSelected: boolean;
    isDisabled: boolean;
}> = ({ icon, title, description, onClick, isSelected, isDisabled }) => (
    <button
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
            "w-full p-4 flex items-start gap-4 rounded-xl border-2 text-left transition-all",
            isDisabled ? "bg-secondary/50 opacity-50 cursor-not-allowed" : "bg-card hover:border-primary/50",
            isSelected ? "border-primary bg-primary/10" : "border-border"
        )}
    >
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", isSelected ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground")}>
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
    </button>
);

const ModelHistoryPanel: FC<{
    models: PredictiveModelResult[];
    selectedModelId: string | null;
    onSelectModel: (id: string) => void;
}> = ({ models, selectedModelId, onSelectModel }) => (
    <aside className="w-full lg:w-72 flex-shrink-0 bg-background/50 border-l border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
            <History size={18} />
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
                        <p className="font-semibold text-sm truncate">{model.summary.modelType}</p>
                        <p className="text-xs text-muted-foreground truncate">Target: {model.summary.targetVariable}</p>
                        <p className="text-xs text-muted-foreground truncate">{new Date(model.timestamp).toLocaleString()}</p>
                    </button>
                ))
            )}
        </div>
    </aside>
);

const Simulator: FC<{ model: PredictiveModelResult }> = ({ model }) => {
    const { blendedData } = useDashboard();
    const [simulatedValues, setSimulatedValues] = useState<Record<string, number>>({});

    const featureRanges = useMemo(() => {
        const ranges: Record<string, { min: number, max: number }> = {};
        model.summary.featureVariables.forEach(featureName => {
            const values = blendedData.map(row => row[featureName]).filter(v => typeof v === 'number');
            if (values.length > 0) {
                ranges[featureName] = { min: _.min(values) || 0, max: _.max(values) || 100 };
            }
        });
        return ranges;
    }, [model, blendedData]);

    useEffect(() => {
        const initialValues: Record<string, number> = {};
        model.summary.featureVariables.forEach(featureName => {
            const range = featureRanges[featureName];
            if (range) {
                initialValues[featureName] = (range.min + range.max) / 2;
            }
        });
        setSimulatedValues(initialValues);
    }, [model, featureRanges]);
    
    const predictedValue = useMemo(() => {
        const intercept = model.coefficients.find(c => c.feature === '(Intercept)')?.coefficient || 0;
        const featureSum = model.summary.featureVariables.reduce((sum, featureName) => {
            const coeff = model.coefficients.find(c => c.feature === featureName)?.coefficient || 0;
            const value = simulatedValues[featureName] || 0;
            return sum + (coeff * value);
        }, 0);
        return intercept + featureSum;
    }, [model, simulatedValues]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            <div className="space-y-6">
                <h3 className="text-lg font-bold">Adjust Feature Variables</h3>
                {model.summary.featureVariables.map(featureName => (
                    <div key={featureName}>
                        <div className="flex justify-between items-baseline mb-1">
                            <label className="font-medium text-sm text-foreground">{featureName}</label>
                            <span className="font-mono text-sm text-primary font-semibold">{formatValue(simulatedValues[featureName], {decimalPlaces: 2})}</span>
                        </div>
                        <Slider
                            min={featureRanges[featureName]?.min || 0}
                            max={featureRanges[featureName]?.max || 100}
                            value={simulatedValues[featureName] || 0}
                            onChange={(val) => setSimulatedValues(v => ({...v, [featureName]: val as number}))}
                            step={(featureRanges[featureName]?.max - featureRanges[featureName]?.min) / 100}
                        />
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-center">
                 <div className="text-center p-6 bg-secondary rounded-xl border border-border w-full">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Predicted {model.summary.targetVariable}</h4>
                    <p className="text-6xl font-bold font-display text-primary my-2 tracking-tighter">
                        {formatValue(predictedValue, {decimalPlaces: 2})}
                    </p>
                </div>
            </div>
        </div>
    )
};


const ResultTabs: FC<{ model: PredictiveModelResult, onTabChange: (tab: string) => void }> = ({ model, onTabChange }) => {
    const [activeTab, setActiveTab] = useState('summary');
    
    const tabs = [
        { id: 'summary', label: 'Summary', icon: <Info size={16} /> },
        { id: 'plots', label: 'Performance Plots', icon: <LineChart size={16} /> },
        { id: 'simulator', label: 'Simulator', icon: <SlidersHorizontal size={16} /> }
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'plots': return <PerformancePlots model={model} />;
            case 'simulator': return <Simulator model={model} />;
            case 'summary':
            default: return <Summary model={model} />;
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 border-b border-border flex items-center px-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); onTabChange(tab.id); }}
                        className={cn('flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors relative', activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
                    >
                        {tab.icon} {tab.label}
                        {activeTab === tab.id && <MotionDiv layoutId="predictive-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                ))}
            </div>
            <div className="flex-grow overflow-y-auto bg-secondary/30">
                <AnimatePresence mode="wait">
                    <MotionDiv
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {renderContent()}
                    </MotionDiv>
                </AnimatePresence>
            </div>
        </div>
    )
}

const PerformancePlots: FC<{ model: PredictiveModelResult }> = ({ model }) => {
     const importanceData = _.orderBy(model.featureImportance, ['importance'], ['desc']);
     return (
         <div className="p-6 space-y-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks size={18} /> Feature Importance</CardTitle></CardHeader>
                <CardContent className="h-80">
                    <EChartsComponent 
                        widget={{ chartType: ChartType.BAR, shelves: {}, isStacked: false } as any}
                        data={{ type: 'chart', labels: importanceData.map(d => d.feature), datasets: [{ label: 'Importance', data: importanceData.map(d => d.importance) }] } as any}
                        onElementClick={() => {}}
                        onElementContextMenu={() => {}}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChartIcon size={18} /> Prediction vs. Actuals</CardTitle></CardHeader>
                <CardContent className="h-96">
                    <EChartsComponent 
                        widget={{ chartType: ChartType.SCATTER, shelves: {} } as any}
                        data={{ type: 'chart', labels: [], datasets: [{ label: 'Prediction', data: model.predictionVsActuals.map(p => ({ x: p.actual, y: p.predicted })) }] } as any}
                        onElementClick={() => {}}
                        onElementContextMenu={() => {}}
                    />
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChartIcon size={18} /> Residuals Plot</CardTitle></CardHeader>
                <CardContent className="h-96">
                     <EChartsComponent 
                        widget={{ chartType: ChartType.SCATTER, shelves: {} } as any}
                        data={{ type: 'chart', labels: [], datasets: [{ label: 'Residual', data: model.residuals.map(p => ({ x: p.predicted, y: p.residual })) }] } as any}
                        onElementClick={() => {}}
                        onElementContextMenu={() => {}}
                    />
                </CardContent>
            </Card>
         </div>
     )
}

const Summary: FC<{ model: PredictiveModelResult }> = ({ model }) => (
    <div className="p-6 space-y-6">
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkle size={18} /> AI Summary</CardTitle></CardHeader>
            <CardContent>
                <FormattedInsight text={model.summary.aiSummary} />
                <div className="mt-4 p-3 bg-secondary rounded-lg font-mono text-sm overflow-x-auto">
                    {model.summary.formula}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Info size={18} /> Performance Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {model.performanceMetrics.map(metric => (
                    <div key={metric.name}>
                        <div className="flex justify-between items-baseline">
                            <h4 className="font-semibold">{metric.name}</h4>
                            <p className="font-mono text-lg font-bold text-primary">{formatValue(metric.value, {decimalPlaces: 3})}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{metric.interpretation}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ListNumbers size={18} weight="bold" /> Coefficients</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Feature</TableHead>
                            <TableHead>Coefficient</TableHead>
                            <TableHead>Std. Error</TableHead>
                            <TableHead>P-value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {model.coefficients.map(coef => (
                            <TableRow key={coef.feature}>
                                <TableCell className="font-medium">{coef.feature}</TableCell>
                                <TableCell>{formatValue(coef.coefficient, {decimalPlaces: 4})}</TableCell>
                                <TableCell>{formatValue(coef.stdError, {decimalPlaces: 4})}</TableCell>
                                <TableCell className={cn(coef.pValue < 0.05 && "text-primary font-semibold")}>{formatValue(coef.pValue, {decimalPlaces: 4})}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
)


export const PredictiveStudioView: React.FC = () => {
    const { blendedData, blendedFields, aiConfig, addPredictiveModel, predictiveModels } = useDashboard();
    const [modelType, setModelType] = useState<PredictiveModelType | null>(null);
    const [targetVariable, setTargetVariable] = useState<Field | null>(null);
    const [featureVariables, setFeatureVariables] = useState<Field[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fieldAnalysis = useMemo(() => {
        const analysis: Record<string, { uniqueValues: number; isBinary: boolean; isMulticlass: boolean }> = {};
        blendedFields.dimensions.forEach(field => {
            const uniqueValues = new Set(blendedData.map(row => row[field.name]));
            const uniqueCount = uniqueValues.size;
            analysis[field.name] = {
                uniqueValues: uniqueCount,
                isBinary: uniqueCount === 2,
                isMulticlass: uniqueCount > 2 && uniqueCount <= 20,
            };
        });
        return analysis;
    }, [blendedData, blendedFields.dimensions]);

    const availableModels = useMemo(() => ({
        [PredictiveModelType.LINEAR_REGRESSION]: blendedFields.measures.length > 0,
        [PredictiveModelType.LOGISTIC_REGRESSION]: blendedFields.dimensions.some(f => fieldAnalysis[f.name]?.isBinary),
        [PredictiveModelType.CLASSIFICATION]: blendedFields.dimensions.some(f => fieldAnalysis[f.name]?.isMulticlass),
        [PredictiveModelType.TIME_SERIES_FORECASTING]: blendedFields.measures.length > 0 && blendedFields.dimensions.some(f => f.type === FieldType.DATETIME),
    }), [blendedFields, fieldAnalysis]);

    const availableTargets = useMemo(() => {
        if (!modelType) return [];
        switch (modelType) {
            case PredictiveModelType.LINEAR_REGRESSION:
            case PredictiveModelType.TIME_SERIES_FORECASTING:
                return blendedFields.measures;
            case PredictiveModelType.LOGISTIC_REGRESSION:
                return blendedFields.dimensions.filter(f => fieldAnalysis[f.name]?.isBinary);
            case PredictiveModelType.CLASSIFICATION:
                return blendedFields.dimensions.filter(f => fieldAnalysis[f.name]?.isMulticlass);
            default:
                return [];
        }
    }, [modelType, blendedFields, fieldAnalysis]);

    const availableFeatures = useMemo(() => {
        if (!targetVariable) return [];
        const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
        return allFields.filter(f => f.name !== targetVariable.name);
    }, [targetVariable, blendedFields]);

    const handleModelTypeSelect = (type: PredictiveModelType) => {
        setModelType(type);
        setTargetVariable(null);
        setFeatureVariables([]);
    };
    
    const handleRunModel = async () => {
        if (!modelType || !targetVariable || featureVariables.length === 0 || !aiConfig) {
            notificationService.error("Please complete all steps to run the model.");
            return;
        }
        if (modelType === PredictiveModelType.TIME_SERIES_FORECASTING && !featureVariables.some(f => f.type === FieldType.DATETIME)) {
            notificationService.warning("Time series forecasting requires at least one date/time feature.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await aiService.runPredictiveModel(aiConfig, modelType, targetVariable, featureVariables, blendedData);
            addPredictiveModel(result);
            setSelectedModelId(result.id);
            notificationService.success("Model ran successfully!");
        } catch (e) {
            notificationService.error(`Model run failed: ${(e as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }

    const toggleFeature = (field: Field) => {
        setFeatureVariables(current => current.some(f => f.name === field.name) ? current.filter(f => f.name !== field.name) : [...current, field]);
    };
    
    const selectedModel = useMemo(() => predictiveModels.find(m => m.id === selectedModelId), [predictiveModels, selectedModelId]);

    const modelOptions: {type: PredictiveModelType, icon: ReactNode, desc: string}[] = [
        { type: PredictiveModelType.LINEAR_REGRESSION, icon: <TrendingUp size={20}/>, desc: "Predict a continuous numeric value." },
        { type: PredictiveModelType.LOGISTIC_REGRESSION, icon: <ToggleLeft size={20}/>, desc: "Predict one of two outcomes (e.g., yes/no)." },
        { type: PredictiveModelType.CLASSIFICATION, icon: <Users size={20}/>, desc: "Predict a category from multiple options." },
        { type: PredictiveModelType.TIME_SERIES_FORECASTING, icon: <Clock size={20}/>, desc: "Forecast future values based on time." },
    ];
    
    return (
        <div className="h-full flex flex-col bg-background">
            <ViewHeader icon={<Brain size={24} />} title="Predictive Studio" showBackToDashboard={true} />
            <div className="flex-grow flex flex-col lg:flex-row min-h-0">
                <aside className="w-full lg:w-96 flex-shrink-0 bg-background border-r border-border flex flex-col p-6 space-y-8 overflow-y-auto">
                    <Step step={1} title="Select Model Type" isComplete={!!modelType} isEnabled={true}>
                        <div className="space-y-3">
                            {modelOptions.map(opt => (
                                <ModelTypeCard 
                                    key={opt.type}
                                    icon={opt.icon}
                                    title={opt.type}
                                    description={opt.desc}
                                    onClick={() => handleModelTypeSelect(opt.type)}
                                    isSelected={modelType === opt.type}
                                    isDisabled={!availableModels[opt.type]}
                                />
                            ))}
                        </div>
                    </Step>

                    <Step step={2} title="Select Target Variable" isComplete={!!targetVariable} isEnabled={!!modelType}>
                        <p className="text-muted-foreground mb-2">What do you want to predict?</p>
                        <select
                            value={targetVariable?.name || ''}
                            onChange={e => {
                                setTargetVariable(availableTargets.find(f => f.name === e.target.value) || null);
                                setFeatureVariables([]);
                            }}
                            className={inputClasses}
                            disabled={!modelType}
                        >
                            <option value="" disabled>Choose a metric...</option>
                            {availableTargets.map(f => <option key={f.name} value={f.name}>{f.simpleName}</option>)}
                        </select>
                    </Step>

                    <Step step={3} title="Select Feature Variables" isComplete={featureVariables.length > 0} isEnabled={!!targetVariable}>
                        <p className="text-muted-foreground mb-2">Which variables might influence the target?</p>
                        <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-secondary rounded-lg border">
                            {availableFeatures.map(field => (
                                <label key={field.name} className="flex items-center gap-2 p-1.5 rounded hover:bg-background cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={featureVariables.some(f => f.name === field.name)}
                                        onChange={() => toggleFeature(field)}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                                    />
                                    <span>{field.simpleName}</span>
                                </label>
                            ))}
                        </div>
                    </Step>
                    
                    <div className="pt-6 border-t border-border flex-grow flex flex-col justify-end">
                        <Button
                            onClick={handleRunModel}
                            disabled={!targetVariable || featureVariables.length === 0 || isLoading}
                            className="w-full text-lg h-12"
                        >
                            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : <><Sparkle /> Run Model</>}
                        </Button>
                    </div>
                </aside>

                <main className="flex-grow min-h-0">
                    {selectedModel ? (
                        <ResultTabs model={selectedModel} onTabChange={() => {}}/>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-center p-8">
                            <div>
                                <Brain size={48} className="text-primary mx-auto mb-4" />
                                <h2 className="text-xl font-bold font-display">Predictive Studio</h2>
                                <p className="text-muted-foreground mt-2 max-w-sm">Configure your model on the left to get started. Once you run a model, the results will appear here.</p>
                            </div>
                        </div>
                    )}
                </main>

                <ModelHistoryPanel models={predictiveModels} selectedModelId={selectedModelId} onSelectModel={setSelectedModelId} />
            </div>
        </div>
    );
};
