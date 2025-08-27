
import React, { useState, useEffect, FC } from 'react';
import { Pill, ValueFormat } from '../../utils/types';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { inputClasses } from '../ui/utils';

export const ValueFormatModal: FC<{ isOpen: boolean; onClose: () => void; pill: Pill | null; onSave: (f: ValueFormat) => void; }> = ({ isOpen, onClose, pill, onSave }) => {
    const [format, setFormat] = useState<ValueFormat>({});
    useEffect(() => {
        if (pill?.formatting) setFormat(pill.formatting);
        else setFormat({});
    }, [pill]);
    const handleSave = () => { onSave(format); onClose(); };
    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader><DialogTitle>Format: {pill?.simpleName}</DialogTitle></DialogHeader>
                <div className="p-6 space-y-4">
                     <div><label className="text-sm font-medium">Prefix</label><input type="text" value={format.prefix || ''} onChange={e => setFormat(f => ({...f, prefix: e.target.value}))} className={inputClasses}/></div>
                     <div><label className="text-sm font-medium">Suffix</label><input type="text" value={format.suffix || ''} onChange={e => setFormat(f => ({...f, suffix: e.target.value}))} className={inputClasses}/></div>
                     <div><label className="text-sm font-medium">Decimal Places</label><input type="number" min="0" value={format.decimalPlaces ?? ''} onChange={e => setFormat(f => ({...f, decimalPlaces: e.target.value === '' ? undefined : parseInt(e.target.value)}))} className={inputClasses}/></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};
