import React, { FC } from 'react';
import { Copy, FileText, MessageSquare, BookOpen, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/Popover';

export const BulkActionsBar: FC = () => {
    const { 
        selectedWidgetIds,
        deselectAllWidgets,
        duplicateSelectedWidgets,
        deleteSelectedWidgets,
        exportSelectedWidgets,
        discussSelectedWithAI,
        addSelectedToStory
    } = useDashboard();
    
    const count = selectedWidgetIds.length;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
                <div className="glass-panel rounded-xl p-2 flex items-center gap-2 shadow-lg border border-border">
                    <div className="px-3">
                        <span className="font-bold text-foreground">{count}</span>
                        <span className="text-muted-foreground"> item{count > 1 ? 's' : ''} selected</span>
                    </div>
                    
                    <Button variant="ghost" size="sm" onClick={duplicateSelectedWidgets}><Copy size={16} /> Duplicate</Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><FileText size={16} /> Export</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => exportSelectedWidgets('PDF')}>PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportSelectedWidgets('CSV')}>CSV</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportSelectedWidgets('XLSX')}>Excel (XLSX)</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="sm" onClick={discussSelectedWithAI}><MessageSquare size={16} /> Discuss with AI</Button>
                    <Button variant="ghost" size="sm" onClick={addSelectedToStory}><BookOpen size={16} /> Add to Story</Button>

                    <div className="w-px h-6 bg-border mx-2" />

                    <Button variant="destructive" size="sm" onClick={deleteSelectedWidgets}><Trash2 size={16} /> Delete</Button>
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={deselectAllWidgets}><X size={16} /></Button>
                </div>
            </motion.div>
        </div>
    );
};
