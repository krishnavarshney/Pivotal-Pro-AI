import React, { useState, useEffect, useMemo, useRef, FC, ReactNode } from 'react';
import _ from 'lodash';
import { useDashboard } from '../contexts/DashboardProvider';
import { useAuth } from '../contexts/AuthProvider';
import { Story, StoryPage, StoryPageType, WidgetState, ChartType, WidgetLayout } from '../utils/types';
import { Button } from '../components/ui/Button';
import { textareaClasses, inputClasses, cn } from '../components/ui/utils';
import { FormattedInsight } from '../components/ui/FormattedInsight';
// FIX: Replaced missing lucide-react icons with their correct counterparts.
import { Plus, Presentation, Pencil, Trash, X, ArrowLeft, ArrowRight, BookOpen, Sparkle, Image as ImageIcon, Layout as LayoutIcon, Text, Copy as CopyIcon, FileText, Expand, Shrink, PencilLine, Share2 } from 'lucide-react';
import { SelectWidgetForStoryModal } from '../components/modals/SelectWidgetForStoryModal';
import { DataProcessor } from '../components/common/DataProcessor';
// FIX: Corrected framer-motion import for Variants and aliased motion components.
import { motion, AnimatePresence, Reorder, type Variants } from 'framer-motion';
import { ViewHeader } from '../components/common/ViewHeader';
import { Popover } from '../components/ui/Popover';
import { Responsive, WidthProvider } from 'react-grid-layout';
import Lottie from 'lottie-react';

const ResponsiveGridLayout = WidthProvider(Responsive);
const MotionDiv = motion.div as any;
const MotionReorder = Reorder as any;

const storyAnimation = {"v":"5.9.6","fr":30,"ip":0,"op":90,"w":800,"h":600,"nm":"Data Story Animation","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Slide","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[400,300,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-300,-200],[300,-200],[300,200],[-300,200]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"rc","d":1,"s":{"a":0,"k":[600,400],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":20,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[1,1,1,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[400,300],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7}}],"nm":"Rectangle 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":90,"st":0,"bm":0,"sc":"#ffffff"},{"ddd":0,"ind":2,"ty":4,"nm":"Chart Group","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.833,"y":0.833},"o":{"x":0.167,"y":0.167},"t":0,"s":[150,300,0]},{"i":{"x":0.833,"y":0.833},"o":{"x":0.167,"y":0.167},"t":30,"s":[250,300,0]},{"t":60,"s":[600,300,0]}],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":0.833,"y":0.833},"o":{"x":0.167,"y":0.167},"t":0,"s":[50,50,100]},{"i":{"x":0.833,"y":0.833},"o":{"x":0.167,"y":0.167},"t":30,"s":[80,80,100]},{"t":60,"s":[20,20,100]}],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ty":"gr","it":[{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":0,"k":[20,50],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":5,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.290196090937,0.278431385756,0.898039221764,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[-40,0],"ix":2}}],"nm":"Bar 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":0,"k":[20,80],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":5,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0,0.658823549747,0.709803938866,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2}}],"nm":"Bar 2","np":2,"cix":2,"bm":0,"ix":2,"mn":"ADBE Vector Group","hd":false},{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":0,"k":[20,30],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":5,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.96862745285,0.721568644047,0,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[40,0],"ix":2}}],"nm":"Bar 3","np":2,"cix":2,"bm":0,"ix":3,"mn":"ADBE Vector Group","hd":false}],"nm":"Bar Chart","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"nm":"Group 1","np":1,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":90,"st":0,"bm":0},{"ddd":0,"ind":3,"ty":4,"nm":"Text Group","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":0.167,"y":0.167},"t":45,"s":0},{"t":60,"s":100}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[400,300,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":0,"k":[150,10],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":2,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.8,0.8,0.8,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[100,-100],"ix":2}}],"nm":"Line 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":0,"k":[200,10],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":2,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.8,0.8,0.8,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[100,-70],"ix":2}}],"nm":"Line 2","np":2,"cix":2,"bm":0,"ix":2,"mn":"ADBE Vector Group","hd":false},{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":0,"k":[180,10],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":2,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.8,0.8,0.8,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[100,-40],"ix":2}}],"nm":"Line 3","np":2,"cix":2,"bm":0,"ix":3,"mn":"ADBE Vector Group","hd":false}],"nm":"Text Lines","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":90,"st":0,"bm":0}]}

