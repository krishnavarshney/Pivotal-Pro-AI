import React, { useState, FC } from 'react';
import Slider from 'rc-slider';
import { useDashboard } from '../../contexts/DashboardProvider';
import { DashboardPage, Parameter } from '../../utils/types';
import { Plus, X, MoreVertical, FileText, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { inputClasses, cn } from '../ui/utils';
import { Popover } from '../ui/Popover';
import { useSidebar } from '../ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';

export const ParametersPanel: FC = () => {
    const { parameters, updateParameter, removeParameter, openParameterModal } = useDashboard();

    return (
        <div className="p-2 space-y-3 w-64">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Parameters</h3>
                <Button onClick={openParameterModal} variant="ghost" size="sm" className="text-xs -mr-2"><Plus size={14}/>Manage</Button>
            </div>
            {parameters.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2 px-2">No parameters defined.</p>
            ) : (
                parameters.map(p => (
                    <div key={p.id} className="space-y-2 group p-2 rounded-lg hover:bg-secondary/50">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-foreground">{p.name}</label>
                            <Button variant="ghost" size="icon" onClick={() => removeParameter(p.id)} className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><X size={12}/></Button>
                        </div>
                        {p.type === 'number' ? (
                             <Slider
                                min={p.config?.min ?? 0}
                                max={p.config?.max ?? 100}
                                step={p.config?.step ?? 1}
                                value={p.currentValue}
                                onChange={val => updateParameter(p.id, { currentValue: val as number })}
                            />
                        ) : (
                            <input
                                type="text"
                                value={p.currentValue}
                                onChange={e => updateParameter(p.id, { currentValue: e.target.value })}
                                className={inputClasses}
                            />
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export const PageMenuItem: FC<{ page: DashboardPage; onNavigate?: () => void }> = ({ page, onNavigate }) => {
    const { activePageId, setActivePageId, openInputModal, removePage, openConfirmationModal, updatePage, renamePage } = useDashboard();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isCollapsed } = useSidebar();
    const isActive = page.id === activePageId;
    const MotionDiv = motion.div as any;

    const handleSelectPage = () => {
        setActivePageId(page.id);
        onNavigate?.();
    };

    const handleRename = () => {
        openInputModal({
            title: "Rename Dashboard Page",
            inputLabel: "Page Name",
            initialValue: page.name,
            onConfirm: (newName) => {
                renamePage(page.id, newName);
            }
        });
    };

    const handleRemove = () => {
        openConfirmationModal({ title:"Remove Page?", message:"Are you sure you want to remove this dashboard page?", onConfirm:() => removePage(page.id) });
    };

    return (
        <div className="group relative">
            <button
                onClick={handleSelectPage}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-colors relative",
                    isActive 
                        ? "text-foreground bg-accent" 
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    isCollapsed ? "justify-center" : "justify-start"
                )}
            >
                <AnimatePresence>
                    {isActive && (
                        <MotionDiv
                            layoutId="sidebar-active-indicator"
                            className="absolute left-0 h-5 w-1 bg-primary rounded-r-full"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                </AnimatePresence>
                <span className="icon-hover-anim inline-block w-5 h-5 flex-shrink-0">
                    <FileText size={16} />
                </span>
                {!isCollapsed && (
                    <>
                        <span className="truncate">{page.name}</span>
                        <Popover
                            isOpen={isMenuOpen}
                            onClose={() => setIsMenuOpen(false)}
                            trigger={<div onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }} className="ml-auto p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground cursor-pointer"><MoreVertical size={16} /></div>}
                            placement="right"
                            align="start"
                            contentClassName="w-40 p-1"
                        >
                            {({ close }) => (
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => { handleRename(); close(); }} className="w-full text-left p-2 rounded text-sm hover:bg-accent flex items-center gap-2"><Pencil size={14}/>Rename</button>
                                    <button onClick={() => { handleRemove(); close(); }} className="w-full text-left p-2 rounded text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"><Trash2 size={14} />Delete</button>
                                </div>
                            )}
                        </Popover>
                    </>
                )}
            </button>
        </div>
    );
};
