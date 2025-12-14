
import React, { FC, ReactNode } from 'react';
import { AdvancedAnalysisResult } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { FormattedInsight } from '../ui/FormattedInsight';
import { Sparkle, AlertCircle, Users, Aperture, TrendingUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';


const getDetailIcon = (heading: string): ReactNode => {
    const lowerHeading = heading.toLowerCase();
    if (lowerHeading.includes('anomaly') || lowerHeading.includes('outlier') || lowerHeading.includes('spike') || lowerHeading.includes('dip')) {
        return <AlertCircle size={24} className="text-amber-500" />;
    }
    if (lowerHeading.includes('influencer') || lowerHeading.includes('driver') || lowerHeading.includes('segment')) {
        return <Users size={24} className="text-sky-500" />;
    }
    if (lowerHeading.includes('cluster') || lowerHeading.includes('group')) {
        return <Aperture size={24} className="text-teal-500" />;
    }
    if (lowerHeading.includes('trend') || lowerHeading.includes('growth') || lowerHeading.includes('increase')) {
        return <TrendingUp size={24} className="text-green-500" />;
    }
    return <Info size={24} className="text-muted-foreground" />;
};


export const AdvancedAnalysisModal: FC<{ isOpen: boolean; onClose: () => void; result: AdvancedAnalysisResult | null; title: string; }> = ({ isOpen, onClose, result, title }) => {
    const MotionDiv = motion.div as any;
    if (!isOpen) return null;

    // Loading State
    if (!result) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogOverlay />
                <DialogContent className="max-w-lg min-h-[300px] flex flex-col items-center justify-center">
                    <DialogHeader className="sr-only">
                         <DialogTitle>{title || "Loading..."}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <Sparkle className="absolute inset-0 m-auto text-primary animate-pulse" size={24} />
                        </div>
                        <p className="text-lg font-medium text-foreground animate-pulse">{title || "Analyzing Data..."}</p>
                        <p className="text-sm text-muted-foreground text-center px-8">
                            Based on the dataset size, this might take a few seconds.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
            },
        },
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                             <span className="icon-hover-anim inline-block"><Sparkle size={22} className="text-primary"/></span>
                        </span>
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <MotionDiv 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-6 max-h-[70vh] overflow-y-auto space-y-6"
                >
                    <MotionDiv variants={itemVariants} className="p-6 bg-secondary/50 rounded-xl border border-border">
                        <h4 className="font-bold text-lg text-foreground mb-2 font-display">Executive Summary</h4>
                        <FormattedInsight text={result.summary} />
                    </MotionDiv>
                     
                    <MotionDiv variants={itemVariants}>
                        <div>
                            <h4 className="font-bold text-lg text-foreground mb-4 font-display">Detailed Findings</h4>
                            <div className="space-y-4">
                            {result.details.map((detail, i) => (
                                <MotionDiv 
                                    key={i} 
                                    variants={itemVariants} 
                                    className="p-4 bg-card rounded-xl border border-border flex items-start gap-4"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <span className="icon-hover-anim inline-block">{getDetailIcon(detail.heading)}</span>
                                    </div>
                                    <div className="flex-grow">
                                        <h5 className="font-semibold mb-1 text-foreground">{detail.heading}</h5>
                                        <FormattedInsight text={detail.content} className="prose-sm"/>
                                    </div>
                                </MotionDiv>
                            ))}
                            </div>
                        </div>
                    </MotionDiv>
                </MotionDiv>
            </DialogContent>
        </Dialog>
    )
};
