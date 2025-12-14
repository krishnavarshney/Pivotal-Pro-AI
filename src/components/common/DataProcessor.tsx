import React, { useMemo, useState, useEffect, useRef, useCallback, useLayoutEffect, CSSProperties, MouseEvent as ReactMouseEvent, Fragment, FC } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { WidgetState, ProcessedData, TableRow, ChartType, Pill, AggregationType, FilterCondition, ContextMenuItem, SortConfig, DND_ITEM_TYPE, HeaderCell, ChartLibrary } from '../../utils/types';
import { formatValue } from '../../utils/dataProcessing/formatting';
import * as mockApiService from '../../services/mockApiService';
import { Home, ZoomIn, ZoomOut, Check, ChevronRight, ArrowUp, ArrowDown, ChevronDown, GripVertical } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow as UITableRow, TableHead, TableCell, TableFooter } from '../ui/Table';
import { WidgetSkeleton } from '../ui/WidgetSkeleton';
import { RechartsComponent } from '../charts/RechartsComponent';
import { ApexChartsComponent } from '../charts/ApexChartsComponent';
import { EChartsComponent } from '../charts/EChartsComponent';
import { cn } from '../ui/utils';
import { useDrag, useDrop } from 'react-dnd';

const HeatmapComponent: FC<{ data: ProcessedData, theme: 'light' | 'dark' }> = ({ data, theme }) => {
    if (data.type !== 'heatmap') return null;

    const { rowLabels, colLabels, data: matrix, valuePill } = data;
    
    const allValues = matrix.flat().filter(v => v !== null) as number[];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    const getHslColor = (value: number | null) => {
        if (value === null) return 'transparent';
        if (min === max) return theme === 'dark' ? 'hsl(210, 50%, 50%)' : 'hsl(215, 90%, 60%)';

        const percentage = (value - min) / (max - min);
        const hue = theme === 'dark' ? 210 : 215; // Blue
        const saturation = theme === 'dark' ? 60 : 85;
        const lightness = theme === 'dark' ? (15 + percentage * 45) : (95 - percentage * 55);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };
    
     const getTextColor = (value: number | null) => {
        if (value === null) return 'inherit';
        if (min === max) return 'white';
        const percentage = (value - min) / (max - min);
        if (theme === 'light') return percentage > 0.6 ? 'white' : 'black';
        return percentage < 0.5 ? 'white' : 'black';
    };

    return (
        <div className="overflow-auto h-full p-4">
            <Table>
                <TableHeader>
                    <UITableRow>
                        <TableHead className="sticky left-0 bg-card"></TableHead>
                        {colLabels.map(label => (
                            <TableHead key={label} className="text-center">{label}</TableHead>
                        ))}
                    </UITableRow>
                </TableHeader>
                <TableBody>
                    {rowLabels.map((label, rowIndex) => (
                        <UITableRow key={label}>
                            <TableHead className="sticky left-0 bg-card">{label}</TableHead>
                            {colLabels.map((_, colIndex) => {
                                const value = matrix[rowIndex][colIndex];
                                return (
                                    <TableCell 
                                        key={colIndex}
                                        style={{ backgroundColor: getHslColor(value), color: getTextColor(value) }}
                                        className="text-center font-medium"
                                        title={`${label} - ${colLabels[colIndex]}: ${formatValue(value, valuePill.formatting, valuePill.aggregation)}`}
                                    >
                                        {formatValue(value, valuePill.formatting, valuePill.aggregation)}
                                    </TableCell>
                                );
                            })}
                        </UITableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const KpiCard: FC<{ data: ProcessedData }> = ({ data }) => {
    if (data.type !== 'kpi') return null;
    const { primaryValue, secondaryValue } = data;
    
    let comparisonElement = null;
    if (secondaryValue && secondaryValue.value !== null && primaryValue.value !== null) {
        const diff = primaryValue.value - secondaryValue.value;
        const percentChange = secondaryValue.value !== 0 ? (diff / Math.abs(secondaryValue.value)) * 100 : 0;
        const isPositive = diff >= 0;

        comparisonElement = (
            <div className={`mt-2 text-base font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '▲' : '▼'} {formatValue(Math.abs(percentChange), {decimalPlaces: 1, suffix: '%'})} vs {secondaryValue.label}
            </div>
        )
    }

    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center p-6">
                <p className="text-xl font-semibold text-muted-foreground">{primaryValue.label}</p>
                <p className="text-7xl font-bold font-display text-foreground my-2 tracking-tighter">{primaryValue.formatted}</p>
                {comparisonElement}
            </div>
        </div>
    );
}

const DrilldownBreadcrumb: FC<{ widget: WidgetState; onDrillUp: (level: number) => void }> = ({ widget, onDrillUp }) => {
    const { blendedFields } = useDashboard();
    const drillPath = widget.drillPath || [];
    if (drillPath.length === 0) return null;

    return (
        <div className="glass-panel rounded-b-none rounded-t-xl flex items-center gap-1 text-sm text-muted-foreground py-2 px-4 border-b flex-shrink-0">
            <button onClick={() => onDrillUp(-1)} className="p-1.5 rounded-md hover:bg-accent text-primary" title="Drill up to top level">
                <span className="icon-hover-anim inline-block"><Home size={14} /></span>
            </button>
            {drillPath.map((level, i) => {
                const field = [...blendedFields.dimensions, ...blendedFields.measures].find(f => f.name === level.fieldName);
                return (
                    <Fragment key={i}>
                        <ChevronRight size={12} />
                        <button onClick={() => onDrillUp(i)} className="px-2 py-1 rounded-md hover:bg-accent text-primary" title={`Drill up to ${field?.simpleName || level.fieldName}`}>
                            {field?.simpleName || level.fieldName}: <span className="font-semibold text-foreground">{formatValue(level.value)}</span>
                        </button>
                    </Fragment>
                );
            })}
        </div>
    );
}

const DraggableHeader: FC<{
    header: HeaderCell;
    isDimension: boolean;
    sortState?: SortConfig;
    onSort: (key: string) => void;
    onMove: (dragKey: string, dropKey: string) => void;
    onContextMenu: (e: ReactMouseEvent) => void;
    stickyLeft?: number;
    showGrid: boolean;
    themeClasses: string;
    style?: CSSProperties;
}> = ({ header, isDimension, sortState, onSort, onMove, onContextMenu, stickyLeft, showGrid, themeClasses, style }) => {
    const ref = useRef<HTMLTableCellElement>(null);

    const [{ isDragging }, drag] = useDrag({
        type: DND_ITEM_TYPE.TABLE_COLUMN,
        item: { key: header.key },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });

    const [, drop] = useDrop({
        accept: DND_ITEM_TYPE.TABLE_COLUMN,
        hover: (item: { key: string }) => {
            if (item.key !== header.key) {
                onMove(item.key, header.key);
            }
        },
    });

    drag(drop(ref));
    
    const isSortable = !header.isMeasureGroup && header.key;

    return (
        <TableHead
            ref={ref}
            key={header.key}
            colSpan={header.colSpan}
            rowSpan={header.rowSpan}
            onContextMenu={onContextMenu}
            style={{
                position: stickyLeft !== undefined ? 'sticky' : undefined,
                left: stickyLeft,
                zIndex: stickyLeft !== undefined ? 35 : undefined,
                opacity: isDragging ? 0.5 : 1,
                ...style
            }}
            className={cn(
                "p-0 text-left group/header",
                "cursor-grab active:cursor-grabbing",
                themeClasses,
                header.isMeasureGroup && "border-b-0",
                showGrid ? "border-r last:border-r-0" : ""
            )}
        >
            <div
                className={cn(
                    "flex items-center px-4 py-2 h-full gap-2",
                    isSortable && "hover:bg-accent",
                    isDimension ? 'justify-start' : 'justify-center',
                    header.isMeasureGroup && "border-b-2 border-border"
                )}
                onClick={() => isSortable && onSort(header.key)}
            >
                <GripVertical size={16} className="text-muted-foreground/30 group-hover/header:text-muted-foreground transition-colors flex-shrink-0 -ml-2" />
                <span>{header.label}</span>
                {sortState && (sortState.order === 'asc' ? <ArrowUp size={14} className="text-primary"/> : <ArrowDown size={14} className="text-primary"/>)}
            </div>
        </TableHead>
    );
};


// Define props for the inner component to decouple it from the context
interface InnerDataProcessorProps {
    widget: WidgetState;
    saveWidget: any;
    crossFilter: any;
    setCrossFilter: any;
    toggleRowCollapse: any;
    collapseAllRows: any;
    expandAllRows: any;
    globalFilters: any;
    parameters: any;
    blendedData: any;
    themeConfig: any;
    openContextMenu: any;
    chartLibrary: any;
    setWidgetPerformance: any;
    refetchCounter: any;
    activePage: any;
    controlFilters: any;
}

const InnerDataProcessor: FC<InnerDataProcessorProps> = React.memo(({ 
    widget, 
    saveWidget, 
    crossFilter, 
    setCrossFilter, 
    toggleRowCollapse, 
    collapseAllRows, 
    expandAllRows,
    globalFilters,
    parameters,
    blendedData,
    themeConfig,
    openContextMenu,
    chartLibrary,
    setWidgetPerformance,
    refetchCounter,
    activePage,
    controlFilters,
}) => {
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [stickyHeaderLeft, setStickyHeaderLeft] = useState<number[]>([]);
    
    const numStickyColumns = useMemo(() => (widget.shelves?.rows || []).length, [widget.shelves?.rows]);
    const collapsedRows = useMemo(() => activePage?.collapsedRows || [], [activePage]);

    // Create a hash of properties that should trigger a data refetch
    const widgetDataHash = JSON.stringify({
        id: widget.id,
        chartType: widget.chartType,
        dataSourceId: widget.dataSourceId,
        shelves: widget.shelves,
        filters: widget.filters,
        sort: widget.sort,
        drillPath: widget.drillPath,
        subtotalSettings: widget.subtotalSettings,
        conditionalFormatting: widget.conditionalFormatting,
    });

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            const startTime = performance.now();
            try {
                const data = await mockApiService.fetchWidgetData(
                    widget,
                    blendedData,
                    globalFilters,
                    crossFilter,
                    parameters,
                    controlFilters
                );
                const endTime = performance.now();
                if (isMounted) {
                    setWidgetPerformance(widget.id, endTime - startTime);
                    setProcessedData(data);
                }
            } catch (error) {
                console.error("Error processing widget data:", error);
                if (isMounted) {
                    setProcessedData({ type: 'nodata', message: 'An error occurred while processing data.' });
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [widgetDataHash, blendedData, globalFilters, crossFilter, parameters, refetchCounter, controlFilters]);
    
    const tableDataForWidget = useMemo(() => {
        if (processedData?.type === 'table') return processedData;
        return null;
    }, [processedData]);
    
    const displayedColumnOrder = useMemo(() => {
        return widget.columnOrder || tableDataForWidget?.columnOrder || [];
    }, [widget.columnOrder, tableDataForWidget]);

    const headerMeta = useMemo(() => {
        if (!tableDataForWidget) return null;
        const { headerRows } = tableDataForWidget;
    
        const keyToHeaderMap = new Map<string, HeaderCell>();
        const grid: (HeaderCell | null)[][] = Array(headerRows.length).fill(null).map(() => []);
    
        headerRows.forEach((row, r) => {
            let c = 0;
            row.forEach(header => {
                keyToHeaderMap.set(header.key, header);
                while (grid[r][c]) { c++; } 
    
                for (let i = 0; i < header.rowSpan; i++) {
                    for (let j = 0; j < header.colSpan; j++) {
                        if (!grid[r + i]) grid[r + i] = [];
                        grid[r + i][c + j] = header;
                    }
                }
            });
        });
        
        const keyToParentKey = new Map<string, string>();
        grid.forEach((row, r) => {
            if (r > 0) {
                row.forEach((header, c) => {
                    if (header) {
                        const parentHeader = grid[r - 1][c];
                        if (parentHeader && parentHeader.key !== header.key) {
                            keyToParentKey.set(header.key, parentHeader.key);
                        }
                    }
                });
            }
        });
    
        return { keyToHeaderMap, keyToParentKey };
    }, [tableDataForWidget]);


    const expandablePaths = useMemo(() => {
        if (!tableDataForWidget) return [];
        return tableDataForWidget.rows.filter(r => r.isExpandable && r.path).map(r => r.path!);
    }, [tableDataForWidget]);

    const bodyRows = useMemo(() => {
        if (!tableDataForWidget) return [];
        return tableDataForWidget.rows.filter(row => {
            if (row.type === 'grandtotal') return false;
            if (!row.path) return true;
            const pathSegments = row.path.split('|');
            const isAnyAncestorCollapsed = pathSegments.slice(0, -1).some((_, i) => {
                const ancestorPath = pathSegments.slice(0, i + 1).join('|');
                return collapsedRows.includes(ancestorPath);
            });
            return !isAnyAncestorCollapsed;
        });
    }, [tableDataForWidget, collapsedRows]);

     useLayoutEffect(() => {
        const calculateLefts = () => {
            if (numStickyColumns === 0 || !tableContainerRef.current) {
                if (stickyHeaderLeft.length > 0) setStickyHeaderLeft([]);
                return;
            }
            const table = tableContainerRef.current.querySelector('table');
            const firstHeaderRow = table?.querySelector('thead tr:last-child');
            if (!firstHeaderRow) return;

            const lefts: number[] = [];
            let cumulativeLeft = 0;
            const children = Array.from(firstHeaderRow.children);
            
            if (children.length >= numStickyColumns) {
                for (let i = 0; i < numStickyColumns; i++) {
                    lefts.push(cumulativeLeft);
                    cumulativeLeft += (children[i] as HTMLElement).offsetWidth;
                }
                if (!_.isEqual(stickyHeaderLeft, lefts)) setStickyHeaderLeft(lefts);
            } else if (stickyHeaderLeft.length > 0) {
                setStickyHeaderLeft([]);
            }
        };
        calculateLefts();
        if (!tableContainerRef.current) return;
        const resizeObserver = new ResizeObserver(_.debounce(calculateLefts, 100));
        resizeObserver.observe(tableContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [numStickyColumns, tableDataForWidget, bodyRows, displayedColumnOrder]);

    const handleElementClick = useCallback((index: number | null, clickedRowData?: TableRow) => {
        if (!widget.isCrossFilterSource) {
            return;
        }
        if (clickedRowData && clickedRowData.type !== 'data') {
            return;
        }
    
        let dimensionPill: Pill | undefined;
        let selectedValue: any;
    
        if (clickedRowData) {
            const rowPills = widget.shelves.rows || [];
            const clickedRowLevel = clickedRowData.level ?? 0;
            dimensionPill = rowPills[clickedRowLevel];
            if (dimensionPill) {
                selectedValue = clickedRowData.values[dimensionPill.name];
            }
        } 
        else if (index !== null && processedData?.type === 'chart') {
            const labels = (processedData as any).labels;
            if (!labels || index >= labels.length) {
                if (crossFilter?.sourceWidgetId === widget.id) setCrossFilter(null);
                return;
            }

            if (widget.chartType === ChartType.SCATTER || widget.chartType === ChartType.BUBBLE) {
                dimensionPill = (widget.shelves.category || [])[0];
            } else {
                dimensionPill = (widget.shelves.rows || [])[0] || (widget.shelves.columns || [])[0];
            }

            if (dimensionPill) {
                selectedValue = (processedData as any).labels[index];
            }
        }
    
        if (selectedValue !== undefined) {
            if (crossFilter?.sourceWidgetId === widget.id && _.isEqual(crossFilter.filter.filter!.values[0], selectedValue)) {
                setCrossFilter(null);
            } else if (dimensionPill) {
                const newFilter: Pill = {
                    id: _.uniqueId('crossfilter_'),
                    name: dimensionPill.name,
                    simpleName: dimensionPill.simpleName,
                    type: dimensionPill.type,
                    aggregation: AggregationType.COUNT,
                    filter: { condition: FilterCondition.IS_ONE_OF, values: [selectedValue] }
                };
                setCrossFilter({ sourceWidgetId: widget.id, filter: newFilter });
            }
        } 
        else if (crossFilter?.sourceWidgetId === widget.id) {
            setCrossFilter(null);
        }
    }, [widget.id, widget.isCrossFilterSource, widget.shelves, processedData, crossFilter, setCrossFilter]);

    const handleDrillDown = useCallback((index: number) => {
        if (processedData?.type !== 'chart') return;
        const drillableDimensions = [...(widget.shelves.rows || []), ...(widget.shelves.columns || [])];
        if (drillableDimensions.length <= (widget.drillPath?.length || 0) + 1) return;
        
        const currentDrillDepth = widget.drillPath?.length || 0;
        const nextDrillField = drillableDimensions[currentDrillDepth];
        const drillValue = (processedData as any).labels[index];
        saveWidget({ ...widget, drillPath: [...(widget.drillPath || []), { fieldName: nextDrillField.name, value: drillValue }] });
    }, [processedData, widget, saveWidget]);
    
    const handleDrillUp = useCallback((level: number) => {
        saveWidget({ ...widget, drillPath: level === -1 ? [] : widget.drillPath?.slice(0, level + 1) });
    }, [widget, saveWidget]);

    const handleHeaderContextMenu = useCallback((e: ReactMouseEvent) => {
        e.preventDefault();
        if (!tableDataForWidget) return;
        const subtotalSettings = { rows: false, columns: false, grandTotal: true, ...widget.subtotalSettings };
        openContextMenu(e.clientX, e.clientY, [
            { label: 'Expand All', icon: <ZoomIn size={16} />, onClick: expandAllRows, disabled: expandablePaths.length === 0 },
            { label: 'Collapse All', icon: <ZoomOut size={16} />, onClick: () => collapseAllRows(expandablePaths), disabled: expandablePaths.length === 0 },
            { label: '---', onClick: () => {} },
            { label: 'Row Subtotals', icon: subtotalSettings.rows ? <Check size={16} /> : <div className="w-4"/>, onClick: () => saveWidget({ ...widget, subtotalSettings: { ...subtotalSettings, rows: !subtotalSettings.rows } }) },
            { label: 'Column Totals', icon: subtotalSettings.columns !== false ? <Check size={16} /> : <div className="w-4"/>, onClick: () => saveWidget({ ...widget, subtotalSettings: { ...subtotalSettings, columns: !(subtotalSettings.columns !== false) } }), disabled: (widget.shelves.columns || []).length === 0 },
            { label: 'Grand Totals', icon: subtotalSettings.grandTotal !== false ? <Check size={16} /> : <div className="w-4"/>, onClick: () => saveWidget({ ...widget, subtotalSettings: { ...subtotalSettings, grandTotal: !(subtotalSettings.grandTotal !== false) } }) },
        ]);
    }, [openContextMenu, expandablePaths, expandAllRows, collapseAllRows, widget, saveWidget, tableDataForWidget]);

    const handleSort = (sortConfig: SortConfig) => {
        saveWidget({ ...widget, sort: [sortConfig] });
    };
    
    const handleMoveColumn = useCallback((dragKey: string, dropKey: string) => {
        if (dragKey === dropKey) return;
        const currentOrder = widget.columnOrder || tableDataForWidget?.columnOrder;
        if (!currentOrder) return;
        
        const newOrder = [...currentOrder];
        const dragIndex = newOrder.indexOf(dragKey);
        const dropIndex = newOrder.indexOf(dropKey);
        
        if (dragIndex === -1 || dropIndex === -1) return;

        const [draggedItem] = newOrder.splice(dragIndex, 1);
        newOrder.splice(dropIndex, 0, draggedItem);
        saveWidget({ ...widget, columnOrder: newOrder });
    }, [widget, tableDataForWidget, saveWidget]);


    const handleElementContextMenu = (event: ReactMouseEvent, index?: number) => {
        event.preventDefault();
        if (index === undefined || !processedData || processedData.type !== 'chart') return;
        
        const menuItems: ContextMenuItem[] = [];
        
        const allPills = [...(widget.shelves.rows || []), ...(widget.shelves.columns || [])];
        if (allPills.length > 0) {
             menuItems.push(
                { label: 'Drill Down', icon: <ZoomIn size={16}/>, onClick: () => handleDrillDown(index), disabled: allPills.length <= (widget.drillPath?.length || 0) + 1 },
                { label: '---', onClick: () => {} },
                { label: `Keep Only "${formatValue((processedData as any).labels[index])}"`, onClick: () => {}, disabled: true },
                { label: `Exclude "${formatValue((processedData as any).labels[index])}"`, onClick: () => {}, disabled: true }
             );
        }
        
        if (menuItems.length > 0) {
            openContextMenu(event.clientX, event.clientY, menuItems);
        }
    };

    const renderContent = () => {
        if (isLoading || !processedData) {
            return <WidgetSkeleton chartType={widget.chartType} />;
        }

        if (processedData.type === 'loading' || processedData.type === 'nodata') {
            return <div className="flex items-center justify-center h-full text-muted-foreground text-center p-4">{processedData.message}</div>;
        }

        if (tableDataForWidget && headerMeta) {
            const { headerRows } = tableDataForWidget;
            const { keyToHeaderMap, keyToParentKey } = headerMeta;
            const tableSettings = { theme: 'modern', striped: true, showGrid: false, ...widget.tableSettings };
            const allValueFields = [...(widget.shelves.values || []), ...(widget.shelves.values2 || [])];
            const showGrid = tableSettings.showGrid !== false;

            const getCellStyle = (row: TableRow, key: string): CSSProperties => {
                const [pillIdOrName] = key.split('|');
                const valuePill = allValueFields.find(p => p.id === pillIdOrName || p.name === pillIdOrName);
                if (!valuePill) return {};
                const cellValue = row.values[key];
                if (typeof cellValue !== 'number') return {};
                const applicableRule = (widget.conditionalFormatting || []).find(rule => {
                    if (rule.measureField !== valuePill.name) return false;
                    switch (rule.condition) {
                        case '>': return cellValue > rule.value; case '<': return cellValue < rule.value;
                        case '=': return cellValue === rule.value; case '>=': return cellValue >= rule.value;
                        case '<=': return cellValue <= rule.value; case '!=': return cellValue !== rule.value;
                        default: return false;
                    }
                });
                return applicableRule ? { backgroundColor: applicableRule.backgroundColor, color: applicableRule.textColor } : {};
            };
            
            return (
                <div ref={tableContainerRef} className="h-full overflow-auto">
                    <Table className="min-w-full border-collapse">
                        <TableHeader className="sticky top-0 z-30">
                            {headerRows.map((_, rowIndex) => (
                                <UITableRow key={rowIndex}>
                                    {(() => {
                                        const cellsToRender = [];
                                        const renderedKeys = new Set<string>();

                                        for (const key of displayedColumnOrder) {
                                            let currentKey: string | undefined = key;
                                            const hierarchy: HeaderCell[] = [];
                                            while (currentKey) {
                                                const header = keyToHeaderMap.get(currentKey);
                                                if (header) {
                                                    hierarchy.unshift(header);
                                                }
                                                currentKey = keyToParentKey.get(currentKey);
                                            }

                                            const headerForThisCell = hierarchy[rowIndex];

                                            if (!headerForThisCell || renderedKeys.has(headerForThisCell.key)) {
                                                continue;
                                            }
                                            
                                            renderedKeys.add(headerForThisCell.key);

                                            const sortState = widget.sort?.find(s => s.fieldName === headerForThisCell.key);
                                            const colIndexInDisplayOrder = displayedColumnOrder.indexOf(key);
                                            const isDimension = colIndexInDisplayOrder !== -1 && colIndexInDisplayOrder < numStickyColumns;
                                            
                                            const themeClassMap: Record<string, string> = {
                                                default: 'bg-card font-semibold border-b-2 border-border',
                                                minimal: 'bg-card font-semibold border-b border-border',
                                                modern: 'bg-background font-semibold border-b border-primary',
                                                'bold-header': 'bg-secondary text-secondary-foreground font-bold uppercase tracking-wider text-xs border-b-2 border-border'
                                            };
                                            const themeClasses = themeClassMap[tableSettings.theme || 'default'];

                                            const headerDynamicStyle: CSSProperties = {
                                                backgroundColor: tableSettings.headerBackgroundColor,
                                                color: tableSettings.headerFontColor,
                                                fontSize: tableSettings.headerFontSize ? `${tableSettings.headerFontSize}px` : undefined,
                                                borderBottomColor: tableSettings.headerBorderColor,
                                                borderRightColor: showGrid ? tableSettings.headerBorderColor : undefined,
                                            };
                                            
                                            cellsToRender.push(
                                                <DraggableHeader
                                                    key={headerForThisCell.key}
                                                    header={headerForThisCell}
                                                    isDimension={isDimension}
                                                    sortState={sortState}
                                                    onSort={(key) => handleSort({ fieldName: key, order: sortState?.order === 'asc' ? 'desc' : 'asc' })}
                                                    onMove={handleMoveColumn}
                                                    onContextMenu={handleHeaderContextMenu}
                                                    stickyLeft={isDimension ? stickyHeaderLeft[colIndexInDisplayOrder] : undefined}
                                                    showGrid={showGrid}
                                                    themeClasses={themeClasses}
                                                    style={headerDynamicStyle}
                                                />
                                            );
                                        }
                                        return cellsToRender;
                                    })()}
                                </UITableRow>
                            ))}
                        </TableHeader>
                         <TableBody>
                            {bodyRows.map((row, rowIndex) => {
                                let rowClasses = 'transition-colors';
                                if (row.type === 'subtotal') rowClasses += ' bg-secondary font-bold';
                                if (row.isExpandable || (widget.isCrossFilterSource && row.type === 'data')) rowClasses += ' cursor-pointer hover:bg-accent';
                                
                                const handleRowClick = () => {
                                    if (row.isExpandable && row.path) toggleRowCollapse(row.path);
                                    else if (widget.isCrossFilterSource && row.type === 'data') handleElementClick(null, row);
                                };
                                
                                return (
                                <UITableRow key={row.path || rowIndex} className={rowClasses} onClick={handleRowClick}>
                                     {displayedColumnOrder.map((key, colIndex) => {
                                        const isDimensionColumn = colIndex < numStickyColumns;
                                        const displayValue = row.values[key];
                                        
                                        const isSticky = colIndex < numStickyColumns;

                                        let cellBgClass = 'bg-card';
                                        if (row.type === 'subtotal') {
                                            cellBgClass = 'bg-secondary';
                                        } else if (isSticky) {
                                            // Keep sticky column background consistent
                                        }

                                        const cellStyle: CSSProperties = {
                                            position: isSticky ? 'sticky' : undefined, 
                                            left: isSticky ? stickyHeaderLeft[colIndex] || 0 : undefined,
                                            zIndex: isSticky ? 20 : undefined,
                                            ...getCellStyle(row, key),
                                        };

                                        if (showGrid) {
                                            cellStyle.borderRightStyle = tableSettings.gridStyle || 'solid';
                                            cellStyle.borderBottomStyle = tableSettings.gridStyle || 'solid';
                                            if (tableSettings.gridColor) {
                                                cellStyle.borderRightColor = tableSettings.gridColor;
                                                cellStyle.borderBottomColor = tableSettings.gridColor;
                                            }
                                        }
                                        
                                        const isSubtotalDimensionCell = row.type === 'subtotal' && isDimensionColumn;
                                        let valueContent = (isSubtotalDimensionCell && displayValue === null)
                                            ? ''
                                            : (displayValue === null || displayValue === undefined)
                                                ? '-'
                                                : formatValue(displayValue);
                                        
                                        if (row.type === 'subtotal' && (widget.shelves.rows || [])[row.level || 0]?.name === key) {
                                            valueContent = `${valueContent} Total`;
                                        }

                                        return (
                                            <TableCell 
                                                key={key} 
                                                style={cellStyle} 
                                                className={cn(
                                                    'whitespace-nowrap px-4 py-2 border-b border-border',
                                                    !isDimensionColumn ? 'text-center' : 'text-left',
                                                    cellBgClass,
                                                    showGrid ? 'border-r border-border' : ''
                                                )}
                                            >
                                                <div className="flex items-center" style={{ paddingLeft: `${isDimensionColumn && row.type !== 'subtotal' ? (row.level || 0) * 1.25 : 0}rem` }}>
                                                    {isDimensionColumn && row.isExpandable && (widget.shelves.rows || [])[row.level || 0]?.name === key && (
                                                        <div className="p-1 rounded-full mr-1">
                                                            {collapsedRows.includes(row.path!) ? <ChevronRight /> : <ChevronDown />}
                                                        </div>
                                                    )}
                                                    {valueContent}
                                                </div>
                                            </TableCell>
                                        );
                                    })}
                                </UITableRow>
                            )})}
                        </TableBody>
                         <TableFooter className="sticky bottom-0 z-30 bg-secondary">
                            {tableDataForWidget.rows.filter(r => r.type === 'grandtotal').map((row, rowIndex) => {
                                return (
                                <UITableRow key={`grandtotal-${rowIndex}`} className="bg-secondary font-bold">
                                    {displayedColumnOrder.map((key, colIndex) => {
                                        const footerCellStyle: CSSProperties = {
                                            ...(colIndex < numStickyColumns && { 
                                                position: 'sticky', 
                                                zIndex: 20, 
                                                left: stickyHeaderLeft[colIndex] || 0, 
                                                backgroundColor: 'hsl(var(--secondary))' 
                                            }), 
                                        };
                                        if (showGrid) {
                                            if (tableSettings.gridStyle) footerCellStyle.borderRightStyle = tableSettings.gridStyle;
                                            if (tableSettings.gridColor) footerCellStyle.borderRightColor = tableSettings.gridColor;
                                        }
                                        return (
                                        <TableCell 
                                            key={key} 
                                            className={cn(
                                                'whitespace-nowrap px-4 py-2 border-t-2 border-border',
                                                colIndex >= numStickyColumns ? 'text-center' : 'text-left',
                                                showGrid ? 'border-r border-border' : ''
                                            )} 
                                            style={footerCellStyle}
                                        >
                                            {formatValue(row.values[key])}
                                        </TableCell>
                                    )})}
                                </UITableRow>
                            )})}
                        </TableFooter>
                    </Table>
                </div>
            );
        }

        if (processedData.type === 'chart' || processedData.type === 'sankey') {
             const ChartComponent = {
                'recharts': RechartsComponent,
                'apexcharts': ApexChartsComponent,
                'echarts': EChartsComponent,
            }[chartLibrary as ChartLibrary] || RechartsComponent;
            
            if (chartLibrary !== 'echarts' && processedData.type !== 'chart') {
                return <div className="flex items-center justify-center h-full text-muted-foreground p-4">This chart type is only supported by the ECharts library.</div>;
            }

            return <ChartComponent 
                widget={widget} 
                data={processedData as any} 
                onElementClick={(idx: number) => handleElementClick(idx, undefined)}
                onElementContextMenu={handleElementContextMenu}
            />;
        }

        if (processedData.type === 'kpi') {
            return <KpiCard data={processedData} />;
        }
        
        if (processedData.type === 'heatmap') {
            return <HeatmapComponent data={processedData} theme={themeConfig.mode} />;
        }
        
        return <div className="flex items-center justify-center h-full text-muted-foreground p-4">Unsupported chart configuration.</div>
    }

    return (
        <div className="h-full w-full flex flex-col relative">
            <DrilldownBreadcrumb widget={widget} onDrillUp={handleDrillUp} />
            <div className="flex-grow min-h-0"> 
                {renderContent()}
            </div>
        </div>
    );
});

export const DataProcessor: FC<{ widget: WidgetState }> = ({ widget }) => {
    const dashboardContext = useDashboard();
    
    // Select specific values to minimize re-renders of the inner component
    // If these values haven't changed, the props object passed to InnerDataProcessor 
    // will satisfy referential equality (or shallow equality check of React.memo)
    
    // We memoize the prop object construction to ensure stability
    const innerProps = useMemo(() => ({
        widget,
        saveWidget: dashboardContext.saveWidget,
        crossFilter: dashboardContext.crossFilter,
        setCrossFilter: dashboardContext.setCrossFilter,
        toggleRowCollapse: dashboardContext.toggleRowCollapse,
        collapseAllRows: dashboardContext.collapseAllRows,
        expandAllRows: dashboardContext.expandAllRows,
        globalFilters: dashboardContext.globalFilters,
        parameters: dashboardContext.parameters,
        blendedData: dashboardContext.blendedData,
        themeConfig: dashboardContext.themeConfig,
        openContextMenu: dashboardContext.openContextMenu,
        chartLibrary: dashboardContext.chartLibrary,
        setWidgetPerformance: dashboardContext.setWidgetPerformance,
        refetchCounter: dashboardContext.refetchCounter,
        activePage: dashboardContext.activePage,
        controlFilters: dashboardContext.controlFilters,
    }), [
        widget,
        dashboardContext.saveWidget,
        dashboardContext.crossFilter,
        dashboardContext.setCrossFilter,
        dashboardContext.toggleRowCollapse,
        dashboardContext.collapseAllRows,
        dashboardContext.expandAllRows,
        dashboardContext.globalFilters,
        dashboardContext.parameters,
        dashboardContext.blendedData,
        dashboardContext.themeConfig,
        dashboardContext.openContextMenu,
        dashboardContext.chartLibrary,
        dashboardContext.setWidgetPerformance,
        dashboardContext.refetchCounter,
        dashboardContext.activePage,
        dashboardContext.controlFilters,
    ]);

    return <InnerDataProcessor {...innerProps} />;
};