// --- Sub-components for Editor & Presenter ---

const SlideThumbnail: FC<{ page: StoryPage, isSelected: boolean, onSelect: () => void }> = ({ page, isSelected, onSelect }) => {
    const { workspaces } = useDashboard();
    const allWidgets = useMemo(() => workspaces.flatMap(ws => ws.pages || []).flatMap(p => p.widgets || []), [workspaces]);
    const widget = useMemo(() => page.widgetId ? allWidgets.find(w => w.id === page.widgetId) : null, [page, allWidgets]);

    const getIcon = () => {
        switch (page.type) {
            case 'title': return <Text size={24} />;
            case 'text': return <Text size={24} />;
            case 'insight': return widget ? <ImageIcon size={24} /> : <ImageIcon size={24} className="opacity-50"/>;
            case 'layout': return <LayoutIcon size={24} />;
            default: return <div className="w-6 h-6 bg-muted rounded"/>;
        }
    };
    
    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full h-full p-2 border-2 rounded-lg flex flex-col items-center justify-center text-center transition-colors",
                isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-accent'
            )}
        >
            <div className="text-primary">{getIcon()}</div>
            <p className="text-xs text-foreground font-semibold mt-2 truncate w-full">{page.title}</p>
        </button>
    );
};

const NewSlideMenu: FC<{ onSelect: (type: StoryPageType) => void }> = ({ onSelect }) => {
    const slideTypes = [
        { type: 'title' as StoryPageType, title: 'Title Slide', icon: <Text />, description: "A bold opening for your story." },
        { type: 'text' as StoryPageType, title: 'Text Slide', icon: <Text />, description: "Add context or summaries." },
        { type: 'insight' as StoryPageType, title: 'Insight Slide', icon: <ImageIcon />, description: "Combine one widget with a narrative." },
        { type: 'layout' as StoryPageType, title: 'Layout Slide', icon: <LayoutIcon />, description: "Arrange multiple widgets together." },
    ];
    
    return (
        <div className="space-y-2">
            {slideTypes.map(st => (
                <button key={st.type} onClick={() => onSelect(st.type)} className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-3">
                    <div className="text-primary">{st.icon}</div>
                    <div>
                        <p className="font-semibold text-sm">{st.title}</p>
                        <p className="text-xs text-muted-foreground">{st.description}</p>
                    </div>
                </button>
            ))}
        </div>
    );
};


// --- Main Components: Presenter, Editor, List ---

