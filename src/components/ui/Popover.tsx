import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, CSSProperties, FC, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight } from "lucide-react"


export const Popover: FC<{
    isOpen: boolean;
    onClose: () => void;
    trigger: ReactNode;
    children: ReactNode | ((props: { close: () => void }) => ReactNode);
    contentClassName?: string;
    align?: 'left' | 'right' | 'center' | 'start' | 'end';
    placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
    contentStyle?: CSSProperties;
}> = ({ isOpen, onClose, trigger, children, contentClassName = 'w-64', align = 'center', placement = 'auto', offset = 8, contentStyle }) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverContentRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden', position: 'fixed' });
    const MotionDiv = motion.div as any;

    const updatePosition = useCallback(() => {
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
            const placements: ('right' | 'left' | 'bottom' | 'top')[] = ['right', 'left', 'bottom', 'top'];
            const bestPlacement = placements.find(p => {
                if (p === 'top' || p === 'bottom') return space[p] > contentRect.height + offset;
                if (p === 'left' || p === 'right') return space[p] > contentRect.width + offset;
                return false;
            });
            effectivePlacement = bestPlacement || 'bottom';
        } else {
            effectivePlacement = placement as any;
        }

        let top: number, left: number;
        
        switch (effectivePlacement) {
            case 'top':
                top = triggerRect.top - contentRect.height - offset;
                if (align === 'right' || align === 'end') left = triggerRect.right - contentRect.width;
                else if (align === 'center') left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
                else left = triggerRect.left;
                break;
            case 'bottom':
                top = triggerRect.bottom + offset;
                if (align === 'right' || align === 'end') left = triggerRect.right - contentRect.width;
                else if (align === 'center') left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
                else left = triggerRect.left;
                break;
            case 'left':
                left = triggerRect.left - contentRect.width - offset;
                if (align === 'end') top = triggerRect.bottom - contentRect.height;
                else if (align === 'center') top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
                else top = triggerRect.top;
                break;
            case 'right':
                left = triggerRect.right + offset;
                if (align === 'end') top = triggerRect.bottom - contentRect.height;
                else if (align === 'center') top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
                else top = triggerRect.top;
                break;
            default:
                top = triggerRect.bottom + offset;
                left = triggerRect.left;
        }

        const finalTop = Math.max(10, Math.min(top, window.innerHeight - contentRect.height - 10));
        const finalLeft = Math.max(10, Math.min(left, window.innerWidth - contentRect.width - 10));
        
        let yOrigin: string, xOrigin: string;

        switch (effectivePlacement) {
            case 'bottom':
                yOrigin = 'top';
                xOrigin = (align === 'left' || align === 'start') ? 'left' : (align === 'right' || align === 'end') ? 'right' : 'center';
                break;
            case 'top':
                yOrigin = 'bottom';
                xOrigin = (align === 'left' || align === 'start') ? 'left' : (align === 'right' || align === 'end') ? 'right' : 'center';
                break;
            case 'left':
                xOrigin = 'right';
                yOrigin = (align === 'start') ? 'top' : (align === 'end') ? 'bottom' : 'center';
                break;
            case 'right':
                xOrigin = 'left';
                yOrigin = (align === 'start') ? 'top' : (align === 'end') ? 'bottom' : 'center';
                break;
            default:
                yOrigin = 'top';
                xOrigin = 'center';
        }

        const transformOrigin = `${xOrigin} ${yOrigin}`;

        setStyle({ 
            position: 'fixed', 
            top: `${finalTop}px`, 
            left: `${finalLeft}px`, 
            visibility: 'visible',
            transformOrigin: transformOrigin,
            ...contentStyle
        });
    }, [align, placement, offset, contentStyle]);

    useLayoutEffect(() => {
        if (isOpen) {
            setStyle({ position: 'fixed', top: '-9999px', left: '-9999px', visibility: 'hidden' });
            requestAnimationFrame(() => updatePosition());
        }
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverContentRef.current && !popoverContentRef.current.contains(event.target as Node) && triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleScroll = () => updatePosition();
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen, onClose, updatePosition]);

    if (typeof document === 'undefined') return null;

    return (
        <div ref={triggerRef}>
            {trigger}
            {ReactDOM.createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <MotionDiv
                            ref={popoverContentRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            style={style}
                            className={cn("z-50 rounded-lg border border-border dark:border-popover bg-popover p-4 text-popover-foreground shadow-md outline-none", contentClassName)}
                        >
                            {typeof children === 'function' ? children({ close: onClose }) : children}
                        </MotionDiv>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};


// --- Dropdown Menu Implementation ---

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal
export const DropdownMenuSub = DropdownMenuPrimitive.Sub
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  DropdownMenuPrimitive.DropdownMenuSubTriggerProps & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-md px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  DropdownMenuPrimitive.DropdownMenuSubContentProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md glass-panel data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuPrimitive.DropdownMenuContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md glass-panel",
        "data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuPrimitive.DropdownMenuItemProps & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuPrimitive.DropdownMenuCheckboxItemProps
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuPrimitive.DropdownMenuRadioItemProps
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuPrimitive.DropdownMenuLabelProps & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-muted-foreground", inset && "pl-8", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  DropdownMenuPrimitive.DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"