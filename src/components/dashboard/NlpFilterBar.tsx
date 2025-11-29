import React, { FC, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { inputClasses, cn } from '../ui/utils';

export const NlpFilterBar: FC = () => {
    const { handleNlpFilterQuery } = useDashboard();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            handleNlpFilterQuery(query.trim());
            setQuery('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 max-w-lg relative">
            <Sparkles size={18} className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors", isFocused ? "text-primary" : "text-muted-foreground")} />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Filter with AI... (e.g., 'show corporate segment in the east region')"
                className={cn(
                    inputClasses,
                    "pl-10 h-9 w-full transition-all duration-300",
                    isFocused && "animate-border-glow shadow-lg shadow-primary/10"
                )}
                style={{'--glow-color': 'hsl(var(--primary-values))'} as React.CSSProperties}
            />
        </form>
    );
};
