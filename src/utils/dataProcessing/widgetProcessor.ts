import _ from 'lodash';
import { WidgetState, Pill, AggregationType, TableRow, ProcessedData, Parameter, ChartType, CrossFilterState, HeaderCell, ControlFilterState } from '../types';
import { applyFilters } from './filtering';
import { formatValue } from './formatting';

function groupByTyped<T>(collection: readonly T[], iteratee: (item: T) => any): Map<any, T[]> {
    const map = new Map<any, T[]>();
    for (const item of collection) {
        const key = iteratee(item);
        if (key === undefined || key === null) continue;
        let group = map.get(key);
        if (!group) {
            group = [];
            map.set(key, group);
        }
        group.push(item);
    }
    return map;
}

const aggregate = (values: any[], agg: AggregationType): number | null => {
    const numericValues = values.filter(v => typeof v === 'number' && isFinite(v)) as number[];
    if (numericValues.length === 0 && agg !== AggregationType.COUNT) return null;

    switch (agg) {
        case AggregationType.SUM: return _.sum(numericValues);
        case AggregationType.AVERAGE: return _.mean(numericValues);
        case AggregationType.COUNT: return values.length;
        case AggregationType.MIN: return _.min(numericValues);
        case AggregationType.MAX: return _.max(numericValues);
        default: return null;
    }
};

export const generateTitle = (widget: WidgetState): string => {
    const { chartType, shelves } = widget;

    const chartPart = chartType === ChartType.TABLE ? 'Table' : `${chartType} Chart`;
    if (chartType === ChartType.KPI) {
        const valuePill = (shelves.values || [])[0];
        return valuePill ? `${_.startCase(valuePill.aggregation.toLowerCase())} of ${valuePill.simpleName}` : 'KPI';
    }

    if (!shelves || (_.isEmpty(shelves.rows) && _.isEmpty(shelves.columns) && _.isEmpty(shelves.values))) {
        return chartType;
    }

    const valuePills = shelves.values || [];
    const dimensionPills = [...(shelves.rows || []), ...(shelves.columns || [])];

    const valuePart = valuePills.map(p => `${_.startCase(p.aggregation.toLowerCase())} of ${p.simpleName}`).join(' and ');
    
    const dimensionPart = dimensionPills.length > 0
        ? `${dimensionPills.map(p => p.simpleName).join(' and ')} wise`
        : '';

    const titleParts = [valuePart, dimensionPart].filter(Boolean);
    
    if (titleParts.length === 0) {
        return chartPart;
    }
    
    return `${titleParts.join(' ')} | ${chartPart}`;
};

