import React, { useState, useEffect, useRef, FC, ChangeEvent } from 'react';
import { Check } from 'lucide-react';
import { inputClasses } from './utils';

export const ColorPicker: FC<{ color?: string; onChange: (color: string) => void; }> = ({ color, onChange }) => {
    const colors = ['#ffffff', '#0f172a', '#e2e8f0', '#334155', '#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];
    const [inputValue, setInputValue] = useState(color || '');
    const colorInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInputValue(color || '');
    }, [color]);

    const handleSwatchClick = (c: string) => {
        setInputValue(c);
        onChange(c);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setInputValue(newColor);
        if (/^#([0-9A-F]{3}){1,2}$/i.test(newColor) || /^#([0-9A-F]{6,8})$/i.test(newColor)) {
            onChange(newColor);
        }
    };

    const handleNativePickerChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setInputValue(newColor);
        onChange(newColor);
    };
    
    return (
        <div className="flex items-center flex-wrap gap-4">
            <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => handleSwatchClick(c)}
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center"
                        style={{ backgroundColor: c }}
                        title={c}
                    >
                        {color === c && <Check size={14} className={c === '#ffffff' || c === '#e2e8f0' ? 'text-black' : 'text-white'} />}
                    </button>
                ))}
            </div>
             <div className="flex items-center gap-2">
                <div className="relative w-6 h-6">
                    <div 
                        className="w-full h-full rounded-full border border-border cursor-pointer" 
                        style={{ backgroundColor: color || 'transparent' }}
                        onClick={() => colorInputRef.current?.click()}
                    ></div>
                    <input 
                        ref={colorInputRef}
                        type="color" 
                        value={color || '#000000'}
                        onChange={handleNativePickerChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    className={`${inputClasses} w-24 p-1 text-sm h-8`}
                    placeholder="#RRGGBB"
                />
            </div>
        </div>
    );
};