const StoryPresenter: FC<{ story: Story; onClose: () => void }> = ({ story, onClose }) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const { workspaces } = useDashboard();
    const presenterRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showNotes, setShowNotes] = useState(false);

    const allWidgets = useMemo(() => workspaces.flatMap(ws => ws.pages || []).flatMap(p => p.widgets || []), [workspaces]);
    const currentPage = story.pages[currentPageIndex];

    const paginate = (newDirection: number) => {
        if (newDirection > 0 && currentPageIndex < story.pages.length - 1) {
            setDirection(1);
            setCurrentPageIndex(currentPageIndex + 1);
        } else if (newDirection < 0 && currentPageIndex > 0) {
            setDirection(-1);
            setCurrentPageIndex(currentPageIndex - 1);
        }
    };
    
    const toggleFullscreen = () => {
        if (!presenterRef.current) return;
        if (!document.fullscreenElement) {
            presenterRef.current.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') paginate(1);
            else if (e.key === 'ArrowLeft') paginate(-1);
            else if (e.key === 'Escape') onClose();
            else if (e.key.toLowerCase() === 'f') toggleFullscreen();
            else if (e.key.toLowerCase() === 'n') setShowNotes(s => !s);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPageIndex, story.pages.length]);
    
    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const variants = {
        enter: (direction: number) => ({ x: direction > 0 ? '50%' : '-50%', scale: 0.9, opacity: 0 }),
        center: { zIndex: 1, x: 0, scale: 1, opacity: 1 },
        exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '50%' : '-50%', scale: 0.9, opacity: 0 }),
    };

    const slideContentVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } },
    };

    const renderSlide = (page: StoryPage) => {
        const content = (() => {
            switch (page.type) {
                case 'title':
                    return (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 bg-transparent">
                            <h1 className="text-6xl md:text-8xl font-black font-display text-primary leading-tight">{page.title}</h1>
                            {page.subtitle && <h2 className="text-3xl md:text-4xl font-display text-foreground mt-6 leading-snug">{page.subtitle}</h2>}
                            {page.annotation && <div className="mt-12 max-w-3xl"><FormattedInsight text={page.annotation}/></div>}
                        </div>
                    );
                case 'text':
                    return (
                        <div className="w-full h-full flex flex-col justify-center p-12 bg-card rounded-xl overflow-y-auto">
                            <h2 className="text-4xl font-bold font-display text-primary mb-6">{page.title}</h2>
                            <FormattedInsight text={page.annotation || ''} />
                        </div>
                    );
                case 'insight':
                    const widget = allWidgets.find(w => w.id === page.widgetId);
                    return (
                        <div className={cn("w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-6", page.insightLayout === 'right' && 'lg:grid-cols-[2fr,1fr]')}>
                            <div className={cn("bg-card rounded-xl border overflow-hidden", page.insightLayout === 'right' ? 'lg:order-1' : 'lg:order-2')}>
                                {widget ? <DataProcessor widget={widget} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Widget not found.</div>}
                            </div>
                            <aside className={cn("lg:col-span-1 bg-card rounded-xl border p-6 overflow-y-auto", page.insightLayout === 'right' ? 'lg:order-2' : 'lg:order-1')}>
                                <h3 className="text-2xl font-bold font-display text-foreground mb-4">{page.title || widget?.title}</h3>
                                <FormattedInsight text={page.annotation || ''} />
                            </aside>
                        </div>
                    );
                case 'layout':
                    const layoutWidgets = (page.widgetIds || []).map(id => allWidgets.find(w => w.id === id)).filter((w): w is WidgetState => !!w);
                    return (
                        <div className="w-full h-full bg-card rounded-xl border overflow-hidden p-4">
                            <h2 className="text-2xl font-bold font-display text-foreground mb-4 px-2">{page.title}</h2>
                             <ResponsiveGridLayout
                                layouts={page.layoutConfig}
                                breakpoints={{ lg: 1200 }}
                                cols={{ lg: 24 }}
                                rowHeight={30}
                                isDraggable={false} isResizable={false}
                                className="layout h-full"
                            >
                                {layoutWidgets.map(w => (
                                    <div key={w.id} className="h-full w-full">
                                        <DataProcessor widget={w} />
                                    </div>
                                ))}
                            </ResponsiveGridLayout>
                        </div>
                    );
                default:
                    return <div className="flex items-center justify-center h-full text-muted-foreground">Unsupported slide type.</div>;
            }
        })();
        return (
            <MotionDiv variants={slideContentVariants} initial="hidden" animate="visible" className="w-full h-full">
                {content}
            </MotionDiv>
        );
    };

    return (
        <div ref={presenterRef} className="fixed inset-0 bg-background z-50 flex flex-col presenter-background">
            <header className="p-4 flex-shrink-0 flex justify-between items-center border-b border-border/50 relative">
                <h2 className="text-xl font-bold text-foreground font-display">{story.title}</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{currentPageIndex + 1} / {story.pages.length}</span>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => paginate(-1)} disabled={currentPageIndex === 0}><ArrowLeft size={16}/></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => paginate(1)} disabled={currentPageIndex === story.pages.length - 1}><ArrowRight size={16}/></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowNotes(s => !s)}><FileText size={16}/></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleFullscreen}>{isFullscreen ? <Shrink size={16} /> : <Expand size={16} />}</Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}><X size={16}/></Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-border/20">
                    <motion.div
                        className="h-1 bg-primary"
                        animate={{ width: `${((currentPageIndex + 1) / story.pages.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                </div>
            </header>
            <main className="flex-grow flex min-h-0 relative p-6">
                <AnimatePresence initial={false} custom={direction}>
                    <MotionDiv
                        key={currentPageIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="absolute inset-6"
                    >
                         {currentPage && renderSlide(currentPage)}
                    </MotionDiv>
                </AnimatePresence>
            </main>
            <AnimatePresence>
                {showNotes && currentPage?.presenterNotes && (
                    <motion.aside
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="absolute bottom-0 left-0 right-0 h-1/3 bg-card/80 backdrop-blur-md border-t border-border/50 shadow-2xl flex flex-col"
                    >
                        <header className="p-3 border-b border-border/50 flex items-center justify-between">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><FileText /> Presenter Notes</h4>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNotes(false)}><X size={14} /></Button>
                        </header>
                        <div className="p-4 overflow-y-auto">
                            <FormattedInsight text={currentPage.presenterNotes} />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
};

export const StoryEditor: FC<{ onBack: () => void }> = ({ onBack }) => {
    const { editingStory, setEditingStory, saveStory, workspaces, getWidgetAnalysisText } = useDashboard();
    const [isWidgetSelectorOpen, setWidgetSelectorOpen] = useState(false);
    const [widgetSelectorCallback, setWidgetSelectorCallback] = useState<(id: string) => void>(() => {});
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [isNewSlideMenuOpen, setIsNewSlideMenuOpen] = useState(false);
    
    useEffect(() => {
        if (editingStory) {
            if (editingStory.focusPageId) {
                setSelectedPageId(editingStory.focusPageId);
                setEditingStory(current => current ? { ...current, focusPageId: undefined } : null);
            } else if (!selectedPageId && editingStory.story.pages.length > 0) {
                setSelectedPageId(editingStory.story.pages[0].id);
            }
        }
    }, [editingStory, selectedPageId, setEditingStory]);
    
    if (!editingStory) return null;
    const { story } = editingStory;

    const allWidgets = useMemo(() => workspaces.flatMap(ws => ws.pages || []).flatMap(p => p.widgets || []), [workspaces]);
    const selectedPage = story.pages.find(p => p.id === selectedPageId);

    const updateStory = (updater: (story: Story) => Story) => {
        setEditingStory(current => current ? { ...current, story: updater(current.story) } : null);
    };

    const addStoryPage = (pageType: StoryPageType, widgetId?: string) => {
        const newPageId = _.uniqueId('spage_');
        let newPage: StoryPage;
        const pageNumber = story.pages.length + 1;

        switch (pageType) {
            case 'title': newPage = { id: newPageId, type: 'title', title: `Title Slide ${pageNumber}`, subtitle: 'Your subtitle here' }; break;
            case 'text': newPage = { id: newPageId, type: 'text', title: `Text Slide ${pageNumber}`, annotation: '' }; break;
            case 'layout': newPage = { id: newPageId, type: 'layout', title: `Layout Slide ${pageNumber}`, widgetIds: [], layoutConfig: { lg: [] } }; break;
            case 'insight': {
                const addInsightPage = (widgetId: string) => {
                    const widget = allWidgets.find(w => w.id === widgetId);
                    const insightPage: StoryPage = { id: newPageId, type: 'insight', title: widget?.title || `Insight ${pageNumber}`, widgetId, annotation: '', insightLayout: 'left' };
                    updateStory(s => ({ ...s, pages: [...s.pages, insightPage] }));
                    setSelectedPageId(newPageId);
                };
                setWidgetSelectorCallback(() => addInsightPage);
                setWidgetSelectorOpen(true);
                return;
            }
        }
        updateStory(s => ({ ...s, pages: [...s.pages, newPage] }));
        setSelectedPageId(newPageId);
    };

    const handleGenerateAnnotation = async () => {
        if (!selectedPage || selectedPage.type !== 'insight') return;
        const widget = allWidgets.find(w => w.id === selectedPage.widgetId);
        if(!widget) return;
        const annotation = await getWidgetAnalysisText(widget as WidgetState);
        if (annotation) updateStory(s => ({ ...s, pages: s.pages.map(p => p.id === selectedPageId ? {...p, annotation} : p) }));
    };

    const handleSave = () => { saveStory(story); onBack(); };

    const renderCanvas = () => {
        if (!selectedPage) return <div className="flex items-center justify-center h-full text-muted-foreground"><BookOpen size={48} /> Select a slide to begin.</div>;
        switch (selectedPage.type) {
            case 'title':
            case 'text':
                return <div className="w-full h-full flex items-center justify-center p-8 bg-card rounded-lg border shadow-inner"><FormattedInsight text={`# ${selectedPage.title || ''}\n## ${selectedPage.subtitle || ''}\n${selectedPage.annotation || ''}`} /></div>;
            case 'insight':
                const widget = allWidgets.find(w => w.id === selectedPage.widgetId);
                return <div className="w-full h-full bg-card rounded-lg border shadow-inner overflow-hidden">{widget ? <DataProcessor widget={widget} /> : <div className="flex items-center justify-center h-full text-muted-foreground">Select a widget</div>}</div>;
            case 'layout':
                const layoutWidgets = (selectedPage.widgetIds || []).map(id => allWidgets.find(w => w.id === id)).filter((w): w is WidgetState => !!w);
                return <div className="w-full h-full bg-card rounded-lg border shadow-inner overflow-hidden p-2"><ResponsiveGridLayout layouts={selectedPage.layoutConfig} breakpoints={{ lg: 1200 }} cols={{ lg: 24 }} rowHeight={15} isDraggable={false} isResizable={false} className="layout h-full bg-grid">{layoutWidgets.map(w => <div key={w.id}><DataProcessor widget={w} /></div>)}</ResponsiveGridLayout></div>;
        }
    };
    
    const renderProperties = () => {
        if (!selectedPage) return null;
        return (
            <AnimatePresence mode="wait">
            <MotionDiv key={selectedPage.id} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                <input type="text" value={selectedPage.title || ''} onChange={e => updateStory(s => ({...s, pages: s.pages.map(p => p.id === selectedPageId ? {...p, title: e.target.value} : p)}))} className={cn(inputClasses, 'text-lg font-bold')} />
                {selectedPage.type === 'title' && <input type="text" placeholder="Subtitle..." value={selectedPage.subtitle || ''} onChange={e => updateStory(s => ({...s, pages: s.pages.map(p => p.id === selectedPageId ? {...p, subtitle: e.target.value} : p)}))} className={inputClasses} />}
                {(selectedPage.type === 'insight' || selectedPage.type === 'text' || selectedPage.type === 'title') && <textarea value={selectedPage.annotation || ''} onChange={e => updateStory(s => ({...s, pages: s.pages.map(p => p.id === selectedPageId ? {...p, annotation: e.target.value} : p)}))} placeholder="Annotation or content..." className={cn(textareaClasses, "h-48")} />}
                {selectedPage.type === 'insight' && (
                     <div className="space-y-2">
                        <Button size="sm" variant="outline" onClick={handleGenerateAnnotation} className="w-full"><Sparkle size={14}/> Generate Annotation with AI</Button>
                        <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg"><button onClick={() => updateStory(s => ({...s, pages: s.pages.map(p => p.id === selectedPageId ? {...p, insightLayout: 'left'} : p)}))} className={`flex-1 text-center py-1.5 px-3 rounded-md text-sm ${selectedPage.insightLayout !== 'right' ? 'bg-background shadow-sm' : ''}`}>Left</button><button onClick={() => updateStory(s => ({...s, pages: s.pages.map(p => p.id === selectedPageId ? {...p, insightLayout: 'right'} : p)}))} className={`flex-1 text-center py-1.5 px-3 rounded-md text-sm ${selectedPage.insightLayout === 'right' ? 'bg-background shadow-sm' : ''}`}>Right</button></div>
                    </div>
                )}
                {selectedPage.type === 'layout' && <Button size="sm" variant="outline" className="w-full"><Plus /> Add Widget to Layout</Button>}
                <div className="pt-4 border-t"><h4 className="text-sm font-semibold text-muted-foreground mb-2">Presenter Notes</h4><textarea value={selectedPage.presenterNotes || ''} onChange={e => updateStory(s => ({...s, pages: s.pages.map(p => p.id === selectedPageId ? {...p, presenterNotes: e.target.value} : p)}))} placeholder="Notes for the presenter (not visible on slide)..." className={cn(textareaClasses, "h-24")} /></div>
            </MotionDiv>
            </AnimatePresence>
        );
    };

    return (
        <div className="h-full flex flex-col bg-background text-foreground">
            <ViewHeader icon={<Pencil size={24} />} title={story.title} showBackToDashboard={false}>
                <input type="text" value={story.title} onChange={e => updateStory(s => ({...s, title: e.target.value}))} className={cn(inputClasses, 'h-9 text-lg font-bold bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0')} />
                <div className="flex-grow"></div>
                <Button variant="outline" onClick={onBack}><ArrowLeft size={16}/> Back</Button>
                <Button onClick={handleSave}>Save & Close</Button>
            </ViewHeader>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-[280px,1fr,350px] min-h-0">
                <aside className="border-r border-border flex flex-col p-4 gap-4">
                    <Popover isOpen={isNewSlideMenuOpen} onClose={() => setIsNewSlideMenuOpen(false)} trigger={<Button className="w-full" onClick={() => setIsNewSlideMenuOpen(true)}><Plus/>Add Slide</Button>} contentClassName="w-72 p-2">{({close}) => <NewSlideMenu onSelect={type => {addStoryPage(type); close();}} />}</Popover>
                    <div className="flex-grow overflow-y-auto space-y-2 -mr-2 pr-2">
                        <MotionReorder.Group axis="y" values={story.pages} onReorder={(pages) => updateStory(s => ({...s, pages}))} className="space-y-2">
                            {story.pages.map((page, index) => (
                                <MotionReorder.Item key={page.id} value={page} className="bg-card rounded-lg cursor-grab active:cursor-grabbing flex items-center group">
                                    <div className="p-3 text-muted-foreground"><span className="font-mono text-xs">{index+1}</span></div>
                                    <div className="flex-grow"><SlideThumbnail page={page} isSelected={selectedPageId === page.id} onSelect={() => setSelectedPageId(page.id)} /></div>
                                    <div className="p-1"><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => updateStory(s => ({...s, pages: s.pages.filter(p => p.id !== page.id)}))}><Trash size={14}/></Button></div>
                                </MotionReorder.Item>
                            ))}
                        </MotionReorder.Group>
                    </div>
                </aside>
                <main className="bg-secondary/30 p-6 flex items-center justify-center">{renderCanvas()}</main>
                <aside className="border-l border-border p-4 overflow-y-auto">{renderProperties()}</aside>
            </div>
             <SelectWidgetForStoryModal isOpen={isWidgetSelectorOpen} onClose={() => setWidgetSelectorOpen(false)} onSelect={widgetSelectorCallback} />
        </div>
    );
};

