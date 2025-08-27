import React, { useState } from 'react';
import { PuzzlePiece } from 'phosphor-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { DashboardPage, Template } from '../../utils/types';
import { Button, Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, inputClasses, textareaClasses } from '../ui';

export const CreateTemplateModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    page: DashboardPage | null;
}> = ({ isOpen, onClose, page }) => {
    const { createTemplateFromPage } = useDashboard();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Custom');

    const handleSave = () => {
        if (!page || !name.trim()) {
            alert("Template name is required.");
            return;
        }
        createTemplateFromPage(page, {
            name,
            description,
            category,
            difficulty: 'Beginner',
            rating: 0,
            downloads: 0,
            tags: [category],
            includedWidgets: page.widgets.map(w => w.title),
            setupTime: '1 min',
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><PuzzlePiece size={20}/> Save Page as Template</DialogTitle>
                    <DialogDescription>Create a reusable template from the current page's layout and widget configuration.</DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <input
                        type="text"
                        placeholder="Template Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className={inputClasses}
                        autoFocus
                    />
                    <textarea
                        placeholder="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className={textareaClasses}
                        rows={3}
                    />
                    <input
                        type="text"
                        placeholder="Category"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className={inputClasses}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Template</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};