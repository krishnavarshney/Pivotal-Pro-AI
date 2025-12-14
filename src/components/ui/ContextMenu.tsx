import React, { useState, useEffect, useRef, useLayoutEffect, CSSProperties, FC } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { ContextMenuItem } from '../../utils/types';

export const ContextMenu: FC<{ x: number, y: number, items: ContextMenuItem[], onClose: () => void }> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<CSSProperties>({});
    const MotionDiv = motion.div as any;
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    useLayoutEffect(() => {
        if (menuRef.current) {
            const menuWidth = menuRef.current.offsetWidth;
            const menuHeight = menuRef.current.offsetHeight;
            const newStyle: CSSProperties = { top: y, left: x };
            if (x + menuWidth > window.innerWidth) {
                newStyle.left = x - menuWidth;
            }
            if (y + menuHeight > window.innerHeight) {
                newStyle.top = y - menuHeight;
            }
            setStyle(newStyle);
        }
    }, [x, y]);
    
    return ReactDOM.createPortal(
        <MotionDiv
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ ...style, position: 'fixed', zIndex: 1000 }}
            className="w-56 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-1"
        >
            {items.map((item, index) => {
                 if (item.label === '---') {
                    return <div key={index} className="h-px bg-border my-1" />;
                 }
                return (
                    <button
                        key={index}
                        onClick={() => { item.onClick(); onClose(); }}
                        disabled={item.disabled}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {item.icon}
                        {item.label}
                    </button>
                )
            })}
        </MotionDiv>,
        document.body
    );
};
