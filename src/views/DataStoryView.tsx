import React, { useState, useEffect, useMemo, useRef, FC } from 'react';
import _ from 'lodash';
import { useDashboard } from '../contexts/DashboardProvider';
import { Story, StoryPage, WidgetState, ChartType } from '../utils/types';
import { Button } from '../components/ui/Button';
import { textareaClasses, inputClasses, cn } from '../components/ui/utils';
import { FormattedInsight } from '../components/ui/FormattedInsight';
import { Sheet, SheetContent } from '../components/ui/Sheet';
import { Plus, Presentation, Pencil, Trash, X, ArrowLeft, ArrowRight, BookOpen, List, Sparkle, ExternalLink, CornerDownRight } from 'lucide-react';
import { SelectWidgetForStoryModal } from '../components/modals/SelectWidgetForStoryModal';
import { DataProcessor } from '../components/common/DataProcessor';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import * as aiService from '../services/aiService';
import { processWidgetData } from '../utils/dataProcessing/widgetProcessor';
import { useSidebar, SidebarTrigger } from '../components/ui/sidebar';
import { ViewHeader } from '../components/common/ViewHeader';


const StoryPresenter: FC<{ story: Story; onClose: () => void }> = ({ story, onClose }) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const { workspaces } = useDashboard();
    const presenterRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const MotionDiv = motion.div as any;
    
    const allWidgets = useMemo(() => workspaces.flatMap(ws => ws.pages || []).flatMap(p => p.widgets || []), [workspaces]);
    const currentPage = story.pages[currentPageIndex];
    const widget = currentPage ? allWidgets.find(w => w.id === currentPage.widgetId) : null;

    const paginate = (newDirection: number) => {
        if (newDirection > 0 && currentPageIndex < story.pages.length - 1) {
            setDirection(1);
            setCurrentPageIndex(currentPageIndex + 1);
        } else if (newDirection < 0 && currentPageIndex > 0) {
            setDirection(-1);
            setCurrentPageIndex(currentPageIndex - 1);
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') paginate(1);
            else if (e.key === 'ArrowLeft') paginate(-1);
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPageIndex, story.pages.length, onClose]);

    const toggleFullscreen = () => {
        if (!presenterRef.current) return;
        if (!document.fullscreenElement) {
            presenterRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };
    
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <div ref={presenterRef} className="fixed inset-0 bg-background z-50 flex flex-col">
            <header className="p-4 flex-shrink-0 flex justify-between items-center border-b border-border">
                <h2 className="text-xl font-bold text-foreground font-display">{story.title}</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{currentPageIndex + 1} / {story.pages.length}</span>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => paginate(-1)} disabled={currentPageIndex === 0}><ArrowLeft size={16}/></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => paginate(1)} disabled={currentPageIndex === story.pages.length - 1}><ArrowRight size={16}/></Button>
                     <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleFullscreen}>
                        {isFullscreen ? <ExternalLink size={16} /> : <CornerDownRight size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}><X size={16}/></Button>
                </div>
            </header>
            <main className="flex-grow flex min-h-0 relative">
                <AnimatePresence initial={false} custom={direction}>
                    <MotionDiv
                        key={currentPageIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                        className="absolute inset-0 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6"
                    >
                         <aside className="lg:col-span-1 bg-card rounded-xl border p-6 overflow-y-auto">
                            <FormattedInsight text={currentPage?.annotation || ''} />
                        </aside>
                        <section className="lg:col-span-2 bg-card rounded-xl border overflow-hidden">
                            {widget ? <DataProcessor widget={widget} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Widget not found.</div>}
                        </section>
                    </MotionDiv>
                </AnimatePresence>
            </main>
        </div>
    );
};

