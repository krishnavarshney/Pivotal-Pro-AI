import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

export const AnimatedBarChart = memo(() => {
    const bars = useMemo(() => Array.from({ length: 5 }).map(() => ({
        height: Math.random() * 80 + 20,
        delay: Math.random() * 0.5,
    })), []);

    return (
        <div className="w-full h-48 relative flex items-end justify-center gap-4">
            <svg viewBox="0 0 400 150" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" className="stop-color-1" />
                        <stop offset="100%" className="stop-color-2" />
                    </linearGradient>
                    <filter id="chartGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {bars.map((bar, i) => (
                    <motion.rect
                        key={i}
                        x={i * 80 + 20}
                        y={150 - bar.height}
                        width="40"
                        height={bar.height}
                        rx="4"
                        fill="url(#barGradient)"
                        filter="url(#chartGlow)"
                        initial={{ height: 0, y: 150 }}
                        animate={{ height: bar.height, y: 150 - bar.height }}
                        transition={{
                            repeat: Infinity,
                            repeatType: 'mirror',
                            duration: 2,
                            delay: bar.delay,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </svg>
        </div>
    );
});