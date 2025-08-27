import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Sparkle } from 'phosphor-react';

export const AiInsightStarterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkle size={20} className="text-primary"/>
                        AI Insight Starter
                    </DialogTitle>
                    <DialogDescription>
                        Let our AI analyze your data to automatically create a dashboard with key metrics and visualizations.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6">
                    <p className="text-sm text-muted-foreground">
                        The AI will profile your dataset, identify important fields, create useful calculated fields if needed, and build a ready-to-use dashboard. This process may take a minute.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onConfirm} className="ai-feature-style">
                        <Sparkle size={16} /> Generate Dashboard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};