import React, { useState, FC, ReactElement } from 'react';
import { ChartBar, ChartLine, ChartLineUp, ChartPie, DotsNine, TextT, NumberSquareOne, GridFour, MapTrifold, Barricade, ChartBarHorizontal, Robot, User, Sparkle, CheckCircle, Info, WarningCircle, LinkSimpleHorizontal, SlidersHorizontal, Package, Funnel, Plus, CirclesFour, ArrowsHorizontal, Clock, CaretDown, ShareNetwork } from 'phosphor-react';
import { ChartType } from '../../utils/types';
import { Popover } from './Popover';
import { cn, inputClasses } from './utils';

export const ChartTypeSelector: FC<{
    chartType: ChartType;
    onChartTypeChange: (type: ChartType) => void;
}> = ({ chartType, onChartTypeChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const chartIcons: Record<string, ReactElement> = {
        [ChartType.BAR]: <ChartBar size={20} />,
        [ChartType.LINE]: <ChartLine size={20} />,
        [ChartType.AREA]: <ChartLineUp size={20} />,
        [ChartType.PIE]: <ChartPie size={20} />,
        [ChartType.SCATTER]: <DotsNine size={20} />,
        [ChartType.BUBBLE]: <CirclesFour size={20} />,
        [ChartType.TABLE]: <TextT size={20} />,
        [ChartType.KPI]: <NumberSquareOne size={20} />,
        [ChartType.TREEMAP]: <GridFour size={20} />,
        [ChartType.MAP]: <MapTrifold size={20} />,
        [ChartType.DUAL_AXIS]: <ChartBarHorizontal size={20} />,
        [ChartType.HEATMAP]: <Barricade size={20} />,
        [ChartType.BOXPLOT]: <Package size={20} />,
        [ChartType.FUNNEL]: <Funnel size={20} />,
        [ChartType.CONTROL]: <SlidersHorizontal size={20} />,
        [ChartType.SANKEY]: <ShareNetwork size={20} />,
    };

    return (
        <Popover
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            trigger={
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn("w-full flex items-center justify-between text-left", inputClasses)}
                >
                    <div className="flex items-center gap-2">
                        {chartIcons[chartType] || <ChartBar size={20} />}
                        <span>{chartType}</span>
                    </div>
                    <CaretDown size={16} className="text-muted-foreground" />
                </button>
            }
            contentClassName="w-[var(--radix-popover-trigger-width)] p-2 grid grid-cols-3 gap-2"
        >
            {({ close }) => Object.values(ChartType).filter(t => t !== ChartType.CONTROL).map(type => (
                <button
                    key={type}
                    type="button"
                    onClick={() => { onChartTypeChange(type); close(); }}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-foreground ${chartType === type ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                    title={type}
                >
                    {chartIcons[type]}
                    <span className="text-xs mt-1">{type}</span>
                </button>
            ))}
        </Popover>
    );
};
