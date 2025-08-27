import React, { useState, useMemo, FC } from 'react';
import { formatValue } from '../../utils/dataProcessing/formatting';
import { MagnifyingGlass } from 'phosphor-react';
import { inputClasses } from './utils';

export const MultiValueInput: FC<{
    options: any[];
    selectedValues: any[];
    onChange: (newValues: any[]) => void;
}> = ({ options, selectedValues, onChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => String(opt).toLowerCase().includes(searchTerm.toLowerCase()));
    }, [options, searchTerm]);

    const toggleValue = (value: any) => {
        const newValuesSet = new Set(selectedValues);
        if (newValuesSet.has(value)) {
            newValuesSet.delete(value);
        } else {
            newValuesSet.add(value);
        }
        onChange(Array.from(newValuesSet));
    };

    return (
        <div className="border border-input rounded-lg flex flex-col bg-background">
            <div className="p-2 border-b border-input relative">
                 <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search values..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-sm pl-8 h-8"
                />
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
                {filteredOptions.map(option => (
                    <label key={option} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedValues.includes(option)}
                            onChange={() => toggleValue(option)}
                            className="h-4 w-4 rounded-sm border-border text-primary focus:ring-ring focus:ring-offset-0"
                        />
                        <span className="text-sm">{formatValue(option)}</span>
                    </label>
                ))}
            </div>
            <div className="p-2 border-t border-input text-xs text-muted-foreground">
                {selectedValues.length} of {options.length} selected.
            </div>
        </div>
    );
};
