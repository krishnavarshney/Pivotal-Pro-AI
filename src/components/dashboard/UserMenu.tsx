import React, { FC, useState } from 'react';
import { Settings, ShieldCheck, LogOut } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { useAuth } from '../../contexts/AuthProvider';
import { Popover } from '../ui/Popover';

export const UserMenu: FC = () => {
    const { setView } = useDashboard();
    const { user, logout } = useAuth();
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);

    if (!user) return null;

    return (
        <Popover isOpen={isUserMenuOpen} onClose={() => setUserMenuOpen(false)} trigger={
            <button onClick={() => setUserMenuOpen(true)} className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm ring-2 ring-primary/50 hover:shadow-lg transition-shadow" aria-label={`Open user menu for ${user.name}`}>{user.initials}</button>
        } contentClassName="w-56 p-2" align="right">
            {({ close }) => (
                <div className="flex flex-col gap-1">
                    <div className="px-2 py-1 border-b border-border mb-1">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <button onClick={() => { setView('settings'); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><Settings size={16} /></span> Settings</button>
                    {user.role === 'ADMIN' && (
                        <button onClick={() => { setView('admin'); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><ShieldCheck size={16} /></span> Admin Dashboard</button>
                    )}
                    <div className="h-px bg-border my-1" />
                    <button onClick={() => { logout(); close(); }} className="w-full text-left flex items-center gap-2 p-2 rounded text-sm hover:bg-accent"><span className="icon-hover-anim"><LogOut size={16} /></span> Sign Out</button>
                </div>
            )}
        </Popover>
    );
};
