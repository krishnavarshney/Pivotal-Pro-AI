import React, { useState, useEffect, useMemo, FC } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Pill, FilterConfig, FilterCondition, FieldType } from '../../utils/types';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { inputClasses } from '../ui/utils';
import { MultiValueInput } from '../ui/MultiValueInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Filter, ArrowLeft } from 'lucide-react';

import { notificationService } from '../../services/notificationService';

export const FilterConfigModal: FC<{ isOpen: boolean; onClose: () => void; pill: Pill | null; onSave: (p: Pill) => void; onBack?: () => void }> = ({ isOpen, onClose, pill, onSave, onBack }) => {
    const [config, setConfig] = useState<FilterConfig>({ condition: FilterCondition.IS_ONE_OF, values: [] });
    const { blendedData } = useDashboard();
    
    const allValuesForField = useMemo(() => {
        if (!pill) return [];
        return _.sortBy(_.uniq(blendedData.map(row => row[pill.name]).filter(v => v !== null && v !== undefined)));
    }, [blendedData, pill]);

    useEffect(() => {
        if (pill) {
            const initialCondition = pill.filter?.condition || (pill.type === FieldType.DIMENSION ? FilterCondition.IS_ONE_OF : FilterCondition.EQUALS);
            setConfig({
                condition: initialCondition,
                values: pill.filter?.values || [],
            });
        }
    }, [pill]);

    if (!isOpen || !pill) return null;

    const handleSave = () => {
        onSave({ ...pill, filter: config });
        
        const valueStr = config.values.join(', ');
        if (config.condition === FilterCondition.IS_ONE_OF || config.condition === FilterCondition.EQUALS) {
             notificationService.success(`${valueStr} is Filtered in ${pill.simpleName} Column`);
        } else {
             notificationService.success(`${pill.simpleName} ${config.condition} ${valueStr} Filter Applied`);
        }

        onClose();
    };

    const isMultiValue = [FilterCondition.IS_ONE_OF, FilterCondition.IS_NOT_ONE_OF].includes(config.condition);
    const isRangeValue = [FilterCondition.BETWEEN].includes(config.condition);

    const renderFilterInput = () => {
        if (pill.type === FieldType.DIMENSION || pill.type === FieldType.DATETIME) {
            const conditionOptions = [
                FilterCondition.IS_ONE_OF, FilterCondition.IS_NOT_ONE_OF, FilterCondition.CONTAINS,
                FilterCondition.DOES_NOT_CONTAIN, FilterCondition.EQUALS, FilterCondition.NOT_EQUALS,
                FilterCondition.STARTS_WITH, FilterCondition.ENDS_WITH,
            ];
            return (
                <div className="space-y-4">
                    <Select value={config.condition} onValueChange={c => setConfig({ ...config, condition: c as FilterCondition, values: [] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {conditionOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {isMultiValue ? (
                        <MultiValueInput options={allValuesForField} selectedValues={config.values} onChange={v => setConfig({ ...config, values: v })} />
                    ) : (
                        <input type="text" value={config.values[0] || ''} onChange={e => setConfig({ ...config, values: [e.target.value] })} className={inputClasses} />
                    )}
                </div>
            );
        } else { // Measure
            const conditionOptions = [
                FilterCondition.EQUALS, FilterCondition.NOT_EQUALS, FilterCondition.GREATER_THAN,
                FilterCondition.LESS_THAN, FilterCondition.GREATER_THAN_OR_EQUAL, FilterCondition.LESS_THAN_OR_EQUAL,
                FilterCondition.BETWEEN,
            ];
            return (
                <div className="space-y-4">
                    <Select value={config.condition} onValueChange={c => setConfig({ ...config, condition: c as FilterCondition, values: [] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {conditionOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                         <input type="number" value={config.values[0] || ''} onChange={e => setConfig({ ...config, values: [parseFloat(e.target.value), config.values[1]] })} className={inputClasses} />
                        {isRangeValue && <span className="p-2">and</span>}
                        {isRangeValue && <input type="number" value={config.values[1] || ''} onChange={e => setConfig({ ...config, values: [config.values[0], parseFloat(e.target.value)] })} className={inputClasses} />}
                    </div>
                </div>
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 mr-2" onClick={onBack}>
                                <span className="icon-hover-anim inline-block"><ArrowLeft size={16} /></span>
                            </Button>
                        )}
                        <span className="icon-hover-anim inline-block"><Filter size={20} /></span> Configure Filter: {pill.simpleName}
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6">{renderFilterInput()}</div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
