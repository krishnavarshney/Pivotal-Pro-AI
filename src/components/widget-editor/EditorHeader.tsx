import React from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button, inputClasses } from '../ui';
import { Save, X, Pencil } from 'lucide-react';

export const EditorHeader: React.FC = () => {
    const { editingWidgetState, updateEditingWidget, saveEditingWidget, closeWidgetEditorModal } = useDashboard();

    if (!editingWidgetState) return null;

    return (
        <header className="flex-shrink-0 flex items-center justify-between p-4 h-[65px] border-b border-border/50">
            <div className="flex items-center gap-3 group">
                <Pencil size={20} className="text-primary" />
                <input
                    type="text"
                    value={editingWidgetState.title}
                    onChange={e => updateEditingWidget({ title: e.target.value })}
                    className={`${inputClasses} text-lg font-semibold w-full max-w-md bg-transparent border-0 shadow-none focus-visible:ring-0 px-2`}
                    placeholder="Widget Title"
                />
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={closeWidgetEditorModal}><X /> Cancel</Button>
                <Button onClick={saveEditingWidget}><Save /> Save Widget</Button>
            </div>
        </header>
    );
};