export const StoryEditor: FC<{ onBack: () => void }> = ({ onBack }) => {
    const { editingStory, setEditingStory, saveStory, workspaces, getWidgetAnalysisText, openGenerateStoryModal } = useDashboard();
    const [isWidgetSelectorOpen, setWidgetSelectorOpen] = useState(false);
    const MotionDiv = motion.div as any;
    
    if (!editingStory) return null;
    const { story } = editingStory;

    const allWidgets = useMemo(() => workspaces.flatMap(ws => ws.pages || []).flatMap(p => p.widgets || []), [workspaces]);

    const updateStory = (updates: Partial<Story>) => {
        setEditingStory(current => current ? { ...current, story: { ...current.story, ...updates } } : null);
    };

    const updatePage = (id: string, updates: Partial<StoryPage>) => {
        updateStory({ pages: story.pages.map(p => p.id === id ? { ...p, ...updates } : p) });
    };

    const addPage = (widgetId: string) => {
        const newPage: StoryPage = { id: _.uniqueId('page_'), widgetId, annotation: '' };
        updateStory({ pages: [...story.pages, newPage] });
    };

    const removePage = (id: string) => {
        updateStory({ pages: story.pages.filter(p => p.id !== id) });
    };
    
    const handleGenerateAnnotation = async (pageId: string, widgetId: string) => {
        const widget = allWidgets.find(w => w.id === widgetId);
        if (widget) {
            const annotation = await getWidgetAnalysisText(widget as WidgetState);
            if (annotation) updatePage(pageId, { annotation });
        }
    };
    
    const handleSave = () => {
        saveStory(story);
        onBack();
    };

    return (
        <div className="h-full flex flex-col bg-secondary/30">
            <ViewHeader icon={<Pencil size={24} />} title="Story Editor" showBackToDashboard={false}>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={onBack}><ArrowLeft size={16}/> Back to Stories</Button>
                    <Button onClick={handleSave}>Save Story</Button>
                </div>
            </ViewHeader>

            <div className="p-4 border-b border-border">
                <input
                    type="text"
                    value={story.title}
                    onChange={(e) => updateStory({ title: e.target.value })}
                    className={cn(inputClasses, "text-lg font-bold w-full max-w-lg bg-transparent border-0 shadow-none focus-visible:ring-0")}
                    placeholder="Story Title"
                />
            </div>

            <div className="flex-grow flex flex-col lg:flex-row min-h-0">
                <aside className="w-full lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border p-3 overflow-y-auto">
                    <Button onClick={() => setWidgetSelectorOpen(true)} className="w-full mb-3"><Plus size={16}/> Add Page</Button>
                     <Reorder.Group axis="y" values={story.pages} onReorder={(pages) => updateStory({ pages })} className="space-y-2">
                        {story.pages.map(page => (
                            <Reorder.Item key={page.id} value={page} className="bg-card p-3 rounded-lg border flex items-start gap-2 cursor-grab active:cursor-grabbing">
                                <List size={16} className="mt-1 flex-shrink-0" />
                                <div className="flex-grow">
                                    <p className="text-sm font-semibold">{allWidgets.find(w => w.id === page.widgetId)?.title || 'Untitled Widget'}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePage(page.id)}><Trash size={14}/></Button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </aside>

                <main className="flex-grow flex-wrap p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                    {story.pages.map(page => {
                        const widget = allWidgets.find(w => w.id === page.widgetId);
                        return (
                            <MotionDiv key={page.id} layout className="bg-card rounded-xl border flex flex-col overflow-hidden min-h-[400px]">
                                <header className="p-3 border-b border-border flex items-center justify-between">
                                    <h4 className="font-semibold truncate">{widget?.title || 'Widget'}</h4>
                                    <Button size="sm" variant="outline" onClick={() => handleGenerateAnnotation(page.id, page.widgetId)}><Sparkle size={14}/> Auto-annotate</Button>
                                </header>
                                 <div className="flex-grow min-h-0 border-b border-border">
                                    {widget ? <DataProcessor widget={widget as WidgetState} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Widget not found.</div>}
                                </div>
                                <div className="p-3">
                                    <textarea
                                        value={page.annotation}
                                        onChange={(e) => updatePage(page.id, { annotation: e.target.value })}
                                        placeholder="Add your annotation here..."
                                        className={cn(textareaClasses, "min-h-[100px]")}
                                    />
                                </div>
                            </MotionDiv>
                        );
                    })}
                </main>
            </div>
            <SelectWidgetForStoryModal isOpen={isWidgetSelectorOpen} onClose={() => setWidgetSelectorOpen(false)} onSelect={addPage} />
        </div>
    );
};


export const StoryListView: FC<{ onEdit: (story: Story) => void }> = ({ onEdit }) => {
    const { stories, setEditingStory, removeStory, openGenerateStoryModal, openConfirmationModal } = useDashboard();
    
    const handleNewStory = () => {
        const newStory: Story = { id: _.uniqueId('story_'), title: 'Untitled Story', pages: [] };
        setEditingStory({ story: newStory });
    };

    return (
        <div className="h-full flex flex-col">
            <ViewHeader icon={<BookOpen size={24} />} title="Data Stories" showBackToDashboard={false}>
                <Button onClick={openGenerateStoryModal}><Sparkle size={16}/> Generate with AI</Button>
                <Button onClick={handleNewStory}><Plus size={16} /> New Story</Button>
            </ViewHeader>
            <main className="flex-grow p-6 overflow-y-auto bg-secondary/30">
                {stories.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                         <div>
                            <BookOpen size={48} strokeWidth={1.5} className="mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No stories yet</h3>
                            <p className="mt-1 text-muted-foreground">Create your first story to share your insights.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {stories.map(story => (
                             <div key={story.id} className="bg-card rounded-xl border shadow-sm flex flex-col group">
                                 <div className="p-4 flex-grow">
                                     <h3 className="font-bold text-lg text-foreground">{story.title}</h3>
                                     <p className="text-sm text-muted-foreground mt-2">{story.pages.length} page{story.pages.length !== 1 && 's'}</p>
                                 </div>
                                 <div className="p-3 border-t border-border flex items-center justify-between">
                                     <Button variant="secondary" size="sm" onClick={() => onEdit(story)}><Pencil size={14}/> Edit</Button>
                                     <Button variant="destructive" size="sm" onClick={() => openConfirmationModal({title:"Delete Story?", message:`Are you sure you want to delete "${story.title}"?`, onConfirm:() => removeStory(story.id) })}><Trash size={14}/> Delete</Button>
                                 </div>
                             </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export const DataStoryView: FC = () => {
    const { editingStory, setEditingStory } = useDashboard();
    const [presentingStory, setPresentingStory] = useState<Story | null>(null);

    if (presentingStory) {
        return <StoryPresenter story={presentingStory} onClose={() => setPresentingStory(null)} />;
    }

    if (editingStory) {
        return <StoryEditor onBack={() => setEditingStory(null)} />;
    }

    return <StoryListView onEdit={(story) => setEditingStory({ story })} />;
};