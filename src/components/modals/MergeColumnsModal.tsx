
import React, { useState, FC } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Field } from '../../utils/types';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { inputClasses } from '../ui/utils';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { Checkbox } from '../ui/Checkbox';
import { Label } from '../ui/Label';

export const MergeColumnsModal: FC<{ isOpen: boolean; onClose: () => void; onConfirm: (payload: any) => void; availableFields: Field[]; }> = ({ isOpen, onClose, onConfirm, availableFields }) => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [newFieldName, setNewFieldName] = useState('');
    const [separator, setSeparator] = useState(' ');
    const [deleteOriginals, setDeleteOriginals] = useState(false);

    const toggleColumn = (fieldName: string) => {
        setSelectedColumns(current => current.includes(fieldName) ? current.filter(c => c !== fieldName) : [...current, fieldName]);
    };

    const handleSave = () => {
        if (selectedColumns.length < 2) { alert("Please select at least two columns to merge."); return; }
        if (!newFieldName.trim()) { alert("Please provide a name for the new merged column."); return; }
        onConfirm({ newFieldName: newFieldName.trim(), columnsToMerge: selectedColumns, separator, deleteOriginals });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><span className="icon-hover-anim inline-block"><ArrowLeftRight size={20}/></span> Merge Columns</DialogTitle>
                    <DialogDescription>Combine multiple columns into a single new column.</DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-background">
                        <h4 className="font-semibold text-sm mb-2 px-1.5">Select columns to merge</h4>
                        {availableFields.map(f => (
                            <Label key={f.name} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer font-normal">
                                <Checkbox checked={selectedColumns.includes(f.name)} onCheckedChange={() => toggleColumn(f.name)}/>
                                <span>{f.simpleName}</span>
                            </Label>
                        ))}
                    </div>
                    <input type="text" placeholder="New Column Name" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} className={inputClasses} />
                    <input type="text" placeholder="Separator" value={separator} onChange={e => setSeparator(e.target.value)} className={inputClasses} />
                    <ToggleSwitch label="Delete original columns" enabled={deleteOriginals} onChange={setDeleteOriginals} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Merge</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
