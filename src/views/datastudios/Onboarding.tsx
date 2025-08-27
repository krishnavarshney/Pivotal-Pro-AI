import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import _ from 'lodash';

interface OnboardingStep {
  elementId: string;
  title: string;
  content: string;
  placement: 'bottom' | 'top' | 'left' | 'right';
}

const steps: OnboardingStep[] = [
  {
    elementId: 'onboarding-datagrid',
    title: 'Your Live Data Canvas',
    content: "This is a live preview of your data. As you add transformation steps, you'll see the changes reflected here instantly.",
    placement: 'bottom',
  },
  {
    elementId: 'onboarding-sidebar',
    title: 'The Control Panel',
    content: 'This sidebar is your main workspace. Manage your data sources, view the final field list, and build your transformation pipeline step-by-step.',
    placement: 'right',
  },
  {
    elementId: 'onboarding-actions',
    title: 'Add Transformations',
    content: 'Add calculated fields or group values manually. Or, use the power of AI to get smart suggestions for cleaning and preparing your data.',
    placement: 'top',
  },
];

export const DataStudioOnboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState({});
  const [popoverStyle, setPopoverStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const [isExiting, setIsExiting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

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

    // Clamp to viewport
    popoverLeft = Math.max(16, Math.min(popoverLeft, window.innerWidth - popoverWidth - 16));
    popoverTop = Math.max(16, Math.min(popoverTop, window.innerHeight - popoverHeight - 16));

    setPopoverStyle({ top: popoverTop, left: popoverLeft });

    // Calculate arrow position relative to the popover
    const arrowSize = 8; // half of the arrow's width/height
    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;

    const arrowLeft = targetCenterX - popoverLeft - arrowSize;
    const arrowTop = targetCenterY - popoverTop - arrowSize;
    
    setArrowStyle({
        left: `${_.clamp(arrowLeft, arrowSize, popoverWidth - arrowSize * 3)}px`,
        top: `${_.clamp(arrowTop, arrowSize, popoverHeight - arrowSize * 3)}px`,
    });

  }, [currentStep, step]);
  
  useLayoutEffect(() => {
    const debouncedCalc = _.debounce(calculatePositions, 50);
    debouncedCalc(); // Initial calculation

    window.addEventListener('resize', debouncedCalc);
    window.addEventListener('scroll', debouncedCalc, true); // Use capture to catch scrolls in inner elements

    return () => {
      window.removeEventListener('resize', debouncedCalc);
      window.removeEventListener('scroll', debouncedCalc, true);
      debouncedCalc.cancel();
    };
  }, [calculatePositions]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
      setIsExiting(true);
      setTimeout(onComplete, 300);
  };

  return (
    <div className="fixed inset-0 z-50">
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
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
                key={currentStep}
                ref={popoverRef}
                className="absolute z-10 w-80 bg-popover rounded-xl shadow-2xl p-6 border border-border"
                style={popoverStyle}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 10 : 0 }}
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
                    <span className="text-sm font-semibold text-muted-foreground">{currentStep + 1} / {steps.length}</span>
                    <div className="flex items-center gap-2">
                        {currentStep > 0 && <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft size={16}/> Back</Button>}
                        <Button size="sm" onClick={handleNext}>
                            {currentStep === steps.length - 1 ? "Get Started" : "Next"} <ArrowRight size={16} />
                        </Button>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={handleComplete}>
                    <X size={16} />
                </Button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
