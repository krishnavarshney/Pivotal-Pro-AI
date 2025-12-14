import React from 'react';
import { Button } from '../ui/Button';
import { LayoutDashboard, Server, Users, FileText, Settings, ShieldAlert, ChevronRight } from 'lucide-react';
import { cn } from '../ui/utils';
import { motion } from 'framer-motion';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'providers', label: 'Model Providers', icon: <Server size={18} /> },
    { id: 'users', label: 'User Management', icon: <Users size={18} /> },
    { id: 'audit', label: 'Audit Logs', icon: <FileText size={18} /> },
    { id: 'settings', label: 'System Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="w-72 border-r border-border/40 bg-card/30 backdrop-blur-xl flex flex-col p-4 gap-2 h-full shadow-[5px_0_30px_-10px_rgba(0,0,0,0.1)] z-10">
      <div className="mb-8 px-4 mt-2">
        <h2 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          <ShieldAlert className="text-primary" />
          Admin Console
        </h2>
        <p className="text-xs text-muted-foreground mt-1 ml-8">System Control Center</p>
      </div>
      
      <div className="space-y-1">
        {navItems.map((item) => {
           const isActive = activeTab === item.id;
           return (
            <div key={item.id} className="relative group">
                {isActive && (
                    <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-primary/10 rounded-lg"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-between relative z-10 transition-all duration-200",
                        isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                    )}
                    onClick={() => setActiveTab(item.id)}
                >
                    <div className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                    </div>
                    {isActive && <ChevronRight size={14} className="opacity-50" />}
                </Button>
            </div>
           );
        })}
      </div>

      <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-primary">System Online</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
            Version 2.5.0-beta
        </div>
      </div>
    </div>
  );
};
