import React, { useMemo, FC, ReactNode } from 'react';
import { Hash, TextT, Clock } from 'phosphor-react';
import { Field, FieldType } from '../../utils/types';
import { formatValue } from '../../utils/dataProcessing/formatting';
import { calculateNumericStats, calculateDimensionStats, createHistogramData } from '../../utils/dataProcessing/statistics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard';

export const FieldInfoPopover: FC<{field: Field, children: ReactNode, isDragging?: boolean, blendedData: any[]}> = ({ field, children, isDragging = false, blendedData }) => {
    
    const columnData = useMemo(() => blendedData.map(row => row[field.name]), [blendedData, field.name]);

    const stats = useMemo(() => {
        if (!field) return null;
        return field.type === FieldType.MEASURE 
            ? calculateNumericStats(columnData)
            : calculateDimensionStats(columnData);
    }, [columnData, field]);

    const chartData = useMemo(() => {
        if (!field || !stats) return null;
        if (field.type === FieldType.MEASURE) {
            const histogram = createHistogramData(columnData as number[], 10);
            return histogram.labels.map((label, i) => ({ name: label, value: histogram.data[i] }));
        } else {
             const topValues = (stats as any).topValues.slice(0, 5);
             return topValues.map((item: any) => ({ name: formatValue(item.value, {maximumFractionDigits: 1}), value: item.count }));
        }
    }, [field, stats, columnData]);

    if (!stats) {
        return <>{children}</>;
    }

    const completeness = stats.count / (stats.count + stats.missing);
    
    const getIcon = () => {
        switch (field.type) {
            case FieldType.DIMENSION: return <TextT size={18} className="text-blue-500 flex-shrink-0"/>;
            case FieldType.MEASURE: return <Hash size={18} className="text-green-500 flex-shrink-0"/>;
            case FieldType.DATETIME: return <Clock size={18} className="text-purple-500 flex-shrink-0"/>;
            default: return null;
        }
    };

    const popoverContent = (
        <div className="text-popover-foreground space-y-3 w-80">
            <div className="border-b border-border pb-3">
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <p className="font-bold text-base truncate" title={field.name}>{field.simpleName}</p>
                </div>
                <p className="text-xs text-muted-foreground capitalize mt-1 ml-7">{field.type} &middot; {field.name.split('.')[0]}</p>
            </div>

            <div className="space-y-4 text-sm">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-muted-foreground">Completeness</span>
                        <span className="font-semibold">{formatValue(completeness * 100, { suffix: '%', decimalPlaces: 1 })}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${completeness * 100}%` }}></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-medium">
                    <div className="text-muted-foreground">Total Values</div><div className="text-right font-semibold">{formatValue(stats.count)}</div>
                    <div className="text-muted-foreground">Unique Values</div><div className="text-right font-semibold">{formatValue((stats as any).unique)}</div>
                    <div className="text-muted-foreground">Missing</div><div className="text-right font-semibold">{formatValue(stats.missing)}</div>
                    {field.type === FieldType.MEASURE && stats && 'mean' in stats && (
                        <>
                            <div className="text-muted-foreground">Mean</div><div className="text-right font-semibold">{formatValue((stats as any).mean)}</div>
                            <div className="text-muted-foreground">Min / Max</div>
                            <div className="text-right font-semibold">{formatValue((stats as any).min)} / {formatValue((stats as any).max)}</div>
                        </>
                    )}
                </div>
            </div>

             {chartData && (chartData.length > 0) && (
                <div className="h-32 pt-3 border-t border-border">
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={chartData} margin={{ top: 5, right: 15, bottom: 5, left: -15 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} />
                            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                            <RechartsTooltip 
                                cursor={{ fill: 'hsl(var(--accent))' }} 
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
    
    return (
        <HoverCard>
            <HoverCardTrigger disabled={isDragging} asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent className="w-auto p-4">
                {popoverContent}
            </HoverCardContent>
        </HoverCard>
    );
}