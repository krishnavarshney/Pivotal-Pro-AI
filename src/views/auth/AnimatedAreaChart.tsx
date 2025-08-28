import React, { memo } from 'react';
import { motion, type Variants } from 'framer-motion';

export const AnimatedDonutChart = memo(() => {
    const segmentVariants: Variants = {
        hidden: { strokeDashoffset: 283 },
        visible: {
            strokeDashoffset: 0,
            transition: {
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: 'reverse',
                repeatDelay: 1,
            }
        }
    };

    return (
        <div className="w-full h-full relative brand-panel flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-20 h-20" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="donutGradientAuth" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className="stop-color-1" />
                        <stop offset="100%" className="stop-color-2" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
                <motion.circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="url(#donutGradientAuth)" 
                    strokeWidth="10" 
                    strokeLinecap="round" 
                    transform="rotate(-90 50 50)" 
                    pathLength="283" 
                    strokeDasharray="180 103"
                    variants={segmentVariants}
                    initial="hidden"
                    animate="visible"
                />
            </svg>
        </div>
    );
});

// Maintain export name to avoid breaking imports
export const AnimatedAreaChart = AnimatedDonutChart;
