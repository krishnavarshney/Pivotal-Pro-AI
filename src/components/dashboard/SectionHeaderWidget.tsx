import React, { FC, useState, KeyboardEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { WidgetState } from '../../utils/types';
import { Button } from '../ui/Button';
import { cn } from '../ui/utils';

export const SectionHeaderWidget: FC<{ widget: WidgetState }> = ({ widget }) => {
    const { saveWidget, openWidgetEditorModal, removeWidget } = useDashboard();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(widget.title);

    const handleTitleSave = () => {
        if (tempTitle.trim() && tempTitle !== widget.title) {
            saveWidget({ ...widget, title: tempTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleTitleSave();
        if (e.key === 'Escape') {
            setTempTitle(widget.title);
            setIsEditingTitle(false);
        }
    };
    
    const settings = widget.sectionSettings;
    const style: React.CSSProperties = {
        fontFamily: settings?.fontFamily,
        fontSize: settings?.fontSize ? `${settings.fontSize}px` : undefined,
        fontWeight: settings?.fontWeight,
        color: settings?.color,
        backgroundColor: settings?.backgroundColor,
        borderRadius: settings?.borderRadius ? `${settings.borderRadius}px` : undefined,
        paddingTop: settings?.paddingY ? `${settings.paddingY}px` : undefined,
        paddingBottom: settings?.paddingY ? `${settings.paddingY}px` : undefined,
        boxShadow: settings?.shadow && settings.shadow !== 'none' ? `var(--shadow-${settings.shadow})` : undefined,
        textAlign: settings?.textAlign,
    };

    return (
        <div style={style} className="rounded-lg flex flex-col h-full w-full group/widget overflow-hidden relative transition-all duration-200">
            <header className="drag-handle flex items-center p-2 h-full flex-shrink-0 gap-1 cursor-move">
                 <div className={cn("flex-grow flex items-center gap-2 group/title truncate nodrag", settings?.textAlign === 'center' && 'justify-center', settings?.textAlign === 'right' && 'justify-end')} onClick={(e) => { e.stopPropagation(); if (!isEditingTitle) setIsEditingTitle(true); }}>
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={tempTitle}
                            onChange={e => setTempTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleTitleKeyDown}
                            className="font-bold text-lg text-foreground bg-transparent border-b-2 border-primary focus:outline-none cursor-text"
                            autoFocus
                            size={Math.max(20, tempTitle.length)}
                        />
                    ) : (
                        <div className="flex items-center gap-3 cursor-text w-full truncate" title="Click to edit title">
                             <h3 className="font-bold text-lg text-foreground truncate" style={{
                                 fontSize: 'inherit',
                                 fontFamily: 'inherit',
                                 fontWeight: 'inherit',
                                 color: 'inherit'
                             }}>
                                {widget.title}
                            </h3>
                            <span className="icon-hover-anim"><Pencil size={16} className="opacity-0 group-hover/title:opacity-100 text-muted-foreground flex-shrink-0" /></span>
                        </div>
                    )}
                </div>
                <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover/widget:opacity-100 transition-opacity nodrag flex items-center gap-1">
                    <Button variant="secondary" size="sm" onClick={() => openWidgetEditorModal(widget.id)}>
                        <Pencil size={14} /> Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeWidget(widget.id)}>
                        <Trash2 size={14} />
                    </Button>
                </div>
            </header>
        </div>
    );
};
