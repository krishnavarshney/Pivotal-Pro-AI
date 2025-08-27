import React, { useContext, useEffect, createContext, FC, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from './utils';

const SheetContext = createContext({
    open: false,
    onOpenChange: (open: boolean) => {}
});

export const Sheet: FC<{ open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }> = ({ open, onOpenChange, children }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onOpenChange(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onOpenChange]);

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <SheetContext.Provider value={{ open, onOpenChange }}>
            <AnimatePresence>
                {open && children}
            </AnimatePresence>
        </SheetContext.Provider>,
        document.body
    );
};

export const SheetOverlay: FC = () => {
    const { onOpenChange } = useContext(SheetContext);
    const MotionDiv = motion.div as any;
    return <MotionDiv className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.3}} onClick={() => onOpenChange(false)} />;
};

const sheetVariants = {
    left: {
        initial: { x: "-100%" },
        animate: { x: 0 },
        exit: { x: "-100%" },
        className: "inset-y-0 left-0 border-r"
    },
    right: {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        className: "inset-y-0 right-0 border-l"
    },
    top: {
        initial: { y: "-100%" },
        animate: { y: 0 },
        exit: { y: "-100%" },
        className: "inset-x-0 top-0 border-b h-auto"
    },
    bottom: {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
        className: "inset-x-0 bottom-0 border-t h-auto"
    },
};


export const SheetContent: FC<{ children: ReactNode; className?: string; side?: 'top' | 'bottom' | 'left' | 'right' }> = ({ children, className, side = 'right' }) => {
    const { onOpenChange } = useContext(SheetContext);
    const variants = sheetVariants[side];
    const MotionDiv = motion.div as any;

    return (
        <>
            <SheetOverlay />
             <MotionDiv
                initial={variants.initial}
                animate={variants.animate}
                exit={variants.exit}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                    "fixed z-50 flex h-full flex-col glass-panel text-card-foreground shadow-lg",
                    variants.className,
                    className
                )}
                onClick={(e) => e.stopPropagation()}
             >
                {children}
                 <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 rounded-lg opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none p-1">
                    <span className="icon-hover-anim inline-block"><X className="h-4 w-4" /></span>
                    <span className="sr-only">Close</span>
                </button>
            </MotionDiv>
        </>
    );
};
export const SheetHeader: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left p-6", className)}>{children}</div>
);
export const SheetTitle: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
     <h2 className={cn("text-lg font-semibold text-foreground", className)}>{children}</h2>
);
export const SheetDescription: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
);
