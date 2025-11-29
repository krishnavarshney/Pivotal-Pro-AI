import { FC } from 'react';
import { Search, Undo2, Redo2 } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { useSidebar, SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { DashboardModeSwitcher } from './DashboardModeSwitcher';
import { BookmarkMenu } from './BookmarkMenu';
import { ActionsPopover } from './ActionsPopover';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { DatasetSelector } from './DatasetSelector';
import { EditablePageName } from './EditablePageName';

export const DashboardHeader: FC = () => {
    const { openCommandPalette, undo, redo, canUndo, canRedo } = useDashboard();
    const { isMobile } = useSidebar();
    
    return (
        <div className="flex-shrink-0 flex items-center justify-between h-[65px] gap-3 px-4 border-b border-border">
            {/* Left: Page Name + Dataset Selector */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {isMobile && <SidebarTrigger />}
                <EditablePageName />
                <div className="hidden lg:block flex-shrink-0">
                    <DatasetSelector />
                </div>
            </div>
            
            {/* Center: Command Palette */}
            <div className="hidden md:flex flex-1 justify-center max-w-2xl">
                <button 
                    onClick={openCommandPalette}
                    className="w-full max-w-lg h-11 px-4 flex items-center gap-3 bg-card rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:shadow-sm group"
                >
                    <Search size={16} className="group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="truncate">Search or type a command...</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 flex-shrink-0">
                        ⌘K
                    </kbd>
                </button>
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex items-center justify-end gap-2 flex-shrink-0 flex-1">
                 <div className="hidden lg:flex items-center gap-1 p-1 border border-border rounded-lg bg-card">
                    <Tooltip content="Undo">
                        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo" className="h-7 w-7">
                            <Undo2 size={16}/>
                        </Button>
                    </Tooltip>
                    <Tooltip content="Redo">
                        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo" className="h-7 w-7">
                            <Redo2 size={16}/>
                        </Button>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-1 p-1 border border-border rounded-lg bg-card">
                    <DashboardModeSwitcher />
                    <BookmarkMenu />
                    <ActionsPopover />
                </div>
                
                <NotificationBell />
                
                <UserMenu />
            </div>
        </div>
    );
};
