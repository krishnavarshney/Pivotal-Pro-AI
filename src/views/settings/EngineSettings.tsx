import React from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { ChartLibrary } from '../../utils/types';
import { cn } from '../../components/ui/utils';
import _ from 'lodash';

const SectionCard: React.FC<{title: string, description?: string, children: React.ReactNode, className?: string}> = ({title, description, children, className}) => (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm", className)}>
        <div className="p-6">
            <h3 className="text-lg font-semibold font-display text-foreground">{title}</h3>
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        <div className="p-6 border-t border-border">
            {children}
        </div>
    </div>
);

export const EngineSettings: React.FC = () => {
    const { chartLibrary, setChartLibrary } = useDashboard();
    
    return (
        <SectionCard title="Chart Engine" description="Select the rendering library for visualizations. This may affect appearance and performance.">
            <div className="flex flex-col md:flex-row gap-4">
                {(['recharts', 'apexcharts', 'echarts'] as ChartLibrary[]).map(lib => (
                        <button
                        key={lib}
                        onClick={() => setChartLibrary(lib)}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${chartLibrary === lib ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80'}`}
                    >
                        <span className="font-semibold text-foreground">{_.capitalize(lib === 'recharts' ? 'Shadcn/Recharts' : lib)}</span>
                    </button>
                ))}
            </div>
        </SectionCard>
    );
};