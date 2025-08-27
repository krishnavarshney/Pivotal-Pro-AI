
import React, { useState, useEffect, FC } from 'react';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { inputClasses } from '../ui/utils';

export const InputModal: FC<{ isOpen: boolean; onClose: () => void; title: string; message?: string; inputLabel: string; initialValue?: string; onConfirm: (value: string) => void | Promise<void>; inputType?: string; actionLabel?: string; }> = ({ isOpen, onClose, title, message, inputLabel, initialValue, onConfirm, inputType, actionLabel }) => {
    const [value, setValue] = useState(initialValue || '');
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => { setValue(initialValue || '') }, [initialValue, isOpen]);
    
    const handleConfirm = async () => { 
        if(value.trim()) { 
            setIsConfirming(true);
            try {
                await onConfirm(value.trim());
            } catch (error) {
                console.error("Input confirmation action failed:", error);
            } finally {
                setIsConfirming(false);
                onClose(); 
            }
        }
    };

    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {message && <DialogDescription>{message}</DialogDescription>}
                </DialogHeader>
                <div className="p-6 space-y-2">
                     <label className="text-sm font-medium">{inputLabel}</label>
                    <input type={inputType || 'text'} value={value} onChange={e => setValue(e.target.value)} className={inputClasses} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleConfirm()} />
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isConfirming}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={isConfirming}>
                        {isConfirming && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />}
                        {actionLabel || "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};