const EmptyState: FC = () => {
    const { openGenerateStoryModal, setEditingStory } = useDashboard();
    const { user: currentUser } = useAuth();

    const handleNewStory = () => {
        const now = new Date().toISOString();
        const newStory: Story = { id: _.uniqueId('story_'), title: 'Untitled Story', pages: [], author: currentUser?.name || 'Unknown', createdAt: now, updatedAt: now, description: '' };
        setEditingStory({ story: newStory });
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };
    
    return (
        <main className="flex-grow flex items-center justify-center text-center p-6 bg-secondary/30">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl">
                <motion.div variants={itemVariants} className="w-48 h-48 mx-auto -mb-8">
                    <Lottie animationData={storyAnimation} loop={true} />
                </motion.div>
                <motion.h2 variants={itemVariants} className="text-4xl font-bold font-display text-foreground">Transform Insights into a Narrative</motion.h2>
                <motion.p variants={itemVariants} className="mt-4 max-w-xl mx-auto text-muted-foreground">
                    Weave your charts and KPIs into a compelling, slide-by-slide presentation. Guide your audience through your analysis, add context with annotations, and share your findings with impact.
                </motion.p>
                <motion.div variants={itemVariants} className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <PencilLine className="text-primary mb-2" />
                        <h4 className="font-semibold">Add Context</h4>
                        <p className="text-xs text-muted-foreground">Write annotations for each visualization to explain key findings.</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <Presentation className="text-primary mb-2" />
                        <h4 className="font-semibold">Narrative Flow</h4>
                        <p className="text-xs text-muted-foreground">Arrange your widgets in a logical sequence to tell a clear story.</p>
                    </div>
                     <div className="bg-card p-4 rounded-lg border border-border">
                        <Share2 className="text-primary mb-2" />
                        <h4 className="font-semibold">Present & Share</h4>
                        <p className="text-xs text-muted-foreground">Enter presentation mode for a clean, full-screen experience.</p>
                    </div>
                </motion.div>
                 <motion.div variants={itemVariants} className="mt-10 flex items-center justify-center gap-4">
                    <Button size="lg" onClick={openGenerateStoryModal} className="ai-feature-style"><Sparkle size={18}/> Generate with AI</Button>
                    <Button size="lg" variant="outline" onClick={handleNewStory}><Plus size={18} /> Create New Story</Button>
                </motion.div>
            </motion.div>
        </main>
    );
};


