import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Activity, Cpu, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

const generateData = (count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      time: i,
      cpu: 20 + Math.random() * 30,
      memory: 40 + Math.random() * 20,
    });
  }
  return data;
};

export const SystemHealthMonitor: React.FC = () => {
    const [data, setData] = useState(generateData(20));

    useEffect(() => {
        const interval = setInterval(() => {
            setData(current => {
                const next = [...current.slice(1)];
                next.push({
                    time: current[current.length - 1].time + 1,
                    cpu: Math.max(10, Math.min(90, next[next.length - 1].cpu + (Math.random() - 0.5) * 20)),
                    memory: Math.max(20, Math.min(80, next[next.length - 1].memory + (Math.random() - 0.5) * 10)),
                });
                return next;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="col-span-1 lg:col-span-2 overflow-hidden border-primary/20 bg-background/50 backdrop-blur-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Activity size={18} className="text-primary" />
                    System Health
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Cpu size={14} /> CPU Usage
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {Math.round(data[data.length - 1].cpu)}%
                        </div>
                        <div className="h-1 w-full bg-primary/20 rounded-full mt-2 overflow-hidden">
                            <motion.div 
                                className="h-full bg-primary" 
                                initial={{ width: "0%" }}
                                animate={{ width: `${data[data.length - 1].cpu}%` }}
                                transition={{ type: "spring", stiffness: 100 }}
                            />
                        </div>
                   </div>
                   <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <HardDrive size={14} /> Memory
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {Math.round(data[data.length - 1].memory)}%
                        </div>
                         <div className="h-1 w-full bg-purple-500/20 rounded-full mt-2 overflow-hidden">
                            <motion.div 
                                className="h-full bg-purple-500" 
                                initial={{ width: "0%" }}
                                animate={{ width: `${data[data.length - 1].memory}%` }}
                                transition={{ type: "spring", stiffness: 100 }}
                            />
                        </div>
                   </div>
                </div>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" hide />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '12px' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="cpu" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorCpu)" 
                                isAnimationActive={false}
                            />
                             <Area 
                                type="monotone" 
                                dataKey="memory" 
                                stroke="#8b5cf6" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorMem)" 
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
