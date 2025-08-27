import React, { useState } from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../../components/ui/Button';
import { cn, inputClasses } from '../../components/ui/utils';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SectionCard: React.FC<{title: string, description?: string, children: React.ReactNode, className?: string}> = ({title, description, children, className}) => (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm", className)}>
        <div className="p-6">
            <h3 className="text-lg font-semibold font-display text-foreground">{title}</h3>
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        <div className="p-6 border-t border-border">
            {children}
        </div>
    </div>
);

export const DangerZone: React.FC = () => {
    const { clearApplicationState } = useDashboard();
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    
    const MotionDiv = motion.div as any;
    const CONFIRMATION_PHRASE = "clear all data";

    return (
        <SectionCard title="Danger Zone" description="These actions are irreversible. Please proceed with caution.">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                 <AnimatePresence mode="wait">
                    {!isConfirming ? (
                        <MotionDiv
                            key="initial"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-between"
                        >
                            <div>
                                <h4 className="font-semibold text-destructive">Clear All Application Data</h4>
                                <p className="text-sm text-destructive/80">This will remove all dashboards, data sources, and settings from local storage.</p>
                            </div>
                            <Button variant="destructive" onClick={() => setIsConfirming(true)}><span className="icon-hover-anim"><Trash2/></span> Clear Data</Button>
                        </MotionDiv>
                    ) : (
                        <MotionDiv
                            key="confirm"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                        >
                            <h4 className="font-semibold text-destructive">Are you sure?</h4>
                            <p className="text-sm text-destructive/90">
                                This action is permanent and cannot be undone. To confirm, please type
                                <strong className="mx-1">"{CONFIRMATION_PHRASE}"</strong> below.
                            </p>
                            <input 
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                className={cn(inputClasses, "bg-background border-destructive/50 focus:ring-destructive")}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => { setIsConfirming(false); setConfirmationText(''); }}>Cancel</Button>
                                <Button
                                    variant="destructive"
                                    onClick={clearApplicationState}
                                    disabled={confirmationText !== CONFIRMATION_PHRASE}
                                >
                                    <span className="icon-hover-anim"><Trash2/></span> Clear All Data
                                </Button>
                            </div>
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </div>
        </SectionCard>
    );
};