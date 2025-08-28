
import React, { useContext, useEffect, createContext, FC, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from './utils';

const DialogContext = createContext({
    open: false,
    onOpenChange: (open: boolean) => {}
});

export const Dialog: FC<{ open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }> = ({ open, onOpenChange, children }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onOpenChange(false);
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onOpenChange]);

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <DialogContext.Provider value={{ open, onOpenChange }}>
            <AnimatePresence>
                {open && children}
            </AnimatePresence>
        </DialogContext.Provider>,
        document.body
    );
};

export const DialogOverlay: FC = () => {
    const { onOpenChange } = useContext(DialogContext);
    const MotionDiv = motion.div as any;
    return <MotionDiv className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}} onClick={() => onOpenChange(false)} />;
};

export const DialogContent: FC<{ children: ReactNode; className?: string; containerClassName?: string; hideCloseButton?: boolean; }> = ({ children, className, containerClassName, hideCloseButton = false }) => {
    const { onOpenChange } = useContext(DialogContext);
    const MotionDiv = motion.div as any;
    return (
        <div className={cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4", containerClassName)} onClick={(e) => e.stopPropagation()}>
             <MotionDiv
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={cn("relative flex w-full flex-col rounded-xl text-card-foreground shadow-lg glass-panel", className)}
            >
                {children}
                {!hideCloseButton && (
                    <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 rounded-lg opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10 p-1">
                        <span className="icon-hover-anim inline-block"><X className="h-4 w-4" /></span>
                        <span className="sr-only">Close</span>
                    </button>
                )}
            </MotionDiv>
        </div>
    );
};

export const DialogHeader: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn("flex flex-col space-y-1.5 p-4 md:p-6 border-b border-border/50", className)}>{children}</div>
);

export const DialogTitle: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight font-display", className)}>{children}</h2>
);
export const DialogDescription: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
);
export const DialogFooter: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 md:p-6 border-t border-border/50", className)}>{children}</div>
);