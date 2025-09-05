import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect, FC } from 'react';
import _ from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag, useDrop, useDragLayer } from 'react-dnd';
import { Database, Link, Type, Hash, Share2, GitBranch, Trash2 } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardProvider';
import { notificationService } from '../services/notificationService';
import { Relationship, DataSource, Field, FieldType, DND_ITEM_TYPE, RelationshipFieldDragItem } from '../utils/types';
import { Button } from '../components/ui/Button';
import { Popover } from '../components/ui/Popover';
import { Tooltip } from '../components/ui/Tooltip';
import { Sheet, SheetContent } from '../components/ui/Sheet';
import { cn } from '../components/ui/utils';
import { ViewHeader } from '../components/common/ViewHeader';
import { useSidebar } from '../components/ui/sidebar.tsx';
import { HelpIcon } from '../components/ui/HelpIcon';

const JOIN_COLORS = [ '#4A47E5', '#00A8B5', '#F7B801', '#E54F6D', '#7A54C7', '#34D399', '#F97316' ];

// --- Sidebar ---
const ModelerSidebarContent: FC<{
    allSources: DataSource[];
    canvasSourceIds: string[];
    onAddSource: (id: string) => void;
}> = ({ allSources, canvasSourceIds, onAddSource }) => (
    <>
        <div className="p-4 border-b border-border flex-shrink-0">
            <h3 className="text-base font-bold text-foreground">Data Sources</h3>
            <p className="text-sm text-muted-foreground">Add tables to the canvas to build relationships.</p>
        </div>
        <div className="flex-grow overflow-y-auto">
            {allSources.map((source: DataSource) => (
                <div key={source.id} className="flex items-center justify-between p-3 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-2 truncate">
                        <Database size={16} className="text-primary flex-shrink-0" />
                        <span className="font-semibold text-foreground truncate">{source.name}</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => onAddSource(source.id)} disabled={canvasSourceIds.includes(source.id)}>
                        {canvasSourceIds.includes(source.id) ? 'Added' : 'Add'}
                    </Button>
                </div>
            ))}
        </div>
    </>
);

const ModelerSidebar: FC<{
    allSources: DataSource[];
    canvasSourceIds: string[];
    onAddSource: (id: string) => void;
}> = ({ allSources, canvasSourceIds, onAddSource }) => {
    return (
        <aside className="w-[300px] flex-shrink-0 bg-background border-r border-border flex flex-col">
            <ModelerSidebarContent allSources={allSources} canvasSourceIds={canvasSourceIds} onAddSource={onAddSource} />
        </aside>
    );
}

// --- Inspector Panel ---
const JoinInspector: FC<{
    relationship: Relationship | null;
    sources: Map<string, DataSource>;
    onUpdate: (id: string, updates: Partial<Relationship>) => void;
    onRemove: (id: string) => void;
}> = ({ relationship, sources, onUpdate, onRemove }) => {
    if (!relationship) {
        return (
            <div className="w-full md:w-[350px] flex-shrink-0 bg-background border-l border-border flex flex-col items-center justify-center p-6 text-center h-full">
                <GitBranch size={48} strokeWidth={1} className="text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground">Join Inspector</h3>
                <p className="text-sm text-muted-foreground mt-1">Select a join line on the canvas to see its details and configure its properties.</p>
            </div>
        );
    }

    const sourceA = sources.get(relationship.sourceAId);
    const sourceB = sources.get(relationship.sourceBId);

    if (!sourceA || !sourceB) return <div>Error: Source not found for relationship.</div>;

    return (
        <aside className="w-full md:w-[350px] flex-shrink-0 bg-background border-l border-border flex flex-col">
             <div className="p-4 border-b border-border flex-shrink-0">
                <h3 className="text-base font-bold text-foreground">Join Properties</h3>
             </div>
             <div className="flex-grow p-4 space-y-6">
                <div className="p-4 bg-secondary rounded-lg border border-border">
                     <div className="flex items-center gap-3">
                        <div className="flex-1 text-center space-y-1">
                            <span className="text-xs text-muted-foreground">Source A</span>
                            <p className="font-semibold text-foreground truncate">{sourceA.name}</p>
                            <p className="font-mono text-xs bg-primary/10 text-primary p-1 rounded">{relationship.fieldA}</p>
                        </div>
                        <Link strokeWidth={3} className="text-primary" />
                         <div className="flex-1 text-center space-y-1">
                            <span className="text-xs text-muted-foreground">Source B</span>
                            <p className="font-semibold text-foreground truncate">{sourceB.name}</p>
                            <p className="font-mono text-xs bg-primary/10 text-primary p-1 rounded">{relationship.fieldB}</p>
                        </div>
                     </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Join Type</label>
                    <select
                        value={relationship.type}
                        onChange={e => onUpdate(relationship.id, { type: e.target.value as any })}
                        className="block w-full rounded-lg border-border bg-background py-2 px-3 text-sm text-foreground placeholder-muted-foreground shadow-sm transition duration-150 ease-in-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="inner">Inner Join</option>
                        <option value="left">Left Join</option>
                        <option value="right">Right Join</option>
                        <option value="full">Full Outer Join</option>
                    </select>
                </div>
                
                <div className="pt-4 border-t border-border">
                    <Button variant="destructive" onClick={() => onRemove(relationship.id)} className="w-full"><Trash2 /> Remove Join</Button>
                </div>
             </div>
        </aside>
    );
};

