import React, { useState, FC, ReactNode, ChangeEvent, FormEvent, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { Mail, Lock, User as UserIcon, AlertCircle, Zap, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../components/ui/utils';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useDashboard } from '../contexts/DashboardProvider';
import { AnimatedLineChart } from './auth/AnimatedLineChart';
import { AnimatedBarChart } from './auth/AnimatedBarChart';
import { AnimatedAreaChart } from './auth/AnimatedAreaChart';
import { AnimatedStars } from './auth/AnimatedStars';

const PasswordStrengthMeter: FC<{ score: number }> = ({ score }) => {
    const levels = [
        { width: '0%', color: '' },
        { width: '25%', color: 'bg-red-500' },
        { width: '50%', color: 'bg-yellow-500' },
        { width: '75%', color: 'bg-sky-500' },
        { width: '100%', color: 'bg-green-500' },
    ];
    return (
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden mt-1">
            <motion.div
                className={`h-full rounded-full ${levels[score].color}`}
                initial={{ width: 0 }}
                animate={{ width: levels[score].width }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            />
        </div>
    );
};

const InputField: FC<{ name: string; type: string; label: string; icon: ReactNode; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; isInvalid?: boolean; ariaDescribedBy?: string; }> = ({ name, type, label, icon, value, onChange, isInvalid, ariaDescribedBy }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-auth-form-label mb-1">{label}</label>
        <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-auth-text-body pointer-events-none">{icon}</div>
            <input
                id={name} name={name} type={type} value={value} onChange={onChange} required
                className="w-full h-11 pl-11 pr-4 rounded-lg bg-auth-input-bg text-auth-form-input placeholder-auth-text-body border border-auth-border focus:outline-none focus:ring-2 focus:ring-primary/80 focus:border-transparent transition-all duration-300"
                aria-invalid={isInvalid}
                aria-describedby={ariaDescribedBy}
            />
        </div>
    </div>
);

const AuthForm: FC<{ isLogin: boolean; }> = ({ isLogin }) => {
    const [formData, setFormData] = useState({ name: '', email: 'krishna@pivotalpro.ai', password: 'krishna' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const { login, signup } = useAuth();
    const errorId = `auth-error-${React.useId()}`;

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
        <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
                {!isLogin && (
                    <motion.div key="name" variants={formVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }}>
                        <InputField name="name" type="text" label="Full name" icon={<UserIcon size={18} />} value={formData.name} onChange={handleInputChange} isInvalid={hasError} ariaDescribedBy={errorId} />
                    </motion.div>
                )}
            </AnimatePresence>
            <InputField name="email" type="email" label="Work email" icon={<Mail size={18} />} value={formData.email} onChange={handleInputChange} isInvalid={hasError} ariaDescribedBy={errorId} />
            <div>
                <InputField name="password" type="password" label="Password" icon={<Lock size={18} />} value={formData.password} onChange={handleInputChange} isInvalid={hasError} ariaDescribedBy={errorId} />
                <AnimatePresence>
                    {!isLogin && formData.password && (
                        <motion.div key="strength" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <PasswordStrengthMeter score={passwordStrength} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.p
                        id={errorId}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className="text-red-400 text-sm flex items-center gap-2 pt-1"
                        aria-live="polite"
                    >
                        <AlertCircle size={16} /> {error}
                    </motion.p>
                )}
            </AnimatePresence>

            <div className="pt-2">
                <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold auth-button" disabled={isLoading}>
                    {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : (isLogin ? 'Login' : 'Create account')}
                </Button>
            </div>
        </form>
    );
};

const AuthThemeSwitcher: FC = () => {
    const { themeConfig, setThemeConfig } = useDashboard();
    const { mode } = themeConfig;
    
    return (
        <div className="flex items-center rounded-lg bg-auth-input-bg p-1">
            <button
                onClick={() => setThemeConfig(t => ({...t, mode: 'light'}))}
                className={`p-1.5 rounded-md ${mode === 'light' ? 'bg-auth-form-input text-auth-input-bg' : 'text-auth-text-body'}`}
                aria-label="Switch to light theme"
            >
                <Sun size={16} />
            </button>
            <button
                onClick={() => setThemeConfig(t => ({...t, mode: 'dark'}))}
                className={`p-1.5 rounded-md ${mode === 'dark' ? 'bg-auth-form-input text-auth-input-bg' : 'text-auth-text-body'}`}
                aria-label="Switch to dark theme"
            >
                <Moon size={16} />
            </button>
        </div>
    )
}

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
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            damping: 12,
            stiffness: 100,
        },
    },
};

