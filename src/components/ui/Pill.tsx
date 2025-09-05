

import React, { useRef, useEffect, FC, MouseEvent } from 'react';
import { useDrag, useDrop, DragSourceMonitor } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Hash, Type, Clock, X, Link } from 'lucide-react';
import { Field, FieldType, Pill, ShelfPillDragItem, FieldDragItem, DND_ITEM_TYPE, WidgetState, RelationshipFieldDragItem } from '../../utils/types';
import { Badge } from './Badge';
import { FieldInfoPopover } from './FieldInfoPopover';
import { cn } from './utils';
import { useDashboard } from '../../contexts/DashboardProvider';

export const FieldPillPreview: FC<{ item: FieldDragItem }> = ({ item }) => {
    return (
         <Badge variant={item.type === 'dimension' ? 'dimension' : item.type === 'measure' ? 'measure' : 'datetime'} className="shadow-lg text-sm px-3 py-1.5 rounded-lg">
            {item.type === FieldType.MEASURE ? <Hash size={14} className="flex-shrink-0 mr-1.5" /> : item.type === FieldType.DATETIME ? <Clock size={14} className="flex-shrink-0 mr-1.5" /> : <Type size={14} className="flex-shrink-0 mr-1.5" />}
            {item.simpleName}
        </Badge>
    );
};

export const ShelfPillPreview: FC<{ item: ShelfPillDragItem }> = ({ item }) => {
    const pill = item.pill;
    const getPillDisplay = () => {
        if (['values', 'values2', 'bubbleSize'].includes(item.shelfId as string)) {
            return `${pill.aggregation}(${pill.simpleName})`;
        }
        return pill.simpleName;
    };
    return (
        <Badge variant={pill.type === 'dimension' ? 'dimension' : pill.type === 'measure' ? 'measure' : 'datetime'} className="shadow-lg text-sm px-3 py-1.5 rounded-lg">
            {getPillDisplay()}
        </Badge>
    );
};

export const RelationshipFieldPreview: FC<{ item: RelationshipFieldDragItem }> = ({ item }) => {
    return (
         <Badge variant="secondary" className="shadow-lg text-sm px-3 py-1.5 rounded-lg">
            <Link size={14} className="mr-1.5" />
            {item.sourceName}.{item.fieldName}
        </Badge>
    );
};


export const FieldPill: FC<{ field: Field }> = ({ field }) => {
    const { blendedData } = useDashboard();
    const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
        type: DND_ITEM_TYPE.FIELD,
        item: { name: field.name, simpleName: field.simpleName, type: field.type, isCalculated: field.isCalculated, formula: field.formula } as FieldDragItem,
        collect: (monitor: DragSourceMonitor) => ({ isDragging: !!monitor.isDragging() }),
    }));
    
    useEffect(() => {
        dragPreview(getEmptyImage(), { captureDraggingState: true });
    }, [dragPreview]);

    const getBadgeVariant = () => {
        switch(field.type) {
            case FieldType.MEASURE: return 'measure';
            case FieldType.DATETIME: return 'datetime';
            default: return 'dimension';
        }
    }
    
    const getIcon = () => {
        switch(field.type) {
            case FieldType.MEASURE: return <Hash size={14} className="mr-1.5" />;
            case FieldType.DATETIME: return <Clock size={14} className="mr-1.5" />;
            default: return <Type size={14} className="mr-1.5" />;
        }
    }

    return (
        <div ref={drag as any} className={cn("w-full", isDragging ? 'opacity-0' : '')}>
            <Badge variant={getBadgeVariant()} className="w-full justify-start cursor-grab text-sm px-3 py-1.5 rounded-lg">
                 <FieldInfoPopover field={field} isDragging={isDragging} blendedData={blendedData}>
                    <span className="flex items-center cursor-help">
                        {getIcon()}
                        {field.simpleName}
                    </span>
                </FieldInfoPopover>
            </Badge>
        </div>
    );
};

export const ShelfPill: FC<{ 
    pill: Pill;
    index: number;
    shelfId: keyof WidgetState['shelves'] | 'globalFilters';
    onRemove: () => void; 
    onMovePill: (dragIndex: number, hoverIndex: number, sourceShelf: keyof WidgetState['shelves'] | 'globalFilters', targetShelf: keyof WidgetState['shelves'] | 'globalFilters') => void;
    onClick: () => void;
    onContextMenu: (e: MouseEvent) => void;
    isNew?: boolean;
}> = ({ pill, index, shelfId, onRemove, onMovePill, onClick, onContextMenu, isNew = false }) => {
    const dragRef = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag, dragPreview] = useDrag({
        type: DND_ITEM_TYPE.SHELF_PILL,
        item: { pill, index, shelfId } as ShelfPillDragItem,
        collect: (monitor: DragSourceMonitor) => ({ isDragging: monitor.isDragging() }),
    });
    
    useEffect(() => { dragPreview(getEmptyImage(), { captureDraggingState: true }); }, [dragPreview]);

    const [, drop] = useDrop({
        accept: DND_ITEM_TYPE.SHELF_PILL,
        hover(item: ShelfPillDragItem, monitor) {
            if (!dragRef.current) return;
            if (item.index === index && item.shelfId === shelfId) return;
            const hoverBoundingRect = dragRef.current.getBoundingClientRect();
            const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            const hoverClientX = clientOffset.x - hoverBoundingRect.left;
            if (item.index < index && hoverClientX < hoverMiddleX) return;
            if (item.index > index && hoverClientX > hoverMiddleX) return;
            onMovePill(item.index, index, item.shelfId, shelfId);
            item.index = index;
            item.shelfId = shelfId;
        },
    });
    
    drag(drop(dragRef));

    const getPillDisplay = () => {
        if (['values', 'values2', 'bubbleSize'].includes(shelfId as string)) {
            return `${pill.aggregation}(${pill.simpleName})`;
        }
        if (shelfId === 'filters' || shelfId === 'globalFilters') {
            if (pill.filter) {
                const valueText = pill.filter.values.length > 1 ? `${pill.filter.values.length} values` : pill.filter.values[0];
                return `${pill.simpleName} ${pill.filter.condition} ${valueText}`;
            }
        }
        return pill.simpleName;
    };

    return (
        <div ref={dragRef} onClick={onClick} onContextMenu={onContextMenu} className={cn(isNew && 'animate-highlight-pulse rounded-lg')}>
            <Badge variant={pill.type === 'dimension' ? 'dimension' : pill.type === 'measure' ? 'measure' : 'datetime'} className={cn("cursor-grab rounded-lg", isDragging ? 'opacity-30' : '')}>
                <span className="truncate">{getPillDisplay()}</span>
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-1.5 rounded-full hover:bg-black/20 p-0.5">
                    <X size={12} />
                </button>
            </Badge>
        </div>
    );
};