// --- Canvas Components ---
const JoinLine: FC<{ rel: Relationship; color: string; fieldRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>; canvasRef: React.RefObject<HTMLDivElement>; isSelected: boolean; onSelect: () => void; }> = ({ rel, color, fieldRefs, canvasRef, isSelected, onSelect }) => {
    const [path, setPath] = useState('');

    useLayoutEffect(() => {
        const calculatePath = () => {
            const refA = fieldRefs.current.get(`${rel.sourceAId}:${rel.fieldA}`);
            const refB = fieldRefs.current.get(`${rel.sourceBId}:${rel.fieldB}`);
            const canvasEl = canvasRef.current;

            if (refA && refB && canvasEl) {
                const canvasRect = canvasEl.getBoundingClientRect();
                const rectA = refA.getBoundingClientRect();
                const rectB = refB.getBoundingClientRect();
                
                const x1 = (rectA.left < rectB.left ? rectA.right : rectA.left) - canvasRect.left + canvasEl.scrollLeft;
                const y1 = rectA.top - canvasRect.top + rectA.height / 2 + canvasEl.scrollTop;
                const x2 = (rectA.left < rectB.left ? rectB.left : rectB.right) - canvasRect.left + canvasEl.scrollLeft;
                const y2 = rectB.top - canvasRect.top + rectB.height / 2 + canvasEl.scrollTop;
                
                setPath(`M${x1},${y1} C${x1 + 60},${y1} ${x2 - 60},${y2} ${x2},${y2}`);
            }
        };

        const debouncedCalculatePath = _.debounce(calculatePath, 50);
        
        calculatePath();

        window.addEventListener('resize', debouncedCalculatePath);
        return () => {
            window.removeEventListener('resize', debouncedCalculatePath);
            debouncedCalculatePath.cancel();
        };
    }, [rel, fieldRefs, canvasRef]);

    return (
        <g onClick={onSelect} className="cursor-pointer">
            <path d={path} stroke="transparent" strokeWidth="12" fill="none" />
            <path d={path} stroke={color} strokeWidth={isSelected ? 4 : 2.5} fill="none" className="transition-all" />
        </g>
    );
};

