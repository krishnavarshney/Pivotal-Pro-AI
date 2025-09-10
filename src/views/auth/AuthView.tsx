import React, { useState, FC, ReactNode, ChangeEvent, FormEvent, useEffect, memo } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { Mail, Lock, User as UserIcon, AlertCircle, Zap, Sun, Moon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/utils';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardProvider';
import { AnimatedStars } from './AnimatedStars';

// New, more professional hero graphic
const AuthHeroGraphic: FC = memo(() => {
    const MotionDiv = motion.div;
    const MotionRect = motion.rect;
    const MotionPath = motion.path;
    return (
        <div className="w-full h-64 relative flex items-center justify-center">
            <MotionDiv
                className="absolute w-full h-full"
                variants={{
                    initial: { opacity: 0, scale: 0.8 },
                    animate: { opacity: 1, scale: 1, transition: { delay: 1, duration: 0.7, ease: 'easeOut' } },
                }}
            >
                <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="hero-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--primary-values) / 0.8)" />
                            <stop offset="100%" stopColor="hsl(var(--primary-values) / 0.3)" />
                        </linearGradient>
                         <linearGradient id="hero-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--primary-values) / 0.6)" />
                            <stop offset="100%" stopColor="hsl(217.2 91.2% 59.8% / 0.4)" />
                        </linearGradient>
                        <filter id="hero-glow" x="-50%" y="-50%" width="200%" height="200%">
                           <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Animated bars */}
                    {[...Array(5)].map((_, i) => (
                        <MotionRect
                            key={i}
                            x={i * 25 + 137.5}
                            width="15"
                            rx="4"
                            ry="4"
                            stroke="hsl(var(--primary-values) / 0.2)"
                            strokeWidth="1"
                            fill="url(#hero-grad-2)"
                            initial={{ y: 150, height: 0 }}
                            animate={{ y: [150, 100 - i*10, 150], height: [0, 50 + i*10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, delay: 1 + i * 0.2, ease: "easeInOut" }}
                        />
                    ))}
                    
                    {/* Flowing line */}
                    <MotionPath
                        d="M 50 100 C 150 20, 250 180, 350 100"
                        fill="none"
                        stroke="url(#hero-grad-1)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        filter="url(#hero-glow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.2, duration: 1.5, ease: 'easeOut' }}
                    />
                </svg>
            </MotionDiv>
        </div>
    );
});


const AuthThemeSwitcher: FC = () => {
    const { themeConfig, toggleThemeMode } = useDashboard();
    
    return (
        <button
            onClick={toggleThemeMode}
            className="absolute top-6 right-6 z-20 p-2 rounded-full text-auth-link hover:text-auth-link-hover hover:bg-auth-glass-bg transition-colors"
            aria-label="Toggle theme"
        >
            {themeConfig.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};


const PasswordStrengthMeter: FC<{ score: number }> = ({ score }) => {
    const MotionDiv = motion.div;
    const levels = [
        { width: '0%', color: '' },
        { width: '25%', color: 'bg-red-500' },
        { width: '50%', color: 'bg-yellow-500' },
        { width: '75%', color: 'bg-sky-500' },
        { width: '100%', color: 'bg-green-500' },
    ];
    return (
        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden mt-1">
            <MotionDiv
                className={`h-full rounded-full ${levels[score].color}`}
                initial={{ width: 0 }}
                animate={{ width: levels[score].width }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            />
        </div>
    );
};

const InputField: FC<{ name: string; type: string; label: string; icon: ReactNode; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; isInvalid?: boolean; ariaDescribedBy?: string; }> = ({ name, type, label, icon, value, onChange, isInvalid, ariaDescribedBy }) => (
    <div className="form-input-wrapper">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            {icon}
        </span>
        <input
            id={name} name={name} type={type} value={value} onChange={onChange} required
            className="form-input w-full py-3 rounded-lg text-auth-input-text placeholder-transparent"
            placeholder={label}
            aria-invalid={isInvalid}
            aria-describedby={ariaDescribedBy}
        />
        <label htmlFor={name} className="form-label">{label}</label>
    </div>
);

const AuthForm: FC<{ isLogin: boolean; }> = ({ isLogin }) => {
    const [formData, setFormData] = useState({ name: '', email: 'admin@pivotalpro.ai', password: 'admin' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const { login, signup } = useAuth();
    const errorId = `auth-error-${React.useId()}`;
    const MotionDiv = motion.div;
    const MotionP = motion.p;

    const checkPasswordStrength = (password: string) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'password') {
            setPasswordStrength(checkPasswordStrength(value));
        }
        setError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await signup(formData.name, formData.email, formData.password);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const formVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 }
    };

    const hasError = !!error;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
                {!isLogin && (
                    <MotionDiv key="name" variants={formVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }}>
                        <InputField name="name" type="text" label="Full name" icon={<UserIcon size={18} className="text-gray-500" />} value={formData.name} onChange={handleInputChange} isInvalid={hasError} ariaDescribedBy={errorId} />
                    </MotionDiv>
                )}
            </AnimatePresence>
            <InputField name="email" type="email" label="Work email" icon={<Mail size={18} className="text-gray-500" />} value={formData.email} onChange={handleInputChange} isInvalid={hasError} ariaDescribedBy={errorId} />
            <div>
                <InputField name="password" type="password" label="Password" icon={<Lock size={18} className="text-gray-500" />} value={formData.password} onChange={handleInputChange} isInvalid={hasError} ariaDescribedBy={errorId} />
                <AnimatePresence>
                    {!isLogin && formData.password && (
                        <MotionDiv key="strength" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <PasswordStrengthMeter score={passwordStrength} />
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {error && (
                    <MotionP
                        id={errorId}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className="text-red-400 text-sm flex items-center gap-2"
                        aria-live="polite"
                    >
                        <AlertCircle size={16} /> {error}
                    </MotionP>
                )}
            </AnimatePresence>

            <div className="pt-2">
                <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold auth-button" disabled={isLoading}>
                    {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : (isLogin ? 'Login Securely' : 'Create Account')}
                </Button>
            </div>
        </form>
    );
};

const sentenceVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const wordVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            damping: 15,
            stiffness: 100,
            delay: 0.5 + i * 0.05,
        },
    }),
};

