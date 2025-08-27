import React from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { ChartType } from '../../utils/types';
import { COLOR_PALETTES } from '../../utils/constants';
import { cn, inputClasses } from '../../components/ui/utils';

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

export const DefaultsSettings: React.FC = () => {
    const { dashboardDefaults, setDashboardDefaults } = useDashboard();
    
    return (
        <SectionCard title="Dashboard Defaults" description="Set default options for new widgets and pages to streamline your workflow.">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Default Color Palette</label>
                    <select value={dashboardDefaults.colorPalette} onChange={e => setDashboardDefaults(d => ({ ...d, colorPalette: e.target.value }))} className={`${inputClasses} mt-1`}>
                        {Object.keys(COLOR_PALETTES).map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>
                    <div>
                    <label className="text-sm font-medium text-muted-foreground">Default Chart Type</label>
                    <select value={dashboardDefaults.chartType} onChange={e => setDashboardDefaults(d => ({ ...d, chartType: e.target.value as ChartType }))} className={`${inputClasses} mt-1`}>
                        {(Object.values(ChartType) as ChartType[]).filter(t => t !== ChartType.CONTROL).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>
        </SectionCard>
    );
};