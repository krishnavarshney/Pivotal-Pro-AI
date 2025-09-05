import React, { useMemo, useState, FC, ReactNode } from 'react';
import _ from 'lodash';
import { useDashboard } from '../contexts/DashboardProvider';
import { ViewHeader } from '../components/common/ViewHeader';
import { Database, Plus, CheckCircle, XCircle, AlertTriangle, RefreshCw, MoreVertical, Search, FileSpreadsheet, Link as LinkIcon, Cloud, Server } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn, inputClasses } from '../components/ui/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/Popover';
import { DataSource } from '../utils/types';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: number;
    colorClass: string;
}> = ({ icon, title, value, colorClass }) => (
    <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-current", colorClass, "bg-current/10")}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
    </div>
);

const statusInfo: Record<DataSource['status'], { text: string, className: string }> = {
    'connected': { text: 'Connected', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 ring-green-500/30' },
    'disconnected': { text: 'Disconnected', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-red-500/30' },
    'pending': { text: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 ring-yellow-500/30' },
    'syncing': { text: 'Syncing', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-blue-500/30' },
    'error': { text: 'Error', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-red-500/30' },
};

const sourceIcons: Record<NonNullable<DataSource['icon']>, React.ReactNode> = {
    'database': <Database size={20} />,
    'file-spreadsheet': <FileSpreadsheet size={20} />,
    'cloud': <Cloud size={20} />,
    'api': <LinkIcon size={20} />,
};

const DataSourceCard: FC<{ source: DataSource, isHighlighted: boolean }> = ({ source, isHighlighted }) => {
    const status = statusInfo[source.status];
    const { setView } = useDashboard();

    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "bg-card rounded-xl border border-border shadow-sm flex flex-col transition-all duration-300",
                isHighlighted && "ring-2 ring-primary shadow-lg"
            )}
        >
            <header className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary flex-shrink-0">
                    {sourceIcons[source.icon || 'database']}
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-foreground">{source.name}</h3>
                    <p className="text-sm text-muted-foreground">{source.technology}</p>
                </div>
                <Badge className={cn("ring-1", status.className)}>{status.text}</Badge>
            </header>
            <div className="px-4 pb-4 space-y-4">
                <p className="text-sm text-muted-foreground text-pretty h-10">{source.description}</p>
                <div>
                    <div className="flex justify-between items-center text-xs font-medium text-muted-foreground mb-1">
                        <span>Health</span>
                        <span>{source.health || 0}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{width: `${source.health || 0}%`}} />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm pt-2 border-t border-border">
                    <div><p className="font-bold text-foreground">{source.size || 0} GB</p><p className="text-xs text-muted-foreground">Size</p></div>
                    <div><p className="font-bold text-foreground">{source.tables || 0}</p><p className="text-xs text-muted-foreground">Tables</p></div>
                    <div><p className="font-bold text-foreground">{source.queryTime || 0}ms</p><p className="text-xs text-muted-foreground">Query Time</p></div>
                </div>
            </div>
            <footer className="p-4 border-t border-border mt-auto flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Last sync: {source.lastSync ? new Date(source.lastSync).toLocaleString([], { dateStyle: 'short', timeStyle: 'short'}) : 'Never'}
                </p>
                <div className="flex items-center gap-1">
                    <Button variant={source.status === 'connected' ? 'destructive' : 'default'} size="sm">
                        {source.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('studio', {sourceId: source.id})}><MoreVertical size={16} /></Button>
                </div>
            </footer>
        </MotionDiv>
    );
};

export const DataSourcesView: React.FC = () => {
    const { dataSources, openAddDataSourceModal, runHealthCheck } = useDashboard();
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    
    const sourcesArray = useMemo(() => Array.from(dataSources.values()), [dataSources]);

    const filteredSources = useMemo(() => {
        return sourcesArray.filter(source => {
            const filterMatch = activeFilter === 'All' || source.status === activeFilter.toLowerCase();
            const searchMatch = source.name.toLowerCase().includes(searchTerm.toLowerCase()) 
                || (source.description && source.description.toLowerCase().includes(searchTerm.toLowerCase()))
                || (source.technology && source.technology.toLowerCase().includes(searchTerm.toLowerCase()));
            return filterMatch && searchMatch;
        });
    }, [sourcesArray, activeFilter, searchTerm]);

    const stats = useMemo(() => {
        return {
            total: sourcesArray.length,
            connected: sourcesArray.filter(s => s.status === 'connected').length,
            disconnected: sourcesArray.filter(s => s.status === 'disconnected').length,
            pending: sourcesArray.filter(s => s.status === 'pending').length,
        };
    }, [sourcesArray]);

    const filterTabs = ['All', 'Connected', 'Disconnected', 'Pending'];

    return (
        <div className="h-full flex flex-col bg-background">
            <ViewHeader icon={<Server size={24} />} title="Data Sources" showBackToDashboard={true} />
            <main className="flex-grow p-6 overflow-y-auto bg-secondary/30 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<Database size={24} />} title="Total Sources" value={stats.total} colorClass="text-indigo-500" />
                    <StatCard icon={<CheckCircle size={24} />} title="Connected" value={stats.connected} colorClass="text-green-500" />
                    <StatCard icon={<XCircle size={24} />} title="Disconnected" value={stats.disconnected} colorClass="text-red-500" />
                    <StatCard icon={<AlertTriangle size={24} />} title="Pending" value={stats.pending} colorClass="text-yellow-500" />
                </div>

                <div className="bg-card p-3 rounded-xl border border-border space-y-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="relative flex-grow max-w-xs">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                            <input type="text" placeholder="Search data sources..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={cn(inputClasses, 'pl-9 h-10')} />
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
                            {filterTabs.map(tab => (
                                <button key={tab} onClick={() => setActiveFilter(tab)} className={cn('px-3 py-1.5 text-sm font-semibold rounded-md transition-colors', activeFilter === tab ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                             <Button variant="secondary" onClick={runHealthCheck}><RefreshCw size={16} /> Health Check</Button>
                             <Button onClick={openAddDataSourceModal}><Plus size={16} /> Add Data Source</Button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSources.map(source => (
                            <DataSourceCard key={source.id} source={source} isHighlighted={source.name.includes("Financial Reports")} />
                        ))}
                    </div>
                </AnimatePresence>
                {filteredSources.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <p>No data sources match your criteria.</p>
                    </div>
                )}
            </main>
        </div>
    );
};
