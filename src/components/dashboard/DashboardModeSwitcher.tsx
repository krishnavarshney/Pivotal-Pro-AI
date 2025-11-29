import React, { FC, useState } from 'react';
import { Eye, Pencil, MessageSquare, Info } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Popover } from '../ui/Popover';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { Checkbox } from '../ui/Checkbox';
import { cn } from '../ui/utils';

export const DashboardModeSwitcher: FC = () => {
    const { dashboardMode, setDashboardMode, isHelpModeActive, toggleHelpMode } = useDashboard();
    const [isOpen, setIsOpen] = useState(false);

    const modes = [
        { id: 'view', label: 'View Mode', icon: <Eye size={16}/>, description: "Interact with the dashboard." },
        { id: 'edit', label: 'Edit Mode', icon: <Pencil size={16}/>, description: "Add, move, and resize widgets." },
        { id: 'comment', label: 'Comment Mode', icon: <MessageSquare size={16}/>, description: "Leave comments on widgets." },
    ];

    const activeMode = modes.find(m => m.id === dashboardMode) || modes[0];
    const isSpecialModeActive = dashboardMode !== 'view' || isHelpModeActive;

    return (
        <Popover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            trigger={
                <Tooltip content="Dashboard Mode" placement="bottom">
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="h-9 w-9 p-0" aria-label="Change dashboard mode">
                        <span className="relative">
                            <span className="icon-hover-anim">{activeMode.icon}</span>
                            {isSpecialModeActive && <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}
                        </span>
                    </Button>
                </Tooltip>
            }
            contentClassName="w-64 p-2"
            align="end"
        >
            {({ close }) => (
                <div className="flex flex-col gap-1">
                    <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Modes</p>
                    {modes.map(mode => (
                        <button key={mode.id} onClick={() => { setDashboardMode(mode.id as any); close(); }} className={cn("w-full text-left p-2 rounded text-sm hover:bg-accent flex items-start gap-3", dashboardMode === mode.id && "bg-accent")}>
                            <div className="mt-0.5">{mode.icon}</div>
                            <div>
                                <p className="font-medium">{mode.label}</p>
                                <p className="text-xs text-muted-foreground">{mode.description}</p>
                            </div>
                        </button>
                    ))}
                    <div className="h-px bg-border my-1" />
                    <label className="w-full text-left p-2 rounded text-sm hover:bg-accent flex items-center justify-between cursor-pointer">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5"><Info size={16}/></div>
                            <div>
                                <p className="font-medium">Help Mode</p>
                                <p className="text-xs text-muted-foreground">Display helpful tooltips.</p>
                            </div>
                        </div>
                        <Checkbox checked={isHelpModeActive} onCheckedChange={toggleHelpMode} />
                    </label>
                </div>
            )}
        </Popover>
    );
};
