
import React, { createContext, useContext, useState, FC, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from './utils';

type AccordionContextProps = {
    type: 'single' | 'multiple';
    value: string | string[];
    onValueChange: (value: string) => void;
};

const AccordionContext = createContext<AccordionContextProps | null>(null);

const useAccordion = () => {
    const context = useContext(AccordionContext);
    if (!context) {
        throw new Error('useAccordion must be used within an Accordion');
    }
    return context;
};

type AccordionProps = {
    type?: 'single' | 'multiple';
    defaultValue?: string | string[];
    children: ReactNode;
    className?: string;
};

export const Accordion: FC<AccordionProps> = ({ type = 'single', defaultValue, children, className }) => {
    const [value, setValue] = useState<string | string[]>(defaultValue || (type === 'multiple' ? [] : ''));

    const onValueChange = (itemValue: string) => {
        if (type === 'multiple') {
            setValue(prev => {
                const arr = Array.isArray(prev) ? prev : [];
                return arr.includes(itemValue) ? arr.filter(v => v !== itemValue) : [...arr, itemValue];
            });
        } else {
            setValue(prev => (prev === itemValue ? '' : itemValue));
        }
    };

    return (
        <AccordionContext.Provider value={{ type, value, onValueChange }}>
            <div className={cn("w-full", className)}>{children}</div>
        </AccordionContext.Provider>
    );
};

type AccordionItemContextProps = {
    value: string;
    isOpen: boolean;
};

const AccordionItemContext = createContext<AccordionItemContextProps | null>(null);

const useAccordionItem = () => {
    const context = useContext(AccordionItemContext);
    if (!context) {
        throw new Error('useAccordionItem must be used within an AccordionItem');
    }
    return context;
};

type AccordionItemProps = {
    value: string;
    children: ReactNode;
    className?: string;
};

export const AccordionItem: FC<AccordionItemProps> = ({ value, children, className }) => {
    const { type, value: contextValue } = useAccordion();
    const isOpen = type === 'multiple' ? (contextValue as string[]).includes(value) : contextValue === value;
    
    return (
        <AccordionItemContext.Provider value={{ value, isOpen }}>
            <div className={cn("border-b", className)}>{children}</div>
        </AccordionItemContext.Provider>
    );
};

export const AccordionTrigger: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => {
    const { onValueChange } = useAccordion();
    const { value, isOpen } = useAccordionItem();

    return (
        <button
            onClick={() => onValueChange(value)}
            className={cn("flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", className)}
            data-state={isOpen ? 'open' : 'closed'}
            aria-expanded={isOpen}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
    );
};

export const AccordionContent: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => {
    const { isOpen } = useAccordionItem();
    const MotionDiv = motion.div as any;
    
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <MotionDiv
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                        open: { opacity: 1, height: 'auto' },
                        collapsed: { opacity: 0, height: 0 },
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden text-sm transition-all"
                >
                    <div className={cn("pb-4 pt-0", className)}>{children}</div>
                </MotionDiv>
            )}
        </AnimatePresence>
    );
};
