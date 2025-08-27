import React from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Dialog, DialogContent, DialogOverlay } from '../ui/Dialog';
import { DataProcessor } from '../common/DataProcessor';
import { motion } from 'framer-motion';

export const FocusWidgetModal: React.FC = () => {
    const { focusedWidgetId, setFocusedWidgetId, activePage } = useDashboard();
    const widget = activePage?.widgets.find(w => w.id === focusedWidgetId);
    const MotionDiv = motion.div as any;

    if (!widget) {
        return null;
    }

    return (
        <Dialog open={!!widget} onOpenChange={() => setFocusedWidgetId(null)}>
            <DialogOverlay />
            <DialogContent
                containerClassName="w-full h-full p-8"
                className="w-full h-full p-0 border-none bg-transparent shadow-none"
            >
                <MotionDiv
                    layoutId={`widget-container-${widget.id}`}
                    className="bg-card rounded-xl border border-border shadow-2xl flex flex-col h-full w-full overflow-hidden"
                >
                    <header className="flex items-center p-4 h-[60px] border-b border-border flex-shrink-0 drag-handle cursor-move active:cursor-grabbing">
                        <h3 className="font-semibold text-foreground text-lg">{widget.title}</h3>
                    </header>
                    <div className="flex-grow min-h-0 w-full">
                        <DataProcessor widget={widget} />
                    </div>
                </MotionDiv>
            </DialogContent>
        </Dialog>
    );
};