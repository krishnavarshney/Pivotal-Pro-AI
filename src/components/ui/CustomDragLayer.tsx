import React, { FC } from 'react';
import { useDragLayer } from 'react-dnd';
import { DND_ITEM_TYPE, FieldDragItem, ShelfPillDragItem, RelationshipFieldDragItem } from '../../utils/types';
import { FieldPillPreview, ShelfPillPreview, RelationshipFieldPreview } from './Pill';

export const CustomDragLayer: FC = () => {
    const { itemType, isDragging, item, currentOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }));

    if (!isDragging || !currentOffset) {
        return null;
    }

    const renderItem = () => {
        switch (itemType) {
            case DND_ITEM_TYPE.FIELD:
                return <FieldPillPreview item={item as FieldDragItem} />;
            case DND_ITEM_TYPE.SHELF_PILL:
                return <ShelfPillPreview item={item as ShelfPillDragItem} />;
            case DND_ITEM_TYPE.RELATIONSHIP_FIELD:
                return <RelationshipFieldPreview item={item as RelationshipFieldDragItem} />;
            default:
                return null;
        }
    };

    return (
        <div style={{ position: 'fixed', pointerEvents: 'none', zIndex: 100, left: 0, top: 0, width: '100%', height: '100%' }}>
            <div style={{ transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)` }}>
                {renderItem()}
            </div>
        </div>
    );
};
