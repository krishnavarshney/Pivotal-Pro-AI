
import React, { FC, ReactNode } from 'react';
import { cn } from './utils';

export const Card: FC<{ children: ReactNode, className?: string, onClick?: () => void }> = ({ children, className, onClick }) => (
    <div className={cn("rounded-xl text-card-foreground glass-panel", className)} onClick={onClick}>{children}</div>
);
export const CardHeader: FC<{ children: ReactNode, className?: string }> = ({ children, className }) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>
);
export const CardTitle: FC<{ children: ReactNode, className?: string }> = ({ children, className }) => (
    <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)}>{children}</h3>
);
export const CardDescription: FC<{ children: ReactNode, className?: string }> = ({ children, className }) => (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
);
export const CardContent: FC<{ children: ReactNode, className?: string }> = ({ children, className }) => (
    <div className={cn("p-6 pt-0", className)}>{children}</div>
);
export const CardFooter: FC<{ children: ReactNode, className?: string }> = ({ children, className }) => (
    <div className={cn("flex items-center p-6 pt-0", className)}>{children}</div>
);