import { FC } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Database, Sparkles } from 'lucide-react';

export const LoadingOverlay: FC<{ message?: string }> = ({ message = 'Loading...' }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
            {/* Animated gradient background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-[100%] opacity-30">
                    <div className="absolute top-0 -left-4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
                    <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
                </div>
            </div>

            {/* Main loader content */}
            <div className="relative flex flex-col items-center gap-8">
                {/* Animated logo/icon container */}
                <div className="relative">
                    {/* Outer rotating ring */}
                    <motion.div
                        className="absolute inset-0 w-32 h-32 rounded-full border-4 border-primary/20"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Middle rotating ring */}
                    <motion.div
                        className="absolute inset-2 w-28 h-28 rounded-full border-4 border-primary/40 border-t-primary"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Inner pulsing circle */}
                    <motion.div
                        className="absolute inset-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {/* Animated icons */}
                        <div className="relative w-16 h-16">
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                animate={{ opacity: [1, 0, 0, 0, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <BarChart3 size={32} className="text-primary" />
                            </motion.div>
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                animate={{ opacity: [0, 1, 0, 0, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <TrendingUp size={32} className="text-primary" />
                            </motion.div>
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                animate={{ opacity: [0, 0, 1, 0, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Database size={32} className="text-primary" />
                            </motion.div>
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center"
                                animate={{ opacity: [0, 0, 0, 1, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Sparkles size={32} className="text-primary" />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Loading text with animation */}
                <div className="flex flex-col items-center gap-3 mt-32">
                    <motion.h2
                        className="text-2xl font-bold font-display text-foreground"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {message}
                    </motion.h2>
                    
                    {/* Animated dots */}
                    <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-primary"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="w-64 h-1 bg-secondary rounded-full overflow-hidden mt-2">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%]"
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

                    {/* Subtle hint text */}
                    <motion.p
                        className="text-sm text-muted-foreground mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        Preparing your experience...
                    </motion.p>
                </div>

                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-primary/30"
                        style={{
                            left: `${20 + i * 15}%`,
                            top: `${30 + (i % 3) * 20}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: 2 + i * 0.3,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};