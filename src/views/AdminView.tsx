import React, { useState, useEffect, useCallback, useMemo, FC, ReactNode } from 'react';
import { useDashboard } from '../contexts/DashboardProvider';
import { notificationService } from '../services/notificationService';
import { User } from '../utils/types';
import { ShieldCheck, User as UserIcon, Users, BarChart, Settings, Trash2, MoreVertical, Search, ArrowUp, ArrowDown } from 'lucide-react';
import * as authService from '../services/authService';
import { Button } from '../components/ui/Button';
import { inputClasses, cn } from '../components/ui/utils';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useAuth } from '../contexts/AuthProvider';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { ViewHeader } from '../components/common/ViewHeader';
import _ from 'lodash';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/Popover';

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
    }, [value, displayValue]);

    return <>{Math.round(displayValue).toLocaleString()}</>;
};

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trendValue: string;
  trendDirection: 'up' | 'down' | 'stable';
}

const StatCard: FC<StatCardProps> = ({ title, value, icon, trendValue, trendDirection }) => {
    const trendColor = trendDirection === 'up' ? 'text-green-500' : trendDirection === 'down' ? 'text-red-500' : 'text-muted-foreground';
    const trendIcon = trendDirection === 'up' ? <ArrowUp size={12} strokeWidth={3} /> : trendDirection === 'down' ? <ArrowDown size={12} strokeWidth={3} /> : null;
    return (
    <Card className="p-5">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="mt-2">
            <h3 className="text-3xl font-bold"><AnimatedCounter value={value} /></h3>
            <div className={cn("mt-1 text-xs flex items-center gap-1", trendColor)}>
                {trendIcon}
                <span>{trendValue}</span>
                {trendDirection !== 'stable' && <span className="text-muted-foreground">from last period</span>}
            </div>
        </div>
    </Card>
)};

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
                <ReactECharts echarts={echarts} option={options} style={{ height: '300px', width: '100%' }} notMerge={true} lazyUpdate={true} theme={themeConfig.mode} />
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
                <ReactECharts echarts={echarts} option={options} style={{ height: '300px', width: '100%' }} notMerge={true} lazyUpdate={true} theme={themeConfig.mode} />
            </div>
        </Card>
    );
};


export const AdminView: FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { openConfirmationModal } = useDashboard();

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await authService.getUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            notificationService.error("Failed to load users.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const stats = useMemo(() => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newUsersLastWeek = users.filter(u => u.createdAt && new Date(u.createdAt) > oneWeekAgo).length;
        const activeUsersLastWeek = users.filter(u => u.lastLogin && new Date(u.lastLogin) > oneWeekAgo).length;

        const newUsersTrend: 'up' | 'down' = newUsersLastWeek > 5 ? 'up' : 'down'; // dummy trend logic

        return {
            totalUsers: users.length,
            adminCount: users.filter(u => u.role === 'ADMIN').length,
            newUsersTrend,
            newUsersTrendValue: `${newUsersLastWeek} new`,
            activeUsers: activeUsersLastWeek,
        };
    }, [users]);

    const handleDeleteUser = useCallback(async (userId: string) => {
        openConfirmationModal({
            title: "Delete User?",
            message: "Are you sure you want to permanently delete this user account?",
            onConfirm: async () => {
                if (user?.id === userId) {
                    notificationService.error("You cannot delete your own account.");
                    return;
                }
                try {
                    await authService.deleteUser(userId);
                    notificationService.success("User deleted successfully.");
                    fetchUsers();
                } catch (error) {
                    notificationService.error("Failed to delete user.");
                }
            }
        });
    }, [fetchUsers, user, openConfirmationModal]);
    
    const handleUpdateUserRole = useCallback(async (userId: string, role: 'USER' | 'ADMIN') => {
        if (user?.id === userId) {
            notificationService.error("You cannot change your own role.");
            return;
        }
        try {
            await authService.updateUser(userId, { role });
            notificationService.success("User role updated.");
            fetchUsers();
        } catch (error) {
            notificationService.error("Failed to update user role.");
        }
    }, [fetchUsers, user]);

    const UserActions: FC<{ user: User }> = ({ user }) => {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}>
                        {user.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                        Delete User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    };
    
    const columns = useMemo<ColumnDef<User>[]>(() => [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Name {column.getIsSorted() === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold flex items-center justify-center text-xs">{row.original.initials}</div>
                    <div>
                        <div className="font-medium">{row.original.name}</div>
                        <div className="text-xs text-muted-foreground">{row.original.email}</div>
                    </div>
                </div>
            )
        },
        { accessorKey: "role", header: "Role" },
        { 
            accessorKey: "createdAt", 
            header: "Signed Up",
            cell: ({ row }) => new Date(row.original.createdAt || Date.now()).toLocaleDateString()
        },
        { 
            accessorKey: "lastLogin", 
            header: "Last Login",
            cell: ({ row }) => new Date(row.original.lastLogin || Date.now()).toLocaleDateString()
        },
        {
            id: "actions",
            cell: ({ row }) => <UserActions user={row.original} />,
        },
    ], [handleDeleteUser, handleUpdateUserRole]);

    return (
        <div className="h-full bg-background flex flex-col">
            <ViewHeader icon={<ShieldCheck size={24} />} title="Admin Dashboard" showBackToDashboard={true} />

            <main className="flex-grow p-6 overflow-y-auto bg-secondary/30 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={24}/>} trendValue={stats.newUsersTrendValue} trendDirection={stats.newUsersTrend} />
                    <StatCard title="Admins" value={stats.adminCount} icon={<ShieldCheck size={24}/>} trendValue="+1" trendDirection="up" />
                    <StatCard title="Active Users (7d)" value={stats.activeUsers} icon={<BarChart size={24}/>} trendValue="-5%" trendDirection="down" />
                    <StatCard title="System Settings" value={4} icon={<Settings size={24}/>} trendValue="stable" trendDirection="stable" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <UserSignupsChart users={users} />
                    <UsersByRoleChart users={users} />
                </div>
                
                <Card className="flex flex-col overflow-hidden">
                     <DataTable columns={columns} data={users} filterColumnId="name" filterColumnPlaceholder="Filter by name or email..."/>
                </Card>
            </main>
        </div>
    );
};