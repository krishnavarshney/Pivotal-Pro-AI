import React, { useRef, useEffect, FC, MouseEvent } from 'react';
// FIX: Changed to default import for echarts-for-react to resolve module compatibility issue.
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useDashboard } from '../../contexts/DashboardProvider';
import { WidgetState, ProcessedData, ChartType } from '../../utils/types';
import { formatValue } from '../../utils/dataProcessing/formatting';
import { COLOR_PALETTES } from '../../utils/constants';
import _ from 'lodash';

interface ChartProps {
    widget: WidgetState;
    data: Extract<ProcessedData, { type: 'chart' | 'sankey' }>;
    onElementClick: (index: number | null) => void;
    onElementContextMenu: (event: globalThis.MouseEvent, index?: number) => void;
}

export const EChartsComponent: FC<ChartProps> = ({ widget, data, onElementClick, onElementContextMenu }) => {
    const { themeConfig, crossFilter } = useDashboard();
    const echartsRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const debouncedResize = _.debounce(() => {
            echartsRef.current?.getEchartsInstance?.()?.resize();
        }, 150);

        const resizeObserver = new ResizeObserver(debouncedResize);
        resizeObserver.observe(container);
        
        const timeoutId = setTimeout(debouncedResize, 300);

        return () => {
            resizeObserver.disconnect();
            debouncedResize.cancel();
            clearTimeout(timeoutId);
        };
    }, []);

    const { chartType, colorPalette, isStacked, chartSettings } = widget;

    const isChartData = data.type === 'chart';
    const labels = isChartData ? (data as any).labels : [];
    const datasets = isChartData ? (data as any).datasets : [];

    const paletteName = colorPalette as keyof typeof COLOR_PALETTES || 'Pivotal Pro';
    const { colors: chartColors } = COLOR_PALETTES[paletteName];

    const allValuePills = [...widget.shelves.values, ...(widget.shelves.values2 || [])];
    
    const isCartesian = ![ChartType.PIE, ChartType.TREEMAP, ChartType.FUNNEL, ChartType.SANKEY, ChartType.MAP, ChartType.GAUGE, ChartType.RADAR].includes(chartType);
    const isHorizontal = chartType === ChartType.BAR && (widget.shelves.rows || []).length > 0 && (widget.shelves.columns || []).length === 0;
    
    const getEchartsLegendOptions = () => {
        const position = chartSettings?.legendPosition || 'bottom';
        const baseOptions = {
            show: chartSettings?.showLegend !== false,
            type: 'scroll',
            textStyle: { color: themeConfig.mode === 'dark' ? '#e2e8f0' : '#334155' },
        };

        switch(position) {
            case 'top':
                return { ...baseOptions, top: '5%', left: 'center' };
            case 'left':
                return { ...baseOptions, left: 10, top: 'center', orient: 'vertical' };
            case 'right':
                return { ...baseOptions, right: 10, top: 'center', orient: 'vertical' };
            case 'bottom':
            default:
                return { ...baseOptions, bottom: '2%', left: 'center' };
        }
    }

    const baseOptions = {
        color: chartColors,
        grid: { top: 20, right: 60, bottom: 60, left: '3%', containLabel: true },
        toolbox: {
            show: true,
            orient: 'vertical',
            right: 10,
            top: 'center',
            feature: {
                dataView: { 
                    show: true, 
                    readOnly: false, 
                    title: 'Data View',
                    backgroundColor: 'hsl(var(--card))',
                    textColor: 'hsl(var(--card-foreground))',
                    textareaColor: 'hsl(var(--background))',
                    textareaBorderColor: 'hsl(var(--border))',
                    buttonColor: 'hsl(var(--primary))',
                    buttonTextColor: 'hsl(var(--primary-foreground))'
                },
                magicType: { 
                    show: isCartesian && [ChartType.BAR, ChartType.LINE, ChartType.AREA].includes(chartType), 
                    type: ['line', 'bar', 'stack'],
                    title: { line: 'Line', bar: 'Bar', stack: 'Stack' }
                },
                restore: { show: true, title: 'Restore' },
                saveAsImage: { show: true, title: 'Save Image', backgroundColor: 'hsl(var(--background))' }
            },
            iconStyle: {
                borderColor: themeConfig.mode === 'dark' ? '#e2e8f0' : '#334155'
            }
        },
        tooltip: {
            backgroundColor: themeConfig.mode === 'dark' ? '#2d3748' : '#ffffff',
            borderColor: themeConfig.mode === 'dark' ? '#4a5568' : '#e2e8f0',
            textStyle: { color: themeConfig.mode === 'dark' ? '#e2e8f0' : '#1a202c' },
            formatter: (params: any) => {
                const paramsArray = Array.isArray(params) ? params : [params];
                if (paramsArray.length === 0 || !paramsArray[0]) return '';
            
                const firstParam = paramsArray[0];
                const title = firstParam.axisValueLabel || firstParam.name;
                let tooltipText = `<strong>${title}</strong><br/>`;
            
                paramsArray.forEach((param: any) => {
                    if (!param || (param.value == null && param.data?.value == null)) return;
            
                    const seriesDataset = datasets[param.seriesIndex ?? 0];
                    if (!seriesDataset) return;
                    
                    const valuePill = allValuePills.find(p => p.name === seriesDataset.valuePillName);
                    const formatting = valuePill?.formatting || { decimalPlaces: 0 };
                    const aggregation = valuePill?.aggregation;
                    const seriesName = param.seriesName || param.name || seriesDataset.label;
            
                    let value = param.value;
                    
                    if (Array.isArray(value) && value.length >= 5) { // Boxplot
                        tooltipText += `${param.marker} ${seriesName}<br/>Max: <strong>${formatValue(value[4], formatting)}</strong><br/>Q3: <strong>${formatValue(value[3], formatting)}</strong><br/>Median: <strong>${formatValue(value[2], formatting)}</strong><br/>Q1: <strong>${formatValue(value[1], formatting)}</strong><br/>Min: <strong>${formatValue(value[0], formatting)}</strong><br/>`;
                    } else if (typeof param.data === 'object' && param.data !== null && 'value' in param.data) { // Pie, Treemap, Funnel, Gauge
                        const dataValue = Array.isArray(param.data.value) ? param.data.value[1] : param.data.value;
                        tooltipText += `${param.marker} ${seriesName} - <strong>${formatValue(dataValue, formatting, aggregation)}</strong><br/>`;
                    } else { // Standard charts like bar, line, scatter
                        const displayValue = isHorizontal && Array.isArray(value) ? value[0] : Array.isArray(value) ? value[1] : value;
                        tooltipText += `${param.marker} ${seriesName} - <strong>${formatValue(displayValue, formatting, aggregation)}</strong><br/>`;
                    }
                });
                return tooltipText;
            },
        },
        legend: getEchartsLegendOptions(),
        xAxis: isCartesian ? {
            type: isHorizontal ? 'value' : 'category',
            data: isHorizontal ? undefined : labels,
            axisLabel: { 
                color: themeConfig.mode === 'dark' ? '#a0aec0' : '#4a5568', 
                rotate: isHorizontal ? 0 : 30, 
                interval: 'auto', 
                hideOverlap: true,
                ...(isHorizontal && { formatter: (val: number) => formatValue(val, widget.shelves.values[0]?.formatting) })
            },
        } : undefined,
        yAxis: isCartesian ? [
            {
                type: isHorizontal ? 'category' : 'value',
                data: isHorizontal ? labels : undefined,
                axisLabel: { 
                    color: themeConfig.mode === 'dark' ? '#a0aec0' : '#4a5568', 
                    ...(!isHorizontal && { formatter: (val: number) => formatValue(val, widget.shelves.values[0]?.formatting) })
                },
                splitLine: { lineStyle: { color: themeConfig.mode === 'dark' ? 'rgba(113, 113, 122, 0.3)' : '#e2e8f0' } },
            },
        ] : undefined,
        dataZoom: isCartesian && labels.length > 20 ? [
            {
                type: 'slider',
                show: true,
                start: 0,
                end: (20 / labels.length) * 100,
                bottom: '8%',
                height: 20,
                backgroundColor: 'hsla(var(--muted-foreground) / 0.1)',
                borderColor: 'hsl(var(--border))',
                handleStyle: { color: 'hsl(var(--background))', borderColor: 'hsl(var(--primary))' },
                textStyle: { color: 'hsl(var(--muted-foreground))' },
                ...(isHorizontal && { yAxisIndex: 0, top: '15%', bottom: '20%', width: 20, right: '2%', left: 'auto' })
            }
        ] : [],
    };

    let options: any = _.cloneDeep(baseOptions);

    if (isCartesian) {
        options.tooltip.trigger = 'axis';
        if (chartType === ChartType.BAR) {
            options.tooltip.axisPointer = { type: 'shadow' };
        } else if ([ChartType.LINE, ChartType.AREA, ChartType.DUAL_AXIS, ChartType.BOXPLOT, ChartType.SCATTER].includes(chartType)) {
            options.tooltip.axisPointer = { type: 'cross', crossStyle: { color: 'hsl(var(--muted-foreground))' } };
        } else {
             options.tooltip.axisPointer = { type: 'shadow' };
        }
    } else {
        options.tooltip.trigger = 'item';
    }


    if (chartType === ChartType.MAP) {
        options.series = [];
        options.xAxis = undefined;
        options.yAxis = undefined;
        options.dataZoom = [];
        options.graphic = {
            elements: [{
                type: 'text',
                left: 'center',
                top: 'center',
                style: {
                    text: 'Map charts are not yet supported in this application.',
                    font: '14px "Inter", sans-serif',
                    fill: themeConfig.mode === 'dark' ? '#a0aec0' : '#4a5568',
                    align: 'center',
                }
            }]
        };
    } else if (chartType === ChartType.SANKEY) {
        options = {
            ...options,
            tooltip: { trigger: 'item', triggerOn: 'mousemove' },
            series: [{
                type: 'sankey',
                data: (data as any).nodes,
                links: (data as any).links,
                emphasis: { focus: 'adjacency' },
                lineStyle: { color: 'gradient', curveness: 0.5 }
            }]
        };
    } else { // Handle all other chart types
        const isMultiSeries = datasets.length > 1;
        const shouldStack = (isStacked ?? (chartType === ChartType.AREA)) && isMultiSeries;

        const series = isChartData ? datasets.map((ds: any) => {
            let chartSpecificProps: any = {};
            
            switch (chartType) {
                case ChartType.BAR: chartSpecificProps = { type: 'bar', ...(shouldStack && { stack: 'total' }), emphasis: { focus: 'series' }, barWidth: '60%' }; break;
                case ChartType.LINE: chartSpecificProps = { type: 'line', smooth: true, showSymbol: false, emphasis: { focus: 'series' }, connectNulls: true, ...(shouldStack && { stack: 'total' }) }; break;
                case ChartType.AREA: chartSpecificProps = { type: 'line', areaStyle: {}, smooth: true, showSymbol: false, emphasis: { focus: 'series' }, ...(shouldStack && { stack: 'total' }), connectNulls: true }; break;
                case ChartType.SCATTER: 
                    chartSpecificProps = { 
                        type: 'scatter', 
                        data: ds.data.map((d: any) => d ? [d.x, d.y] : null).filter(Boolean)
                    }; 
                    break;
                case ChartType.BUBBLE: 
                    chartSpecificProps = { 
                        type: 'scatter', 
                        symbolSize: (val: number[]) => Math.max(5, Math.sqrt(val[2] || 0) / 2), 
                        data: ds.data.map((d: any) => d ? [d.x, d.y, d.r] : null).filter(Boolean)
                    }; 
                    break;
                case ChartType.PIE:
                    chartSpecificProps = {
                        type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
                        label: { show: false, position: 'center' },
                        emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
                        labelLine: { show: false },
                        data: labels.map((l, j) => ({ name: l, value: ds.data[j] })),
                    };
                    break;
                case ChartType.TREEMAP:
                    chartSpecificProps = {
                        type: 'treemap',
                        label: { show: true, formatter: '{b}', color: '#fff', fontSize: 14 },
                        upperLabel: { show: true, height: 20, color: '#fff', fontSize: 16, fontWeight: 'bold' },
                        itemStyle: { borderColor: 'hsl(var(--background))', borderWidth: 2, gapWidth: 2 },
                        data: ds.data,
                    };
                    break;
                case ChartType.FUNNEL:
                     chartSpecificProps = {
                        type: 'funnel',
                        left: '10%', top: 60, bottom: 60, width: '80%', min: 0, max: 100, minSize: '0%',
                        maxSize: '100%', sort: 'descending', gap: 2,
                        label: { show: true, position: 'inside', formatter: '{b}: {c}%' },
                        labelLine: { length: 10, lineStyle: { width: 1, type: 'solid' } },
                        itemStyle: { borderWidth: 0 },
                        emphasis: { label: { fontSize: 20 } },
                        data: labels.map((l, j) => ({ name: l, value: ds.data[j] }))
                    };
                    break;
                 case ChartType.BOXPLOT:
                    chartSpecificProps = {
                        type: 'boxplot',
                        data: ds.data.map((d: any) => d ? [d.min, d.q1, d.median, d.q3, d.max] : null)
                    };
                    break;
                case ChartType.RADAR:
                    chartSpecificProps = { type: 'radar' };
                    break;
                case ChartType.GAUGE:
                    chartSpecificProps = {
                        type: 'gauge',
                        data: [{
                            value: ds.data[0],
                            name: ds.label
                        }],
                        detail: {
                            formatter: (value: number) => {
                                const pill = widget.shelves.values[0];
                                return pill ? formatValue(value, pill.formatting, pill.aggregation) : formatValue(value);
                            },
                            fontSize: 24,
                            fontWeight: 'bold',
                            color: 'auto'
                        },
                        progress: { show: true, width: 18 },
                        axisLine: { lineStyle: { width: 18 } },
                        axisTick: { show: false },
                        splitLine: { show: false },
                        axisLabel: { show: false },
                        pointer: { show: false },
                        title: { show: true, offsetCenter: [0, '80%'], fontSize: 14 }
                    };
                    break;
                default: chartSpecificProps = { type: 'bar' };
            }

            let finalData = ds.data;
            if (shouldStack && [ChartType.AREA, ChartType.LINE].includes(chartType)) {
                finalData = ds.data.map((val: any) => val ?? 0);
            }
            
            const seriesData = isHorizontal ? finalData.map((val: any, i: number) => ([val, labels[i]])) : finalData;
            return { name: ds.label, data: seriesData, ...chartSpecificProps };
        }) : [];
        
        if (chartType === ChartType.RADAR) {
            const maxValues = datasets.map((ds: any) => Math.max(...ds.data.filter((v: any) => v !== null).map((v: any) => Number(v))));
            const overallMax = Math.max(...maxValues, 0);
            options.radar = { indicator: labels.map((l: string) => ({ name: l, max: overallMax > 0 ? overallMax * 1.1 : 100 })) };
            options.series = [{
                type: 'radar',
                data: datasets.map((ds: any) => ({ value: ds.data, name: ds.label })),
            }];
        } else {
            options.series = series;
        }

        if (chartType === ChartType.DUAL_AXIS && widget.shelves.values2?.length > 0) {
            options.yAxis.push({
                type: 'value',
                axisLabel: { color: themeConfig.mode === 'dark' ? '#a0aec0' : '#4a5568', formatter: (val: number) => formatValue(val, widget.shelves.values2[0]?.formatting)},
                splitLine: { show: false },
            });
            
            options.series = [
                ...widget.shelves.values.map((_pill, i) => _.omit({ ...series[i], type: 'bar' }, 'stack')),
                ...widget.shelves.values2.map((_, i) => ({ ...series[widget.shelves.values.length + i], type: 'line', yAxisIndex: 1, smooth: true })),
            ];
        }
    }
    
    const onEvents = {
        'click': (params: any) => onElementClick(params ? params.dataIndex : null),
        'contextmenu': (params: any) => {
            if (params?.event?.event) {
                params.event.event.preventDefault();
                onElementContextMenu(params.event.event, params.dataIndex);
            }
        }
    };

    return (
        <div ref={containerRef} className="w-full h-full">
            <ReactECharts
                ref={echartsRef}
                echarts={echarts}
                option={options}
                style={{ height: '100%', width: '100%' }}
                theme={themeConfig.mode}
                notMerge={true}
                lazyUpdate={true}
                onEvents={onEvents}
            />
        </div>
    );
};