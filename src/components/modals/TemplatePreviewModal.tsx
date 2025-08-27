import React from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Template, ChartType, WidgetState } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../ui/utils';
import { CheckCircle, Clock, ChartBar, ChartLine, ChartLineUp, ChartPie, DotsNine, Table, GridFour, MapTrifold, Barricade, ChartBarHorizontal, Package, Funnel, ShareNetwork, CirclesFour, SlidersHorizontal, NumberSquareOne } from 'phosphor-react';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

const difficultyColors: Record<string, string> = {
    'Beginner': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Intermediate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Advanced': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const chartIcons: Record<string, React.ReactElement> = {
    [ChartType.BAR]: <ChartBar size={24} />,
    [ChartType.LINE]: <ChartLine size={24} />,
    [ChartType.AREA]: <ChartLineUp size={24} />,
    [ChartType.PIE]: <ChartPie size={24} />,
    [ChartType.SCATTER]: <DotsNine size={24} />,
    [ChartType.BUBBLE]: <CirclesFour size={24} />,
    [ChartType.TABLE]: <Table size={24} />,
    [ChartType.KPI]: <NumberSquareOne size={24} />,
    [ChartType.TREEMAP]: <GridFour size={24} />,
    [ChartType.MAP]: <MapTrifold size={24} />,
    [ChartType.DUAL_AXIS]: <ChartBarHorizontal size={24} />,
    [ChartType.HEATMAP]: <Barricade size={24} />,
    [ChartType.BOXPLOT]: <Package size={24} />,
    [ChartType.FUNNEL]: <Funnel size={24} />,
    [ChartType.CONTROL]: <SlidersHorizontal size={24} />,
    [ChartType.SANKEY]: <ShareNetwork size={24} />,
};


const TemplateLayoutPreview: React.FC<{ template: Template }> = ({ template }) => {
    const widgets = template.page.widgets || [];
    const layouts = template.page.layouts || {};

    if (widgets.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-muted-foreground">No preview available</div>;
    }

    return (
        <div className="w-full h-full bg-grid overflow-hidden rounded-md relative pointer-events-none">
            <ResponsiveGridLayout
                layouts={layouts}
                breakpoints={{ lg: 1200 }}
                cols={{ lg: 24 }}
                rowHeight={15}
                isDraggable={false}
                isResizable={false}
                isDroppable={false}
                compactType={null}
                preventCollision={true}
                margin={[8, 8]}
                className="opacity-70"
            >
                {(widgets as WidgetState[]).map(widget => (
                    <div key={widget.id} className="bg-card/60 rounded border border-border/50 flex flex-col items-center justify-center p-2 text-center">
                        <div className="text-primary opacity-80">
                            {chartIcons[widget.chartType] || <ChartBar size={24} />}
                        </div>
                        <p className="text-[10px] leading-tight text-muted-foreground mt-2 truncate max-w-full">{widget.title}</p>
                    </div>
                ))}
            </ResponsiveGridLayout>
        </div>
    );
};


export const TemplatePreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    template: Template | null;
}> = ({ isOpen, onClose, template }) => {
    const { addNewPage, openFieldMappingModal, setView } = useDashboard();

    if (!isOpen || !template) return null;

    const handleUseTemplate = () => {
        if (template.requiredFields && template.requiredFields.length > 0) {
            openFieldMappingModal(template, () => setView('templates'));
        } else {
            addNewPage(template.page);
        }
        onClose();
    };
    
    const MAX_WIDGETS_TO_SHOW = 4;
    const actualWidgets = template.page.widgets || [];
    const widgetsToShow = actualWidgets.slice(0, MAX_WIDGETS_TO_SHOW);
    const remainingWidgets = actualWidgets.length - widgetsToShow.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent containerClassName="w-[95%] max-w-5xl" className="h-[85vh] flex flex-col p-0">
                <header className="p-4 md:p-6 border-b border-border flex-shrink-0">
                    <h2 className="text-2xl font-bold font-display">{template.name}</h2>
                </header>
                <main className="flex-grow flex flex-col md:flex-row min-h-0">
                    <div className="md:w-2/3 p-4 md:p-6 bg-secondary/30 flex items-center justify-center h-80 md:h-auto flex-shrink-0">
                        <div className="w-full h-full bg-background p-2 rounded-lg border border-border shadow-inner">
                             <TemplateLayoutPreview template={template} />
                        </div>
                    </div>
                    <div className="md:w-1/3 p-4 md:p-6 flex flex-col gap-8 overflow-y-auto">
                        <div>
                            <h3 className="font-semibold text-foreground mb-3 text-lg">Included Widgets</h3>
                            <ul className="space-y-3">
                                {widgetsToShow.map((widget: any) => (
                                    <li key={widget.id} className="flex items-center gap-3 text-sm text-foreground">
                                        <CheckCircle size={18} weight="fill" className="text-green-500 flex-shrink-0" />
                                        <span>{widget.title}</span>
                                    </li>
                                ))}
                                {remainingWidgets > 0 && (
                                     <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <CheckCircle size={18} weight="fill" className="text-green-500/50 flex-shrink-0" />
                                        <span>+ {remainingWidgets} more</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                         <div className="pt-8 border-t border-border">
                            <h3 className="font-semibold text-foreground mb-3 text-lg">Template Details</h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Difficulty</span>
                                    <Badge className={cn(difficultyColors[template.difficulty || 'Beginner'])}>{template.difficulty || 'Beginner'}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Setup Time</span>
                                    <span className="font-semibold">{template.setupTime || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Downloads</span>
                                    <span className="font-semibold">{(template.downloads || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                 <footer className="p-4 md:p-6 border-t border-border flex-shrink-0 flex justify-end">
                    <Button size="lg" onClick={handleUseTemplate}>Use Template</Button>
                </footer>
            </DialogContent>
        </Dialog>
    );
};