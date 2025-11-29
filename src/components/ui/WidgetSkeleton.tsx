import { FC } from 'react';
import { ChartType } from '../../utils/types';
import { cn } from './utils';
import { motion } from 'framer-motion';
import { BarChart3, LineChart, PieChart, Table2, Gauge, Database, Sparkles } from 'lucide-react';

const LoadingIcon: FC<{ chartType?: ChartType }> = ({ chartType }) => {
    const getIcon = () => {
        switch(chartType) {
            case ChartType.BAR: return BarChart3;
            case ChartType.LINE:
            case ChartType.AREA: return LineChart;
            case ChartType.PIE: return PieChart;
            case ChartType.TABLE: return Table2;
            case ChartType.KPI: return Gauge;
            default: return Database;
        }
    };

    const Icon = getIcon();

    return (
        <motion.div
            className="relative"
            animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        >
            <Icon size={48} className="text-primary" strokeWidth={1.5} />
            <motion.div
                className="absolute -inset-2 rounded-full border-2 border-primary/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
        </motion.div>
    );
};

const BarSkeleton = () => (
    <div className="flex items-end space-x-3 h-full px-8">
        {[50, 80, 30, 60, 75, 40, 65].map((height, i) => (
            <motion.div
                key={i}
                className="w-full bg-gradient-to-t from-primary/20 to-primary/5 rounded-t-lg"
                style={{ height: `${height}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 2,
                }}
            />
        ))}
    </div>
);

const LineSkeleton = () => (
    <div className="h-full flex items-center justify-center p-8">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 80">
            <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                </linearGradient>
            </defs>
            <motion.path
                d="M0,50 C20,10 40,80 60,40 S80,0 100,60"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
        </svg>
    </div>
);

const PieSkeleton = () => (
    <div className="h-full flex items-center justify-center">
        <motion.div
            className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 via-purple-500/10 to-blue-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
            <div className="w-full h-full rounded-full border-8 border-primary/30 border-t-primary" />
        </motion.div>
    </div>
);

const KpiSkeleton = () => (
    <div className="h-full flex flex-col items-center justify-center space-y-6">
        <motion.div
            className="h-6 bg-gradient-to-r from-muted via-primary/20 to-muted rounded w-48"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: '200% 100%' }}
        />
        <motion.div
            className="h-16 bg-gradient-to-r from-muted via-primary/30 to-muted rounded w-64"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.2 }}
            style={{ backgroundSize: '200% 100%' }}
        />
    </div>
);

const TableSkeleton = () => (
    <div className="space-y-3 p-6">
        {[100, 95, 85, 90, 100, 80].map((width, i) => (
            <motion.div
                key={i}
                className="h-4 bg-gradient-to-r from-muted via-primary/20 to-muted rounded"
                style={{ width: `${width}%`, backgroundSize: '200% 100%' }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.1,
                }}
            />
        ))}
    </div>
);

export const WidgetSkeleton: FC<{ chartType?: ChartType }> = ({ chartType }) => {
    const renderSkeleton = () => {
        switch(chartType) {
            case ChartType.BAR: return <BarSkeleton />;
            case ChartType.LINE:
            case ChartType.AREA: return <LineSkeleton />;
            case ChartType.PIE: return <PieSkeleton />;
            case ChartType.KPI: return <KpiSkeleton />;
            case ChartType.TABLE: return <TableSkeleton />;
            default: return <BarSkeleton />;
        }
    };

    const getLoadingMessage = () => {
        switch(chartType) {
            case ChartType.TABLE: return "Loading data rows...";
            case ChartType.KPI: return "Calculating metrics...";
            default: return "Processing data...";
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            {/* Subtle background animation */}
            <div className="absolute inset-0 opacity-30">
                <motion.div
                    className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, -100, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center gap-6 w-full h-full">
                {/* Icon and title */}
                <div className="flex flex-col items-center gap-4 mt-8">
                    <LoadingIcon chartType={chartType} />
                    <div className="flex flex-col items-center gap-2">
                        <motion.h3
                            className="text-lg font-semibold text-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {getLoadingMessage()}
                        </motion.h3>
                        {/* Animated dots */}
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-primary"
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.4, 1, 0.4],
                                    }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: "easeInOut",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart preview skeleton */}
                <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                    {renderSkeleton()}
                </div>

                {/* Progress bar */}
                <div className="w-3/4 max-w-md h-1.5 bg-secondary rounded-full overflow-hidden mb-8">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary"
                        style={{ backgroundSize: '200% 100%' }}
                        animate={{
                            x: ['-100%', '100%'],
                            backgroundPosition: ['0% 50%', '100% 50%'],
                        }}
                        transition={{
                            x: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                            backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};