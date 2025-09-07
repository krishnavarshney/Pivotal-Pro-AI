import React, { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatabaseZap, BrainCircuit, BarChartBig, Lightbulb } from 'lucide-react';

const loadingSteps = [
    {
        icon: DatabaseZap,
        messages: ["Connecting to data sources...", "Processing raw data...", "Wrangling the numbers...", "Preparing the canvas..."],
    },
    {
        icon: BrainCircuit,
        messages: ["Running advanced analysis...", "Consulting the data oracles...", "Finding patterns...", "Asking the tough questions..."],
    },
    {
        icon: BarChartBig,
        messages: ["Building visualizations...", "Assembling pixels into charts...", "Crafting your dashboard...", "Designing the layout..."],
    },
    {
        icon: Lightbulb,
        messages: ["Uncovering key insights...", "Polishing the results...", "Finalizing the details...", "Almost there..."],
    },
];

export const LoadingOverlay: FC<{ message?: string; }> = ({ message = 'Loading...' }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    // Effect for cycling through the main steps (animation + message group)
    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCurrentStepIndex(prevIndex => (prevIndex + 1) % loadingSteps.length);
        }, 3500);
        return () => clearInterval(stepInterval);
    }, []);

    // Effect for cycling through messages within the current step
    useEffect(() => {
        // Reset message index when step changes
        setCurrentMessageIndex(0);
        
        const messageInterval = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % loadingSteps[currentStepIndex].messages.length);
        }, 2000);
        return () => clearInterval(messageInterval);
    }, [currentStepIndex]);

    const currentStep = loadingSteps[currentStepIndex];
    const currentMessage = currentStep.messages[currentMessageIndex];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-background/80 backdrop-blur-md flex items-center justify-center"
        >
            <div className="absolute inset-0 bg-aurora animate-aurora opacity-50 -z-10" />

            <div className="flex flex-col items-center gap-6 text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStepIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.4, type: 'spring', damping: 15 }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                            transition={{
                                scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                                rotate: { repeat: Infinity, duration: 5, ease: 'easeInOut' }
                            }}
                            className="w-40 h-40 flex items-center justify-center text-primary"
                        >
                            {React.createElement(currentStep.icon, { size: 80, strokeWidth: 1.5, className: "drop-shadow-[0_0_8px_hsl(var(--primary-values)/0.6)]" })}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
                
                <div className="flex flex-col items-center gap-4">
                    <p className="text-xl font-semibold text-foreground">{message}</p>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentMessage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="text-base text-muted-foreground min-h-[24px]"
                        >
                            {currentMessage}
                        </motion.p>
                    </AnimatePresence>
                    <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStepIndex + 1) / loadingSteps.length) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};