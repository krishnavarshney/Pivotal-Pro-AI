import React, { useState, useEffect, useRef, useCallback, createContext, useContext, FC, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';

interface HoverCardContextProps {
    isOpen: boolean;
    triggerRef: React.RefObject<HTMLDivElement>;
    contentRef: React.RefObject<HTMLDivElement>;
    handleOpen: () => void;
    handleClose: () => void;
}

const HoverCardContext = createContext<HoverCardContextProps | null>(null);

const useHoverCard = () => {
    const context = useContext(HoverCardContext);
    if (!context) throw new Error('useHoverCard must be used within a HoverCard');
    return context;
};

export const HoverCard: FC<{ children: ReactNode; openDelay?: number; closeDelay?: number; }> = ({ children, openDelay = 200, closeDelay = 100 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const openTimer = useRef<number | null>(null);
    const closeTimer = useRef<number | null>(null);

    const handleOpen = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        openTimer.current = window.setTimeout(() => setIsOpen(true), openDelay);
    }, [openDelay]);

    const handleClose = useCallback(() => {
        if (openTimer.current) clearTimeout(openTimer.current);
        closeTimer.current = window.setTimeout(() => setIsOpen(false), closeDelay);
    }, [closeDelay]);

    useEffect(() => {
        return () => {
            if (openTimer.current) clearTimeout(openTimer.current);
            if (closeTimer.current) clearTimeout(closeTimer.current);
        };
    }, []);
    
    const contextValue = { isOpen, triggerRef, contentRef, handleOpen, handleClose };

    return <HoverCardContext.Provider value={contextValue}>{children}</HoverCardContext.Provider>;
};

export const HoverCardTrigger: FC<{ children: ReactNode; asChild?: boolean; disabled?: boolean; }> = ({ children, asChild = false, disabled = false }) => {
    const { triggerRef, handleOpen, handleClose } = useHoverCard();

    const eventHandlers = disabled ? {} : {
        onMouseEnter: handleOpen,
        onMouseLeave: handleClose,
        onFocus: handleOpen,
        onBlur: handleClose,
    };

    if (asChild) {
        // When asChild is true, we must wrap the child to get a reliable ref for positioning.
        // This is a necessary compromise for correct positioning without a Slot primitive.
        return (
            <span ref={triggerRef} {...eventHandlers}>
                {children}
            </span>
        );
    }
    
    return <div ref={triggerRef} {...eventHandlers}>{children}</div>;
};

export const HoverCardContent: FC<{
    children: ReactNode;
    className?: string;
    align?: 'left' | 'right' | 'center' | 'start' | 'end';
    placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
}> = ({ children, className = 'w-64', align = 'center', placement = 'auto', offset = 8 }) => {
    const { isOpen, triggerRef, contentRef, handleOpen, handleClose } = useHoverCard();
    const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden', position: 'fixed' });
    const MotionDiv = motion.div as any;

    const updatePosition = useCallback(() => {
        if (!triggerRef.current || !contentRef.current) return;
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        
        let effectivePlacement = placement;
        
        if (placement === 'auto') {
            const space = {
                top: triggerRect.top,
                bottom: window.innerHeight - triggerRect.bottom,
                left: triggerRect.left,
                right: window.innerWidth - triggerRect.right,
            };
            const placements: ('right' | 'left' | 'bottom' | 'top')[] = ['right', 'left', 'bottom', 'top'];
            const bestPlacement = placements.find(p => {
                if (p === 'top' || p === 'bottom') return space[p] > contentRect.height + offset;
                if (p === 'left' || p === 'right') return space[p] > contentRect.width + offset;
                return false;
            });
            effectivePlacement = bestPlacement || 'bottom';
        }

        let top: number, left: number;
        
        switch (effectivePlacement) {
            case 'top':
                top = triggerRect.top - contentRect.height - offset;
                if (align === 'right') left = triggerRect.right - contentRect.width;
                else if (align === 'center') left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
                else left = triggerRect.left; // align 'left' or 'start'
                break;
            case 'bottom':
                top = triggerRect.bottom + offset;
                if (align === 'right') left = triggerRect.right - contentRect.width;
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

        setStyle({ position: 'fixed', top: `${finalTop}px`, left: `${finalLeft}px`, visibility: 'visible' });
    }, [align, placement, offset, triggerRef, contentRef]);


    useEffect(() => {
        if (isOpen) {
            setStyle({ position: 'fixed', top: '-9999px', left: '-9999px', visibility: 'hidden' });
            requestAnimationFrame(() => updatePosition());
        }
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return;
        const handleScrollAndResize = () => updatePosition();
        window.addEventListener('scroll', handleScrollAndResize, true);
        window.addEventListener('resize', handleScrollAndResize);
        return () => {
            window.removeEventListener('scroll', handleScrollAndResize, true);
            window.removeEventListener('resize', handleScrollAndResize);
        };
    }, [isOpen, updatePosition]);

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <MotionDiv
                    ref={contentRef}
                    onMouseEnter={handleOpen}
                    onMouseLeave={handleClose}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    style={style}
                    className={cn("z-50 rounded-lg border border-border dark:border-popover bg-popover p-4 text-popover-foreground shadow-md outline-none", className)}
                >
                    {children}
                </MotionDiv>
            )}
        </AnimatePresence>,
        document.body
    );
};
