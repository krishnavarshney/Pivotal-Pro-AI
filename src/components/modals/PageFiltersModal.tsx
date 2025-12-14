import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Pill, FilterConfig, FilterCondition, FieldType, Field, AggregationType } from '../../utils/types';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { inputClasses, cn } from '../ui/utils';
import { MultiValueInput } from '../ui/MultiValueInput';
import { Funnel, MagnifyingGlass, TextT, Hash, Clock, X, CaretDown, CheckCircle } from 'phosphor-react';
import { motion, AnimatePresence } from 'framer-motion';

const FilterCard: React.FC<{
    pill: Pill;
    onChange: (newConfig: FilterConfig) => void;
    onRemove: () => void;
}> = ({ pill, onChange, onRemove }) => {
    const [isExpanded, setExpanded] = useState(pill.filter ? Object.values(pill.filter).every(v => v !== undefined) === false : true);
    const { blendedData } = useDashboard();
    const MotionSection = motion.section as any;

    const allValuesForField = useMemo(() => {
        if (!pill) return [];
        return _.sortBy(_.uniq(blendedData.map(row => row[pill.name]).filter(v => v !== null && v !== undefined)));
    }, [blendedData, pill]);

    const isMultiValue = [FilterCondition.IS_ONE_OF, FilterCondition.IS_NOT_ONE_OF].includes(pill.filter?.condition || FilterCondition.IS_ONE_OF);
    const isRangeValue = pill.filter?.condition === FilterCondition.BETWEEN;

    const summary = useMemo(() => {
        if (!pill.filter || !pill.filter.values || pill.filter.values.length === 0) return <span className="text-amber-500">Not configured</span>;
        const { condition, values } = pill.filter;
        if (values.length > 2) return `${condition} ${values.length} values`;
        return `${condition} ${values.join(' & ')}`;
    }, [pill.filter]);

    const renderFilterInput = () => {
        if (!pill.filter) return null;
        const config = pill.filter;
        
        if (pill.type === FieldType.DIMENSION || pill.type === FieldType.DATETIME) {
            const conditionOptions = [FilterCondition.IS_ONE_OF, FilterCondition.IS_NOT_ONE_OF, FilterCondition.CONTAINS, FilterCondition.DOES_NOT_CONTAIN, FilterCondition.EQUALS, FilterCondition.NOT_EQUALS, FilterCondition.STARTS_WITH, FilterCondition.ENDS_WITH];
            return (
                <div className="space-y-3 p-3">
                    <select value={config.condition} onChange={e => onChange({ ...config, condition: e.target.value as FilterCondition, values: [] })} className={inputClasses}>
                        {conditionOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {isMultiValue ? (
                        <MultiValueInput options={allValuesForField} selectedValues={config.values} onChange={v => onChange({ ...config, values: v })} />
                    ) : (
                        <input type="text" value={config.values[0] || ''} onChange={e => onChange({ ...config, values: [e.target.value] })} className={inputClasses} />
                    )}
                </div>
            );
        } else { // Measure
            const conditionOptions = [FilterCondition.EQUALS, FilterCondition.NOT_EQUALS, FilterCondition.GREATER_THAN, FilterCondition.LESS_THAN, FilterCondition.GREATER_THAN_OR_EQUAL, FilterCondition.LESS_THAN_OR_EQUAL, FilterCondition.BETWEEN];
            return (
                <div className="space-y-3 p-3">
                    <select value={config.condition} onChange={e => onChange({ ...config, condition: e.target.value as FilterCondition, values: [] })} className={inputClasses}>
                        {conditionOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex gap-2">
                         <input type="number" value={config.values[0] || ''} onChange={e => onChange({ ...config, values: [parseFloat(e.target.value), config.values[1]] })} className={inputClasses} />
                        {isRangeValue && <span className="p-2">and</span>}
                        {isRangeValue && <input type="number" value={config.values[1] || ''} onChange={e => onChange({ ...config, values: [config.values[0], parseFloat(e.target.value)] })} className={inputClasses} />}
                    </div>
                </div>
            );
        }
    };
    
    return (
        <div className="bg-card rounded-lg border border-border">
            <header className="flex items-center p-3 cursor-pointer" onClick={() => setExpanded(!isExpanded)}>
                <span className="flex-grow font-semibold text-sm text-foreground truncate pr-2">{pill.simpleName}</span>
                <span className="text-xs text-muted-foreground truncate font-mono hidden sm:block">{summary}</span>
                <div className="flex items-center pl-2">
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><X size={14}/></button>
                    <CaretDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </header>
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <MotionSection
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden border-t border-border"
                    >
                        {renderFilterInput()}
                    </MotionSection>
                )}
            </AnimatePresence>
        </div>
    );
};


