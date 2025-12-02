import React, { FC, useState } from 'react';
import { User, Mail, Briefcase, Building, Camera, Shield, Bell, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { Badge } from '../../components/ui/Badge';
import { notificationService } from '../../services/notificationService';
import { cn, inputClasses } from '../../components/ui/utils';

export const ProfileSettings: FC = () => {
   const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [jobTitle, setJobTitle] = useState('Senior Analyst');
    const [department, setDepartment] = useState('Business Intelligence');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);

    // Dropdown options
    const jobTitleOptions = [
        'Data Analyst',
        'Senior Analyst',
        'Business Analyst',
        'Data Scientist',
        'BI Developer',
        'Analytics Manager',
        'Director of Analytics',
        'Chief Data Officer',
        'Consultant',
        'Other'
    ];

    const departmentOptions = [
        'Business Intelligence',
        'Data Analytics',
        'IT / Technology',
        'Finance',
        'Marketing',
        'Sales',
        'Operations',
        'Human Resources',
        'Strategy',
        'Other'
    ];

    const handleSave = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        notificationService.success("Profile updated successfully.");
    };

    const handleAvatarChange = () => {
        notificationService.info("Avatar upload functionality coming soon.");
    };

    const handleChangePassword = () => {
        notificationService.info("Password reset link sent to your email.");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column: Avatar & Basic Info */}
                <div className="w-full md:w-1/3 space-y-6">
                    <Card className="overflow-hidden border-border/50 shadow-sm">
                        <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
                             <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                <div className="relative group cursor-pointer" onClick={handleAvatarChange}>
                                    <div className="w-24 h-24 rounded-full bg-background border-4 border-background shadow-lg flex items-center justify-center text-3xl font-bold text-primary overflow-hidden">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user?.initials || 'U'
                                        )}
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white" size={24} />
                                    </div>
                                </div>
                             </div>
                        </div>
                        <div className="pt-16 pb-6 px-6 text-center">
                            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                            <div className="mt-4 flex justify-center gap-2">
                                <Badge variant="secondary" className="capitalize">{user?.role || 'User'}</Badge>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Shield size={18} /> Security</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Password</Label>
                                    <p className="text-xs text-muted-foreground">Last changed 3 months ago</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleChangePassword}>Change</Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>2FA</Label>
                                    <p className="text-xs text-muted-foreground">Two-factor authentication</p>
                                </div>
                                <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">Enabled</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Edit Profile & Preferences */}
                <div className="w-full md:w-2/3 space-y-6">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><User size={18} /> Personal Information</CardTitle>
                            <CardDescription>Update your personal details and public profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input 
                                            id="name" 
                                            type="text" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                            className={cn(inputClasses, "pl-9")} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input 
                                            id="email" 
                                            type="email" 
                                            value={user?.email || ''} 
                                            disabled 
                                            className={cn(inputClasses, "pl-9 opacity-70 cursor-not-allowed")} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <div className="relative">
                                        <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input 
                                            id="phoneNumber" 
                                            type="tel" 
                                            placeholder="+1 (555) 123-4567"
                                            value={phoneNumber} 
                                            onChange={(e) => setPhoneNumber(e.target.value)} 
                                            className={cn(inputClasses, "pl-9")} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="jobTitle">Job Title</Label>
                                    <div className="relative">
                                        <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                                        <select 
                                            id="jobTitle" 
                                            value={jobTitle} 
                                            onChange={(e) => setJobTitle(e.target.value)} 
                                            className={cn(inputClasses, "pl-9 pr-10 cursor-pointer appearance-none bg-background")} 
                                        >
                                            {jobTitleOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <div className="relative">
                                        <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                                        <select 
                                            id="department" 
                                            value={department} 
                                            onChange={(e) => setDepartment(e.target.value)} 
                                            className={cn(inputClasses, "pl-9 pr-10 cursor-pointer appearance-none bg-background")} 
                                        >
                                            {departmentOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleSave} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Bell size={18} /> Notification Preferences</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-secondary/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Email Notifications</p>
                                        <p className="text-xs text-muted-foreground">Receive updates and reports via email</p>
                                    </div>
                                </div>
                                <ToggleSwitch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-secondary/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                                        <Smartphone size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Push Notifications</p>
                                        <p className="text-xs text-muted-foreground">Receive real-time alerts on your device</p>
                                    </div>
                                </div>
                                <ToggleSwitch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
