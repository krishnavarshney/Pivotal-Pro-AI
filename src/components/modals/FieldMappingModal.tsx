
import React, { useState, useRef, useLayoutEffect, useMemo, FC } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import _ from 'lodash';
import { ShareNetwork, TextT, Hash, Clock, Check, Info, X, ArrowLeft, Link, CheckCircle } from 'phosphor-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Template, FieldType, Field, DND_ITEM_TYPE, FieldDragItem } from '../../utils/types';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../ui/utils';
import { motion } from 'framer-motion';

const MappedField: FC<{ field: Field, onUnmap: () => void }> = ({ field, onUnmap }) => {
    const MotionDiv = motion.div as any;
    return (
        <MotionDiv 
            layout 
            initial={{scale: 0.8, opacity: 0}} 
            animate={{scale: 1, opacity: 1}} 
            className="flex items-center justify-between gap-2 p-2 bg-background dark:bg-black/20 rounded-lg border border-border text-sm w-full"
        >
            <div className="flex items-center gap-2 truncate">
                {field.type === FieldType.MEASURE ? <Hash className="text-green-500 flex-shrink-0" /> : <TextT className="text-blue-500 flex-shrink-0" />}
                <span className="font-semibold text-foreground truncate">{field.simpleName}</span>
            </div>
            <button onClick={onUnmap} className="ml-auto text-muted-foreground hover:text-foreground p-1 rounded-full flex-shrink-0">
                <X size={14} />
            </button>
        </MotionDiv>
    );
};


const TemplateFieldCard: FC<{
    templateField: Template['requiredFields'][0],
    mappedField: Field | null,
    onMap: (field: Field) => void,
    onUnmap: () => void,
    setRef: (el: HTMLDivElement | null) => void
}> = ({ templateField, mappedField, onMap, onUnmap, setRef }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: DND_ITEM_TYPE.FIELD,
        drop: (item: FieldDragItem) => onMap(item as Field),
        canDrop: (item: FieldDragItem) => {
            const itemType = item.type;
            const requiredType = templateField.type;

            if (requiredType === FieldType.MEASURE) {
                return itemType === FieldType.MEASURE;
            }
            if (requiredType === FieldType.DIMENSION || requiredType === FieldType.DATETIME) {
                return itemType === FieldType.DIMENSION || itemType === FieldType.DATETIME;
            }
            return false;
        },
        collect: monitor => ({
            isOver: !!monitor.isOver() && monitor.canDrop(),
            canDrop: !!monitor.canDrop(),
        }),
    }));
    
    return (
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
            <div className="flex-grow">
                <h4 className="font-bold text-foreground flex items-center gap-2">{templateField.displayName} {templateField.required && <span className="text-destructive">*</span>}
                    <Tooltip content={`Requires a ${templateField.type} field. ${templateField.description}`}>
                        <Info size={14} className="cursor-help text-muted-foreground"/>
                    </Tooltip>
                </h4>
                
                <div ref={drop as any} className={cn(
                    "mt-3 p-2 h-16 flex items-center justify-center rounded-lg border-2 border-dashed transition-all",
                    isOver ? "border-primary bg-primary/10" : "border-border/70 bg-secondary/50",
                    !canDrop && isOver && "border-destructive/50 bg-destructive/10"
                )}>
                    {mappedField 
                        ? <MappedField field={mappedField} onUnmap={onUnmap}/> 
                        : <p className="text-xs text-muted-foreground">Drop a compatible field here</p>
                    }
                </div>
            </div>
            <div ref={setRef} className={cn(
                "w-4 h-4 rounded-full flex-shrink-0 transition-all ring-4",
                mappedField ? "bg-primary ring-primary/20" : "bg-border ring-transparent"
            )}/>
        </div>
    );
};

const SourceFieldCard: FC<{ field: Field, setRef: (el: HTMLDivElement | null) => void, isMapped: boolean }> = ({ field, setRef, isMapped }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: DND_ITEM_TYPE.FIELD,
        item: field,
        collect: monitor => ({ isDragging: !!monitor.isDragging() }),
    }));
    
    return (
         <div ref={drag as any} className={cn(
             "p-3 rounded-lg border bg-card shadow-sm relative flex items-center gap-3 transition-opacity",
             isDragging ? 'opacity-30' : '',
             isMapped ? 'opacity-60' : 'cursor-grab'
         )}>
            <div ref={setRef} className={cn(
                "w-4 h-4 rounded-full flex-shrink-0 transition-all ring-4",
                isMapped ? "bg-primary ring-primary/20" : "bg-border ring-transparent"
            )}/>
            <div className="flex items-center gap-2 flex-grow truncate">
                {field.type === FieldType.MEASURE ? <Hash className="text-green-500" /> : field.type === FieldType.DATETIME ? <Clock className="text-purple-500" /> : <TextT className="text-blue-500" />}
                <span className="font-medium text-sm text-foreground truncate">{field.simpleName}</span>
            </div>
            {isMapped && <Link size={16} weight="bold" className="text-primary flex-shrink-0"/>}
        </div>
    );
};