export const processWidgetData = (
    data: any[],
    widget: WidgetState,
    globalFilters: Pill[],
    crossFilter: CrossFilterState,
    parameters: Parameter[],
    controlFilters?: ControlFilterState
): ProcessedData => {

    if (!widget.shelves) {
        return { type: 'nodata', message: 'Widget is not configured properly.' };
    }

    if (data.length === 0) {
        return { type: 'nodata', message: 'No data available.' };
    }
    
    const effectiveChartType = widget.displayMode === 'table' ? ChartType.TABLE : widget.chartType;
    const subtotalSettings = { rows: false, columns: false, grandTotal: true, ...widget.subtotalSettings };

    const controlFilterValues = controlFilters ? Array.from(controlFilters.values()).filter(cf => cf.id !== widget.id) : [];
    const allFilters = [...globalFilters, ...(widget.shelves.filters || []), ...(crossFilter ? [crossFilter.filter] : []), ...controlFilterValues];
    let filteredData: any[] = applyFilters(data, allFilters);

    if (widget.drillPath && widget.drillPath.length > 0) {
        widget.drillPath.forEach(level => {
            filteredData = filteredData.filter(row => row[level.fieldName] === level.value);
        });
    }
    
    if(widget.forecasting?.enabled && [ChartType.LINE, ChartType.AREA, ChartType.BAR].includes(effectiveChartType)) {
        // Forecasting logic is now handled in mockApiService to simulate backend processing
    }

    if (filteredData.length === 0) {
        return { type: 'nodata', message: 'No data matches the current filters.' };
    }

    switch (effectiveChartType) {
        case ChartType.GAUGE: {
            const valuePill = (widget.shelves.values || [])[0];
            if (!valuePill) return { type: 'nodata', message: 'Please add a measure to the Gauge chart.' };

            const value = aggregate(filteredData.map(row => row[valuePill.name]), valuePill.aggregation);
            
            return {
                type: 'chart',
                labels: [valuePill.simpleName],
                datasets: [{
                    label: valuePill.simpleName,
                    data: [value],
                    valuePillName: valuePill.name
                }],
                chartType: ChartType.GAUGE
            };
        }
        case ChartType.SANKEY: {
            const dimensionPills = widget.shelves.rows || [];
            const valuePill = (widget.shelves.values || [])[0];

            if (dimensionPills.length < 2 || !valuePill) {
                return { type: 'nodata', message: 'Sankey charts require at least two dimensions on Rows and one measure on Values.' };
            }

            const nodesSet = new Set<string>();
            dimensionPills.forEach(pill => {
                filteredData.forEach(row => {
                    const value = row[pill.name];
                    if (value !== null && value !== undefined && value !== '') {
                        nodesSet.add(String(value));
                    }
                });
            });
            const nodes = Array.from(nodesSet).map(name => ({ name }));

            const linksMap = new Map<string, number>();
            for (let i = 0; i < dimensionPills.length - 1; i++) {
                const sourcePill = dimensionPills[i];
                const targetPill = dimensionPills[i + 1];

                const grouped = groupByTyped(filteredData, row => `${row[sourcePill.name]}|${row[targetPill.name]}`);
                
                grouped.forEach((groupData, key) => {
                    const [source, target] = String(key).split('|');
                    if (source === 'null' || target === 'null' || source === '' || target === '') return;
                    
                    const value = aggregate(groupData.map(r => r[valuePill.name]), valuePill.aggregation);
                     if (source && target && value !== null) {
                        const linkKey = `${source}|${target}`;
                        linksMap.set(linkKey, (linksMap.get(linkKey) || 0) + value);
                    }
                });
            }

            const links = Array.from(linksMap.entries()).map(([key, value]) => {
                const [source, target] = key.split('|');
                return { source, target, value };
            });

            return { type: 'sankey', nodes, links };
        }
        case ChartType.KPI: {
            const primaryPill = (widget.shelves.values || [])[0];
            if (!primaryPill) return { type: 'nodata', message: 'Please add a measure to the KPI.' };

            const primaryValue = aggregate(filteredData.map(row => row[primaryPill.name]), primaryPill.aggregation);
            return {
                type: 'kpi',
                primaryValue: {
                    value: primaryValue,
                    label: `${primaryPill.aggregation}(${primaryPill.simpleName})`,
                    formatted: formatValue(primaryValue, primaryPill.formatting),
                }
            };
        }
        case ChartType.HEATMAP: {
             const rowPill = (widget.shelves.rows || [])[0];
             const colPill = (widget.shelves.columns || [])[0];
             const valuePill = (widget.shelves.values || [])[0];
             if (!rowPill || !colPill || !valuePill) return { type: 'nodata', message: 'Heatmap requires a row, a column, and a value.' };

             const rowLabels = _.uniq(filteredData.map(r => r[rowPill.name])).sort();
             const colLabels = _.uniq(filteredData.map(r => r[colPill.name])).sort();
             
             const grouped = _.groupBy(filteredData, r => `${r[rowPill.name]}|${r[colPill.name]}`);
             
             const matrix = rowLabels.map(rowLabel => {
                 return colLabels.map(colLabel => {
                     const group = grouped[`${rowLabel}|${colLabel}`];
                     return group && Array.isArray(group) ? aggregate(group.map(g => g[valuePill.name]), valuePill.aggregation) : null;
                 });
             });
             
             return { type: 'heatmap', rowLabels, colLabels, data: matrix, valuePill };
        }
        case ChartType.TABLE: {
            const rowPills = widget.shelves.rows || [];
            const colPills = widget.shelves.columns || [];
            const valuePills = widget.shelves.values || [];

            if (rowPills.length === 0 && valuePills.length === 0) {
                return { type: 'nodata', message: 'Add at least one field to Rows or Values.' };
            }

            const pivotMeasureLayout = widget.tableSettings?.pivotMeasureLayout || 'horizontal';
            
            if (pivotMeasureLayout === 'vertical' && colPills.length > 0) {
                // --- VERTICAL PIVOT LAYOUT ---
                const allValueFields = [...(widget.shelves.values || []), ...(widget.shelves.values2 || [])];
                const allColPills = widget.shelves.columns || [];
                const allRowPills = widget.shelves.rows || [];

                const uniqueColValues = _.uniqBy(filteredData.map(row => {
                    const values: { [key: string]: any } = {};
                    allColPills.forEach(p => values[p.name] = row[p.name]);
                    return values;
                }), JSON.stringify);
                
                const headerRows: HeaderCell[][] = [[]];
                allRowPills.forEach(p => headerRows[0].push({ label: p.simpleName, key: p.name, rowSpan: 2, colSpan: 1 }));

                allValueFields.forEach(vf => {
                    headerRows[0].push({ label: vf.simpleName, key: `group-${vf.name}`, rowSpan: 1, colSpan: uniqueColValues.length + (subtotalSettings.columns !== false ? 1 : 0), isMeasureGroup: true });
                });
                
                headerRows.push([]); // second row of headers
                allValueFields.forEach(vf => {
                    uniqueColValues.forEach(cv => {
                        const label = allColPills.map(p => cv[p.name]).join(' - ');
                        headerRows[1].push({ label, key: `${vf.name}|${label}`, rowSpan: 1, colSpan: 1 });
                    });
                     if(subtotalSettings.columns !== false) {
                        headerRows[1].push({ label: 'Total', key: `${vf.name}|row_total`, rowSpan: 1, colSpan: 1 });
                    }
                });
                
                const columnOrder = [
                    ...allRowPills.map(p => p.name),
                    ...allValueFields.flatMap(vf => [
                        ...uniqueColValues.map(cv => `${vf.name}|${allColPills.map(p => cv[p.name]).join(' - ')}`),
                        ...(subtotalSettings.columns !== false ? [`${vf.name}|row_total`] : [])
                    ])
                ];

                const rows: TableRow[] = [];
                // This logic is simplified for brevity. A full implementation would handle nested subtotals.
                const groupedByRow = groupByTyped(filteredData, item => allRowPills.map(p => item[p.name]).join('|'));

                Array.from(groupedByRow.keys()).forEach(rowKey => {
                    const groupData = groupedByRow.get(rowKey) || [];
                    const dataRow: TableRow = { type: 'data', values: {}, level: 0, path: rowKey };
                    
                    allRowPills.forEach((p, i) => {
                        dataRow.values[p.name] = rowKey.split('|')[i];
                    });
                    
                    allValueFields.forEach(vf => {
                        uniqueColValues.forEach(cv => {
                            const filteredGroup = groupData.filter(row => allColPills.every(p => row[p.name] === cv[p.name]));
                            const key = `${vf.name}|${allColPills.map(p => cv[p.name]).join(' - ')}`;
                            dataRow.values[key] = aggregate(filteredGroup.map(r => r[vf.name]), vf.aggregation);
                        });
                        if(subtotalSettings.columns !== false) {
                            dataRow.values[`${vf.name}|row_total`] = aggregate(groupData.map(r => r[vf.name]), vf.aggregation);
                        }
                    });
                    rows.push(dataRow);
                });

                if (subtotalSettings.grandTotal !== false) {
                    const grandTotalRow: TableRow = { type: 'grandtotal', values: {} };
                    grandTotalRow.values[allRowPills[0]?.name || ''] = 'Grand Total';
                    
                    allValueFields.forEach(vf => {
                        uniqueColValues.forEach(cv => {
                            const filteredGroup = filteredData.filter(row => allColPills.every(p => row[p.name] === cv[p.name]));
                            const key = `${vf.name}|${allColPills.map(p => cv[p.name]).join(' - ')}`;
                            grandTotalRow.values[key] = aggregate(filteredGroup.map(r => r[vf.name]), vf.aggregation);
                        });
                        if(subtotalSettings.columns !== false) {
                            grandTotalRow.values[`${vf.name}|row_total`] = aggregate(filteredData.map(r => r[vf.name]), vf.aggregation);
                        }
                    });
                    rows.push(grandTotalRow);
                }

                return { type: 'table', headerRows, rows, columnOrder };

            } else {
                // --- HORIZONTAL PIVOT LAYOUT (OR FLAT TABLE) ---
                let uniqueColumnValues = colPills.length > 0
                    ? _.uniqWith(filteredData.map(row => {
                        const values: { [key: string]: any } = {};
                        colPills.forEach(p => { values[p.name] = row[p.name]; });
                        return values;
                    }), _.isEqual)
                    : [];
                
                if (colPills.length > 0 && colPills[0]) {
                    uniqueColumnValues = _.orderBy(uniqueColumnValues, colPills.map(p => p.name));
                }

                const headerRows: HeaderCell[][] = [[]];
                const isPivot = colPills.length > 0 && valuePills.length > 0;
                const isMultiMeasurePivot = isPivot && valuePills.length > 1;
                const isSingleMeasurePivot = isPivot && valuePills.length === 1;

                if (isPivot) {
                    headerRows.push([]);
                }

                rowPills.forEach(rp => {
                    headerRows[0].push({ label: rp.simpleName, key: rp.name, rowSpan: isPivot ? 2 : 1, colSpan: 1 });
                });

                if (isSingleMeasurePivot) {
                    const measure = valuePills[0];
                    headerRows[0].push({ label: measure.simpleName, key: `group-${measure.name}`, rowSpan: 1, colSpan: uniqueColumnValues.length, isMeasureGroup: true });
                    uniqueColumnValues.forEach(cv => {
                        const label = colPills.map(p => cv[p.name]).join(' - ');
                        const key = `${measure.name}|${colPills.map(p => cv[p.name]).join('|')}`;
                        headerRows[1].push({ label, key, colSpan: 1, rowSpan: 1 });
                    });
                } else if (isMultiMeasurePivot) {
                    uniqueColumnValues.forEach(cv => {
                        const label = colPills.map(p => cv[p.name]).join(' - ');
                        headerRows[0].push({ label, key: `group-${label}`, colSpan: valuePills.length, rowSpan: 1, isMeasureGroup: true });
                    });
                    uniqueColumnValues.forEach((cv) => {
                        const colValueKey = colPills.map(p => cv[p.name]).join('|');
                        valuePills.forEach(vp => {
                            const fullKey = `${vp.name}|${colValueKey}`;
                            headerRows[1].push({ label: vp.simpleName, key: fullKey, colSpan: 1, rowSpan: 1 });
                        });
                    });
                } else { // Not a pivot table, just list value pills
                    valuePills.forEach(vp => {
                        headerRows[0].push({ label: vp.simpleName, key: vp.name, colSpan: 1, rowSpan: 1 });
                    });
                }
                
                const shouldAddGrandTotal = isPivot && subtotalSettings.columns !== false;
                if (shouldAddGrandTotal) {
                    if (isSingleMeasurePivot) {
                        headerRows[0].push({ label: 'Grand Total', key: `value|grand_total`, rowSpan: 2, colSpan: 1 });
                    } else { // Multi-measure
                        headerRows[0].push({ label: 'Grand Total', key: 'grand_total_header', rowSpan: 1, colSpan: valuePills.length, isMeasureGroup: true });
                        valuePills.forEach(vp => {
                            headerRows[1].push({ label: vp.simpleName, key: `${vp.name}|grand_total`, colSpan: 1, rowSpan: 1 });
                        });
                    }
                }
                
                const columnOrder: string[] = [
                    ...rowPills.map(p => p.name),
                ];
                if (colPills.length > 0) {
                     columnOrder.push(...uniqueColumnValues.flatMap(cv => valuePills.map(vp => `${vp.name}|${colPills.map(p => cv[p.name]).join('|')}`)));
                } else {
                     columnOrder.push(...valuePills.map(vp => vp.name));
                }

                if (shouldAddGrandTotal) {
                    columnOrder.push(...valuePills.map(vp => `${vp.name}|grand_total`));
                }
                
                const rows: TableRow[] = [];
                const processGroup = (data: any[], level: number, path: string) => {
                    if (rowPills.length > 0 && level >= rowPills.length) {
                        return; // Base case for multi-level hierarchies
                    }
                
                    const groupPill = rowPills[level];
                    const grouped = rowPills.length > 0 ? groupByTyped(data, item => item[groupPill.name]) : new Map([['all', data]]);
                    const isLastLevel = level === rowPills.length - 1;
                
                    grouped.forEach((groupData, groupKey) => {
                        const currentPath = path ? `${path}|${groupKey}` : String(groupKey);
                        const isLeafNode = isLastLevel || rowPills.length === 0;

                        if (isLeafNode) {
                            const dataRow: TableRow = { type: 'data', values: {}, level: level, path: currentPath };
                            if (rowPills.length > 0) {
                                rowPills.forEach((p, i) => {
                                    dataRow.values[p.name] = currentPath.split('|')[i];
                                });
                            }
                
                            valuePills.forEach(vp => {
                                if (colPills.length > 0) {
                                    uniqueColumnValues.forEach(cv => {
                                        const filteredGroup = groupData.filter(row => colPills.every(p => row[p.name] === cv[p.name]));
                                        const key = `${vp.name}|${colPills.map(p => cv[p.name]).join('|')}`;
                                        const value = aggregate(filteredGroup.map(r => r[vp.name]), vp.aggregation);
                                        dataRow.values[key] = value;
                                    });
                                    if (shouldAddGrandTotal) {
                                        const rowTotalValue = aggregate(groupData.map(r => r[vp.name]), vp.aggregation);
                                        dataRow.values[`${vp.name}|grand_total`] = rowTotalValue;
                                    }
                                } else {
                                    dataRow.values[vp.name] = aggregate(groupData.map(r => r[vp.name]), vp.aggregation);
                                }
                            });
                            rows.push(dataRow);
                        }
                        
                        if (!isLeafNode) { // It's a parent group, process subtotals and recurse
                            if (subtotalSettings.rows) {
                                const subtotalRow: TableRow = { type: 'subtotal', values: {}, level, path: currentPath, isExpandable: true };
                                rowPills.forEach((p, i) => subtotalRow.values[p.name] = (i === level) ? groupKey : null);
                
                                valuePills.forEach(vp => {
                                    if (colPills.length > 0) {
                                        uniqueColumnValues.forEach(cv => {
                                            const filteredGroup = groupData.filter(row => colPills.every(p => row[p.name] === cv[p.name]));
                                            const key = `${vp.name}|${colPills.map(p => cv[p.name]).join('|')}`;
                                            subtotalRow.values[key] = aggregate(filteredGroup.map(r => r[vp.name]), vp.aggregation);
                                        });
                                        if (shouldAddGrandTotal) {
                                             const rowTotalValue = aggregate(groupData.map(r => r[vp.name]), vp.aggregation);
                                             subtotalRow.values[`${vp.name}|grand_total`] = rowTotalValue;
                                        }
                                    } else {
                                        subtotalRow.values[vp.name] = aggregate(groupData.map(r => r[vp.name]), vp.aggregation);
                                    }
                                });
                                rows.push(subtotalRow);
                            }
                            processGroup(groupData, level + 1, currentPath);
                        }
                    });
                };
                
                if (rowPills.length > 0) {
                    filteredData = _.orderBy(filteredData, rowPills.map(p => p.name));
                }
                processGroup(filteredData, 0, '');

                // Grand Total
                if (subtotalSettings.grandTotal !== false) {
                    const grandTotalRow: TableRow = { type: 'grandtotal', values: {} };
                    if (rowPills.length > 0) {
                        grandTotalRow.values[rowPills[0].name] = 'Grand Total';
                        for (let i = 1; i < rowPills.length; i++) {
                            grandTotalRow.values[rowPills[i].name] = null;
                        }
                    } else if (columnOrder.length > 0) {
                        const firstColumnKey = columnOrder[0];
                        grandTotalRow.values[firstColumnKey] = 'Grand Total';
                    }

                    valuePills.forEach(vp => {
                        if (colPills.length > 0) {
                            uniqueColumnValues.forEach(colValues => {
                                const key = `${vp.name}|${colPills.map(p => colValues[p.name]).join('|')}`;
                                const groupForTotal = filteredData.filter(r => colPills.every(p => r[p.name] === colValues[p.name]));
                                const colTotal = aggregate(groupForTotal.map(r => r[vp.name]), vp.aggregation);
                                grandTotalRow.values[key] = colTotal;
                            });
                            if (shouldAddGrandTotal) {
                                 const grandTotalValue = aggregate(filteredData.map(r => r[vp.name]), vp.aggregation);
                                 grandTotalRow.values[`${vp.name}|grand_total`] = grandTotalValue;
                            }
                        } else {
                            grandTotalRow.values[vp.name] = aggregate(filteredData.map(r => r[vp.name]), vp.aggregation);
                        }
                    });

                    rows.push(grandTotalRow);
                }

                return { type: 'table', headerRows, rows, columnOrder };
            }
        }
        default: {
            if (effectiveChartType === ChartType.TREEMAP) {
                const categoryPills = widget.shelves.rows || [];
                const valuePill = (widget.shelves.values || [])[0];
    
                if (categoryPills.length === 0 || !valuePill) {
                    return { type: 'nodata', message: 'Treemap requires at least one dimension on Rows and one measure on Values.' };
                }
    
                const createNestedData = (data: any[], level: number): any[] => {
                    if (level >= categoryPills.length) {
                        return [];
                    }
                    const pill = categoryPills[level];
                    const grouped = groupByTyped(data, item => item[pill.name]);
    
                    return Array.from(grouped.entries()).map(([name, groupData]) => {
                        const children = createNestedData(groupData, level + 1);
                        const aggregatedValue = aggregate(groupData.map(item => item[valuePill.name]), valuePill.aggregation) || 0;
                
                        const node: { name: string; value: number; children?: any[] } = {
                            name: String(name),
                            value: aggregatedValue,
                        };
                
                        if (children.length > 0) {
                            node.children = children;
                        }
                
                        return node;
                    });
                };
    
                const treemapData = createNestedData(filteredData, 0);
    
                return {
                    type: 'chart',
                    labels: [], 
                    datasets: [{
                        label: valuePill.simpleName,
                        data: treemapData,
                        valuePillName: valuePill.name
                    }],
                    chartType: ChartType.TREEMAP
                };
            }

            const rowPills = widget.shelves.rows || [];
            const colPills = widget.shelves.columns || [];
            const valuePills = [...(widget.shelves.values || []), ...(widget.shelves.values2 || [])];
            
            if (valuePills.length === 0) return { type: 'nodata', message: 'Please add a measure to the Values shelf.' };
            
            if (effectiveChartType === ChartType.SCATTER || effectiveChartType === ChartType.BUBBLE) {
                const xPill = (widget.shelves.columns || [])[0];
                const yPill = (widget.shelves.rows || [])[0];
                const sizePill = (widget.shelves.values || [])[0];
                const catPill = (widget.shelves.category || [])[0];

                if (!xPill || !yPill || (effectiveChartType === ChartType.BUBBLE && !sizePill)) {
                    return { type: 'nodata', message: 'Scatter/Bubble charts require measures on X, Y, and (for Bubble) Values shelves.' };
                }

                const labels = catPill ? _.uniq(filteredData.map(r => r[catPill.name])) : ['All'];
                const datasets = labels.map(label => {
                    const dataForLabel = catPill ? filteredData.filter(r => r[catPill.name] === label) : filteredData;
                    return {
                        label: String(label),
                        data: dataForLabel
                            .map(r => ({
                                x: r[xPill.name],
                                y: r[yPill.name],
                                r: effectiveChartType === ChartType.BUBBLE && sizePill ? r[sizePill.name] : 5,
                                category: catPill ? r[catPill.name] : 'All'
                            }))
                            .filter(d => d.x != null && d.y != null)
                    };
                });
                return { type: 'chart', labels, datasets, chartType: effectiveChartType };
            }
            
            if(effectiveChartType === ChartType.BOXPLOT) {
                const catPill = (widget.shelves.rows || [])[0];
                const valPill = (widget.shelves.values || [])[0];
                if(!valPill) return { type: 'nodata', message: 'Box Plot requires a measure on the Values shelf.'};
                
                let labels: any[];
                let groupedData: Map<any, any[]>;

                if(catPill) {
                    labels = _.uniq(filteredData.map(r => r[catPill.name])).sort();
                    groupedData = groupByTyped(filteredData, item => item[catPill.name]);
                } else {
                    labels = [valPill.simpleName];
                    groupedData = new Map([[valPill.simpleName, filteredData]]);
                }
                
                const datasets = [{
                    label: valPill.simpleName,
                    data: labels.map(l => {
                        const group = groupedData.get(l) || [];
                        const values = group.map(i => i[valPill.name]).filter(v => typeof v === 'number' && isFinite(v));
                        if (values.length === 0) return null;
                        const sorted = values.sort((a,b) => a-b);
                        const q1 = sorted[Math.floor(sorted.length * 0.25)];
                        const median = sorted[Math.floor(sorted.length * 0.5)];
                        const q3 = sorted[Math.floor(sorted.length * 0.75)];
                        return { min: sorted[0], q1, median, q3, max: sorted[sorted.length-1] };
                    }),
                    valuePillName: valPill.name
                }];
                return { type: 'chart', labels, datasets, chartType: effectiveChartType };
            }

            if (rowPills.length > 0 && colPills.length > 0) {
                // Handle multiple dimensions on rows and columns for stacked/grouped charts
                const getRowKey = (item: any) => rowPills.map(p => item[p.name]).join(' | ');
                const groupedByRow = groupByTyped(filteredData, getRowKey);
                const rowLabels = _.sortBy(Array.from(groupedByRow.keys()));
            
                const getColKey = (item: any) => colPills.map(p => item[p.name]).join(' | ');
                const colLabels = _.sortBy(_.uniq(filteredData.map(getColKey)));
            
                const datasets = valuePills.flatMap(valuePill => {
                    return colLabels.map(colLabel => {
                        const dataForCol = rowLabels.map(rowLabel => {
                            const group = groupedByRow.get(rowLabel) || [];
                            const finalGroup = group.filter(r => getColKey(r) === colLabel);
                            return aggregate(finalGroup.map(r => r[valuePill.name]), valuePill.aggregation);
                        });
                        const displayColLabel = colLabel.replace(/ \| /g, ' - ');
                        return {
                            label: valuePills.length > 1 ? `${valuePill.simpleName} - ${displayColLabel}` : displayColLabel,
                            data: dataForCol,
                            valuePillName: valuePill.name
                        };
                    });
                });
                return { type: 'chart', labels: rowLabels, datasets, chartType: effectiveChartType };
            } else {
                const dimensionPills = rowPills.length > 0 ? rowPills : colPills;
                if (dimensionPills.length === 0) {
                     // No dimensions, just show aggregated values
                    const labels = valuePills.map(p => p.simpleName);
                    const data = valuePills.map(p => aggregate(filteredData.map(r => r[p.name]), p.aggregation));
                    const datasets = [{ label: 'Total', data, valuePillName: valuePills[0]?.name }];
                    return { type: 'chart', labels, datasets, chartType: effectiveChartType };
                }
                 // Single dimension
                const dimensionPill = dimensionPills[0];
                const groupedData = groupByTyped(filteredData, item => item[dimensionPill.name]);
                let labels = _.sortBy(Array.from(groupedData.keys()));

                 if(widget.sort && widget.sort.length > 0) {
                    const sortConfig = widget.sort[0];
                    const sortPill = valuePills.find(p => p.name === sortConfig.fieldName || p.simpleName === sortConfig.fieldName);
                    if (sortPill) {
                         const aggregatedForSort = labels.map(label => ({
                            label,
                            value: aggregate(groupedData.get(label)!.map(r => r[sortPill.name]), sortPill.aggregation)
                        }));
                        labels = _.orderBy(aggregatedForSort, 'value', sortConfig.order).map(item => item.label);
                    } else if (sortConfig.fieldName === dimensionPill.name) {
                        labels = _.orderBy(labels, [], [sortConfig.order]);
                    }
                }
                
                const datasets = valuePills.map(valuePill => {
                    const data = labels.map(label => {
                        const group = groupedData.get(label) || [];
                        return aggregate(group.map(item => item[valuePill.name]), valuePill.aggregation);
                    });
                    return { label: valuePill.simpleName, data, valuePillName: valuePill.name };
                });
                return { type: 'chart', labels, datasets, chartType: effectiveChartType };
            }
        }
    }
};
