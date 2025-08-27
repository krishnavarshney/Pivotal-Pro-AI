
import React, { useState, FC } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Parameter } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { inputClasses } from '../ui/utils';
import { SlidersHorizontal, Plus, Trash2, Pencil } from 'lucide-react';
import _ from 'lodash';

export const ParameterModal: FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { parameters, addParameter, removeParameter, updateParameter, openInputModal } = useDashboard();
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'string' | 'number'>('string');
    const [newDefaultValue, setNewDefaultValue] = useState<string | number>('');

    const handleAdd = () => {
        if (!newName.trim()) return;
        addParameter({
            name: newName.trim(),
            type: newType,
            currentValue: newType === 'number' ? Number(newDefaultValue) : newDefaultValue,
        });
        setNewName('');
        setNewDefaultValue('');
    };

    const handleEditName = (param: Parameter) => {
        openInputModal({
            title: 'Edit Parameter Name',
            inputLabel: 'New Name',
            initialValue: param.name,
            onConfirm: (value) => {
                updateParameter(param.id, { name: value });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="icon-hover-anim inline-block"><SlidersHorizontal size={20} /></span> Parameters
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                    <div className="space-y-2">
                        {parameters.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{p.name}</span>
                                    <span className="text-xs text-muted-foreground">Type: {p.type}, Current: {String(p.currentValue)}</span>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditName(p)}><span className="icon-hover-anim inline-block"><Pencil size={16} /></span></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeParameter(p.id)}><span className="icon-hover-anim inline-block"><Trash2 size={16} /></span></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="pt-4 border-t border-border space-y-2">
                        <h4 className="font-semibold text-sm">Add New Parameter</h4>
                        <input type="text" placeholder="Parameter Name" value={newName} onChange={e => setNewName(e.target.value)} className={inputClasses}/>
                        <div className="flex gap-2">
                            <select value={newType} onChange={e => setNewType(e.target.value as any)} className={inputClasses}>
                                <option value="string">String</option>
                                <option value="number">Number</option>
                            </select>
                             <input type={newType} placeholder="Default Value" value={String(newDefaultValue)} onChange={e => setNewDefaultValue(e.target.value)} className={inputClasses}/>
                        </div>
                        <Button onClick={handleAdd} className="w-full"><Plus size={16} /> Add Parameter</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
