
import React, { useState, FC } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';

export const ConfirmationModal: FC<{ isOpen: boolean; onClose: () => void; title: string; message: string; onConfirm: () => void | Promise<void>; }> = ({ isOpen, onClose, title, message, onConfirm }) => {
    const [isConfirming, setIsConfirming] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error("Confirmation action failed:", error);
            // Optionally show a toast notification here
        } finally {
            setIsConfirming(false);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent className="max-w-md">
                <DialogHeader className="text-left">
                    <DialogTitle className="flex items-center gap-2">
                        <span className="icon-hover-anim inline-block"><AlertCircle size={24} className="text-destructive"/></span> 
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6">
                    <p className="text-muted-foreground">{message}</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isConfirming}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isConfirming}>
                        {isConfirming && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />}
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