export const FieldMappingModal: FC<{ isOpen: boolean; onClose: () => void; template: Template | null; onBack?: () => void; }> = ({ isOpen, onClose, template, onBack }) => {
    const { blendedFields, createPageFromTemplate } = useDashboard();
    const [mappings, setMappings] = useState<Map<string, string>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);
    const elementRefs = useRef(new Map<string, HTMLDivElement | null>());
    const [svgPaths, setSvgPaths] = useState<string[]>([]);
    const MotionPath = motion.path as any;

    const mappedSourceFields = useMemo(() => new Set(mappings.values()), [mappings]);

    const setElementRef = (key: string, el: HTMLDivElement | null) => {
        elementRefs.current.set(key, el);
    };

    useLayoutEffect(() => {
        if (!isOpen) return;
        
        const calculatePaths = () => {
            const newPaths: string[] = [];
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return;

            for (const [templateFieldId, sourceFieldName] of mappings.entries()) {
                const fromEl = elementRefs.current.get(`template-${templateFieldId}`);
                const toEl = elementRefs.current.get(`source-${sourceFieldName}`);

                if (fromEl && toEl) {
                    const fromRect = fromEl.getBoundingClientRect();
                    const toRect = toEl.getBoundingClientRect();

                    const x1 = fromRect.right - containerRect.left;
                    const y1 = fromRect.top - containerRect.top + fromRect.height / 2;
                    const x2 = toRect.left - containerRect.left;
                    const y2 = toRect.top - containerRect.top + toRect.height / 2;

                    const controlPointOffset = Math.max(40, (x2 - x1) * 0.3);
                    const path = `M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`;
                    newPaths.push(path);
                }
            }
            setSvgPaths(newPaths);
        };

        const debouncedCalculatePaths = _.debounce(calculatePaths, 50);
        
        debouncedCalculatePaths();

        const resizeObserver = new ResizeObserver(debouncedCalculatePaths);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        const rightPanelEl = rightPanelRef.current;
        if (rightPanelEl) {
            rightPanelEl.addEventListener('scroll', debouncedCalculatePaths);
        }

        return () => {
            resizeObserver.disconnect();
            if (rightPanelEl) {
                rightPanelEl.removeEventListener('scroll', debouncedCalculatePaths);
            }
            debouncedCalculatePaths.cancel();
        };

    }, [mappings, isOpen]);


    const handleConfirm = () => {
        if (template) createPageFromTemplate(template, mappings);
        onClose();
    };
    
    if (!isOpen || !template) return null;
    
    const requiredFieldsMapped = template.requiredFields.filter(f => f.required).every(f => mappings.has(f.id) && mappings.get(f.id));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent containerClassName="w-[95%] max-w-screen-2xl" className="max-h-[85vh] flex flex-col p-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {onBack && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 mr-2" onClick={onBack}>
                                <ArrowLeft size={16} />
                            </Button>
                        )}
                        <ShareNetwork size={20}/> The Data Bridge
                    </DialogTitle>
                </DialogHeader>
                <div ref={containerRef} className="flex-grow p-6 grid grid-cols-2 gap-16 min-h-0 relative bg-grid">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                         <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {svgPaths.map((path, index) => (
                             <MotionPath 
                                key={index} 
                                d={path} 
                                stroke="hsl(var(--primary))" 
                                strokeWidth="3" 
                                fill="none" 
                                initial={{ pathLength: 0, opacity: 0 }} 
                                animate={{ pathLength: 1, opacity: 1 }} 
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                style={{ filter: "url(#glow)" }}
                            />
                        ))}
                    </svg>
                    
                    <div className="relative z-10 flex flex-col space-y-4 overflow-y-auto pr-2 -mr-2">
                        <h3 className="font-semibold text-lg text-foreground sticky top-0 bg-background/80 backdrop-blur-sm py-2">Template Fields</h3>
                        {template.requiredFields.map(tf => {
                            const mappedFieldName = mappings.get(tf.id);
                            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
                            const mappedField = mappedFieldName ? allFields.find(f => f.name === mappedFieldName) : null;
                            return <TemplateFieldCard key={tf.id} templateField={tf} mappedField={mappedField || null} onMap={(field) => setMappings(new Map(mappings.set(tf.id, field.name)))} onUnmap={() => setMappings(m => {const newM = new Map(m); newM.delete(tf.id); return newM;})} setRef={(el) => setElementRef(`template-${tf.id}`, el)}/>
                        })}
                    </div>
                     <div ref={rightPanelRef} className="relative z-10 flex flex-col space-y-3 overflow-y-auto pr-2 -mr-2">
                        <h3 className="font-semibold text-lg text-foreground sticky top-0 bg-background/80 backdrop-blur-sm py-2">Your Data Fields</h3>
                        <h4 className="font-semibold text-sm text-green-400 uppercase tracking-wider pt-2">MEASURES</h4>
                        {blendedFields.measures.map(f => <SourceFieldCard key={f.name} field={f} setRef={(el) => setElementRef(`source-${f.name}`, el)} isMapped={mappedSourceFields.has(f.name)} />)}
                        <h4 className="font-semibold text-sm text-blue-400 uppercase tracking-wider pt-2">DIMENSIONS</h4>
                        {blendedFields.dimensions.map(f => <SourceFieldCard key={f.name} field={f} setRef={(el) => setElementRef(`source-${f.name}`, el)} isMapped={mappedSourceFields.has(f.name)} />)}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!requiredFieldsMapped}>
                        {!requiredFieldsMapped && <Info size={16} />}
                        {requiredFieldsMapped ? 'Create Page' : 'Map required fields'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};