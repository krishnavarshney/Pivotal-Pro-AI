import React from 'react';
import { cn } from './utils';
import { motion, HTMLMotionProps } from 'framer-motion';

const buttonVariants = {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-lg px-3",
      lg: "h-11 rounded-lg px-8",
      icon: "h-10 w-10",
    },
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children" | "className" | "style"> {
    variant?: keyof typeof buttonVariants.variant;
    size?: keyof typeof buttonVariants.size;
    children?: React.ReactNode;
    className?: string; // Add className explicitly to interface
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
        
        const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 flex-shrink-0';
        const variantClasses = buttonVariants.variant[variant];
        const sizeClasses = buttonVariants.size[size];

        return (
            <motion.button
                ref={ref}
                className={cn(baseClasses, variantClasses, sizeClasses, className)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                {...props}
            >
                {children}
            </motion.button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };