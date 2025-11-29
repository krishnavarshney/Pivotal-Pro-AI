import React, { FC, useMemo, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Slider from 'rc-slider';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { WidgetState, FieldType, AggregationType, FilterCondition, Pill } from '../../utils/types';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { inputClasses, cn } from '../ui/utils';
import { formatValue } from '../../utils/dataProcessing/formatting';

export const FilterControlWidget: FC<{ widget: WidgetState }> = ({ widget }) => {
    const { 
        blendedData, 
        blendedFields, 
        controlFilters, 
        setControlFilter,
        openWidgetEditorModal 
    } = useDashboard();
    
    const targetField = useMemo(() => {
        if (widget.targetType !== 'field' || !widget.targetId) return null;
        return [...blendedFields.dimensions, ...blendedFields.measures].find(f => f.name === widget.targetId);
    }, [widget.targetId, widget.targetType, blendedFields]);

    const displayType = widget.controlSettings?.display;
    const currentFilter = controlFilters[widget.id];

    if (!targetField) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <SlidersHorizontal size={24} className="text-muted-foreground mb-2" />
                <p className="font-semibold text-sm">Filter Control</p>
                <p className="text-xs text-muted-foreground">This control is not configured.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => openWidgetEditorModal(widget.id)}>
                    Configure Filter
                </Button>
            </div>
        );
    }
    
    if (displayType === 'range' && targetField.type === FieldType.MEASURE) {
        const { dataMin, dataMax } = useMemo(() => {
            const values = blendedData.map(row => row[targetField.name]).filter(v => typeof v === 'number');
            if (values.length === 0) return { dataMin: 0, dataMax: 100 };
            const min = _.min(values) || 0;
            const max = _.max(values) || 100;
            return { dataMin: min, dataMax: max };
        }, [blendedData, targetField]);

        const selectedRange = currentFilter?.filter?.values || [dataMin, dataMax];

        const debouncedSetControlFilter = useCallback(_.debounce((range: number[]) => {
            const filterPill: Pill = {
                id: widget.id,
                name: targetField.name,
                simpleName: targetField.simpleName,
                type: targetField.type,
                aggregation: AggregationType.COUNT,
                filter: {
                    condition: FilterCondition.BETWEEN,
                    values: range,
                },
            };
            setControlFilter(widget.id, filterPill);
        }, 200), [targetField, widget.id, setControlFilter]);
        
        return (
            <div className="p-6 h-full flex flex-col justify-center">
                <Slider
                    range
                    min={dataMin}
                    max={dataMax}
                    value={selectedRange}
                    onChange={(value) => debouncedSetControlFilter(value as number[])}
                    step={dataMax > dataMin ? (dataMax - dataMin) / 100 : 1}
                />
                <div className="flex justify-between text-xs font-mono mt-2 text-muted-foreground">
                    <span>{formatValue(selectedRange[0], { decimalPlaces: 2 })}</span>
                    <span>{formatValue(selectedRange[1], { decimalPlaces: 2 })}</span>
                </div>
            </div>
        );
    }

    if (displayType === 'datepicker' && targetField.type === FieldType.DATETIME) {
        const { dataMin, dataMax } = useMemo(() => {
            const dates = blendedData.map(row => row[targetField.name] ? new Date(row[targetField.name]).getTime() : null).filter(v => v !== null) as number[];
            if (dates.length === 0) return { dataMin: new Date(), dataMax: new Date() };
            return { dataMin: new Date(_.min(dates) as number), dataMax: new Date(_.max(dates) as number) };
        }, [blendedData, targetField]);
        
        const formatDateForInput = (date: Date | string | undefined) => {
            if (!date) return '';
            try { return new Date(date).toISOString().split('T')[0]; } catch { return ''; }
        };

        const selectedRange = currentFilter?.filter?.values || [dataMin, dataMax];
        const startDate = formatDateForInput(selectedRange[0]);
        const endDate = formatDateForInput(selectedRange[1]);

        const handleDateChange = (type: 'start' | 'end', value: string) => {
            const newStartDate = type === 'start' ? value : startDate;
            const newEndDate = type === 'end' ? value : endDate;
            if (new Date(newEndDate) < new Date(newStartDate)) return;

            const filterPill: Pill = {
                 id: widget.id,
                 name: targetField.name,
                 simpleName: targetField.simpleName,
                 type: targetField.type,
                 aggregation: AggregationType.COUNT,
                 filter: {
                     condition: FilterCondition.BETWEEN,
                     values: [new Date(newStartDate), new Date(newEndDate)],
                 },
            };
            setControlFilter(widget.id, filterPill);
        };
        
        return (
            <div className="p-3 space-y-2">
                 <div>
                    <label className="text-xs text-muted-foreground">Start Date</label>
                    <input type="date" value={startDate} onChange={e => handleDateChange('start', e.target.value)} className={cn(inputClasses, 'h-9')} />
                 </div>
                 <div>
                    <label className="text-xs text-muted-foreground">End Date</label>
                    <input type="date" value={endDate} onChange={e => handleDateChange('end', e.target.value)} className={cn(inputClasses, 'h-9')} />
                 </div>
            </div>
        );
    }
    
    const uniqueValues = useMemo(() => {
        if (!targetField || targetField.type !== FieldType.DIMENSION) return [];
        return _.sortBy(_.uniq(blendedData.map(row => row[targetField.name]).filter(v => v !== null && v !== undefined)));
    }, [blendedData, targetField]);

    const selectedValues = currentFilter?.filter?.values || [];

    const handleSelectionChange = (values: any[]) => {
        if (!targetField) return;

        if (values.length === 0) {
            setControlFilter(widget.id, null);
            return;
        }

        const filterPill: Pill = {
            id: widget.id,
            name: targetField.name,
            simpleName: targetField.simpleName,
            type: targetField.type,
            aggregation: AggregationType.COUNT,
            filter: {
                condition: FilterCondition.IS_ONE_OF,
                values: values,
            },
        };
        setControlFilter(widget.id, filterPill);
    };
    
    return (
        <div className="p-2 overflow-y-auto h-full">
            {uniqueValues.map(value => (
                <label key={String(value)} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                    <Checkbox 
                        checked={selectedValues.includes(value)}
                        onCheckedChange={(checked) => {
                            const newSelection = checked 
                                ? [...selectedValues, value] 
                                : selectedValues.filter(v => v !== value);
                            handleSelectionChange(newSelection);
                        }}
                    />
                    <span className="text-sm">{String(value)}</span>
                </label>
            ))}
        </div>
    );
};