const AnimatedBrandHeading: FC = () => {
    const lines = ["Make every", "decision", "Pivotal."];
    
    return (
         <motion.h2
            variants={sentenceVariants}
            initial="hidden"
            animate="visible"
            className="text-7xl font-bold font-display leading-tight select-none mt-8"
            style={{ color: 'var(--auth-brand-heading-color)' }}
        >
            {lines.map((line, lineIndex) => (
                <span className="block" key={lineIndex}>
                    {line.split(" ").map((word, wordIndex) => (
                        <motion.span
                            key={`${word}-${wordIndex}`}
                            variants={wordVariants}
                            style={{ display: 'inline-block', paddingRight: '0.4em' }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </span>
            ))}
        </motion.h2>
    );
};


export const AuthView: FC = () => {
    const { themeConfig } = useDashboard();
    const [isLogin, setIsLogin] = useState(true);
    const [authTheme, setAuthTheme] = useState(themeConfig.mode);

    useEffect(() => {
        setAuthTheme(themeConfig.mode);
    }, [themeConfig.mode]);

    return (
        <div data-theme={authTheme} className="auth-container min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-auth-border" />
            <AnimatedStars />
            <div className="w-full max-w-5xl mx-auto z-10">
                <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center w-full max-w-5xl mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center text-primary">
                            <Zap size={20} />
                        </div>
                        <h1 className="font-bold text-lg text-auth-header opacity-50">Pivotal Pro AI</h1>
                    </div>
                    <AuthThemeSwitcher />
                </header>
                
                <div className="grid md:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden glass-panel-auth mt-20">
                    <div className="hidden md:flex flex-col justify-between gap-8 p-12 brand-panel">
                        <div>
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                Secure SSO Ready
                            </div>
                            <AnimatedBrandHeading />
                        </div>
                        <motion.div
                            key="animated-chart"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <AnimatedLineChart />
                        </motion.div>
                    </div>

                    <div className="p-10 flex flex-col justify-center">
                        <div className="w-full max-w-sm mx-auto">
                            <div className="flex items-center mb-8">
                                <button onClick={() => setIsLogin(true)} className={cn('flex-1 p-2 text-sm font-semibold transition-colors relative auth-tab-btn', isLogin ? 'active' : 'inactive')}>
                                    <span className="relative z-10">Login</span>
                                    {isLogin && <motion.div className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" layoutId="auth-tab" />}
                                </button>
                                <button onClick={() => setIsLogin(false)} className={cn('flex-1 p-2 text-sm font-semibold transition-colors relative auth-tab-btn', !isLogin ? 'active' : 'inactive')}>
                                    <span className="relative z-10">Create account</span>
                                    {!isLogin && <motion.div className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" layoutId="auth-tab" />}
                                </button>
                            </div>
                             <AnimatePresence mode="wait">
                                <motion.div
                                    key={isLogin ? 'login' : 'signup'}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <h3 className="text-2xl font-bold text-auth-header mb-1">{isLogin ? 'Login to your account' : 'Create your account'}</h3>
                                    <p className="text-auth-text-body mb-6 text-sm">Start your journey with AI-powered BI</p>
                                    <AuthForm isLogin={isLogin} />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};