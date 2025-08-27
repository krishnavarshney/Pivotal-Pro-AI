
import React, { useState, useEffect, FC } from 'react';
import { Columns } from 'lucide-react';
import { Field } from '../../utils/types';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { inputClasses } from '../ui/utils';

export const SplitColumnModal: FC<{ isOpen: boolean; onClose: () => void; field: Field | null; onConfirm: (payload: any) => void; }> = ({ isOpen, onClose, field, onConfirm }) => {
    const [delimiter, setDelimiter] = useState('');
    const [newColumnNames, setNewColumnNames] = useState<string[]>([]);
    const [numCols, setNumCols] = useState(2);

    useEffect(() => {
        if (field) {
            setNewColumnNames(Array.from({ length: numCols }, (_, i) => `${field.simpleName} ${i + 1}`));
        }
    }, [field, numCols]);

    if (!isOpen || !field) return null;

    const handleSave = () => {
        if (!delimiter) { alert("Please enter a delimiter."); return; }
        onConfirm({ fieldName: field.name, delimiter, newColumnNames });
        onClose();
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><span className="icon-hover-anim inline-block"><Columns size={20}/></span> Split Column: {field.simpleName}</DialogTitle>
                    <DialogDescription>Split this column into multiple new columns based on a delimiter.</DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <input type="text" placeholder="Delimiter (e.g., ',', '-', ' ')" value={delimiter} onChange={e => setDelimiter(e.target.value)} className={inputClasses} />
                    <input type="number" min="2" placeholder="Number of new columns" value={numCols} onChange={e => setNumCols(parseInt(e.target.value) || 2)} className={inputClasses} />
                    <div className="space-y-2">
                        <label className="text-sm font-medium">New Column Names</label>
                        {newColumnNames.map((name, i) => (
                             <input key={i} type="text" value={name} onChange={e => setNewColumnNames(names => names.map((n, idx) => idx === i ? e.target.value : n))} className={inputClasses} />
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Split</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