export const PageFiltersModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { globalFilters, setGlobalFilters, blendedFields } = useDashboard();
    const [localFilters, setLocalFilters] = useState<Pill[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsReady(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsReady(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if(isOpen) {
            setLocalFilters(_.cloneDeep(globalFilters));
        }
    }, [isOpen, globalFilters]);

    const allFields = useMemo(() => [...blendedFields.dimensions, ...blendedFields.measures], [blendedFields]);
    const availableFields = useMemo(() => {
        const activeFieldNames = new Set(localFilters.map(f => f.name));
        return allFields.filter(f => !activeFieldNames.has(f.name) && f.simpleName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allFields, localFilters, searchTerm]);

    const handleAddField = (field: Field) => {
        const newPill: Pill = {
            id: _.uniqueId('filter_'),
            name: field.name,
            simpleName: field.simpleName,
            type: field.type,
            aggregation: field.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT,
            filter: {
                condition: field.type === FieldType.DIMENSION ? FilterCondition.IS_ONE_OF : FilterCondition.GREATER_THAN,
                values: []
            }
        };
        setLocalFilters(current => [...current, newPill]);
    };

    const handleUpdateFilter = (pillId: string, newConfig: FilterConfig) => {
        setLocalFilters(current => current.map(p => p.id === pillId ? { ...p, filter: newConfig } : p));
    };
    
    const handleRemoveFilter = (pillId: string) => {
        setLocalFilters(current => current.filter(p => p.id !== pillId));
    };

    const handleSave = () => {
        setGlobalFilters(localFilters);
        onClose();
    };

    if (!isOpen) return null;
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent containerClassName="w-[95%] max-w-4xl" className="h-[80vh] flex flex-col p-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Funnel size={20} /> Page Filters</DialogTitle>
                </DialogHeader>

                {!isReady ? (
                    <main className="flex-grow flex flex-col md:flex-row gap-6 p-6 min-h-0 overflow-hidden">
                        <div className="flex flex-col border border-border bg-secondary/30 rounded-xl p-3 md:w-1/2 space-y-4">
                            <div className="h-6 bg-secondary/50 rounded w-1/3 animate-pulse"></div>
                            <div className="h-9 bg-secondary/50 rounded w-full animate-pulse"></div>
                            <div className="space-y-2">
                                <div className="h-8 bg-secondary/50 rounded w-full animate-pulse"></div>
                                <div className="h-8 bg-secondary/50 rounded w-full animate-pulse"></div>
                                <div className="h-8 bg-secondary/50 rounded w-full animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex flex-col border border-border bg-secondary/30 rounded-xl p-3 md:w-1/2 space-y-4">
                            <div className="h-6 bg-secondary/50 rounded w-1/3 animate-pulse"></div>
                            <div className="flex-grow flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                            </div>
                        </div>
                    </main>
                ) : (
                    <main className="flex-grow flex flex-col md:flex-row gap-6 p-6 min-h-0 overflow-y-auto">
                        {/* Left Panel: Available Fields */}
                        <div className="flex flex-col border border-border bg-secondary/30 rounded-xl p-3 md:w-1/2">
                            <h3 className="font-semibold text-foreground px-1 pb-2 flex-shrink-0">Available Fields</h3>
                            <div className="relative mb-2 flex-shrink-0">
                                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input type="text" placeholder="Search fields..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={cn(inputClasses, 'pl-8 h-9')} />
                            </div>
                            <div className="space-y-1 flex-grow overflow-y-auto">
                                {availableFields.map(field => (
                                    <button key={field.name} onClick={() => handleAddField(field)} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-sm text-left">
                                        {field.type === FieldType.MEASURE ? <Hash className="text-green-500" /> : field.type === FieldType.DATETIME ? <Clock className="text-purple-500"/> : <TextT className="text-blue-500" />}
                                        <span className="font-medium">{field.simpleName}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Right Panel: Active Filters */}
                        <div className="flex flex-col border border-border bg-secondary/30 rounded-xl p-3 md:w-1/2">
                             <h3 className="font-semibold text-foreground px-1 pb-2 flex-shrink-0">Active Filters ({localFilters.length})</h3>
                            <div className="space-y-2 flex-grow overflow-y-auto">
                                {localFilters.length > 0 ? (
                                    localFilters.map(pill => (
                                        <FilterCard 
                                            key={pill.id} 
                                            pill={pill} 
                                            onChange={(config) => handleUpdateFilter(pill.id, config)}
                                            onRemove={() => handleRemoveFilter(pill.id)}
                                        />
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
                                        <p>Click a field on the left to add a filter.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}><CheckCircle size={16}/> Apply Filters</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
