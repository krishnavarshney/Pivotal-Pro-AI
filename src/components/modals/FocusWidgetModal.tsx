import React, { useState, useEffect, useMemo, FC } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { DataProcessor } from '../common/DataProcessor';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkle, Table, Settings, Download, RefreshCw, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Pill, ProcessedData, WidgetState, Field } from '../../utils/types';
import { cn } from '../ui/utils';
import { FormattedInsight } from '../ui/FormattedInsight';
import { applyFilters } from '../../utils/dataProcessing/filtering';
import { processWidgetData } from '../../utils/dataProcessing/widgetProcessor';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import _ from 'lodash';
import { WidgetSkeleton } from '../ui/WidgetSkeleton';
import { notificationService } from '../../services/notificationService';
import { formatValue } from '../../utils/dataProcessing/formatting';

const InspectorTabButton: FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 p-3 text-xs font-semibold transition-colors relative border-b-2",
            isActive ? 'text-primary border-primary' : 'text-muted-foreground hover:text-foreground border-transparent'
        )}
    >
        {icon}
        {label}
    </button>
);

const AiSummaryTab: React.FC<{ widget: WidgetState }> = ({ widget }) => {
    const { getWidgetAnalysisText } = useDashboard();
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSummary = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getWidgetAnalysisText(widget);
            setSummary(result);
        } catch (e) {
            setError('Failed to generate summary.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-8 space-y-2">
                <RefreshCw size={24} className="animate-spin text-primary" />
                <p className="font-semibold">AI is analyzing...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4 text-center">
                <p className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</p>
                <Button variant="outline" size="sm" onClick={generateSummary} disabled={isLoading} className="w-full">
                    <RefreshCw size={14} /> Try Again
                </Button>
            </div>
        );
    }

    if (summary) {
        return (
            <div className="space-y-4">
                <FormattedInsight text={summary} />
                <Button variant="outline" size="sm" onClick={generateSummary} disabled={isLoading} className="w-full">
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Regenerate
                </Button>
            </div>
        );
    }
    
    // Initial state
    return (
        <div className="flex flex-col items-center justify-center text-center p-4">
            <Sparkle size={32} className="mb-4 text-primary opacity-50"/>
            <h4 className="font-semibold text-foreground">Unlock AI Insights</h4>
            <p className="text-sm mt-1 mb-6 text-muted-foreground">Generate a summary and find key observations about this widget's data.</p>
            <Button 
                size="lg" 
                onClick={generateSummary} 
                disabled={isLoading} 
                className="w-full animate-border-glow"
                style={{'--glow-color': 'hsl(var(--primary-values))'} as React.CSSProperties}
            >
                <Sparkle size={16} /> Generate AI Insights
            </Button>
        </div>
    );
};

