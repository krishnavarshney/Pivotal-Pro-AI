import React, { useState, FC, ReactElement } from 'react';
import {
    Settings,
    Sparkles,
    Save,
    Upload,
    Download,
    Filter,
    Trash2,
    Copy,
    Table,
    BookOpen,
    X,
    Undo2,
    Redo2,
    AlertCircle,
    MoreVertical,
    RotateCw,
    Pencil,
    Users,
    Aperture,
    Search,
    Puzzle,
    Share2,
    LogOut,
    BarChart,
    Timer,
    GripVertical,
    ShieldCheck,
    Bookmark,
    MessageSquare,
    ChevronDown,
    LineChart,
    AreaChart,
    PieChart,
    AppWindow,
    Grid,
    Construction,
    BarChartHorizontal,
    Box,
    Dot,
    Layout as LayoutIcon,
    Info,
    SlidersHorizontal,
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { WidgetState, WidgetLayout, ChartType, Pill, FilterCondition, AggregationType, DND_ITEM_TYPE, FieldType, Bookmark as BookmarkType, ContextMenuItem, Field } from '../../utils/types';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { cn } from '../ui/utils';
import { Tooltip } from '../ui/Tooltip';
import { useSidebar, SidebarTrigger } from '../ui/sidebar';
import { useAuth } from '../../contexts/AuthProvider';
import { ThemeSwitcher } from './ThemeSwitcher';

const UserMenu: FC = () => {
    const { setView } = useDashboard();
    const { user, logout } = useAuth();
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);

    if (!user) return null;

    return (
        <Popover isOpen={isUserMenuOpen} onClose={() => setUserMenuOpen(false)} trigger={
            <button onClick={() => setUserMenuOpen(true)} className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm ring-2 ring-primary/50 hover:shadow-lg transition-shadow" aria-label={`Open user menu for ${user.name}`}>{user.initials}</button>
        } contentClassName="w-56 p-2" align="right">
            {({ close }) => (
                <div className="flex flex-col gap-1">
                    <div className="px-2 py-1 border-b border-border mb-1">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <button onClick={() => { setView('settings'); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><Settings size={16} /></span> Settings</button>
                    {user.role === 'ADMIN' && (
                        <button onClick={() => { setView('admin'); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><ShieldCheck size={16} /></span> Admin Dashboard</button>
                    )}
                    <div className="h-px bg-border my-1" />
                    <button onClick={() => { logout(); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><LogOut size={16} /></span> Sign Out</button>
                </div>
            )}
        </Popover>
    );
};

const BookmarkMenu: FC = () => {
    const { activePage, addBookmark, applyBookmark, removeBookmark, openInputModal } = useDashboard();
    const [isBookmarkMenuOpen, setBookmarkMenuOpen] = useState(false);
    if (!activePage) return null;

    const handleAddBookmark = () => {
        openInputModal({
            title: "Create Bookmark",
            inputLabel: "Bookmark Name",
            initialValue: `Bookmark ${activePage.bookmarks.length + 1}`,
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
                        {activePage.bookmarks.map(bm => (
                            <div key={bm.id} className="group flex items-center justify-between p-2 rounded hover:bg-accent">
                                <button onClick={() => {applyBookmark(bm as BookmarkType); close();}} className="truncate text-sm font-medium">{bm.name}</button>
                                <button onClick={() => removeBookmark(bm.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" aria-label={`Delete bookmark ${bm.name}`}><span className="icon-hover-anim"><Trash2 size={14}/></span></button>
                            </div>
                        ))}
                         {activePage.bookmarks.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">No bookmarks yet.</p>}
                    </div>
                    <div className="mt-2 pt-2 border-t border-border">
                        <Button size="sm" className="w-full" onClick={handleAddBookmark}>Create Bookmark from Current State</Button>
                    </div>
                </div>
            )}
        </Popover>
    )
};

const ActionsPopover: FC = () => {
    const {
        activePage,
        openCreateTemplateModal,
        importInputRef,
        handleExportDashboard,
        openPerformanceAnalyzer,
        resetDashboard,
    } = useDashboard();
    const [isOpen, setIsOpen] = useState(false);

    if (!activePage) return null;

    const actions = [
        { label: 'Save Page as Template', icon: <Save size={16} />, onClick: () => openCreateTemplateModal(activePage) },
        { label: '---', onClick: () => {} },
        { label: 'Import Dashboard', icon: <Upload size={16} />, onClick: () => importInputRef.current?.click() },
        { label: 'Export Dashboard', icon: <Download size={16} />, onClick: handleExportDashboard },
        { label: '---', onClick: () => {} },
        { label: 'Performance Analyzer', icon: <Timer size={16} />, onClick: openPerformanceAnalyzer },
        { label: 'Reset Dashboard', icon: <RotateCw size={16} />, onClick: resetDashboard, isDestructive: true },
    ];

    return (
        <Popover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            trigger={
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} aria-label="Open dashboard actions menu" className="h-7 w-7">
                    <span className="icon-hover-anim"><MoreVertical /></span>
                </Button>
            }
            contentClassName="w-60 p-2"
            align="right"
        >
             {({ close }) => (
                <div className="flex flex-col gap-1">
                    {actions.map((action, index) => (
                         action.label === '---' ? <div key={index} className="h-px bg-border my-1" /> : (
                            <button
                                key={index}
                                onClick={() => { action.onClick(); close(); }}
                                className={cn(
                                    "w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent",
                                    (action as any).isDestructive && "text-destructive hover:bg-destructive/10"
                                )}
                            >
                                <span className="icon-hover-anim">{action.icon}</span> {action.label}
                            </button>
                        )
                    ))}
                </div>
            )}
        </Popover>
    );
};

export const DashboardHeader: FC = () => {
    const { activePage, openCommandPalette, undo, redo, canUndo, canRedo, dashboardMode, setDashboardMode, isHelpModeActive, toggleHelpMode } = useDashboard();
    const { isMobile } = useSidebar();

    return (
        <div className="flex-shrink-0 grid grid-cols-3 items-center h-[65px] gap-4">
            {/* Left: Title */}
            <div className="flex items-center gap-3 justify-start">
                {isMobile && <SidebarTrigger />}
                <h1 className="text-2xl font-bold font-display text-foreground truncate">{activePage?.name || 'Dashboard'}</h1>
            </div>

            {/* Center: Command Palette */}
            <div className="flex justify-center">
                <button
                    onClick={openCommandPalette}
                    className="w-full max-w-lg h-11 px-4 flex items-center gap-3 bg-card rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:shadow-md group"
                >
                    <Search size={16} className="group-hover:text-primary transition-colors" />
                    <span>Type a command or search...</span>
                    <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
                        ⌘K
                    </kbd>
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-2">
                 <div className="hidden md:flex items-center gap-1 p-1 border border-border rounded-lg bg-card">
                    <Tooltip content="Undo"><Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo" className="h-7 w-7"><Undo2 size={16}/></Button></Tooltip>
                    <Tooltip content="Redo"><Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo" className="h-7 w-7"><Redo2 size={16}/></Button></Tooltip>
                </div>

                <div className="hidden md:flex items-center gap-1 p-1 border border-border rounded-lg bg-card">
                    <Tooltip content="Comment Mode"><Button variant={dashboardMode === 'comment' ? 'outline' : 'ghost'} size="icon" onClick={() => setDashboardMode(m => m === 'comment' ? 'view' : 'comment')} aria-label="Toggle Comment Mode" className="h-7 w-7"><MessageSquare size={16} /></Button></Tooltip>
                    <Tooltip content="Help Mode"><Button variant={isHelpModeActive ? 'outline' : 'ghost'} size="icon" onClick={toggleHelpMode} aria-label="Toggle Help Mode" className="h-7 w-7"><Info size={16} /></Button></Tooltip>
                    <BookmarkMenu />
                    <ActionsPopover />
                </div>

                <div className="p-1 border border-border rounded-lg bg-card">
                    <ThemeSwitcher />
                </div>

                <UserMenu />
            </div>
        </div>
    );
};
