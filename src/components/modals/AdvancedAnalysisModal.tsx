
import React, { FC, ReactNode } from 'react';
import { AdvancedAnalysisResult, WhatIfResult } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { FormattedInsight } from '../ui/FormattedInsight';
import { cn } from '../ui/utils';
import { Sparkle, AlertCircle, Users, Aperture, TrendingUp, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatValue } from '../../utils/dataProcessing/formatting';


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

const WhatIfResultDisplay: FC<{ result: WhatIfResult }> = ({ result }) => {
    const MotionDiv = motion.div as any;
    const sensitivityData = result.sensitivityAnalysis
        .map(item => ({
            ...item,
            fill: item.impact > 0 ? 'var(--color-positive)' : 'var(--color-negative)',
        }))
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    const maxImpact = Math.max(...sensitivityData.map(d => Math.abs(d.impact)), 0);

    return (
        <div
            className="space-y-8"
            style={{
                '--color-positive': 'hsl(142 76% 46%)',
                '--color-negative': 'hsl(0 84% 60%)',
            } as React.CSSProperties}
        >
            <div className="text-center p-6 bg-secondary/30 rounded-xl border border-border">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Predicted Outcome</h4>
                <p className="text-6xl font-bold font-display text-primary my-2 tracking-tighter">
                    {formatValue(result.predictedValue)}
                </p>
                <p className="text-muted-foreground">
                    with 95% confidence between{' '}
                    <span className="font-semibold text-foreground">{formatValue(result.confidenceInterval[0])}</span> and{' '}
                    <span className="font-semibold text-foreground">{formatValue(result.confidenceInterval[1])}</span>.
                </p>
            </div>

            <div>
                <h4 className="font-bold text-lg text-foreground mb-3 font-display">Key Drivers of Change</h4>
                <div className="bg-card rounded-xl border p-4 space-y-3">
                    {sensitivityData.map(item => (
                        <div key={item.variable} className="flex items-center gap-4 text-sm" title={`${item.variable}: ${item.impact.toFixed(1)}% impact`}>
                            <div className="w-1/3 truncate font-medium text-foreground">{item.variable}</div>
                            <div className="w-2/3 flex items-center gap-2">
                                <div className="flex-grow bg-secondary rounded-full h-2.5 overflow-hidden">
                                    <MotionDiv
                                        className="h-full"
                                        style={{ background: item.impact > 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(Math.abs(item.impact) / (maxImpact || 1)) * 100}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                                    />
                                </div>
                                <div className={cn(
                                    "w-20 text-right font-mono font-semibold flex items-center justify-end gap-1",
                                    item.impact > 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'
                                )}>
                                    {item.impact > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                    {formatValue(item.impact, { decimalPlaces: 1, suffix: '%' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {sensitivityData.length === 0 && <p className="text-muted-foreground text-center p-4">No significant drivers identified.</p>}
                </div>
            </div>
        </div>
    );
};


export const AdvancedAnalysisModal: FC<{ isOpen: boolean; onClose: () => void; result: AdvancedAnalysisResult | null; title: string; }> = ({ isOpen, onClose, result, title }) => {
    const MotionDiv = motion.div as any;
    if (!isOpen || !result) return null;

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
                        {result.whatIfResult ? (
                            <WhatIfResultDisplay result={result.whatIfResult} />
                        ) : (
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
                        )}
                    </MotionDiv>
                </MotionDiv>
            </DialogContent>
        </Dialog>
    )
};
