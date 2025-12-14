import React, { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { Users, Server, DollarSign, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import * as adminService from '../../services/adminService';
import { notificationService } from '../../services/notificationService';
import { UsageCharts } from './UsageCharts';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { motion } from 'framer-motion';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [overviewData, usageStats] = await Promise.all([
            adminService.getOverview(),
            adminService.getUsageStats('month')
        ]);
        setStats(overviewData);
        setUsageData(usageStats);
      } catch (error) {
        notificationService.error("Failed to load overview stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
      <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
  );
  
  if (!stats) return <div className="p-4 text-destructive">Failed to load data</div>;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item}>
            <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={24} />} trendDirection="up" trendValue="+12% this month" />
        </motion.div>
        <motion.div variants={item}>
            <StatCard title="Active Providers" value={stats.activeProviders} icon={<Server size={24} />} trendDirection="stable" trendValue="Optimal" />
        </motion.div>
        <motion.div variants={item}>
            <StatCard title="Tokens Today" value={stats.tokensToday.toLocaleString()} icon={<Zap size={24} />} trendDirection="up" trendValue={stats.costToday ? `$${stats.costToday.toFixed(2)}` : 'Low Cost'} />
        </motion.div>
        <motion.div variants={item}>
            <StatCard title="System Status" value={stats.errorCount > 0 ? 'Warning' : 'Healthy'} icon={<AlertCircle size={24} />} trendDirection={stats.errorCount > 0 ? 'down' : 'up'} trendValue={stats.errorCount > 0 ? `${stats.errorCount} Errors` : '100% Uptime'} />
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
             <UsageCharts data={usageData} />
        </motion.div>
        <motion.div variants={item} className="h-full">
            <SystemHealthMonitor />
        </motion.div>
      </div>
    </motion.div>
  );
};
