
import React, { useState } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { StoryTone, DashboardPage } from '../../utils/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { BookOpen, Sparkle } from 'phosphor-react';
import { cn, inputClasses } from '../ui/utils';

export const GenerateStoryModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { workspaces, generateStoryFromPage } = useDashboard();
    const allPages = workspaces.flatMap(ws => ws.pages);
    
    const [selectedPageId, setSelectedPageId] = useState<string>(allPages[0]?.id || '');
    const [title, setTitle] = useState<string>(allPages[0] ? `${allPages[0].name} - AI Story` : 'AI Generated Story');
    const [tone, setTone] = useState<StoryTone>('Executive');
    
    const handleGenerate = () => {
        if (!selectedPageId || !title.trim()) {
            alert("Please select a page and provide a title.");
            return;
        }
        generateStoryFromPage(selectedPageId, title.trim(), tone);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Sparkle size={20}/> Generate Story with AI</DialogTitle>
                    <DialogDescription>Let AI create a narrative from one of your dashboard pages.</DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium">Story Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className={cn(inputClasses, "mt-1")}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Source Dashboard Page</label>
                        <select
                            value={selectedPageId}
                            onChange={e => {
                                setSelectedPageId(e.target.value);
                                const page = allPages.find(p => p.id === e.target.value);
                                if (page) setTitle(`${page.name} - AI Story`);
                            }}
                            className={cn(inputClasses, "mt-1")}
                        >
                            {allPages.map(page => (
                                <option key={page.id} value={page.id}>{page.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Narrative Tone</label>
                        <div className="flex items-center gap-2 mt-1">
                            {(['Executive', 'Detailed', 'Casual'] as StoryTone[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`flex-1 p-2 rounded-md text-sm font-semibold border ${tone === t ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary hover:bg-accent'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleGenerate}>Generate Story</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
