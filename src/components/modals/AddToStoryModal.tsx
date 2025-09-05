

import React, { FC } from 'react';
import { Plus } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';

export const AddToStoryModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    widgetId: string | null;
}> = ({ isOpen, onClose, widgetId }) => {
    const { stories, createStoryFromWidget, addWidgetToStory } = useDashboard();

    if (!isOpen || !widgetId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Widget to Story</DialogTitle>
                    <DialogDescription>
                        Add this widget as a new slide to an existing story or create a new one.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                    <Button onClick={() => createStoryFromWidget(widgetId)} className="w-full">
                        <Plus size={16} /> Create a New Story
                    </Button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-popover px-2 text-muted-foreground">
                                Or add to existing
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {stories.map(story => (
                            <button
                                key={story.id}
                                onClick={() => addWidgetToStory(story.id, widgetId)}
                                className="w-full text-left p-3 rounded-lg hover:bg-accent border"
                            >
                                <p className="font-semibold">{story.title}</p>
                                <p className="text-sm text-muted-foreground">{story.pages.length} page(s)</p>
                            </button>
                        ))}
                         {stories.length === 0 && <p className="text-muted-foreground text-center text-sm p-4">No existing stories. Create a new one to begin.</p>}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
