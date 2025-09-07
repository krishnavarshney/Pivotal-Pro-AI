import React, { useMemo, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ZAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useDashboard } from '../../contexts/DashboardProvider';
import { WidgetState, ProcessedData, ChartType } from '../../utils/types';
import { formatValue } from '../../utils/dataProcessing/formatting';
import { COLOR_PALETTES } from '../../utils/constants';
import _ from 'lodash';

interface ChartProps {
    widget: WidgetState;
    data: Extract<ProcessedData, { type: 'chart' }>;
    onElementClick: (index: number | null) => void;
    onElementContextMenu: (event: MouseEvent, index?: number) => void;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label, widget }) => {
    if (active && payload && payload.length) {
        if(!payload[0].payload) return null;
        return (
            <div className="p-3 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border text-sm">
                <p className="font-bold mb-2">{formatValue(label)}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} style={{ color: pld.color }}>
                        {`${pld.name}: ${formatValue(pld.value, widget.shelves.values[index]?.formatting, widget.shelves.values[index]?.aggregation)}`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ScatterTooltip: React.FC<any> = ({ active, payload, widget }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (!data) return null;
        const xPill = widget.shelves.columns[0];
        const yPill = widget.shelves.rows[0];
        const rPill = widget.shelves.values[0];

        return (
            <div className="p-3 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border text-sm">
                {data.category && data.category !== 'All' && <p className="font-bold mb-2" style={{color: payload[0].color}}>{data.category}</p>}
                {xPill && <p>{xPill.simpleName}: {formatValue(data.x, xPill.formatting)}</p>}
                {yPill && <p>{yPill.simpleName}: {formatValue(data.y, yPill.formatting)}</p>}
                {rPill && widget.chartType === ChartType.BUBBLE && data.r !== 5 && <p>{rPill.simpleName}: {formatValue(data.r, rPill.formatting)}</p>}
            </div>
        );
    }
    return null;
};

export const RechartsComponent: React.FC<ChartProps> = ({ widget, data, onElementClick, onElementContextMenu }) => {
    const { crossFilter, themeConfig } = useDashboard();
    const nativeEventRef = useRef<MouseEvent | null>(null);
    const { chartType, colorPalette } = widget;
    const { labels, datasets } = data;

    const paletteName = colorPalette as keyof typeof COLOR_PALETTES || 'Pivotal Pro';
    const { colors: chartColors } = COLOR_PALETTES[paletteName];

    const isSourceOfFilter = crossFilter?.sourceWidgetId === widget.id;
    const selectedValue = isSourceOfFilter ? crossFilter.filter.filter!.values[0] : null;

    const chartData = useMemo(() => {
        return labels.map((label, index) => {
            const entry: { [key: string]: any } = { name: label };
            datasets.forEach(ds => {
                entry[ds.label] = ds.data[index];
            });
            return entry;
        });
    }, [labels, datasets]);

    const handleContextMenuCapture = (e: React.MouseEvent) => {
        nativeEventRef.current = e.nativeEvent;
    };

    const handleChartContextMenu = (payload: any) => {
        if (nativeEventRef.current) {
            onElementContextMenu(nativeEventRef.current, payload?.activeTooltipIndex);
            nativeEventRef.current = null;
        }
    };

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 5, right: 20, left: -10, bottom: 40 },
            onClick: (e: any) => onElementClick(e?.activeTooltipIndex ?? null),
            onContextMenu: handleChartContextMenu,
        };
        
        const isDark = themeConfig.mode === 'dark';
        const tickColor = isDark ? '#94a3b8' : '#6b7280'; // Muted Foreground
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        const legendColor = isDark ? '#e2e8f0' : '#334155'; // Foreground
        const tooltipCursorFill = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)';

        switch (chartType) {
            case ChartType.BAR:
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                        <YAxis tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={(val) => formatValue(val, widget.shelves.values[0]?.formatting)} />
                        <Tooltip content={<CustomTooltip widget={widget} />} cursor={{ fill: tooltipCursorFill }}/>
                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px', color: legendColor}}/>
                        {datasets.map((ds, i) => (
                            <Bar key={ds.label} dataKey={ds.label} fill={chartColors[i % chartColors.length]} name={ds.label}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fillOpacity={isSourceOfFilter ? (_.isEqual(entry.name, selectedValue) ? 1 : 0.3) : 1} />
                                ))}
                            </Bar>
                        ))}
                    </BarChart>
                );
            case ChartType.LINE:
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                        <YAxis tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={(val) => formatValue(val, widget.shelves.values[0]?.formatting)} />
                        <Tooltip content={<CustomTooltip widget={widget} />} cursor={{ stroke: tooltipCursorFill, strokeWidth: 2 }}/>
                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px', color: legendColor}}/>
                        {datasets.map((ds, i) => (
                            <Line key={ds.label} type="monotone" dataKey={ds.label} stroke={chartColors[i % chartColors.length]} strokeWidth={2} name={ds.label} />
                        ))}
                    </LineChart>
                );
            case ChartType.AREA:
                 return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                        <YAxis tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={(val) => formatValue(val, widget.shelves.values[0]?.formatting)} />
                        <Tooltip content={<CustomTooltip widget={widget} />} cursor={{ stroke: tooltipCursorFill, strokeWidth: 2 }}/>
                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px', color: legendColor}}/>
                        {datasets.map((ds, i) => {
                            const color = chartColors[i % chartColors.length];
                            return (
                                <Area key={ds.label} type="monotone" dataKey={ds.label} stroke={color} fill={color} fillOpacity={0.3} name={ds.label} />
                            )
                        })}
                    </AreaChart>
                );
            case ChartType.PIE:
                return (
                    <PieChart {...commonProps}>
                        <Tooltip content={<CustomTooltip widget={widget} />} />
                        <Legend wrapperStyle={{color: legendColor}}/>
                        <Pie data={chartData} dataKey={datasets[0].label} nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{fill: legendColor}}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} fillOpacity={isSourceOfFilter ? (_.isEqual(entry.name, selectedValue) ? 1 : 0.3) : 1} />
                            ))}
                        </Pie>
                    </PieChart>
                );
            case ChartType.SCATTER:
            case ChartType.BUBBLE:
                const xPill = widget.shelves.columns[0];
                const yPill = widget.shelves.rows[0];
                const rPill = widget.shelves.values[0];

                if (!xPill || !yPill) return <div className="text-center text-muted-foreground p-4">Scatter charts require a field on X-Axis and Y-Axis.</div>;
                
                const allPoints = _.flatMap(datasets, ds => ds.data);
                const rDomain = rPill && allPoints.length > 0 ? [_.minBy(allPoints, 'r')?.r ?? 0, _.maxBy(allPoints, 'r')?.r ?? 0] : [0, 100];

                const handleScatterClick = (e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                        const payload = e.activePayload[0].payload;
                        if (payload && payload.category !== undefined) {
                            const categoryPill = (widget.shelves.category || [])[0];
                            if (categoryPill) {
                                const index = data.labels.indexOf(payload.category);
                                onElementClick(index !== -1 ? index : null);
                            } else {
                                onElementClick(null);
                            }
                        }
                    } else {
                        onElementClick(null);
                    }
                };

                return (
                    <ScatterChart 
                        margin={{ top: 20, right: 20, bottom: 50, left: 20 }}
                        onClick={handleScatterClick}
                        onContextMenu={handleChartContextMenu}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis type="number" dataKey="x" name={xPill.simpleName} tick={{ fill: tickColor, fontSize: 12 }} domain={['dataMin', 'dataMax']} />
                        <YAxis type="number" dataKey="y" name={yPill.simpleName} tick={{ fill: tickColor, fontSize: 12 }} domain={['dataMin', 'dataMax']} />
                        {chartType === ChartType.BUBBLE && rPill && <ZAxis type="number" dataKey="r" name={rPill.simpleName} range={[50, 500]} domain={rDomain} />}
                        <Tooltip content={<ScatterTooltip widget={widget} />} cursor={{ stroke: tooltipCursorFill, strokeDasharray: '3 3' }} />
                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px', color: legendColor}}/>
                        {datasets.map((ds, i) => (
                            <Scatter key={ds.label} name={ds.label} data={ds.data as any[]} fill={chartColors[i % chartColors.length]} />
                        ))}
                    </ScatterChart>
                );
            case ChartType.RADAR:
                return (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData} {...commonProps}>
                        <PolarGrid stroke={gridColor} />
                        <PolarAngleAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: tickColor, fontSize: 12 }}/>
                        <Tooltip content={<CustomTooltip widget={widget} />} />
                        <Legend wrapperStyle={{color: legendColor}}/>
                        {datasets.map((ds, i) => (
                            <Radar key={ds.label} name={ds.label} dataKey={ds.label} stroke={chartColors[i % chartColors.length]} fill={chartColors[i % chartColors.length]} fillOpacity={0.6} />
                        ))}
                    </RadarChart>
                );
            case ChartType.GAUGE:
                return <div className="text-center text-muted-foreground p-4">Gauge charts are not yet supported by Recharts.</div>;
            default:
                return <div className="text-center text-muted-foreground p-4">This chart type is not yet supported by Recharts.</div>;
        }
    };

    return (
        <div onContextMenuCapture={handleContextMenuCapture} style={{ width: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
};
