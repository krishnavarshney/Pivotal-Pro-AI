
import React, { useState, useMemo, memo, FC } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Field, Pill, AggregationType, FieldType } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { inputClasses, cn } from '../ui/utils';
import { Funnel, MagnifyingGlass, TextT, Hash, Clock } from 'phosphor-react';
import { ResponsiveContainer, BarChart, Bar } from 'recharts';
import { calculateDimensionStats, createHistogramData } from '../../utils/dataProcessing/statistics';

const MicroVisualization: FC<{ field: Field }> = memo(({ field }) => {
    const { blendedData } = useDashboard();
    const data = useMemo(() => {
        const columnData = blendedData.map(row => row[field.name]);
        if (field.type === FieldType.MEASURE) {
            const histogram = createHistogramData(columnData as number[], 10);
            return histogram.data.map((value, i) => ({ name: `bin${i}`, value }));
        }
        const stats = calculateDimensionStats(columnData);
        return stats.topValues.slice(0, 5).map(item => ({ name: item.value, value: item.count }));
    }, [blendedData, field]);

    if (!data || data.length === 0) return <div className="h-8 w-16 bg-secondary rounded" />;
    return (
        <div className="h-8 w-20">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={2} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});


export const SelectFieldForFilterModal: FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { blendedFields, setGlobalFilters, openFilterConfigModal, openSelectFieldModal } = useDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    
    const allFields = useMemo(() => [...blendedFields.dimensions, ...blendedFields.measures], [blendedFields]);

    const filteredFields = useMemo(() => {
        return searchTerm ? allFields.filter(f => f.simpleName.toLowerCase().includes(searchTerm.toLowerCase())) : allFields;
    }, [allFields, searchTerm]);

    const handleSelectField = (field: Field) => {
        const newPill: Pill = {
            id: _.uniqueId('filter_'),
            name: field.name,
            simpleName: field.simpleName,
            type: field.type,
            aggregation: field.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT,
        };
        onClose();
        openFilterConfigModal(
            newPill, 
            (configuredPill) => {
                setGlobalFilters(current => [...current, configuredPill]);
            },
            openSelectFieldModal // onBack handler
        );
    };
    
    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent containerClassName="max-w-md w-[95%]" className="max-h-[70vh] flex flex-col p-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Funnel size={20} /> Select a Field to Filter</DialogTitle>
                </DialogHeader>
                <div className="p-4 border-b border-border flex-shrink-0">
                    <div className="relative">
                        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" placeholder="Search fields..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={cn(inputClasses, 'pl-8 h-10')} />
                    </div>
                </div>
                <div className="flex-grow min-h-0 overflow-y-auto p-2">
                    <div className="flex flex-col space-y-1">
                         {filteredFields.map(field => (
                            <button key={field.name} onClick={() => handleSelectField(field)} className="w-full flex justify-between items-center p-3 rounded-lg hover:bg-accent border border-transparent hover:border-border transition-all text-left">
                                <div className="flex items-center gap-2 truncate">
                                    {field.type === FieldType.MEASURE ? <Hash className="text-green-500 flex-shrink-0" /> : field.type === FieldType.DATETIME ? <Clock className="text-purple-500 flex-shrink-0"/> : <TextT className="text-blue-500 flex-shrink-0" />}
                                    <span className="font-medium text-sm truncate">{field.simpleName}</span>
                                </div>
                                <MicroVisualization field={field} />
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="p-4 border-t border-border flex justify-end">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};