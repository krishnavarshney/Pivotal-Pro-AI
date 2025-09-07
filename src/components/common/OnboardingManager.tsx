import React, { useLayoutEffect, useRef, useState, useCallback, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { TOURS } from '../../utils/onboardingTours';
import { Button } from '../ui/Button';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { OnboardingStep } from '../../utils/types';

export const OnboardingManager: FC = () => {
    const { onboardingState, advanceOnboardingStep, exitOnboarding, startOnboardingTour } = useDashboard();
    const [highlightStyle, setHighlightStyle] = useState({});
    const [popoverStyle, setPopoverStyle] = useState({});
    const [arrowStyle, setArrowStyle] = useState({});
    const popoverRef = useRef<HTMLDivElement>(null);

    const tour = onboardingState.currentTour ? TOURS[onboardingState.currentTour] : null;
    const step = tour ? tour[onboardingState.currentStep] : null;

    const calculatePositions = useCallback(() => {
        if (!step) return;
        const element = document.getElementById(step.elementId);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const popoverRect = popoverRef.current?.getBoundingClientRect();

        setHighlightStyle({
            width: rect.width + 16,
            height: rect.height + 16,
            top: rect.top - 8,
            left: rect.left - 8,
        });

        let popoverTop = 0, popoverLeft = 0;
        const offset = 16;
        const popoverWidth = popoverRect?.width ?? 320;
        const popoverHeight = popoverRect?.height ?? 200;

        switch (step.placement) {
            case 'bottom':
                popoverTop = rect.bottom + offset;
                popoverLeft = rect.left + rect.width / 2 - popoverWidth / 2;
                break;
            case 'top':
                popoverTop = rect.top - popoverHeight - offset;
                popoverLeft = rect.left + rect.width / 2 - popoverWidth / 2;
                break;
            case 'right':
                popoverLeft = rect.right + offset;
                popoverTop = rect.top + rect.height / 2 - popoverHeight / 2;
                break;
            case 'left':
                popoverLeft = rect.left - popoverWidth - offset;
                popoverTop = rect.top + rect.height / 2 - popoverHeight / 2;
                break;
        }

        popoverLeft = Math.max(16, Math.min(popoverLeft, window.innerWidth - popoverWidth - 16));
        popoverTop = Math.max(16, Math.min(popoverTop, window.innerHeight - popoverHeight - 16));

        setPopoverStyle({ top: popoverTop, left: popoverLeft });

        const arrowSize = 8;
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;
        const arrowLeft = targetCenterX - popoverLeft - arrowSize;
        const arrowTop = targetCenterY - popoverTop - arrowSize;
        
        setArrowStyle({
            left: `${_.clamp(arrowLeft, arrowSize, popoverWidth - arrowSize * 3)}px`,
            top: `${_.clamp(arrowTop, arrowSize, popoverHeight - arrowSize * 3)}px`,
        });

    }, [step]);

    useLayoutEffect(() => {
        if (!onboardingState.isTourActive || !step) return;
        
        const preAction = step.preAction;
        if (preAction) {
           preAction({ startOnboardingTour });
        }

        const debouncedCalc = _.debounce(calculatePositions, 50);
        const timeoutId = setTimeout(debouncedCalc, step.preAction ? 350 : 50); // Delay for UI to settle after action

        window.addEventListener('resize', debouncedCalc);
        window.addEventListener('scroll', debouncedCalc, true);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', debouncedCalc);
            window.removeEventListener('scroll', debouncedCalc, true);
            debouncedCalc.cancel();
        };
    }, [onboardingState.isTourActive, step, calculatePositions]);
    
    if (!onboardingState.isTourActive || !step) return null;

    return (
        <div className="fixed inset-0 z-[300]">
            <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            />
            <motion.div
                className="onboarding-spotlight"
                animate={highlightStyle}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
            <AnimatePresence>
                {step && (
                    <motion.div
                        key={onboardingState.currentStep}
                        ref={popoverRef}
                        className="absolute z-10 w-80 bg-popover rounded-xl shadow-2xl p-6 border border-border"
                        style={popoverStyle}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div
                            className="onboarding-popover-arrow"
                            style={arrowStyle}
                            data-placement={step.placement}
                        />
                        <h3 className="text-lg font-bold font-display text-popover-foreground mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{step.content}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">{onboardingState.currentStep + 1} / {tour?.length}</span>
                            <div className="flex items-center gap-2">
                                {onboardingState.currentStep > 0 && <Button variant="ghost" size="sm" onClick={() => advanceOnboardingStep('back')}><ArrowLeft size={16}/> Back</Button>}
                                <Button size="sm" onClick={() => advanceOnboardingStep('next')}>
                                    {onboardingState.currentStep === tour!.length - 1 ? "Finish" : "Next"} <ArrowRight size={16} />
                                </Button>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={exitOnboarding}>
                            <X size={16} />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
