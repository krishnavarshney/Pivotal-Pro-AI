import React, { useState, useEffect, useCallback, useMemo, FC, ReactNode } from 'react';
import { useDashboard } from '../contexts/DashboardProvider';
import { User } from '../utils/types';
import { ShieldCheck, User as UserIcon, Users, ChartBar, Gear, Trash, DotsThreeVertical, MagnifyingGlass, ArrowUp, ArrowDown } from 'phosphor-react';
import * as authService from '../services/authService';
import { Button } from '../components/ui/Button';
import { Popover } from '../components/ui/Popover';
import { inputClasses, cn } from '../components/ui/utils';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useAuth } from '../contexts/AuthProvider';
import * as echartsForReact from 'echarts-for-react';
import * as echarts from 'echarts';
import { ViewHeader } from '../components/common/ViewHeader';
import _ from 'lodash';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/Popover';

const ReactECharts = (echartsForReact as any).default;

const AnimatedCounter: FC<{ value: number }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = animate(displayValue, value, {
            duration: 1,
            ease: "easeOut",
            onUpdate(latest) {
                setDisplayValue(latest);
            }
        });
        return () => controls.stop();
    }, [value]);

    return <>{Math.round(displayValue).toLocaleString()}</>;
};

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trendValue: string;
  trendDirection: 'up' | 'down';
}

