import { FC } from 'react';
import { motion } from 'framer-motion';
import { useDashboard } from '../contexts/DashboardProvider';
import { Button } from '../components/ui/Button';
import { ArrowRight, Sparkles, Layout, BarChart2, Zap } from 'lucide-react';
import { AnimatedStars } from './auth/AnimatedStars';

const MotionDiv = motion.div;
const MotionH1 = motion.h1;
const MotionP = motion.p;

export const OnboardingView: FC = () => {
    const { setView } = useDashboard();

    const handleGetStarted = () => {
        setView('dashboard');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background text-foreground p-6">
            <div className="absolute inset-0 bg-aurora animate-aurora opacity-30 pointer-events-none" />
            <AnimatedStars isAuth={false} />

            <MotionDiv 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-4xl w-full text-center space-y-12"
            >
                <div className="space-y-6">
                    <MotionDiv variants={itemVariants} className="flex justify-center">
                        <div className="p-4 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                            <Sparkles size={48} />
                        </div>
                    </MotionDiv>
                    
                    <MotionH1 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight font-display">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Pivotal Pro AI</span>
                    </MotionH1>
                    
                    <MotionP variants={itemVariants} className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Your intelligent workspace for data analytics. Transform raw data into actionable insights with the power of AI.
                    </MotionP>
                </div>

                <MotionDiv variants={itemVariants} className="grid md:grid-cols-3 gap-6 text-left">
                    <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="h-12 w-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                            <Layout size={24} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Flexible Workspaces</h3>
                        <p className="text-sm text-muted-foreground">Organize your projects into dedicated workspaces and pages.</p>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="h-12 w-12 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
                        <p className="text-sm text-muted-foreground">Ask questions in plain English and get instant visualizations.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="h-12 w-12 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
                            <BarChart2 size={24} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                        <p className="text-sm text-muted-foreground">Build complex dashboards with drag-and-drop simplicity.</p>
                    </div>
                </MotionDiv>

                <MotionDiv variants={itemVariants} className="pt-8">
                    <Button 
                        size="lg" 
                        onClick={handleGetStarted}
                        className="text-lg px-8 py-6 h-auto rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
                    >
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </MotionDiv>
            </MotionDiv>
        </div>
    );
};
