import React, { FC, ReactElement } from 'react';
import { 
    BarChart, LineChart, AreaChart, PieChart, AppWindow, Dot, Table, Grid, 
    BarChartHorizontal, Construction, Box, Filter, Share2, Radar, GaugeCircle 
} from 'lucide-react';
import { ChartType } from '../../utils/types';

const chartIcons: Record<string, ReactElement> = {
    [ChartType.BAR]: <BarChart size={20} />,
    [ChartType.LINE]: <LineChart size={20} />,
    [ChartType.AREA]: <AreaChart size={20} />,
    [ChartType.PIE]: <PieChart size={20} />,
    [ChartType.SCATTER]: <AppWindow size={20} />,
    [ChartType.BUBBLE]: <Dot size={20} />,
    [ChartType.TABLE]: <Table size={20} />,
    [ChartType.TREEMAP]: <Grid size={20} />,
    [ChartType.DUAL_AXIS]: <BarChartHorizontal size={20} />,
    [ChartType.HEATMAP]: <Construction size={20} />,
    [ChartType.BOXPLOT]: <Box size={20} />,
    [ChartType.FUNNEL]: <Filter size={20} />,
    [ChartType.SANKEY]: <Share2 size={20} />,
    [ChartType.RADAR]: <Radar size={20} />,
    [ChartType.GAUGE]: <GaugeCircle size={20} />,
};

export const CompactChartTypeSelector: FC<{
    currentType: ChartType;
    onChange: (type: ChartType) => void;
    onClose: () => void;
}> = ({ currentType, onChange, onClose }) => {
    return (
        <div className="grid grid-cols-4 gap-2">
            {Object.values(ChartType)
                .filter(t => t !== ChartType.CONTROL && t !== ChartType.TABLE && t !== ChartType.KPI)
                .map(type => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => { onChange(type); onClose(); }}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-foreground ${currentType === type ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                        title={type}
                    >
                        <span className="icon-hover-anim">{chartIcons[type]}</span>
                        <span className="text-xs mt-1">{type}</span>
                    </button>
                ))
            }
        </div>
    );
};
