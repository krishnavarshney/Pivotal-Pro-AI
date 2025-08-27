import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Popover } from './Popover';
import { cn } from './utils';

export const HelpIcon: React.FC<{ helpText: React.ReactNode; className?: string }> = ({ helpText, className }) => {
    const { isHelpModeActive } = useDashboard();
    const [isOpen, setIsOpen] = useState(false);

    if (!isHelpModeActive) {
        return null;
    }

    return (
        <Popover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            trigger={
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                    className={cn("text-primary cursor-help animate-info-pulse rounded-full", className)}
                    aria-label="Show help"
                >
                    <Info size={16} />
                </button>
            }
            contentClassName="w-64 p-3 text-sm"
            placement="bottom"
            align="end"
        >
            {helpText}
        </Popover>
    );
};