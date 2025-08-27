import React, { FC, ReactNode } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard';

export const Tooltip: FC<{
    content: ReactNode;
    children: ReactNode;
    align?: 'left' | 'right' | 'center' | 'start' | 'end';
    placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, align = 'center', placement = 'bottom' }) => {
    return (
        <HoverCard>
            <HoverCardTrigger asChild>{children}</HoverCardTrigger>
            <HoverCardContent className="w-auto px-3 py-1.5 text-sm font-semibold rounded-lg" align={align} placement={placement} offset={8}>
                {content}
            </HoverCardContent>
        </HoverCard>
    );
};
