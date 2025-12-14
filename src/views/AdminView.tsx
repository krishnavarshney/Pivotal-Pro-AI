import React, { useState } from 'react';
import { ViewHeader } from '../components/common/ViewHeader';
import { ShieldCheck } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminProviders } from '../components/admin/AdminProviders';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminAuditLogs } from '../components/admin/AdminAuditLogs';
import { AdminSettings } from '../components/admin/AdminSettings';

export const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <AdminOverview />;
            case 'providers': return <AdminProviders />;
            case 'users': return <AdminUsers />;
            case 'audit': return <AdminAuditLogs />;
            case 'settings': return <AdminSettings />;
            default: return <div className="p-8 text-center text-muted-foreground">This module is under construction.</div>;
        }
    };

    return (
        <div className="h-full bg-background flex flex-col">
            <ViewHeader icon={<ShieldCheck size={24} />} title="Admin Dashboard" showBackToDashboard={true} />
            <div className="flex flex-grow overflow-hidden">
                <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="flex-grow p-6 overflow-y-auto bg-secondary/30">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};