import React, { FC, useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Bookmark as BookmarkType } from '../../utils/types';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';

export const BookmarkMenu: FC = () => {
    const { activePage, addBookmark, applyBookmark, removeBookmark, openInputModal } = useDashboard();
    const [isBookmarkMenuOpen, setBookmarkMenuOpen] = useState(false);
    if (!activePage) return null;

    const bookmarks = activePage.bookmarks || [];

    const handleAddBookmark = () => {
        openInputModal({
            title: "Create Bookmark",
            inputLabel: "Bookmark Name",
            initialValue: `Bookmark ${bookmarks.length + 1}`,
            onConfirm: addBookmark
        });
    };

    return (
        <Popover
            isOpen={isBookmarkMenuOpen}
            onClose={() => setBookmarkMenuOpen(false)}
            trigger={
                <Button variant="ghost" size="icon" onClick={() => setBookmarkMenuOpen(true)} aria-label="Open bookmarks menu" className="h-7 w-7">
                    <span className="icon-hover-anim"><Bookmark size={16}/></span>
                </Button>
            }
            contentClassName="w-72 p-2"
        >
            {({ close }) => (
                <div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {bookmarks.map(bm => (
                            <div key={bm.id} className="group flex items-center justify-between p-2 rounded hover:bg-accent">
                                <button onClick={() => {applyBookmark(bm as BookmarkType); close();}} className="truncate text-sm font-medium">{bm.name}</button>
                                <button onClick={() => removeBookmark(bm.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" aria-label={`Delete bookmark ${bm.name}`}><span className="icon-hover-anim"><Trash2 size={14}/></span></button>
                            </div>
                        ))}
                         {bookmarks.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">No bookmarks yet.</p>}
                    </div>
                    <div className="mt-2 pt-2 border-t border-border">
                        <Button size="sm" className="w-full" onClick={handleAddBookmark}>Create Bookmark from Current State</Button>
                    </div>
                </div>
            )}
        </Popover>
    )
};
