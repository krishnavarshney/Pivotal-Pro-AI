import React, { FC, ReactNode } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Database, Funnel, GitBranch, PuzzlePiece, ShareNetwork, Table } from 'phosphor-react';
import { WidgetState, Transformation, FilterCondition } from '../../utils/types';

const LineageNode: FC<{ icon: ReactNode; title: string; children: ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-3 border-b flex items-center gap-3 bg-secondary/50 rounded-t-lg">
            <span className="text-primary">{icon}</span>
            <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <div className="p-4 text-sm space-y-2">
            {children}
        </div>
    </div>
);

const LineageConnector: FC = () => (
    <div className="h-8 w-px bg-border mx-auto my-2"></div>
);

export const DataLineageModal: FC = () => {
    const {
        dataLineageModalState,
        closeDataLineageModal,
        activePage,
        dataSources,
        getTransformationsForSource,
        relationships,
        globalFilters,
        crossFilter
    } = useDashboard();

    const { isOpen, widgetId } = dataLineageModalState;
    if (!isOpen || !widgetId || !activePage) return null;

    const widget = activePage.widgets.find(w => w.id === widgetId);
    if (!widget) return null;

    const getSourceNamesFromWidget = (w: WidgetState): string[] => {
        const fieldNames = _.flatMap(Object.values(w.shelves), shelf => (shelf || []).map(pill => pill.name));
        const sourceNames = _.uniq(fieldNames.map(name => name.split('.')[0]));
        return sourceNames;
    };

    const sourceNames = getSourceNamesFromWidget(widget);
    const widgetSources = sourceNames.map(name => [...dataSources.values()].find(ds => ds.name === name)).filter(Boolean);
    const widgetSourceIds = widgetSources.map(ds => ds?.id).filter(Boolean) as string[];

    const formatFilterValue = (values: any[]) => {
        if (values.length > 2) return `${values.length} values`;
        return values.join(', ');
    };
    
    const relevantTransforms = widgetSourceIds.flatMap(id => getTransformationsForSource(id));
    const relevantRelationships = relationships.filter(rel => widgetSourceIds.includes(rel.sourceAId) || widgetSourceIds.includes(rel.sourceBId));
    const allFilters = [...globalFilters, ...(crossFilter ? [crossFilter.filter] : []), ...(widget.shelves.filters || [])];

    return (
        <Dialog open={isOpen} onOpenChange={closeDataLineageModal}>
            <DialogOverlay />
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShareNetwork size={20} /> Data Lineage: {widget.title}
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    
                    <LineageNode icon={<Database size={20} />} title="Data Sources">
                        {widgetSources.length > 0 ? widgetSources.map(ds => ds && (
                            <p key={ds.id}><Badge variant="secondary">{ds.name}</Badge></p>
                        )) : <p className="text-muted-foreground">No direct data sources found.</p>}
                    </LineageNode>
                    <LineageConnector />

                    <LineageNode icon={<PuzzlePiece size={20} />} title="Transformations">
                        {relevantTransforms.length > 0 ? relevantTransforms.map((t: Transformation) => (
                            <p key={t.id}><Badge>{t.type}</Badge></p>
                        )) : <p className="text-muted-foreground">No transformations applied.</p>}
                    </LineageNode>
                    <LineageConnector />
                    
                    <LineageNode icon={<GitBranch size={20} />} title="Joins / Relationships">
                        {relevantRelationships.length > 0 ? relevantRelationships.map(rel => (
                            <p key={rel.id}>
                                <Badge variant="secondary">{dataSources.get(rel.sourceAId)?.name}</Badge>
                                <span className="mx-2 font-mono text-xs">{rel.type}</span>
                                <Badge variant="secondary">{dataSources.get(rel.sourceBId)?.name}</Badge>
                            </p>
                        )) : <p className="text-muted-foreground">No relationships defined.</p>}
                    </LineageNode>
                    <LineageConnector />

                    <LineageNode icon={<Funnel size={20} />} title="Filters Applied">
                        {globalFilters.map(f => <p key={f.id}><Badge>Global:</Badge> {f.simpleName} {f.filter?.condition} {formatFilterValue(f.filter?.values || [])}</p>)}
                        {crossFilter && <p><Badge>Cross-Filter:</Badge> {crossFilter.filter.simpleName} {crossFilter.filter.filter?.condition} {formatFilterValue(crossFilter.filter.filter?.values || [])}</p>}
                        {(widget.shelves.filters || []).map(f => <p key={f.id}><Badge>Local:</Badge> {f.simpleName} {f.filter?.condition} {formatFilterValue(f.filter?.values || [])}</p>)}
                        {allFilters.length === 0 && <p className="text-muted-foreground">No filters applied.</p>}
                    </LineageNode>
                    <LineageConnector />
                    
                     <LineageNode icon={<Table size={20} />} title="Final Widget">
                        <p><Badge variant="outline">{widget.title}</Badge></p>
                        <p className="text-muted-foreground">Type: {widget.chartType}</p>
                    </LineageNode>
                </div>
            </DialogContent>
        </Dialog>
    );
};
