
import React, { useState, useEffect, FC } from 'react';
import { Field } from '../../utils/types';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { inputClasses } from '../ui/utils';

export const RenameFieldModal: FC<{ isOpen: boolean; onClose: () => void; field: Field | null; onConfirm: (newName: string) => void; }> = ({ isOpen, onClose, field, onConfirm }) => {
    const [name, setName] = useState(field?.simpleName || '');
    useEffect(() => { if(field) setName(field.simpleName); }, [field]);
    const handleConfirm = () => { if (name.trim()) { onConfirm(name.trim()); onClose(); }};
    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader><DialogTitle>Rename: {field?.simpleName}</DialogTitle></DialogHeader>
                <div className="p-6"><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} autoFocus /></div>
                <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleConfirm}>Rename</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    )
};
