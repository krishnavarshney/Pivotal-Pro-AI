import React, { FC } from 'react';
import { ChartType } from '../../utils/types';
import { cn } from './utils';

const BarSkeleton = () => (
    <div className="flex items-end space-x-2 h-full">
        <div className="h-[50%] w-full bg-muted rounded"></div>
        <div className="h-[80%] w-full bg-muted rounded"></div>
        <div className="h-[30%] w-full bg-muted rounded"></div>
        <div className="h-[60%] w-full bg-muted rounded"></div>
        <div className="h-[75%] w-full bg-muted rounded"></div>
        <div className="h-[40%] w-full bg-muted rounded"></div>
    </div>
);

const LineSkeleton = () => (
    <div className="h-full flex items-center justify-center p-4">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 80">
            <path d="M0,50 C20,10 40,80 60,40 S80,0 100,60" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
        </svg>
    </div>
);

const PieSkeleton = () => (
    <div className="h-full flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-muted"></div>
    </div>
);

const KpiSkeleton = () => (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-12 bg-muted rounded w-1/2"></div>
    </div>
);

const TableSkeleton = () => (
    <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-4/6"></div>
    </div>
);

export const WidgetSkeleton: FC<{ chartType?: ChartType }> = ({ chartType }) => {
    
    const renderSkeleton = () => {
        switch(chartType) {
            case ChartType.BAR: return <BarSkeleton />;
            case ChartType.LINE:
            case ChartType.AREA: return <LineSkeleton />;
            case ChartType.PIE: return <PieSkeleton />;
            case ChartType.KPI: return <KpiSkeleton />;
            case ChartType.TABLE: return <TableSkeleton />;
            default: return <BarSkeleton />;
        }
    }
    
    return (
        <div className="w-full h-full p-6 animate-pulse flex flex-col">
            <div className="h-4 bg-muted rounded w-1/3 flex-shrink-0"></div>
            <div className="mt-6 flex-grow min-h-0">
                 {renderSkeleton()}
            </div>
        </div>
    );
};