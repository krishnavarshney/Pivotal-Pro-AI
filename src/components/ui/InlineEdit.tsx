import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Check, X } from 'lucide-react';
import { cn, inputClasses } from './utils';

interface InlineEditProps {
    value: string;
    onSave: (newValue: string) => void;
    onCancel: () => void;
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    autoFocus?: boolean;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
    value: initialValue,
    onSave,
    onCancel,
    className,
    inputClassName,
    placeholder,
    autoFocus = true
}) => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [autoFocus]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    const handleSave = () => {
        if (value.trim() !== initialValue) {
            onSave(value.trim());
        } else {
            onCancel();
        }
    };

    return (
        <div className={cn("flex items-center gap-1 w-full", className)}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className={cn(inputClasses, "h-7 py-1 px-2 text-sm w-full", inputClassName)}
                placeholder={placeholder}
            />
            <button
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                className="p-1 rounded hover:bg-green-500/10 text-green-500 hover:text-green-600 transition-colors"
                title="Save"
            >
                <Check size={14} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onCancel(); }}
                className="p-1 rounded hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
                title="Cancel"
            >
                <X size={14} />
            </button>
        </div>
    );
};
