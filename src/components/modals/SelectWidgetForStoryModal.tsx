import React, { useMemo, FC } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '../ui';
import { WidgetState } from '../../utils/types';

export const SelectWidgetForStoryModal: FC<{ isOpen: boolean; onClose: () => void; onSelect: (widgetId: string) => void; }> = ({ isOpen, onClose, onSelect }) => {
    const { workspaces } = useDashboard();
    const allWidgets = useMemo(() => workspaces.flatMap(ws => ws.pages || []).flatMap(p => p.widgets || []), [workspaces]);

    if (!isOpen) return null;
    
    const handleSelect = (widgetId: string) => {
        onSelect(widgetId);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select a Widget to Add</DialogTitle>
                </DialogHeader>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {allWidgets.map((widget: WidgetState) => (
                        <button key={widget.id} onClick={() => handleSelect(widget.id)} className="w-full text-left p-2 rounded-md hover:bg-accent">
                            {widget.title}
                        </button>
                    ))}
                    {allWidgets.length === 0 && <p className="text-muted-foreground text-center">No widgets available to add.</p>}
                </div>
            </DialogContent>
        </Dialog>
    );
};
