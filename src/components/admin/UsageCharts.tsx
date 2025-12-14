import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface UsageStats {
    date: string;
    newUsers: number;
    newWorkspaces: number;
    newWidgets: number;
    tokens: number;
    cost: number;
}

interface UsageChartsProps {
    data: UsageStats[];
}

export const UsageCharts: React.FC<UsageChartsProps> = ({ data }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Growth Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorWorkspaces" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="newUsers" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" name="New Users" />
                            <Area type="monotone" dataKey="newWorkspaces" stroke="#82ca9d" fillOpacity={1} fill="url(#colorWorkspaces)" name="New Workspaces" />
                            <Area type="monotone" dataKey="newWidgets" stroke="#ffc658" fillOpacity={1} fill="#ffc658" name="New Widgets" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Token Usage & Cost</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="tokens" fill="#8884d8" name="Tokens" />
                            <Bar yAxisId="right" dataKey="cost" fill="#82ca9d" name="Cost ($)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};