const DataSourceNode: FC<{ source: DataSource; onRemove: (id: string) => void; onFieldDrop: (source: RelationshipFieldDragItem, target: { sourceId: string; fieldName: string; }) => void; onFieldDropOnNode: (source: RelationshipFieldDragItem, targetSourceId: string) => void; fieldRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>; fieldColors: Map<string, string>; }> = ({ source, onRemove, onFieldDrop, onFieldDropOnNode, fieldRefs, fieldColors }) => {
    const { dataModelerLayout, setDataModelerLayout } = useDashboard();
    const nodeRef = useRef<HTMLDivElement>(null);
    const layout = dataModelerLayout[source.id] || { x: 50, y: 50, width: 280, height: 400 };
    const MotionDiv = motion.div as any;

    const [{ isDragging }, drag] = useDrag(() => ({
        type: `NODE_${source.id}`, item: { id: source.id },
        end: (item, monitor) => {
            const delta = monitor.getDifferenceFromInitialOffset();
            if (delta) {
                setDataModelerLayout(p => {
                    const currentLayout = p[source.id] || { x: 50, y: 50, width: 280, height: 400 };
                    return {
                        ...p,
                        [source.id]: {
                            ...currentLayout,
                            x: currentLayout.x + delta.x,
                            y: currentLayout.y + delta.y,
                        },
                    };
                });
            }
        },
        collect: monitor => ({ isDragging: !!monitor.isDragging() }),
    }), [source.id, setDataModelerLayout]);
    
    const [{ isOverNode, canDropNode }, dropNode] = useDrop(() => ({
        accept: DND_ITEM_TYPE.RELATIONSHIP_FIELD,
        drop: (item: RelationshipFieldDragItem) => onFieldDropOnNode(item, source.id),
        canDrop: (item: RelationshipFieldDragItem) => item.sourceId !== source.id,
        collect: monitor => ({
            isOverNode: !!monitor.isOver({ shallow: true }),
            canDropNode: monitor.canDrop(),
        }),
    }));

    const combinedRef = (el: HTMLDivElement | null) => {
        drag(el);
        dropNode(el);
    };

    const allFields = [...source.fields.dimensions, ...source.fields.measures];

    return (
        <MotionDiv ref={combinedRef} style={{ top: layout.y, left: layout.x, width: layout.width, height: layout.height, opacity: isDragging ? 0.7 : 1 }} className={cn("absolute bg-card rounded-lg shadow-xl border border-border flex flex-col group/node", isOverNode && canDropNode && "ring-2 ring-primary ring-offset-4 ring-offset-background transition-all duration-200")}>
            <header className="p-2.5 font-bold text-sm bg-secondary text-foreground rounded-t-lg cursor-move flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 truncate"><Database size={16} /> {source.name}</div>
                <button onClick={() => onRemove(source.id)} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover/node:opacity-100 transition-opacity" aria-label={`Remove ${source.name} from canvas`}><span className="icon-hover-anim"><Trash2 size={14} /></span></button>
            </header>
            <div className="flex-grow text-sm overflow-y-auto">
                {allFields.map(field => (
                    <FieldRow key={field.name} source={source} field={field} onDrop={onFieldDrop} fieldRefs={fieldRefs} color={fieldColors.get(`${source.id}:${field.simpleName}`)} />
                ))}
            </div>
        </MotionDiv>
    );
};

