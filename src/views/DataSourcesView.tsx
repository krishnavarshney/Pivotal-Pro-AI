import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import { useDashboard } from '../contexts/DashboardProvider';
import { ViewHeader } from '../components/common/ViewHeader';
import { Database, Plus, CheckCircle, Clock, AlertTriangle, RefreshCw, Cog, TestTube, Link, Cloud, File as FileIcon, HardDrive, Activity } from 'lucide-react';
import { Button, Card, Badge, cn, Tooltip } from '../components/ui';
import { DataSource } from '../utils/types';

function timeAgo(dateString: string | undefined): string {
    if (!dateString) return 'never';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (days > 365) return `${Math.floor(days / 365)}d ago`;
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
}

const sourceIcons: Record<NonNullable<DataSource['type']>, React.ReactNode> = {
    'database': <HardDrive size={24} />,
    'api': <Link size={24} />,
    'file': <FileIcon size={24} />,
    'cloud': <Cloud size={24} />,
};

const statusInfo: Record<NonNullable<DataSource['status']>, { icon: React.ReactNode, text: string, className: string }> = {
    'connected': { icon: <CheckCircle size={14} />, text: 'Connected', className: 'text-green-500' },
    'syncing': { icon: <RefreshCw size={14} className="animate-spin" />, text: 'Syncing', className: 'text-yellow-500' },
    'error': { icon: <AlertTriangle size={14} />, text: 'Error', className: 'text-red-500' },
};

const DataSourceCard: React.FC<{ dataSource: DataSource }> = ({ dataSource }) => {
    const { setView, showToast } = useDashboard();

    return (
        <Card className="flex flex-col group hover:border-primary/50 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="p-4 flex-grow">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            {sourceIcons[dataSource.type || 'file']}
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground truncate">{dataSource.name}</h3>
                            <Badge variant="secondary" className="mt-1 capitalize">{dataSource.type || 'file'}</Badge>
                        </div>
                    </div>
                    <Tooltip content="Refresh">
                        <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100" onClick={() => showToast({ type: 'info', message: `Refreshing ${dataSource.name}...` })}>
                            <RefreshCw size={16} />
                        </Button>
                    </Tooltip>
                </div>

                <p className="text-sm text-muted-foreground mt-3 h-10">{dataSource.description || 'No description provided.'}</p>
                
                <div className="mt-4 pt-4 border-t border-border/50 text-sm space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <div className={cn("flex items-center gap-1.5 font-semibold", statusInfo[dataSource.status || 'connected'].className)}>
                            {statusInfo[dataSource.status || 'connected'].icon}
                            <span>{statusInfo[dataSource.status || 'connected'].text}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Last Synced</span>
                        <span className="font-semibold">{timeAgo(dataSource.lastSync)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Records</span>
                        <span className="font-semibold">{dataSource.data.length.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div className="p-3 border-t border-border/50 bg-secondary/30 flex items-center gap-2">
                <Button variant="outline" className="w-full" onClick={() => setView('studio', { sourceId: dataSource.id })}><Cog size={16}/> Configure</Button>
                <Button variant="outline" className="w-full" onClick={() => showToast({type: 'success', message: `Connection test for ${dataSource.name} successful!`})}><TestTube size={16}/> Test</Button>
            </div>
        </Card>
    );
};

const ConnectionStatusCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    count: string;
    colorClass: string;
}> = ({ icon, title, count, colorClass }) => (
    <div className={cn("p-4 bg-card rounded-xl border flex items-start gap-4", colorClass)}>
        <div className="w-10 h-10 rounded-lg bg-current/10 flex items-center justify-center text-current">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{count}</p>
        </div>
    </div>
);

export const DataSourcesView: React.FC = () => {
    const { dataSources, openAddDataSourceModal } = useDashboard();
    const [activeTab, setActiveTab] = useState('dataSources');

    const sourcesArray = useMemo(() => Array.from(dataSources.values()), [dataSources]);
    
    const stats = useMemo(() => {
        const connected = sourcesArray.filter(s => s.status === 'connected').length;
        const syncing = sourcesArray.filter(s => s.status === 'syncing').length;
        const error = sourcesArray.filter(s => s.status === 'error').length;
        const totalRecords = _.sumBy(sourcesArray, s => s.data.length);
        return { connected, syncing, error, totalRecords };
    }, [sourcesArray]);
    
    const handleAddSource = () => {
        openAddDataSourceModal();
    };

    const TabButton: React.FC<{ tabId: string, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={cn(
                "px-4 py-2 text-sm font-semibold border-b-2",
                activeTab === tabId
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
        >
            {children}
        </button>
    );

    return (
        <div className="h-full flex flex-col bg-background">
            <ViewHeader icon={<Database size={24} />} title="Data Sources" showBackToDashboard={false}>
                <p className="text-muted-foreground hidden lg:block">Manage and monitor your data connections</p>
                <div className="flex-grow"></div>
                <Button variant="outline" onClick={handleAddSource}><FileIcon size={16}/> Import Data</Button>
                <Button onClick={handleAddSource}><Plus size={16}/> Add Source</Button>
            </ViewHeader>

            <div className="flex-shrink-0 border-b border-border px-6">
                <div className="flex items-center">
                    <TabButton tabId="dataSources">Data Sources</TabButton>
                    <TabButton tabId="importHistory">Import History</TabButton>
                    <TabButton tabId="connections">Connections</TabButton>
                </div>
            </div>

            <main className="flex-grow p-6 overflow-y-auto bg-secondary/30 space-y-8">
                {activeTab === 'dataSources' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <ConnectionStatusCard icon={<CheckCircle size={20} />} title="Connected" count={stats.connected.toString()} colorClass="border-green-500/30 text-green-500" />
                            <ConnectionStatusCard icon={<RefreshCw size={20} />} title="Syncing" count={stats.syncing.toString()} colorClass="border-yellow-500/30 text-yellow-500" />
                            <ConnectionStatusCard icon={<AlertTriangle size={20} />} title="Error" count={stats.error.toString()} colorClass="border-red-500/30 text-red-500" />
                            <ConnectionStatusCard icon={<HardDrive size={20} />} title="Total Records" count={`${(stats.totalRecords / 1000).toFixed(0)}K`} colorClass="border-border text-foreground" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sourcesArray.map(source => (
                                <DataSourceCard key={source.id} dataSource={source} />
                            ))}
                        </div>
                    </>
                )}
                {activeTab !== 'dataSources' && (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                        <div>
                             <Activity size={48} className="mx-auto mb-4 opacity-50"/>
                            <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
                            <p>This section is under construction.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};