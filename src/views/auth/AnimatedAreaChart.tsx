import React, { memo } from 'react';
import { motion, type Variants } from 'framer-motion';

export const AnimatedAreaChart = memo(() => {
    const pathVariants: Variants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { type: 'spring', duration: 3, bounce: 0, repeat: Infinity, repeatType: 'loop', repeatDelay: 1 },
                opacity: { duration: 0.1 }
            }
        }
    };
     const areaVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut'
            }
        }
    };
    const areaPath = "M 0 120 C 50 80, 80 140, 130 100 S 180 20, 230 70 S 300 130, 350 90 S 400 50, 400 50 L 400 150 L 0 150 Z";

    return (
        <div className="w-full h-48 relative">
            <svg viewBox="0 0 400 150" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" className="stop-color-1" />
                        <stop offset="100%" className="stop-color-2" />
                    </linearGradient>
                    <linearGradient id="areaFillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" className="stop-color-1" stopOpacity="0.4" />
                        <stop offset="100%" className="stop-color-2" stopOpacity="0.05" />
                    </linearGradient>
                    <filter id="chartGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <motion.path
                    d={areaPath}
                    fill="url(#areaFillGradient)"
                    variants={areaVariants}
                    initial="hidden"
                    animate="visible"
                />
                <motion.path
                    d="M 0 120 C 50 80, 80 140, 130 100 S 180 20, 230 70 S 300 130, 350 90 S 400 50, 400 50"
                    fill="none"
                    stroke="url(#chartGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={pathVariants}
                    initial="hidden"
                    animate="visible"
                    filter="url(#chartGlow)"
                />
            </svg>
        </div>
    );
});