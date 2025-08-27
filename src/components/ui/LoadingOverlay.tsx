import React, { FC } from 'react';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';

export const LoadingOverlay: FC<{ message?: string; lottieAnimation?: object; }> = ({ message = 'Loading...', lottieAnimation }) => {
    const MotionDiv = motion.div as any;
    return (
    <MotionDiv 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] bg-background/80 backdrop-blur-sm flex items-center justify-center"
    >
        <div className="flex flex-col items-center gap-4 text-lg font-semibold text-foreground">
            {lottieAnimation ? (
                <div className="w-48 h-48 -mb-8">
                    <Lottie animationData={lottieAnimation} loop={true} />
                </div>
            ) : (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            )}
            <span>{message}</span>
        </div>
    </MotionDiv>
)};
