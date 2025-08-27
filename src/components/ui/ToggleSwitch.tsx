import React, { FC, ReactNode } from 'react';
import { cn, labelClasses } from './utils';

export const ToggleSwitch: FC<{ label: ReactNode; enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean; }> = ({ label, enabled, onChange, disabled = false }) => (
    <div className="flex items-center justify-between gap-4">
         <label className={cn(labelClasses, "cursor-pointer select-none", disabled ? "cursor-not-allowed opacity-50" : "")} onClick={() => !disabled && onChange(!enabled)}>{label}</label>
        <button
            onClick={() => onChange(!enabled)}
            className={cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50", enabled ? "bg-primary" : "bg-input")}
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
        >
            <span
                aria-hidden="true"
                className={cn("pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform", enabled ? 'translate-x-5' : 'translate-x-0')}
            />
        </button>
    </div>
);