const FieldRow: FC<{ source: DataSource; field: Field; onDrop: (source: RelationshipFieldDragItem, target: { sourceId: string; fieldName: string; }) => void; fieldRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>; color?: string; }> = ({ source, field, onDrop, fieldRefs, color }) => {
    const [, drag, dragPreview] = useDrag(() => ({ type: DND_ITEM_TYPE.RELATIONSHIP_FIELD, item: { sourceId: source.id, sourceName: source.name, fieldName: field.simpleName } as RelationshipFieldDragItem }));
    const [{ isOver }, drop] = useDrop(() => ({ accept: DND_ITEM_TYPE.RELATIONSHIP_FIELD, drop: (item: RelationshipFieldDragItem) => onDrop(item, { sourceId: source.id, fieldName: field.simpleName }), collect: monitor => ({ isOver: !!monitor.isOver() }) }));

    const combinedRef = (el: HTMLDivElement | null) => {
        drop(el);
        fieldRefs.current.set(`${source.id}:${field.simpleName}`, el);
    };

    return (
        <div ref={combinedRef} style={{ backgroundColor: color }} className={`flex items-center justify-between p-2.5 border-b border-border last:border-b-0 ${isOver ? 'bg-primary/10' : ''} ${color ? 'text-primary-foreground font-semibold' : 'hover:bg-accent'}`}>
            <div className="flex items-center gap-2 truncate">
                {field.type === FieldType.DIMENSION ? <Type size={14} className={color ? 'text-white/80' : 'text-blue-500'} /> : <Hash size={14} className={color ? 'text-white/80' : 'text-green-500'} />}
                <span className="truncate">{field.simpleName}</span>
            </div>
            <div ref={drag as any} className="w-5 h-5 flex items-center justify-center cursor-pointer">
                <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-transparent transition-all ${color ? 'bg-white/50 hover:bg-white' : 'bg-muted-foreground hover:bg-primary hover:ring-primary/20'}`} />
            </div>
        </div>
    );
}

// --- Main View ---
export const DataModelerView: FC = () => {
    const { dataSources, relationships, setRelationships, setView, dataModelerLayout, setDataModelerLayout } = useDashboard();
    const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const fieldRefs = useRef(new Map<string, HTMLDivElement | null>());
    const { isMobile } = useSidebar();
    const [isSourcesOpen, setSourcesOpen] = useState(false);
    const [isInspectorOpen, setInspectorOpen] = useState(false);

    const canvasSourceIds = useMemo(() => Object.keys(dataModelerLayout), [dataModelerLayout]);
    
    useEffect(() => {
        if (isMobile && selectedRelationshipId) {
            setInspectorOpen(true);
        }
    }, [isMobile, selectedRelationshipId]);

    useEffect(() => {
        if(Object.keys(dataModelerLayout).length === 0 && dataSources.size > 0) {
            const initialLayout: typeof dataModelerLayout = {};
            Array.from(dataSources.keys()).slice(0,2).forEach((id, i) => {
                initialLayout[id] = { x: 50 + i * 350, y: 50, width: 300, height: 400 };
            });
            setDataModelerLayout(initialLayout);
        }
    }, [dataSources, dataModelerLayout, setDataModelerLayout]);

    const handleAddSourceToCanvas = (id: string) => {
        if (!dataModelerLayout[id]) {
            setDataModelerLayout(p => ({ ...p, [id]: { x: 100, y: 100, width: 300, height: 400 } }));
        }
        if (isMobile) setSourcesOpen(false);
    };

    const handleRemoveSourceFromCanvas = (id: string) => {
        setDataModelerLayout(p => _.omit(p, id));
        setRelationships(prev => prev.filter(r => r.sourceAId !== id && r.sourceBId !== id));
    };

    const handleDropOnField = useCallback((source: RelationshipFieldDragItem, target: { sourceId: string; fieldName: string; }) => {
        if (source.sourceId === target.sourceId) return;
        const newRel: Relationship = { id: _.uniqueId('rel_'), sourceAId: source.sourceId, fieldA: source.fieldName, sourceBId: target.sourceId, fieldB: target.fieldName, type: 'inner' };
        setRelationships(prev => [...prev, newRel]);
    }, [setRelationships]);
    
    const handleDropOnNode = (sourceItem: RelationshipFieldDragItem, targetSourceId: string) => {
        if (sourceItem.sourceId === targetSourceId) return;

        const targetSource = dataSources.get(targetSourceId);
        if (!targetSource) return;

        const allTargetFields = [...targetSource.fields.dimensions, ...targetSource.fields.measures];
        const matchingField = allTargetFields.find(f => f.simpleName === sourceItem.fieldName);

        if (matchingField) {
            const newRel: Relationship = {
                id: _.uniqueId('rel_'),
                sourceAId: sourceItem.sourceId,
                fieldA: sourceItem.fieldName,
                sourceBId: targetSourceId,
                fieldB: matchingField.simpleName,
                type: 'inner',
            };
            setRelationships(prev => [...prev, newRel]);
            notificationService.success(`Smart join created between ${sourceItem.sourceName} and ${targetSource.name} on "${sourceItem.fieldName}"`);
        } else {
            notificationService.info(`No matching field for "${sourceItem.fieldName}" found in ${targetSource.name}.`);
        }
    };

    const onUpdateRelationship = (id: string, updates: Partial<Relationship>) => setRelationships(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    const onRemoveRelationship = (id: string) => setRelationships(prev => prev.filter(r => r.id !== id));
    
    const canvasSources = useMemo(() => Array.from(dataSources.values()).filter((ds: DataSource) => canvasSourceIds.includes(ds.id)), [dataSources, canvasSourceIds]);

    const { relationshipColors, fieldJoinColors } = useMemo(() => {
        const relColors = new Map<string, string>();
        const fieldColors = new Map<string, string>();
        relationships.forEach((rel, i) => {
            const color = JOIN_COLORS[i % JOIN_COLORS.length];
            relColors.set(rel.id, color);
            fieldColors.set(`${rel.sourceAId}:${rel.fieldA}`, color);
            fieldColors.set(`${rel.sourceBId}:${rel.fieldB}`, color);
        });
        return { relationshipColors: relColors, fieldJoinColors: fieldColors };
    }, [relationships]);
    
    return (
        <div className="h-full flex flex-col bg-secondary/30">
            <ViewHeader icon={<Share2 size={24} />} title="Data Modeler" showBackToDashboard={!isMobile}>
                 <HelpIcon helpText="Drag fields between tables to create joins. Click on a join line to edit its properties like join type (inner, left, etc.). This model defines how your data sources are connected for analysis." />
                 {isMobile ? (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setSourcesOpen(true)}><Database size={16}/></Button>
                        <Button variant="outline" size="icon" onClick={() => setInspectorOpen(true)} disabled={relationships.length === 0}><GitBranch size={16}/></Button>
                    </div>
                ) : (
                    <Button variant="secondary" onClick={() => setView('dashboard')}>Close</Button>
                )}
            </ViewHeader>
            <div className="flex-grow flex min-h-0">
                {!isMobile && <ModelerSidebar allSources={Array.from(dataSources.values())} canvasSourceIds={canvasSourceIds} onAddSource={handleAddSourceToCanvas} />}
                {isMobile && (
                    <Sheet open={isSourcesOpen} onOpenChange={setSourcesOpen}>
                        <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                           <ModelerSidebarContent allSources={Array.from(dataSources.values())} canvasSourceIds={canvasSourceIds} onAddSource={handleAddSourceToCanvas} />
                        </SheetContent>
                    </Sheet>
                )}
                <main ref={canvasRef} className="flex-grow relative overflow-auto bg-grid">
                    {canvasSources.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center p-8 bg-card rounded-lg shadow-xl">
                                 <Share2 size={48} className="mx-auto text-primary" strokeWidth={1} />
                                <h2 className="mt-4 text-xl font-bold font-display text-foreground">Visual Join Canvas</h2>
                                <p className="mt-2 max-w-sm mx-auto text-muted-foreground">Add data sources from the left panel to begin creating relationships between your tables.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {canvasSources.map((ds: DataSource) => (
                                <DataSourceNode key={ds.id} source={ds} onRemove={handleRemoveSourceFromCanvas} onFieldDrop={handleDropOnField} onFieldDropOnNode={handleDropOnNode} fieldRefs={fieldRefs} fieldColors={fieldJoinColors} />
                            ))}
                            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ minWidth: 2000, minHeight: 2000 }}>
                                {relationships.map(rel => (
                                    <JoinLine key={rel.id} rel={rel} color={relationshipColors.get(rel.id) || '#94a3b8'} fieldRefs={fieldRefs} canvasRef={canvasRef} isSelected={selectedRelationshipId === rel.id} onSelect={() => setSelectedRelationshipId(rel.id)} />
                                ))}
                            </svg>
                        </>
                    )}
                </main>
                {!isMobile && <JoinInspector relationship={relationships.find(r => r.id === selectedRelationshipId) || null} sources={dataSources} onUpdate={onUpdateRelationship} onRemove={onRemoveRelationship} />}
                {isMobile && (
                    <Sheet open={isInspectorOpen} onOpenChange={setInspectorOpen}>
                        <SheetContent side="right" className="w-[350px] p-0 flex flex-col">
                            <JoinInspector relationship={relationships.find(r => r.id === selectedRelationshipId) || null} sources={dataSources} onUpdate={onUpdateRelationship} onRemove={onRemoveRelationship} />
                        </SheetContent>
                    </Sheet>
                )}
            </div>
        </div>
    );
};