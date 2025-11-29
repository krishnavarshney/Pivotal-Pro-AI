import { FC, useState } from 'react';
import { Database, Layers, ChevronDown, Check } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { useData } from '../../contexts/DataContext';
import { Popover } from '../ui/Popover';

export const DatasetSelector: FC = () => {
    const { activeDatasetId, setActiveDataset } = useDashboard();
    const { dataSources } = useData();
    const [open, setOpen] = useState(false);

    const sources = Array.from(dataSources.values());
    
    if (sources.length === 0) {
        return null;
    }

    const activeSource = activeDatasetId === 'blended' 
        ? null 
        : dataSources.get(activeDatasetId);
    
    const hasMultipleSources = sources.length > 1;
    
    const displayName = activeDatasetId === 'blended' 
        ? 'Blended Data' 
        : activeSource?.name || 'Select Dataset';

    const handleSelect = (id: string | 'blended') => {
        setActiveDataset(id);
        setOpen(false);
    };

    return (
        <Popover
            isOpen={open}
            onClose={() => setOpen(false)}
            trigger={
                <button 
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all group min-w-[180px]"
                >
                    {activeDatasetId === 'blended' ? (
                        <Layers size={16} className="text-primary flex-shrink-0" />
                    ) : (
                        <Database size={16} className="text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground truncate flex-1 text-left">
                        {displayName}
                    </span>
                    <ChevronDown 
                        size={14} 
                        className="text-muted-foreground transition-transform group-hover:scale-110 flex-shrink-0" 
                    />
                </button>
            }
            contentClassName="w-[280px] p-2"
            align="start"
        >
            <div className="space-y-1">
                {hasMultipleSources && (
                    <button
                        onClick={() => handleSelect('blended')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-left group"
                    >
                        <Layers size={16} className="text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground">Blended Data</div>
                            <div className="text-xs text-muted-foreground">{sources.length} sources combined</div>
                        </div>
                        {activeDatasetId === 'blended' && (
                            <Check size={16} className="text-primary flex-shrink-0" />
                        )}
                    </button>
                )}
                
                {hasMultipleSources && (
                    <div className="h-px bg-border my-2" />
                )}
                
                {sources.map((source) => (
                    <button
                        key={source.id}
                        onClick={() => handleSelect(source.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-left group"
                    >
                        <Database size={16} className="text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{source.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {source.data?.length?.toLocaleString() || 0} rows • {source.type === 'file' ? 'File' : 'API'}
                            </div>
                        </div>
                        {activeDatasetId === source.id && (
                            <Check size={16} className="text-primary flex-shrink-0" />
                        )}
                    </button>
                ))}
            </div>
        </Popover>
    );
};
