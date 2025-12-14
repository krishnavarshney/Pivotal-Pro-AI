import React, { useEffect, useState } from 'react';
import { DataTable } from '../ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import * as adminService from '../../services/adminService';
import { notificationService } from '../../services/notificationService';
import { format } from 'date-fns';
import { FileText, Clock, User, Terminal, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const AdminAuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAuditLogs();
            setLogs(data);
        } catch (error) {
            notificationService.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        {
            header: 'Time / Actor',
            accessorKey: 'createdAt',
            cell: (info: any) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-sm font-medium">
                         <Clock size={12} className="text-muted-foreground"/>
                         {format(new Date(info.getValue()), 'MMM d, HH:mm')}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <User size={12} />
                        {info.row.original.admin?.name || 'System'}
                    </div>
                </div>
            ),
        },
        {
            header: 'Action',
            accessorKey: 'action',
            cell: (info: any) => (
                <Badge variant="outline" className="font-mono text-xs">
                    {info.getValue()}
                </Badge>
            )
        },
        {
            header: 'Resource',
            accessorKey: 'resource',
            cell: (info: any) => <span className="font-medium text-sm text-primary">{info.getValue()}</span>
        },
        {
            header: 'Details',
            accessorKey: 'afterJson',
            cell: (info: any) => {
                const val = info.getValue();
                if (!val || val === '{}') return <span className="text-muted-foreground">-</span>;
                try {
                    const parsed = JSON.parse(val);
                    const before = info.row.original.beforeJson ? JSON.parse(info.row.original.beforeJson) : null;
                    
                    return (
                        <div className="text-xs font-mono bg-muted/30 p-2 rounded max-w-[300px] overflow-hidden truncate">
                             {Object.entries(parsed).map(([k, v]) => (
                                <div key={k} className="flex gap-1">
                                    <span className="text-muted-foreground">{k}:</span>
                                    <span className="text-foreground">{String(v)}</span>
                                </div>
                             ))}
                        </div>
                    );
                } catch (e) {
                    return val;
                }
            }
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                     <h3 className="text-2xl font-bold tracking-tight">Audit Logs</h3>
                     <p className="text-muted-foreground">Track administrative actions and system events.</p>
                </div>
                <Button onClick={fetchLogs} variant="outline" size="sm">Refresh Logs</Button>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <DataTable
                        data={logs}
                        columns={columns}
                        loading={loading}
                    />
                </CardContent>
            </Card>
        </div>
    );
};
