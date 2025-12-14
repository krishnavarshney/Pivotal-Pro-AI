import React, { FC, ReactNode, useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../ui/utils';
import { animate } from 'framer-motion';

const AnimatedCounter: FC<{ value: number }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = animate(displayValue, value, {
            duration: 1,
            ease: "easeOut",
            onUpdate(latest) {
                setDisplayValue(latest);
            }
        });
        return () => controls.stop();
    }, [value, displayValue]);

    return <>{Math.round(displayValue).toLocaleString()}</>;
};

export interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trendValue?: string;
  trendDirection?: 'up' | 'down' | 'stable';
}

export const StatCard: FC<StatCardProps> = ({ title, value, icon, trendValue, trendDirection }) => {
    const trendColor = trendDirection === 'up' ? 'text-green-500' : trendDirection === 'down' ? 'text-red-500' : 'text-muted-foreground';
    const trendIcon = trendDirection === 'up' ? <ArrowUp size={12} strokeWidth={3} /> : trendDirection === 'down' ? <ArrowDown size={12} strokeWidth={3} /> : null;
    return (
    <Card className="p-5">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="mt-2">
            <h3 className="text-3xl font-bold"><AnimatedCounter value={value} /></h3>
            {trendValue && (
                <div className={cn("mt-1 text-xs flex items-center gap-1", trendColor)}>
                    {trendIcon}
                    <span>{trendValue}</span>
                    {trendDirection !== 'stable' && <span className="text-muted-foreground">from last period</span>}
                </div>
            )}
        </div>
    </Card>
)};
