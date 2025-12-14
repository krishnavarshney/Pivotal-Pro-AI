import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight } from "lucide-react"


export const Popover: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    trigger: React.ReactNode;
    children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode);
    contentClassName?: string;
    align?: 'left' | 'right' | 'center' | 'start' | 'end';
    placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
    contentStyle?: React.CSSProperties;
}> = ({ isOpen, onClose, trigger, children, contentClassName = 'w-64', align = 'center', placement = 'auto', offset = 8, contentStyle }) => {
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const popoverContentRef = React.useRef<HTMLDivElement>(null);
    const [style, setStyle] = React.useState<React.CSSProperties>({ visibility: 'hidden', position: 'fixed' });
    const MotionDiv = motion.div;

    const updatePosition = React.useCallback(() => {
        if (!triggerRef.current || !popoverContentRef.current) return;
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = popoverContentRef.current.getBoundingClientRect();
        
        let effectivePlacement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
        
        if (placement === 'auto') {
            const space = {
                top: triggerRect.top,
                bottom: window.innerHeight - triggerRect.bottom,
                left: triggerRect.left,
                right: window.innerWidth - triggerRect.right,
            };
            const placements: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
            effectivePlacement = placements.find(p => {
                if (p === 'top' || p === 'bottom') return space[p] > contentRect.height + offset;
                if (p === 'left' || p === 'right') return space[p] > contentRect.width + offset;
                return false;
            }) || 'bottom';
        }

        let top: number, left: number;
        
        switch (effectivePlacement) {
            case 'top':
                top = triggerRect.top - contentRect.height - offset;
                if (align === 'right' || align === 'end') left = triggerRect.right - contentRect.width;
                else if (align === 'center') left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
                else left = triggerRect.left; // align 'left' or 'start'
                break;
            case 'bottom':
                top = triggerRect.bottom + offset;
                if (align === 'right' || align === 'end') left = triggerRect.right - contentRect.width;
                else if (align === 'center') left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
                else left = triggerRect.left; // align 'left' or 'start'
                break;
            case 'left':
                left = triggerRect.left - contentRect.width - offset;
                if (align === 'end') top = triggerRect.bottom - contentRect.height;
                else if (align === 'center') top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
                else top = triggerRect.top; // 'start'
                break;
            case 'right':
                left = triggerRect.right + offset;
                if (align === 'end') top = triggerRect.bottom - contentRect.height;
                else if (align === 'center') top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
                else top = triggerRect.top; // 'start'
                break;
            default: // bottom as fallback
                top = triggerRect.bottom + offset;
                left = triggerRect.left;
        }

        const finalTop = Math.max(10, Math.min(top, window.innerHeight - contentRect.height - 10));
        const finalLeft = Math.max(10, Math.min(left, window.innerWidth - contentRect.width - 10));

        setStyle({ position: 'fixed', top: `${finalTop}px`, left: `${finalLeft}px`, visibility: 'visible', ...contentStyle });
    }, [align, placement, offset, triggerRef, popoverContentRef, contentStyle]);

    React.useEffect(() => {
        if (isOpen) {
            setStyle({ position: 'fixed', top: '-9999px', left: '-9999px', visibility: 'hidden' });
            requestAnimationFrame(() => updatePosition());
        }
    }, [isOpen, updatePosition]);

    React.useEffect(() => {
        if (!isOpen) return;

        const handleScrollAndResize = () => updatePosition();
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
                popoverContentRef.current && !popoverContentRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        window.addEventListener('scroll', handleScrollAndResize, true);
        window.addEventListener('resize', handleScrollAndResize);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScrollAndResize, true);
            window.removeEventListener('resize', handleScrollAndResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, updatePosition, onClose]);

    // FIX: Added missing return statement and JSX structure.
    return (
        <>
            <div ref={triggerRef} className="inline-block">
                {trigger}
            </div>
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <MotionDiv
                            ref={popoverContentRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={style}
                            className={cn("z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none", contentClassName)}
                        >
                            {typeof children === 'function' ? children({ close: onClose }) : children}
                        </MotionDiv>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

