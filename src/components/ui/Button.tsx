import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { cn } from './utils';

const buttonVariants = {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
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

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants.variant;
    size?: keyof typeof buttonVariants.size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const { onClick, children, ...rest } = props;
        const internalRef = useRef<HTMLButtonElement>(null);
        useImperativeHandle(ref, () => internalRef.current!, []);

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (variant !== 'link') {
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();

                const circle = document.createElement("span");
                const diameter = Math.max(button.clientWidth, button.clientHeight);
                const radius = diameter / 2;

                circle.style.width = circle.style.height = `${diameter}px`;
                circle.style.left = `${e.clientX - rect.left - radius}px`;
                circle.style.top = `${e.clientY - rect.top - radius}px`;
                circle.classList.add("ripple");
                
                if (variant === 'default') {
                    circle.style.backgroundColor = 'var(--primary-foreground)';
                } else if (variant === 'destructive') {
                    circle.style.backgroundColor = 'var(--destructive-foreground)';
                } else {
                    circle.style.backgroundColor = 'var(--primary)';
                }

                const existingRipple = button.querySelector('.ripple');
                if (existingRipple) {
                    existingRipple.remove();
                }

                button.appendChild(circle);

                setTimeout(() => {
                    if (circle.parentElement) {
                       circle.remove();
                    }
                }, 600);
            }
            onClick?.(e);
        };

        const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2';
        const variantClasses = buttonVariants.variant[variant];
        const sizeClasses = buttonVariants.size[size];

        return (
            <button
                className={cn(baseClasses, variantClasses, sizeClasses, className)}
                ref={internalRef}
                onClick={handleClick}
                {...rest}
            >
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";