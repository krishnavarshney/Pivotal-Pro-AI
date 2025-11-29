import React, { FC, useState } from 'react';
import { Save, Upload, Download, Timer, RotateCw, MoreVertical } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { cn } from '../ui/utils';

export const ActionsPopover: FC = () => {
    const { 
        activePage,
        openCreateTemplateModal,
        importInputRef,
        handleExportDashboard,
        openPerformanceAnalyzer,
        resetDashboard,
    } = useDashboard();
    const [isOpen, setIsOpen] = useState(false);

    if (!activePage) return null;

    const actions = [
        { label: 'Save Page as Template', icon: <Save size={16} />, onClick: () => openCreateTemplateModal(activePage) },
        { label: '---', onClick: () => {} },
        { label: 'Import Dashboard', icon: <Upload size={16} />, onClick: () => importInputRef.current?.click() },
        { label: 'Export Dashboard', icon: <Download size={16} />, onClick: handleExportDashboard },
        { label: '---', onClick: () => {} },
        { label: 'Performance Analyzer', icon: <Timer size={16} />, onClick: openPerformanceAnalyzer },
        { label: 'Reset Dashboard', icon: <RotateCw size={16} />, onClick: resetDashboard, isDestructive: true },
    ];

    return (
        <Popover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            trigger={
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} aria-label="Open dashboard actions menu" className="h-7 w-7">
                    <span className="icon-hover-anim"><MoreVertical /></span>
                </Button>
            }
            contentClassName="w-60 p-2"
            align="right"
        >
             {({ close }) => (
                <div className="flex flex-col gap-1">
                    {actions.map((action, index) => (
                         action.label === '---' ? <div key={index} className="h-px bg-border my-1" /> : (
                            <button
                                key={index}
                                onClick={() => { action.onClick(); close(); }}
                                className={cn(
                                    "w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent",
                                    (action as any).isDestructive && "text-destructive hover:bg-destructive/10"
                                )}
                            >
                                <span className="icon-hover-anim">{action.icon}</span> {action.label}
                            </button>
                        )
                    ))}
                </div>
            )}
        </Popover>
    );
};