const DataTab: React.FC<{ widget: WidgetState }> = ({ widget }) => {
    const { blendedData, globalFilters, crossFilter, controlFilters, blendedFields } = useDashboard();

    const { data, headers } = useMemo(() => {
        const allFilters = [...globalFilters, ...(widget.shelves.filters || []), ...(crossFilter ? [crossFilter.filter] : []), ...Array.from(controlFilters.values())];
        const filteredData = applyFilters(blendedData, allFilters);
        
        // FIX: Explicitly filter out undefined shelves and ensure type safety to resolve 'unknown' type errors.
        const allPillNames = new Set(
            Object.values(widget.shelves)
                .filter((shelf): shelf is Pill[] => Array.isArray(shelf))
                .flatMap(shelf => shelf.map(pill => pill.name))
        );
        const allFields = [...blendedFields.dimensions, ...blendedFields.measures];

        const displayHeaders = Array.from(allPillNames).map(name => {
            const field = allFields.find(f => f.name === name);
            return { key: name, title: field?.simpleName || name };
        });

        const displayData = filteredData.slice(0, 200).map(row => _.pick(row, Array.from(allPillNames)));

        return { data: displayData, headers: displayHeaders };
    }, [widget, blendedData, globalFilters, crossFilter, controlFilters, blendedFields]);

    if (data.length === 0) {
        return <p className="text-muted-foreground text-sm text-center p-4">No underlying data to display for this configuration.</p>;
    }

    return (
        <div className="overflow-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-border">
                        {headers.map(h => <th key={h.key} className="p-2 text-left font-semibold text-muted-foreground">{h.title}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                            {/* FIX: Use `formatValue` for robust type handling and correct display of cell content. */}
                            {headers.map(h => <td key={h.key} className="p-2 truncate">{formatValue((row as any)[h.key])}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PillDisplay: FC<{ pill: Pill }> = ({pill}) => {
    const isMeasure = pill.type === 'measure';
    const text = isMeasure ? `${pill.aggregation}(${pill.simpleName})` : pill.simpleName;
    return <div className="text-xs font-semibold bg-secondary px-2 py-1 rounded-md text-secondary-foreground truncate">{text}</div>
}

const PropertiesTab: React.FC<{ widget: WidgetState }> = ({ widget }) => {
    return (
        <div className="space-y-4">
            {Object.entries(widget.shelves).map(([shelfId, pills]) => {
                if (!pills || pills.length === 0) return null;
                return (
                    <div key={shelfId}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{shelfId}</h4>
                        <div className="flex flex-col gap-2">
                            {pills.map(pill => <PillDisplay key={pill.id} pill={pill} />)}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

const ExportTab: React.FC<{ widget: WidgetState }> = ({ widget }) => {
     const { blendedData, globalFilters, crossFilter, parameters, controlFilters } = useDashboard();
     
     const handleExportPNG = () => {
        const element = document.getElementById(`focus-widget-panel-${widget.id}`);
        if(element) {
            html2canvas(element, { scale: 2, useCORS: true, backgroundColor: 'transparent' }).then(canvas => {
                const link = document.createElement('a');
                link.download = `${widget.title.replace(/ /g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };
    
    const handleExportCSV = () => {
        const processed = processWidgetData(blendedData, widget, globalFilters, crossFilter, parameters, controlFilters);
        let dataToExport: any[] = [];
        let headers: string[] = [];
        
        if (processed.type === 'table') {
            headers = processed.columnOrder.map(key => {
                const header = processed.headerRows[processed.headerRows.length - 1].find(h => h.key === key);
                return header?.label || key;
            });
            dataToExport = processed.rows.map(row => {
                const rowData: Record<string, any> = {};
                processed.columnOrder.forEach((key, i) => {
                    rowData[headers[i]] = row.values[key];
                });
                return rowData;
            });
        } else if (processed.type === 'chart') {
            headers = ['Category', ...processed.datasets.map(ds => ds.label)];
            dataToExport = processed.labels.map((label, index) => {
                const row: Record<string, any> = { 'Category': label };
                processed.datasets.forEach(ds => {
                    row[ds.label] = ds.data[index];
                });
                return row;
            });
        } else {
            notificationService.error("Export not available for this widget type.");
            return;
        }

        const csv = Papa.unparse(dataToExport, { header: true });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${widget.title.replace(/ /g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleExportPNG}>
                <ImageIcon size={16}/> Export as PNG
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleExportCSV}>
                <FileText size={16}/> Export data as CSV
            </Button>
        </div>
    );
};

const FocusInspectorPanel: React.FC<{ widget: WidgetState }> = ({ widget }) => {
    const [activeTab, setActiveTab] = useState<'ai' | 'data' | 'properties' | 'export'>('ai');
    
    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 border-b border-border/50 flex items-center">
                <InspectorTabButton label="AI Summary" icon={<Sparkle size={18}/>} isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
                <InspectorTabButton label="Data" icon={<Table size={18}/>} isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} />
                <InspectorTabButton label="Properties" icon={<Settings size={18}/>} isActive={activeTab === 'properties'} onClick={() => setActiveTab('properties')} />
                <InspectorTabButton label="Export" icon={<Download size={18}/>} isActive={activeTab === 'export'} onClick={() => setActiveTab('export')} />
            </header>
            <div className="flex-grow min-h-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-4"
                    >
                        {activeTab === 'ai' && <AiSummaryTab widget={widget} />}
                        {activeTab === 'data' && <DataTab widget={widget} />}
                        {activeTab === 'properties' && <PropertiesTab widget={widget} />}
                        {activeTab === 'export' && <ExportTab widget={widget} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export const FocusWidgetModal: React.FC = () => {
    const { focusedWidgetId, setFocusedWidgetId, activePage } = useDashboard();
    const widget = activePage?.widgets.find(w => w.id === focusedWidgetId);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setFocusedWidgetId(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setFocusedWidgetId]);

    return (
         <AnimatePresence>
            {widget && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                    onClick={() => setFocusedWidgetId(null)}
                >
                    <div className="w-full h-full flex flex-col md:flex-row gap-6" onClick={e => e.stopPropagation()}>
                        <motion.div
                            layoutId={`widget-container-${widget.id}`}
                            className="flex-[3] min-w-0 glass-panel rounded-xl flex flex-col h-full overflow-hidden"
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        >
                            <div id={`focus-widget-panel-${widget.id}`} className="flex flex-col h-full">
                                <header className="flex items-center p-4 h-[60px] border-b border-border/50 flex-shrink-0">
                                    <h3 className="font-semibold text-foreground text-lg">{widget.title}</h3>
                                </header>
                                <div className="flex-grow min-h-0 w-full">
                                    <DataProcessor widget={widget} />
                                </div>
                            </div>
                        </motion.div>
        
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex-1 max-w-sm w-full md:w-auto glass-panel rounded-xl flex flex-col h-full overflow-hidden"
                        >
                            <FocusInspectorPanel widget={widget} />
                        </motion.div>
                    </div>
                    
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 }}} exit={{ opacity: 0 }}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-card/50 hover:bg-card"
                            onClick={() => setFocusedWidgetId(null)}
                        >
                            <X size={20} />
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};