const StatCard: FC<StatCardProps> = ({ title, value, icon, trendValue, trendDirection }) => (
    <Card className="p-5">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="mt-2">
            <h3 className="text-3xl font-bold"><AnimatedCounter value={value} /></h3>
            <div className={`mt-1 text-xs flex items-center gap-1 ${trendDirection === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trendDirection === 'up' ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
                <span>{trendValue}</span>
                <span className="text-muted-foreground">from last period</span>
            </div>
        </div>
    </Card>
);

const UserSignupsChart: FC<{ users: User[] }> = ({ users }) => {
    const { themeConfig } = useDashboard();
    const chartData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        const labels = Array(30).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            counts[label] = 0;
            return label;
        }).reverse();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        users.forEach(user => {
            if (user.createdAt) {
                const createdAt = new Date(user.createdAt);
                if (createdAt >= thirtyDaysAgo) {
                    const label = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    if (counts[label] !== undefined) {
                        counts[label]++;
                    }
                }
            }
        });

        return { labels, data: Object.values(counts) };
    }, [users]);
    
    const options = {
        grid: { top: '10%', right: '3%', bottom: '15%', left: '5%', containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: { type: 'category', data: chartData.labels, axisLabel: { color: 'hsl(var(--muted-foreground))' }, axisTick: { show: false }, axisLine: { show: false } },
        yAxis: { type: 'value', axisLabel: { color: 'hsl(var(--muted-foreground))' }, splitLine: { lineStyle: { color: 'hsl(var(--border))' } } },
        series: [{ data: chartData.data, type: 'bar', barWidth: '60%', itemStyle: { color: 'hsl(var(--primary))', borderRadius: [4, 4, 0, 0] } }],
        textStyle: { fontFamily: 'Inter, sans-serif' },
    };

    return (
        <Card className="lg:col-span-2">
            <div className="p-4 border-b border-border"><h3 className="font-semibold">User Signups (Last 30 Days)</h3></div>
            <div className="p-4">
                <ReactECharts option={options} style={{ height: '300px', width: '100%' }} notMerge={true} lazyUpdate={true} theme={themeConfig.mode} />
            </div>
        </Card>
    );
};

const UsersByRoleChart: FC<{ users: User[] }> = ({ users }) => {
    const { themeConfig } = useDashboard();
    const roleData = useMemo(() => {
        const counts = _.countBy(users, 'role');
        return [
            { value: counts['ADMIN'] || 0, name: 'Admins' },
            { value: counts['USER'] || 0, name: 'Users' }
        ];
    }, [users]);
    
    const options = {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left', textStyle: { color: 'hsl(var(--muted-foreground))' } },
        series: [{
            name: 'User Roles', type: 'pie', radius: ['50%', '70%'], avoidLabelOverlap: false,
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
            labelLine: { show: false },
            data: roleData,
            color: ['hsl(var(--primary))', 'hsl(var(--secondary))']
        }],
        textStyle: { fontFamily: 'Inter, sans-serif' },
    };

    return (
        <Card>
            <div className="p-4 border-b border-border"><h3 className="font-semibold">Users by Role</h3></div>
            <div className="p-4">
                 <ReactECharts option={options} style={{ height: '300px', width: '100%' }} notMerge={true} lazyUpdate={true} theme={themeConfig.mode} />
            </div>
        </Card>
    );
};

function timeAgo(dateString: string): string {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
}

const RecentActivityList: FC<{ users: User[] }> = ({ users }) => {
    const recentUsers = useMemo(() => {
        return [...users]
            .sort((a, b) => new Date(b.lastLogin || 0).getTime() - new Date(a.lastLogin || 0).getTime())
            .slice(0, 5);
    }, [users]);

    return (
        <Card>
            <div className="p-4 border-b border-border"><h3 className="font-semibold">Recent Activity</h3></div>
            <div className="p-4 space-y-4">
                {recentUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                            {user.initials}
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">{timeAgo(user.lastLogin || '')}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
};


const UserManagementTable: FC<{
    users: User[];
    adminUser: User | null;
    onUpdate: () => void;
}> = ({ users, adminUser, onUpdate }) => {
    const { showToast, openConfirmationModal } = useDashboard();

    const handleRoleChange = async (userId: string, role: 'USER' | 'ADMIN') => {
        try {
            await authService.updateUser(userId, { role });
            showToast({ message: "User role updated.", type: 'success' });
            onUpdate();
        } catch (error) {
            showToast({ message: 'Failed to update role.', type: 'error' });
        }
    };

    const handleDeleteUser = (user: User) => {
        openConfirmationModal({
            title: `Delete user ${user.name}?`,
            message: `This action is irreversible and will permanently delete the user account for ${user.email}.`,
            onConfirm: async () => {
                try {
                    await authService.deleteUser(user.id);
                    showToast({ message: 'User deleted successfully.', type: 'success' });
                    onUpdate();
                } catch (error) {
                    showToast({ message: 'Failed to delete user.', type: 'error' });
                }
            }
        });
    };

    const columns = useMemo<ColumnDef<User>[]>(() => [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'role', header: 'Role' },
        { accessorKey: 'createdAt', header: 'Joined', cell: ({ row }) => new Date(row.original.createdAt || Date.now()).toLocaleDateString() },
        { accessorKey: 'lastLogin', header: 'Last Login', cell: ({ row }) => new Date(row.original.lastLogin || Date.now()).toLocaleString() },
        {
            id: 'actions',
            cell: ({ row }) => {
                const user = row.original;
                if (user.id === adminUser?.id) return null;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><DotsThreeVertical weight="bold" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'USER')}>Set as User</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'ADMIN')}>Set as Admin</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user)}>Delete User</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [adminUser]);

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full">
            <DataTable columns={columns} data={users} filterColumnId="name" filterColumnPlaceholder="Search by name..." />
        </div>
    );
};


export const AdminView: FC = () => {
    const { user: adminUser } = useAuth();
    const { showToast } = useDashboard();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
    const MotionDiv = motion.div as any;

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const userList = await authService.getUsers();
            setUsers(userList);
        } catch (error) {
            showToast({ message: 'Failed to fetch users.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const adminStats = useMemo(() => {
        const calculateTrend = (currentPeriodCount: number, previousPeriodCount: number): { value: string; direction: 'up' | 'down' } => {
            if (previousPeriodCount === 0) {
                 return { value: currentPeriodCount > 0 ? `+${(currentPeriodCount * 100).toFixed(0)}%` : '+0%', direction: 'up' };
            }
            const change = ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100;
            return {
                value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
                direction: change >= 0 ? 'up' : 'down'
            };
        };

        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

        const newSignupsThisPeriod = users.filter(u => u.createdAt && new Date(u.createdAt).getTime() >= thirtyDaysAgo).length;
        const newSignupsLastPeriod = users.filter(u => u.createdAt && new Date(u.createdAt).getTime() >= sixtyDaysAgo && new Date(u.createdAt).getTime() < thirtyDaysAgo).length;
        
        const activeUsersThisPeriod = users.filter(u => u.lastLogin && new Date(u.lastLogin).getTime() >= thirtyDaysAgo).length;
        const activeUsersLastPeriod = users.filter(u => u.lastLogin && new Date(u.lastLogin).getTime() >= sixtyDaysAgo && new Date(u.lastLogin).getTime() < thirtyDaysAgo).length;

        const totalUsersLastPeriod = users.filter(u => u.createdAt && new Date(u.createdAt).getTime() < thirtyDaysAgo).length;

        return {
            total: users.length,
            newSignups: newSignupsThisPeriod,
            activeUsers: activeUsersThisPeriod,
            totalAdmins: users.filter(u => u.role === 'ADMIN').length,
            signupTrend: calculateTrend(newSignupsThisPeriod, newSignupsLastPeriod),
            activeUsersTrend: calculateTrend(activeUsersThisPeriod, activeUsersLastPeriod),
            totalUsersTrend: calculateTrend(users.length, totalUsersLastPeriod)
        }
    }, [users]);
    
    const TabButton: FC<{ tab: typeof activeTab; icon: ReactNode; label: string; }> = ({ tab, icon, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                activeTab === tab ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
            )}
        >
            {icon} {label}
        </button>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'users':
                return <UserManagementTable users={users} adminUser={adminUser} onUpdate={fetchUsers} />;
            case 'settings':
                 return (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Application settings will be available here.</p>
                    </div>
                );
            case 'overview':
            default:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total Users" value={adminStats.total} icon={<Users size={24} />} trendValue={adminStats.totalUsersTrend.value} trendDirection={adminStats.totalUsersTrend.direction} />
                            <StatCard title="Active Users" value={adminStats.activeUsers} icon={<UserIcon size={24} />} trendValue={adminStats.activeUsersTrend.value} trendDirection={adminStats.activeUsersTrend.direction} />
                            <StatCard title="New Signups" value={adminStats.newSignups} icon={<UserIcon size={24} />} trendValue={adminStats.signupTrend.value} trendDirection={adminStats.signupTrend.direction} />
                            <StatCard title="Total Admins" value={adminStats.totalAdmins} icon={<ShieldCheck size={24} />} trendValue="+0" trendDirection="up" />
                        </div>
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <UserSignupsChart users={users} />
                            <div className="space-y-6 lg:col-span-1">
                                <UsersByRoleChart users={users} />
                                <RecentActivityList users={users} />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-full flex flex-col bg-background">
            <ViewHeader icon={<ShieldCheck size={24} />} title="Admin Dashboard" />
            <div className="flex-shrink-0 border-b border-border px-6">
                 <div className="flex items-center gap-2">
                    <TabButton tab="overview" icon={<ChartBar size={18} />} label="Overview" />
                    <TabButton tab="users" icon={<Users size={18} />} label="User Management" />
                    <TabButton tab="settings" icon={<Gear size={18} />} label="App Settings" />
                </div>
            </div>
            <main className="flex-grow p-6 overflow-y-auto bg-secondary/30">
                <AnimatePresence mode="wait">
                    <MotionDiv
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={activeTab === 'users' ? 'h-full' : ''}
                    >
                         {isLoading ? <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div> : renderContent()}
                    </MotionDiv>
                </AnimatePresence>
            </main>
        </div>
    );
};
