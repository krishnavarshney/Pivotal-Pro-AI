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
                            transition={{ duration: 0.1, ease: 'easeOut' }}
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

// FIX: Export Radix UI Dropdown Menu components
export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal
export const DropdownMenuSub = DropdownMenuPrimitive.Sub
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

export const DropdownMenuGroup = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Group
    ref={ref}
    className={cn("p-1", className)}
    {...props}
  />
))
DropdownMenuGroup.displayName = DropdownMenuPrimitive.Group.displayName

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <div className="h-2 w-2 rounded-full bg-primary" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
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
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName