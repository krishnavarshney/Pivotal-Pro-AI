import React, { FC, ReactNode, MouseEvent } from 'react';
import { useDrop } from 'react-dnd';
import { Pill, WidgetState, FieldDragItem, DND_ITEM_TYPE, ShelfPillDragItem } from '../../utils/types';
import { ShelfPill } from './Pill';
import { cn } from './utils';
import { HelpIcon } from './HelpIcon';

export const Shelf: FC<{
    shelfId: keyof WidgetState['shelves'];
    title: string;
    icon?: ReactNode;
    pills: Pill[];
    onDrop: (item: FieldDragItem) => void;
    onRemovePill: (index: number) => void;
    onUpdatePill: (index: number, update: Partial<Pill>) => void;
    onMovePill: (dragIndex: number, hoverIndex: number, sourceShelf: keyof WidgetState['shelves'], targetShelf: keyof WidgetState['shelves']) => void;
    onPillClick: (pill: Pill, index: number) => void;
    onPillContextMenu: (e: MouseEvent, pill: Pill, index: number) => void;
    canDrop: (item: any) => boolean;
    helpText?: string;
}> = ({ shelfId, title, icon, pills, onDrop, onRemovePill, onMovePill, onPillClick, onPillContextMenu, canDrop, helpText }) => {

    const [{ isOver, canDrop: canDropItem }, drop] = useDrop({
        accept: [DND_ITEM_TYPE.FIELD, DND_ITEM_TYPE.SHELF_PILL],
        drop: (item: FieldDragItem | ShelfPillDragItem, monitor) => {
            if (monitor.didDrop()) {
                return;
            }
            const itemType = monitor.getItemType();
            if (itemType === DND_ITEM_TYPE.FIELD) {
                onDrop(item as FieldDragItem);
            } else if (itemType === DND_ITEM_TYPE.SHELF_PILL) {
                const shelfPillItem = item as ShelfPillDragItem;
                onMovePill(shelfPillItem.index, pills.length, shelfPillItem.shelfId as any, shelfId);
            }
        },
        canDrop: (item: any) => canDrop(item),
        collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }), canDrop: monitor.canDrop() }),
    });

    return (
        <div>
            <div className="flex items-center gap-1.5">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {icon}
                    {title}
                </label>
                {helpText && <HelpIcon helpText={helpText} />}
            </div>
            <div
                ref={drop as any}
                className={cn(
                    "mt-1 min-h-[48px] bg-secondary/50 border-2 border-dashed border-transparent rounded-lg flex flex-wrap items-start p-1.5 gap-1.5 transition-colors",
                    {
                        'border-primary/50 bg-primary/10': isOver && canDropItem,
                        'border-red-500/50 bg-red-500/10': isOver && !canDropItem
                    }
                )}
            >
                {pills.length === 0 && <span className="text-xs text-muted-foreground p-2 text-center w-full">Drop fields here</span>}
                {pills.map((pill, index) => (
                    <ShelfPill
                        key={pill.id}
                        pill={pill}
                        index={index}
                        shelfId={shelfId}
                        onRemove={() => onRemovePill(index)}
                        onMovePill={onMovePill}
                        onClick={() => onPillClick(pill, index)}
                        onContextMenu={(e) => onPillContextMenu(e, pill, index)}
                    />
                ))}
            </div>
        </div>
    );
};