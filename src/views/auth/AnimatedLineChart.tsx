import React, { memo } from 'react';
// FIX: Corrected framer-motion import for Variants and aliased motion components.
import { motion, type Variants } from 'framer-motion';

// FIX: Add aliasing for motion component to fix TypeScript errors.
const MotionPath = motion.path as any;

export const AnimatedLineChart = memo(() => {
    const pathVariants: Variants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { type: "spring", duration: 2, bounce: 0, repeat: Infinity, repeatType: 'loop', repeatDelay: 2 },
                opacity: { duration: 0.1 }
            }
        }
    };

    return (
        <div className="w-full h-full relative brand-panel">
            <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradientAuth" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" className="stop-color-1" />
                        <stop offset="100%" className="stop-color-2" />
                    </linearGradient>
                     <filter id="chartGlowAuth" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <MotionPath
                    d="M 0 40 Q 25 10, 50 30 T 100 20"
                    fill="none"
                    stroke="url(#chartGradientAuth)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={pathVariants}
                    initial="hidden"
                    animate="visible"
                    filter="url(#chartGlowAuth)"
                />
            </svg>
        </div>
    );
});