const AnimatedBrandHeading: FC = () => {
    const MotionH2 = motion.h2;
    const MotionSpan = motion.span;
    const line1 = "Make every decision";
    const line2 = "Pivotal.";
    
    return (
         <MotionH2
            variants={sentenceVariants}
            initial="hidden"
            animate="visible"
            className="text-6xl lg:text-7xl font-extrabold leading-tight tracking-tighter text-auth-foreground select-none"
        >
            <span className="block">
                {line1.split(" ").map((word, wordIndex) => (
                    <MotionSpan key={`${word}-${wordIndex}`} custom={wordIndex} variants={wordVariants} className="inline-block pr-4">
                        {word}
                    </MotionSpan>
                ))}
            </span>
             <MotionSpan custom={line1.split(" ").length} variants={wordVariants} className="inline-block pr-4 animated-text">
                {line2}
            </MotionSpan>
        </MotionH2>
    );
};


export const AuthView: FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const MotionDiv = motion.div;
    
    return (
        <div className="auth-container min-h-screen flex items-center justify-center p-4">
            <AnimatedStars isAuth={true} />
            <div className="absolute inset-0 bg-aurora animate-aurora -z-10" />
            <AuthThemeSwitcher />
            
            <div className="content-wrapper relative z-10 w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
                 <div className="hidden lg:block p-8 space-y-8">
                    <MotionDiv 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center space-x-3"
                    >
                        <Zap size={24} className="text-primary" />
                        <h1 className="text-2xl font-bold tracking-wider text-auth-muted-foreground">Pivotal Pro AI</h1>
                    </MotionDiv>

                    <AnimatedBrandHeading />

                    <MotionDiv 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                    >
                        <AuthHeroGraphic />
                    </MotionDiv>
                </div>

                <div className="w-full max-w-md mx-auto">
                    <MotionDiv 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
                        className="glass-card rounded-2xl p-8 md:p-12"
                    >
                        <h3 className="text-3xl font-bold text-auth-foreground mb-2 text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
                        <p className="text-auth-muted-foreground mb-10 text-center">Enter the future of BI.</p>
                        
                        <AuthForm isLogin={isLogin} />

                        <div className="text-center mt-6">
                            <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-medium text-auth-link hover:text-auth-link-hover transition-colors">
                                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                            </button>
                        </div>
                    </MotionDiv>
                </div>
            </div>
        </div>
    );
};