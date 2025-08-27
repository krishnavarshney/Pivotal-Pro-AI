import React, { FC } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ArrowClockwise, Timer } from 'phosphor-react';

export const PerformanceAnalyzerModal: FC = () => {
    const {
        isPerformanceAnalyzerOpen,
        closePerformanceAnalyzer,
        activePage,
        performanceTimings,
        triggerWidgetRefetch
    } = useDashboard();

    if (!isPerformanceAnalyzerOpen || !activePage) return null;

    return (
        <Dialog open={isPerformanceAnalyzerOpen} onOpenChange={closePerformanceAnalyzer}>
            <DialogOverlay />
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Timer size={20} /> Performance Analyzer
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                    {activePage.widgets.map(widget => {
                        const time = performanceTimings.get(widget.id);
                        return (
                            <div key={widget.id} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                                <span className="font-medium text-foreground">{widget.title}</span>
                                <span className="font-mono text-sm text-primary font-semibold">
                                    {time !== undefined ? `${time.toFixed(0)} ms` : 'N/A'}
                                </span>
                            </div>
                        );
                    })}
                     {activePage.widgets.length === 0 && <p className="text-muted-foreground text-center">No widgets on this page to analyze.</p>}
                </div>
                <div className="p-4 border-t border-border flex justify-end">
                    <Button onClick={triggerWidgetRefetch}>
                        <ArrowClockwise size={16} /> Re-run Analysis
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
