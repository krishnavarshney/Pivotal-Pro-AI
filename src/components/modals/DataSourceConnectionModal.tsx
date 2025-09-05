import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { inputClasses, cn } from '../ui/utils';
import { Label } from '../ui/Label';
import { Connector } from '../../utils/types';
import { Link, TestTube, RefreshCw } from 'lucide-react';
// FIX: Add aliasing for motion component to fix TypeScript errors.
import { motion, AnimatePresence } from 'framer-motion';
import * as apiService from '../../services/apiService';
import { notificationService } from '../../services/notificationService';

// FIX: Add aliasing for motion component to fix TypeScript errors.
const MotionDiv = motion.div as any;

const ConnectionField: React.FC<{ id: string; label: string; type?: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ id, label, type = 'text', placeholder, value, onChange }) => (
    <div>
        <Label htmlFor={id}>{label}</Label>
        <input
            id={id}
            name={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={cn(inputClasses, "mt-1")}
        />
    </div>
);

const renderFieldsForConnector = (connector: Connector, details: any, handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void) => {
    switch (connector.id) {
        case 'postgresql':
        case 'mysql':
            return (
                <>
                    <ConnectionField id="host" label="Host" placeholder="e.g., localhost" value={details.host || ''} onChange={handleChange} />
                    <ConnectionField id="port" label="Port" type="number" placeholder="e.g., 5432" value={details.port || ''} onChange={handleChange} />
                    <ConnectionField id="database" label="Database" placeholder="e.g., production_db" value={details.database || ''} onChange={handleChange} />
                    <ConnectionField id="username" label="Username" placeholder="e.g., admin" value={details.username || ''} onChange={handleChange} />
                    <ConnectionField id="password" label="Password" type="password" placeholder="••••••••" value={details.password || ''} onChange={handleChange} />
                </>
            );
        case 'rest_api':
            return (
                <>
                    <ConnectionField id="baseUrl" label="Base URL" placeholder="https://api.example.com/v1/users" value={details.baseUrl || ''} onChange={handleChange} />
                    <div>
                        <Label htmlFor="authMethod">Authentication Method</Label>
                        <select id="authMethod" name="authMethod" value={details.authMethod || 'none'} onChange={handleChange} className={cn(inputClasses, "mt-1")}>
                            <option value="none">None</option>
                            <option value="api_key">API Key in Header</option>
                            <option value="bearer">Bearer Token</option>
                        </select>
                    </div>
                    {details.authMethod === 'api_key' && (
                        <>
                            <ConnectionField id="apiHeader" label="Header Name" placeholder="e.g., X-API-KEY" value={details.apiHeader || ''} onChange={handleChange} />
                            <ConnectionField id="apiKey" label="API Key" type="password" placeholder="••••••••" value={details.apiKey || ''} onChange={handleChange} />
                        </>
                    )}
                    {details.authMethod === 'bearer' && (
                         <ConnectionField id="apiKey" label="Bearer Token" type="password" placeholder="••••••••" value={details.apiKey || ''} onChange={handleChange} />
                    )}
                </>
            );
        default:
            return <p className="text-muted-foreground">This connector type is not configured yet.</p>;
    }
};

export const DataSourceConnectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    connector: Connector | null;
}> = ({ isOpen, onClose, connector }) => {
    const { createDataSourceFromConnection } = useDashboard();
    const [details, setDetails] = useState<any>({});
    const [name, setName] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        if (connector) {
            setName(`${connector.name} Connection`);
            setDetails({});
            setTestResult(null);
        }
    }, [connector]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
        setTestResult(null);
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            await apiService.fetchDataFromApi(details, 1); // Fetch 1 record to test
            setTestResult('success');
            // FIX: Replaced direct `showToast` call with `notificationService` to decouple the component from the context provider implementation and fix the missing property error.
            notificationService.success('Connection test successful!');
        } catch (e) {
            setTestResult('error');
            notificationService.error(`Connection test failed: ${(e as Error).message}`);
        } finally {
            setIsTesting(false);
        }
    };

    const handleConnect = () => {
        if (!name.trim()) {
            notificationService.error('Please enter a connection name.');
            return;
        }
        if (connector) {
            createDataSourceFromConnection({ connector, details, name });
        }
    };
    
    if(!isOpen || !connector) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{connector.icon}</div>
                        Configure {connector.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <ConnectionField id="name" label="Connection Name" placeholder="e.g., My Production DB" value={name} onChange={(e) => setName(e.target.value)} />
                    <div className="pt-4 border-t border-border space-y-4">
                        {renderFieldsForConnector(connector, details, handleChange)}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                     <div className="flex-grow">
                        <AnimatePresence>
                            {testResult && (
                                <MotionDiv
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-sm font-semibold ${testResult === 'success' ? 'text-green-500' : 'text-red-500'}`}
                                >
                                    {testResult === 'success' ? 'Connection Successful!' : 'Connection Failed.'}
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                    </div>
                    <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                        {isTesting ? <RefreshCw size={16} className="animate-spin" /> : <TestTube size={16}/>}
                        {isTesting ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button onClick={handleConnect} disabled={testResult !== 'success'}>
                        <Link size={16}/> Connect
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};