const StoryListView: FC<{ onEdit: (story: Story) => void, onPresent: (story: Story) => void }> = ({ onEdit, onPresent }) => {
    const { stories, setEditingStory, removeStory, openGenerateStoryModal, openConfirmationModal } = useDashboard();
    const { user: currentUser } = useAuth();
    
    const handleNewStory = () => {
        const now = new Date().toISOString();
        const newStory: Story = { id: _.uniqueId('story_'), title: 'Untitled Story', pages: [], author: currentUser?.name || 'Unknown', createdAt: now, updatedAt: now, description: '' };
        setEditingStory({ story: newStory });
    };

    if (stories.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <ViewHeader icon={<BookOpen size={24} />} title="Data Stories" showBackToDashboard={true} />
                <EmptyState />
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col">
            <ViewHeader icon={<BookOpen size={24} />} title="Data Stories" showBackToDashboard={true}>
                <Button variant="outline" onClick={openGenerateStoryModal}><Sparkle size={16}/> Generate with AI</Button>
                <Button onClick={handleNewStory}><Plus size={16} /> New Story</Button>
            </ViewHeader>
            <main className="flex-grow p-6 overflow-y-auto bg-secondary/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {stories.map(story => (
                         <MotionDiv key={story.id} layout initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="bg-card rounded-xl border shadow-sm flex flex-col group transition-shadow hover:shadow-lg">
                             <div className="p-4 flex-grow">
                                 <h3 className="font-bold text-lg text-foreground">{story.title}</h3>
                                 <p className="text-sm text-muted-foreground mt-1">{story.description}</p>
                                 <p className="text-xs text-muted-foreground mt-4">{story.pages.length} page{story.pages.length !== 1 && 's'}</p>
                             </div>
                             <div className="p-3 border-t border-border flex items-center justify-between">
                                 <Button variant="default" size="sm" onClick={() => onPresent(story)}><Presentation size={14}/> Present</Button>
                                 <div>
                                     <Button variant="secondary" size="sm" onClick={() => onEdit(story)}><Pencil size={14}/> Edit</Button>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => openConfirmationModal({title:"Delete Story?", message:`Are you sure you want to delete "${story.title}"?`, onConfirm:() => removeStory(story.id) })}><Trash size={14}/></Button>
                                 </div>
                             </div>
                         </MotionDiv>
                    ))}
                </div>
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

    return <StoryListView onEdit={(story) => setEditingStory({ story })} onPresent={setPresentingStory} />;
};
