import React, { useState, FC, useEffect } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogOverlay } from '../ui/Dialog';
import { Sheet, SheetContent } from '../ui/Sheet';
import { FieldsPanel } from './WidgetEditorPanel/FieldsPanel';
import { ConfigurationPanel } from './WidgetEditorPanel/ConfigurationPanel';
import { LivePreviewPanel } from './WidgetEditorPanel/LivePreviewPanel';
import { Save, X, Columns3, Settings, Pencil } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { AiPromptBar } from './WidgetEditorPanel/AiPromptBar';

const DesktopLayout: FC = () => {
    const { editingWidgetState } = useDashboard();
    if (editingWidgetState?.displayMode === 'section') {
        return (
            <div className="flex-grow flex min-h-0">
                <section id="onboarding-widget-editor-properties" className="w-full flex-shrink-0 flex flex-col">
                    <ConfigurationPanel />
                </section>
            </div>
        );
    }

    return (
        <div className="flex-grow flex min-h-0">
            <section id="onboarding-widget-editor-fields" className="w-[300px] flex-shrink-0 bg-secondary/50 border-r border-border flex flex-col">
                <FieldsPanel />
            </section>
            <section id="onboarding-widget-editor-properties" className="w-[384px] flex-shrink-0 border-r border-border flex flex-col">
                <ConfigurationPanel />
            </section>
            <section id="onboarding-widget-editor-preview" className="flex-grow bg-background">
                 <LivePreviewPanel />
            </section>
        </div>
    );
};

const MobileLayout: FC<{
    mobilePanel: 'fields' | 'config' | null;
    setMobilePanel: React.Dispatch<React.SetStateAction<'fields' | 'config' | null>>;
}> = ({ mobilePanel, setMobilePanel }) => {
     const { editingWidgetState } = useDashboard();

    if (editingWidgetState?.displayMode === 'section') {
        return (
            <div className="flex-grow flex min-h-0">
                <ConfigurationPanel />
            </div>
        )
    }

    return (
        <>
            <div className="p-2 border-b border-border flex-shrink-0 flex items-center justify-center gap-2">
                <Button variant="outline" onClick={() => setMobilePanel('fields')} className="flex-1">
                    <span className="icon-hover-anim"><Columns3 size={16} /></span> Fields
                </Button>
                <Button variant="outline" onClick={() => setMobilePanel('config')} className="flex-1">
                    <span className="icon-hover-anim"><Settings size={16} /></span> Configuration
                </Button>
            </div>
            <div className="flex-grow bg-background">
                <LivePreviewPanel />
            </div>

            <Sheet open={mobilePanel === 'fields'} onOpenChange={(open) => !open && setMobilePanel(null)}>
                <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                    <FieldsPanel />
                </SheetContent>
            </Sheet>

            <Sheet open={mobilePanel === 'config'} onOpenChange={(open) => !open && setMobilePanel(null)}>
                <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                    <ConfigurationPanel />
                </SheetContent>
            </Sheet>
        </>
    );
};


export const WidgetEditorModal: FC = () => {
    const { isWidgetEditorModalOpen, closeWidgetEditorModal, saveEditingWidget, editingWidgetState } = useDashboard();
    const [mobilePanel, setMobilePanel] = useState<'fields' | 'config' | null>(null);
    const isMobile = useMediaQuery('(max-width: 1023px)');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (isWidgetEditorModalOpen) {
            const timer = setTimeout(() => setIsReady(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsReady(false);
        }
    }, [isWidgetEditorModalOpen]);

    if (!editingWidgetState) return null;

    const isSectionEditor = editingWidgetState.displayMode === 'section';
    
    const title = editingWidgetState.id === 'new' 
        ? (isSectionEditor ? 'Create New Section' : 'Create Widget')
        : (isSectionEditor ? 'Edit Section' : 'Edit Widget');
    
    const containerClassName = isSectionEditor
        ? "w-full max-w-xl"
        : "w-[95vw] max-w-[1600px]";
        
    const contentClassName = isSectionEditor
        ? "h-auto max-h-[80vh] flex flex-col p-0 gap-0"
        : "h-[90vh] flex flex-col p-0 gap-0";

    return (
        <Dialog open={isWidgetEditorModalOpen} onOpenChange={closeWidgetEditorModal}>
            <DialogOverlay />
            <DialogContent containerClassName={containerClassName} className={contentClassName} hideCloseButton>
                <header className="flex-shrink-0 grid grid-cols-3 items-center p-4 h-[65px] border-b border-border glass-header rounded-t-xl">
                    <div className="justify-self-start">
                        <h2 className="text-lg font-semibold text-foreground font-display">{title}</h2>
                    </div>
                    <div className="justify-self-center w-full">
                        {!isSectionEditor && <AiPromptBar />}
                    </div>
                    <div className="justify-self-end flex items-center gap-2">
                        <Button variant="outline" onClick={closeWidgetEditorModal}>Cancel</Button>
                        <Button onClick={saveEditingWidget}>Save Widget</Button>
                    </div>
                </header>
                {!isReady ? (
                    <div className="flex-grow flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                            <p className="text-muted-foreground animate-pulse">Loading editor...</p>
                        </div>
                    </div>
                ) : (
                    isMobile ? <MobileLayout mobilePanel={mobilePanel} setMobilePanel={setMobilePanel} /> : <DesktopLayout />
                )}
            </DialogContent>
        </Dialog>
    );
};