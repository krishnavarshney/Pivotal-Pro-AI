import React, { useRef, useEffect, FC, MouseEvent } from 'react';
import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useDashboard } from '../../contexts/DashboardProvider';
import { WidgetState, ProcessedData, ChartType } from '../../utils/types';
import { formatValue } from '../../utils/dataProcessing/formatting';
import { COLOR_PALETTES } from '../../utils/constants';
import _ from 'lodash';

interface ChartProps {
    widget: WidgetState;
    data: Extract<ProcessedData, { type: 'chart' }>;
    onElementClick: (index: number | null) => void;
    onElementContextMenu: (event: globalThis.MouseEvent, index?: number) => void;
}

export const ApexChartsComponent: FC<ChartProps> = ({ widget, data, onElementClick, onElementContextMenu }) => {
    const { crossFilter, themeConfig } = useDashboard();
    const chartWrapperRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const wrapper = chartWrapperRef.current;
        if (!wrapper) return;

        const handleContextMenu = (event: globalThis.MouseEvent) => {
            event.preventDefault();
            onElementContextMenu(event);
        };

        wrapper.addEventListener('contextmenu', handleContextMenu);
        return () => {
            if (wrapper) {
                wrapper.removeEventListener('contextmenu', handleContextMenu);
            }
        };
    }, [onElementContextMenu]);
    
    const { chartType, colorPalette, isStacked, chartSettings } = widget;
    const { labels, datasets } = data;

    const paletteName = colorPalette as keyof typeof COLOR_PALETTES || 'Pivotal Pro';
    const { colors: chartColors } = COLOR_PALETTES[paletteName];

    const isSourceOfFilter = crossFilter?.sourceWidgetId === widget.id;
    const selectedValue = isSourceOfFilter ? crossFilter.filter.filter!.values[0] : null;

    // --- Intelligent Configuration ---
    const isHorizontal = chartType === ChartType.BAR && (widget.shelves.rows || []).length > 0 && (widget.shelves.columns || []).length === 0;
    const shouldStack = isStacked && [ChartType.BAR, ChartType.AREA].includes(chartType);
    const isHorizontalLegend = !chartSettings?.legendPosition || ['top', 'bottom'].includes(chartSettings.legendPosition);

    // --- Base Options ---
    const options: ApexOptions = {
        chart: {
            background: 'transparent',
            foreColor: themeConfig.mode === 'dark' ? '#e2e8f0' : '#334155',
            stacked: shouldStack,
            events: {
                click: (event, chartContext, config) => {
                    onElementClick(config.dataPointIndex < 0 ? null : config.dataPointIndex);
                },
                dataPointSelection: (event, chartContext, config) => {
                    onElementClick(config.dataPointIndex < 0 ? null : config.dataPointIndex);
                },
                markerClick: (event, chartContext, { dataPointIndex }) => {
                    onElementClick(dataPointIndex < 0 ? null : dataPointIndex);
                },
            },
            toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } },
            zoom: { enabled: false },
        },
        colors: chartColors,
        grid: {
            borderColor: themeConfig.mode === 'dark' ? 'rgba(113, 113, 122, 0.3)' : '#e5e7eb',
            strokeDashArray: 4
        },
        legend: {
            show: chartSettings?.showLegend !== false,
            position: chartSettings?.legendPosition || 'bottom',
            horizontalAlign: isHorizontalLegend ? 'center' : 'left',
            offsetY: 5,
        },
        xaxis: {
            categories: labels,
            labels: {
                formatter: (val: any) => isHorizontal ? formatValue(val, widget.shelves.values[0]?.formatting) : formatValue(val),
                trim: true,
            },
        },
        yaxis: {
            labels: {
                formatter: (val: any) => isHorizontal ? formatValue(val) : formatValue(val, widget.shelves.values[0]?.formatting),
            },
        },
        tooltip: {
            theme: themeConfig.mode,
            y: {
                formatter: (val, { seriesIndex, dataPointIndex, w }) => {
                    const pill = widget.shelves.values[seriesIndex];
                    if (chartType === ChartType.BOXPLOT && w.config.series[seriesIndex]?.data[dataPointIndex]?.y) {
                         const seriesData = w.config.series[seriesIndex].data[dataPointIndex].y;
                         return `Max: ${formatValue(seriesData[4])}<br>Q3: ${formatValue(seriesData[3])}<br>Median: ${formatValue(seriesData[2])}<br>Q1: ${formatValue(seriesData[1])}<br>Min: ${formatValue(seriesData[0])}`;
                    }
                    return pill ? formatValue(val, pill.formatting, pill.aggregation) : formatValue(val);
                }
            }
        },
        dataLabels: {
            enabled: false
        },
    };
    
    // --- Chart-Specific Options ---
    if (chartType === ChartType.LINE || chartType === ChartType.AREA) {
        options.stroke = { curve: 'smooth', width: chartType === ChartType.LINE ? 3 : 2 };
        if (chartType === ChartType.LINE) {
            options.chart!.dropShadow = { enabled: true, color: '#000', top: 10, left: 3, blur: 6, opacity: 0.1 };
        }
    }
    
    if (chartType === ChartType.AREA) {
        options.fill = {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.6,
                opacityTo: 0.1,
                stops: [0, 100]
            }
        };
    }
    
    if (chartType === ChartType.BAR) {
        options.plotOptions = {
            bar: {
                horizontal: isHorizontal,
                borderRadius: 5,
                columnWidth: '70%',
            }
        };
    }
    
    // --- Prepare Series and Type ---
    let series: any[] = [];
    let apexChartType: any = 'bar';
    
    switch (chartType) {
        case ChartType.BAR:
            apexChartType = 'bar';
            series = datasets.map(ds => ({ name: ds.label, data: ds.data }));
            break;
        case ChartType.LINE:
            apexChartType = 'line';
            series = datasets.map(ds => ({ name: ds.label, data: ds.data }));
            break;
        case ChartType.AREA:
            apexChartType = 'area';
            series = datasets.map(ds => ({ name: ds.label, data: ds.data }));
            break;
        case ChartType.PIE:
            apexChartType = 'donut';
            options.labels = labels as string[];
            series = datasets[0]?.data || [];
            break;
        case ChartType.SCATTER:
            apexChartType = 'scatter';
            series = datasets.map(ds => ({ name: ds.label, data: (ds.data || []).map(d => d ? [d.x, d.y] : null).filter(Boolean) }));
            break;
        case ChartType.BUBBLE:
            apexChartType = 'bubble';
            series = datasets.map(ds => ({ name: ds.label, data: (ds.data || []).map(d => d ? [d.x, d.y, d.r] : null).filter(Boolean) }));
            break;
        case ChartType.TREEMAP:
            apexChartType = 'treemap';
            options.legend!.show = false;
            options.plotOptions = { treemap: { distributed: true, enableShades: false }};
            series = [{ data: datasets[0]?.data.map((d: any) => ({ x: d.name, y: d.value })) || [] }];
            break;
        case ChartType.BOXPLOT:
            apexChartType = 'boxPlot';
            series = [{ name: datasets[0]?.label || 'BoxPlot', data: labels.map((label, i) => {
                const dataPoint = datasets[0]?.data[i];
                if (!dataPoint) return null;
                return { x: label, y: [dataPoint.min, dataPoint.q1, dataPoint.median, dataPoint.q3, dataPoint.max]};
            }).filter(Boolean) }];
            break;
        case ChartType.FUNNEL:
            apexChartType = 'bar';
            options.plotOptions = { bar: { borderRadius: 0, horizontal: true, barHeight: '80%', isFunnel: true } };
            options.xaxis = { categories: labels };
            options.yaxis = { labels: { show: false } };
            series = [{ name: datasets[0]?.label || 'Funnel', data: datasets[0]?.data || [] }];
            break;
        case ChartType.DUAL_AXIS:
            apexChartType = 'line'; // Mixed chart type base
            const valuesCount = widget.shelves.values.length;
            series = datasets.map((ds, i) => {
                const type = i < valuesCount ? 'bar' : 'line';
                return { name: ds.label, type, data: ds.data };
            });
            options.stroke = { width: datasets.map((_, i) => (i < valuesCount ? 0 : 3)), curve: 'smooth' };
            options.yaxis = [
                {
                    seriesName: datasets[0]?.label,
                    title: { text: widget.shelves.values[0]?.simpleName },
                    labels: { formatter: (val) => formatValue(val, widget.shelves.values[0]?.formatting) }
                },
                {
                    seriesName: datasets[valuesCount]?.label,
                    opposite: true,
                    title: { text: widget.shelves.values2?.[0]?.simpleName },
                    labels: { formatter: (val) => formatValue(val, widget.shelves.values2?.[0]?.formatting) }
                }
            ];
            break;
        case ChartType.RADAR:
            apexChartType = 'radar';
            series = datasets.map(ds => ({ name: ds.label, data: ds.data }));
            break;
        case ChartType.GAUGE:
            apexChartType = 'radialBar';
            series = datasets[0]?.data || [];
            options.plotOptions = {
                radialBar: {
                    hollow: {
                        size: '70%',
                    },
                    dataLabels: {
                        name: {
                            show: false,
                        },
                        value: {
                            formatter: (val: number) => {
                                const pill = widget.shelves.values[0];
                                return pill ? formatValue(val, pill.formatting, pill.aggregation) : formatValue(val);
                            },
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: themeConfig.mode === 'dark' ? '#e2e8f0' : '#334155',
                        }
                    }
                }
            };
            options.labels = [datasets[0]?.label || ''];
            break;
        default:
            apexChartType = 'bar';
            series = datasets.map(ds => ({ name: ds.label, data: ds.data }));
    }
    
    // Final checks
    if (widget.shelves.values.length > 1 && chartType === ChartType.BAR && !shouldStack) {
         options.plotOptions = { ...(options.plotOptions || {}), bar: { ...(options.plotOptions?.bar || {}), columnWidth: '55%' } };
    }
    
    return (
        <div ref={chartWrapperRef} className="w-full h-full">
            <ApexChart options={options} series={series} type={apexChartType} height="100%" width="100%" />
        </div>
    );
};