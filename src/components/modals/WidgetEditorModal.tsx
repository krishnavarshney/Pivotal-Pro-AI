import React, { useState, FC } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';
import { Sheet, SheetContent } from '../ui/Sheet';
import { FieldsPanel } from './WidgetEditorPanel/FieldsPanel';
import { ConfigurationPanel } from './WidgetEditorPanel/ConfigurationPanel';
import { LivePreviewPanel } from './WidgetEditorPanel/LivePreviewPanel';
import { Save, X, Columns3, Settings, Pencil } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { DataProcessor } from '../common/DataProcessor';

const DesktopLayout: FC = () => {
    const { editingWidgetState } = useDashboard();
    if (editingWidgetState?.displayMode === 'section') {
        return (
            <div className="flex-grow flex min-h-0">
                <section className="w-full flex-shrink-0 flex flex-col">
                    <ConfigurationPanel />
                </section>
            </div>
        );
    }

    return (
        <div className="flex-grow flex min-h-0">
            <section className="w-[300px] flex-shrink-0 bg-secondary/50 border-r border-border flex flex-col">
                <FieldsPanel />
            </section>
            <section className="w-[384px] flex-shrink-0 border-r border-border flex flex-col">
                <ConfigurationPanel />
            </section>
            <section className="flex-grow bg-background">
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

    if (!editingWidgetState) return null;

    const isSectionEditor = editingWidgetState.displayMode === 'section';
    
    const title = editingWidgetState.id === 'new' 
        ? (isSectionEditor ? 'Create New Section' : 'Create New Widget')
        : (isSectionEditor ? 'Edit Section' : 'Edit Widget');
    
    const sheetClassName = isSectionEditor
        ? "w-full max-w-md p-0 flex flex-col gap-0 border-none"
        : "w-full max-w-none sm:max-w-[calc(100%-4rem)] p-0 flex flex-col gap-0 border-none";

    return (
        <Sheet open={isWidgetEditorModalOpen} onOpenChange={closeWidgetEditorModal}>
            <SheetContent side="right" className={sheetClassName}>
                <header className="flex-shrink-0 flex items-center justify-between p-4 h-[65px] border-b border-border glass-header">
                    <div className="flex items-center gap-3">
                        <span className="p-2 bg-primary/10 rounded-lg text-primary"><Pencil size={20} /></span>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground font-display">{title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={closeWidgetEditorModal}><X /> Cancel</Button>
                        <Button onClick={saveEditingWidget}><Save /> Save Widget</Button>
                    </div>
                </header>
                {isMobile ? <MobileLayout mobilePanel={mobilePanel} setMobilePanel={setMobilePanel} /> : <DesktopLayout />}
            </SheetContent>
        </Sheet>
    );
};