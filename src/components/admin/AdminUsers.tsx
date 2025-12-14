import React, { useEffect, useState } from 'react';
import { DataTable } from '../ui/DataTable';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import * as adminService from '../../services/adminService';
import { notificationService } from '../../services/notificationService';
import { ColumnDef } from '@tanstack/react-table';
import { User as UserIcon, MoreVertical, Ban, Shield, Trash2, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/Popover';
import { User } from '../../utils/types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminService.getUsers(0, 100, searchTerm);
            setUsers(data.users);
        } catch (error) {
            notificationService.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(fetchUsers, 500);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleSuspend = async (id: string) => {
        try {
            await adminService.suspendUser(id);
            notificationService.success("User suspended successfully");
            fetchUsers(); // Refresh to potentially show status change if supported
        } catch (error) {
            notificationService.error("Failed to suspend user");
        }
    };

    const filteredUsers = users.filter(user => {
        if (roleFilter === 'ALL') return true;
        return user.role === roleFilter;
    });

    const columns: ColumnDef<User>[] = [
        { 
            accessorKey: 'name', 
            header: 'User Details',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {row.original.initials || row.original.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="font-semibold text-foreground">{row.original.name}</div>
                        <div className="text-xs text-muted-foreground">{row.original.email}</div>
                    </div>
                </div>
            )
        },
        { 
            accessorKey: 'role', 
            header: 'Role',
            cell: ({ row }) => (
                <div className="flex items-center">
                    {row.original.role === 'ADMIN' ? (
                        <Badge variant="default" className="bg-primary/20 text-primary border-primary/50 hover:bg-primary/30">
                            <Shield size={12} className="mr-1" /> Admin
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                            <UserIcon size={12} className="mr-1" /> User
                        </Badge>
                    )}
                </div>
            )
        },
        { 
            accessorKey: 'createdAt', 
            header: 'Joined Date',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground font-mono">
                    {new Date(row.original.createdAt || Date.now()).toLocaleDateString()}
                </span>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={() => handleSuspend(row.original.id)} className="text-destructive focus:text-destructive">
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend Account
                            </DropdownMenuItem>
                             <DropdownMenuItem className="text-muted-foreground">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Data
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">User Management</h3>
                    <p className="text-muted-foreground">Manage system access and roles.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:w-[300px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input 
                            placeholder="Search users..." 
                            className="pl-9 bg-background/50 border-input/50 focus:bg-background transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant={roleFilter === 'ADMIN' ? 'default' : 'outline'} size="icon" onClick={() => setRoleFilter(roleFilter === 'ADMIN' ? 'ALL' : 'ADMIN')} title="Filter Admins">
                         <Shield size={16} />
                    </Button>
                </div>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="p-1">
                    <DataTable columns={columns} data={filteredUsers} loading={loading} />
                </div>
            </Card>
        </div>
    );
};
