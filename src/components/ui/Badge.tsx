import React, { FC, ReactNode } from 'react';
import { cn } from './utils';

const badgeVariants = {
    variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        dimension: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
        measure: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
        datetime: "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
    }
};

export const Badge: FC<{ children: ReactNode; className?: string; variant?: keyof typeof badgeVariants.variant; }> = ({ children, className, variant = 'default' }) => {
    return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", badgeVariants.variant[variant], className)}>{children}</div>;
};
