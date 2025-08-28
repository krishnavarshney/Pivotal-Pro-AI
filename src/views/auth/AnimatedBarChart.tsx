import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

export const AnimatedBarChart = memo(() => {
    const bars = [
        { height: 30, delay: 2.2 },
        { height: 40, delay: 2.0 },
        { height: 20, delay: 2.4 },
    ];

    return (
        <div className="w-full h-full relative flex items-end justify-center gap-2 brand-panel px-2">
            <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="barGradientAuth1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#6366F1" /></linearGradient>
                    <linearGradient id="barGradientAuth2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#6366F1" /><stop offset="100%" stopColor="#818CF8" /></linearGradient>
                    <linearGradient id="barGradientAuth3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#818CF8" /><stop offset="100%" stopColor="#A78BFA" /></linearGradient>
                </defs>
                {bars.map((bar, i) => (
                    <motion.rect
                        key={i}
                        x={10 + i * 30}
                        width="20"
                        rx="3"
                        fill={`url(#barGradientAuth${i+1})`}
                        initial={{ height: 0, y: 50 }}
                        animate={{ height: bar.height, y: 50 - bar.height }}
                        transition={{
                            repeat: Infinity,
                            repeatType: 'mirror',
                            duration: 1.5,
                            delay: bar.delay,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </svg>
        </div>
    );
});