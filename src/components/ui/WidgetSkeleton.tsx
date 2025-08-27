import React, { FC } from 'react';

export const WidgetSkeleton: FC = () => {
    return (
        <div className="w-full h-full p-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
            <div className="mt-6 flex items-end space-x-2 h-full pb-10">
                <div className="h-[50%] w-full bg-muted rounded"></div>
                <div className="h-[80%] w-full bg-muted rounded"></div>
                <div className="h-[30%] w-full bg-muted rounded"></div>
                <div className="h-[60%] w-full bg-muted rounded"></div>
                <div className="h-[75%] w-full bg-muted rounded"></div>
                <div className="h-[40%] w-full bg-muted rounded"></div>
            </div>
        </div>
    );
};
