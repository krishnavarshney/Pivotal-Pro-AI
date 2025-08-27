import React, { useState, useMemo } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '../ui/Dialog';
import { inputClasses, cn } from '../ui/utils';
import { Badge } from '../ui/Badge';
import { Connector } from '../../utils/types';
import { FileText, Database, Link, Code, Search, FileSpreadsheet, File, Cloud } from 'lucide-react';

const CONNECTORS: Connector[] = [
    { id: 'csv', name: 'CSV File', category: 'File', icon: <FileText size={24} />, description: 'Upload a comma-separated values file.' },
    { id: 'excel', name: 'Excel File', category: 'File', icon: <FileSpreadsheet size={24} />, description: 'Upload an XLSX or XLS file.' },
    { id: 'parquet', name: 'Parquet File', category: 'File', icon: <File size={24} />, description: 'Upload an Apache Parquet file.' },
    { id: 'postgresql', name: 'PostgreSQL', category: 'Database', icon: <Database size={24} />, description: 'Connect to a PostgreSQL database.' },
    { id: 'mysql', name: 'MySQL', category: 'Database', icon: <Database size={24} />, description: 'Connect to a MySQL database.' },
    { id: 'rest_api', name: 'REST API', category: 'Application', icon: <Link size={24} />, description: 'Connect to a custom REST API.' },
    { id: 'salesforce', name: 'Salesforce', category: 'Application', icon: <Cloud size={24} />, description: 'Pull data from your Salesforce org.' },
    { id: 'google_analytics', name: 'Google Analytics', category: 'Application', icon: <Code size={24} />, description: 'Connect to Google Analytics 4.' },
];

const ConnectorCard: React.FC<{ connector: Connector; onSelect: () => void; }> = ({ connector, onSelect }) => (
    <button
        onClick={onSelect}
        className="group relative flex flex-col items-start text-left w-full p-4 bg-card rounded-xl border border-border shadow-sm transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1"
    >
        <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary/20">
                {connector.icon}
            </div>
            <div>
                 <h3 className="font-bold text-foreground">{connector.name}</h3>
                 <Badge variant="secondary" className="mt-1">{connector.category}</Badge>
            </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3 flex-grow">{connector.description}</p>
    </button>
);


export const AddDataSourceModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { openDataSourceConnectionModal, importInputRef } = useDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', ..._.uniq(CONNECTORS.map(c => c.category))];

    const filteredConnectors = useMemo(() => {
        return CONNECTORS.filter(connector => {
            const categoryMatch = selectedCategory === 'All' || connector.category === selectedCategory;
            const searchMatch = connector.name.toLowerCase().includes(searchTerm.toLowerCase()) || connector.description.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [searchTerm, selectedCategory]);

    const handleSelect = (connector: Connector) => {
        if (connector.category === 'File') {
            importInputRef.current?.click();
            onClose();
        } else {
            openDataSourceConnectionModal(connector);
            onClose();
        }
    };
    
    if(!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent containerClassName="w-[95%] max-w-4xl" className="max-h-[85vh] flex flex-col p-0">
                <DialogHeader>
                    <DialogTitle>Add a New Data Source</DialogTitle>
                </DialogHeader>

                 <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-72">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                        <input type="text" placeholder="Search connectors..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={cn(inputClasses, 'pl-9 h-10')} />
                    </div>
                    <div className="flex-grow flex items-center gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn('px-3 py-1.5 text-sm font-semibold rounded-full border-2', selectedCategory === cat ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary border-transparent hover:border-border')}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <main className="flex-grow p-6 overflow-y-auto bg-secondary/30">
                     {filteredConnectors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredConnectors.map(connector => (
                                <ConnectorCard key={connector.id} connector={connector} onSelect={() => handleSelect(connector)} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <Search size={48} className="mb-4 opacity-50"/>
                            <h3 className="font-semibold text-lg text-foreground">No Connectors Found</h3>
                            <p>Your search for "{searchTerm}" did not match any connectors.</p>
                        </div>
                    )}
                </main>
            </DialogContent>
        </Dialog>
    );
};