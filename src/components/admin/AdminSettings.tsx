import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import * as adminService from '../../services/adminService';
import { notificationService } from '../../services/notificationService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Save, BrainCircuit, Flag, Settings } from 'lucide-react';

export const AdminSettings: React.FC = () => {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await adminService.getSettings();
                setSettings(data);
            } catch (error) {
                notificationService.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async (key: string, value: any) => {
        try {
            await adminService.updateSetting(key, value);
            notificationService.success("Setting saved");
        } catch (error) {
            notificationService.error("Failed to save setting");
        }
    };

    if (loading) return (
         <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-6">
                <div>
                     <h3 className="text-2xl font-bold tracking-tight">System Configuration</h3>
                     <p className="text-muted-foreground">Manage global application behavior.</p>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="general" className="flex items-center gap-2"><Settings size={14}/> General</TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2"><BrainCircuit size={14}/> AI & Models</TabsTrigger>
                    <TabsTrigger value="features" className="flex items-center gap-2"><Flag size={14}/> Feature Flags</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Basic system access and maintenance controls.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div>
                                    <p className="font-medium">Maintenance Mode</p>
                                    <p className="text-sm text-muted-foreground">Prevent non-admin users from accessing the system.</p>
                                </div>
                                <ToggleSwitch
                                    enabled={settings.maintenanceMode || false}
                                    onChange={(val) => {
                                        handleChange('maintenanceMode', val);
                                        handleSave('maintenanceMode', val);
                                    }}
                                    label=""
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div>
                                    <p className="font-medium">Allow Signups</p>
                                    <p className="text-sm text-muted-foreground">Allow new users to register accounts.</p>
                                </div>
                                <ToggleSwitch
                                    enabled={settings.allowSignups !== false}
                                    onChange={(val) => {
                                        handleChange('allowSignups', val);
                                        handleSave('allowSignups', val);
                                    }}
                                    label=""
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ai">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Configuration</CardTitle>
                            <CardDescription>Default parameters for model generation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Temperature (0.0 - 1.0)</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="number" 
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            value={settings.aiTemperature || 0.7}
                                            onChange={(e) => handleChange('aiTemperature', parseFloat(e.target.value))}
                                        />
                                        <Button size="icon" variant="ghost" onClick={() => handleSave('aiTemperature', settings.aiTemperature)}>
                                            <Save size={16} />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Higher values make output more random.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Tokens</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            type="number" 
                                            value={settings.aiMaxTokens || 2048}
                                            onChange={(e) => handleChange('aiMaxTokens', parseInt(e.target.value))}
                                        />
                                        <Button size="icon" variant="ghost" onClick={() => handleSave('aiMaxTokens', settings.aiMaxTokens)}>
                                            <Save size={16} />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Maximum length of generated response.</p>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="features">
                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Flags</CardTitle>
                            <CardDescription>Enable or disable experimental features.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            {[
                                { id: 'enableBetaAnalytics', label: 'Advanced Analytics (Beta)', desc: 'New charting engine and prediction models.' },
                                { id: 'enableDataStories', label: 'Data Stories', desc: 'Auto-generated narrative reports.' },
                                { id: 'enableCollaborativeMode', label: 'Real-time Collaboration', desc: 'Allow multiple users to edit dashboards.' }
                            ].map(feature => (
                                <div key={feature.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                    <div>
                                        <p className="font-medium flex items-center gap-2">
                                            {feature.label}
                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">FLAG</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                                    </div>
                                    <ToggleSwitch
                                        enabled={settings[feature.id] || false}
                                        onChange={(val) => {
                                            handleChange(feature.id, val);
                                            handleSave(feature.id, val);
                                        }}
                                        label=""
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
