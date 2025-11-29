
import React, { FC, ReactNode } from 'react';
import { ChartType } from '../../utils/types';
import { BarChart, LineChart, AreaChart, PieChart, Table, Hash as KpiIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/Accordion';
import { DatasetSelector } from './DatasetSelector';

interface QuickAddCardProps {
    chartType: ChartType;
    icon: ReactNode;
    name: string;
}

const QuickAddCard: FC<QuickAddCardProps> = ({ chartType, icon, name }) => {
    const { openWidgetEditorForNewWidget } = useDashboard();
   
    return (
        <button
            onClick={() => openWidgetEditorForNewWidget(chartType)}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md cursor-pointer transition-all text-center"
        >
            <div className="text-primary">{icon}</div>
            <span className="text-xs mt-1 font-medium text-foreground">{name}</span>
        </button>
    );
};

const SectionHeader: FC<{ children: ReactNode }> = ({ children }) => (
    <h3 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-2 pt-4 pb-2">
        {children}
    </h3>
);

export const BuilderSidebar: FC = () => {
    const { openWidgetEditorForNewWidget, dataSources } = useDashboard();

    const quickAddWidgets = [
        { type: ChartType.BAR, icon: <BarChart size={20} />, name: 'Bar' },
        { type: ChartType.LINE, icon: <LineChart size={20} />, name: 'Line' },
        { type: ChartType.PIE, icon: <PieChart size={20} />, name: 'Pie' },
        { type: ChartType.AREA, icon: <AreaChart size={20} />, name: 'Area' },
        { type: ChartType.TABLE, icon: <Table size={20} />, name: 'Table' },
        { type: ChartType.KPI, icon: <KpiIcon size={20} />, name: 'Kpi' },
    ];
    
    const sources = Array.from(dataSources.values());

    return (
        <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute top-0 left-0 h-full w-[260px] bg-background/80 backdrop-blur-lg border-r border-border flex flex-col z-20"
        >
            <div className="p-4 border-b border-border flex-shrink-0">
                <h2 className="text-lg font-bold font-display text-foreground">Widget Library</h2>
            </div>
            <DatasetSelector />
            <div className="flex-grow p-4 overflow-y-auto">
                <Button size="lg" className="w-full mb-4" onClick={() => openWidgetEditorForNewWidget()}>
                    <Plus /> Create New Widget
                </Button>

                <SectionHeader>Quick Add Widgets</SectionHeader>
                <div className="grid grid-cols-3 gap-3">
                    {quickAddWidgets.map(item => (
                        <QuickAddCard key={item.type} chartType={item.type} icon={item.icon} name={item.name} />
                    ))}
                </div>

                <SectionHeader>Data Sources</SectionHeader>
                <Accordion type="multiple" className="w-full">
                    {sources.map(source => (
                         <AccordionItem key={source.id} value={source.id}>
                            <AccordionTrigger>{source.name}</AccordionTrigger>
                            <AccordionContent>
                                <p className="text-sm text-muted-foreground p-2">Drag fields from here in a future update.</p>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </motion.aside>
    );
};
