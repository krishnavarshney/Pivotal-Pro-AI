import React, { FC } from 'react';
import { Filter, Aperture } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';
import { HelpIcon } from '../ui/HelpIcon';
import { ShelfPill } from '../ui/Pill';
import { NlpFilterBar } from './NlpFilterBar';

const MotionDiv = motion.div;

export const GlobalFilterShelf: FC = () => {
    const { activePage, setGlobalFilters, openPageFiltersModal, crossFilter, setCrossFilter, openFilterConfigModal, newlyAddedPillId } = useDashboard();
    
    const globalFilters = activePage?.globalFilters || [];

    const handleRemovePill = (index: number) => {
        setGlobalFilters(pills => pills.filter((_, i) => i !== index));
    };

    const handlePillClick = (pill: any, index: number) => {
        openFilterConfigModal(pill, (updatedPill) => {
            setGlobalFilters(pills => {
                const newPills = [...pills];
                newPills[index] = updatedPill;
                return newPills;
            });
        });
    };
    
    return (
        <div id="onboarding-filters" className="glass-panel rounded-lg px-3 py-2 border border-border">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-shrink-0">
                     <Button variant="outline" size="sm" onClick={openPageFiltersModal} title="Add or edit filters that affect all widgets on this page.">
                        <span className="icon-hover-anim"><Filter size={14} /></span> Page Filters
                    </Button>
                    <HelpIcon helpText="Page Filters apply to all widgets on this dashboard page. Cross-filters are temporary filters created by clicking on data points within a widget." />
                </div>
                <div className="flex-grow flex items-center gap-2 flex-wrap min-h-[36px]">
                     <AnimatePresence>
                    {globalFilters.map((pill, index) => (
                         <MotionDiv
                            key={pill.id} 
                            layout
                            initial={{opacity:0, scale:0.5}} 
                            animate={{opacity:1, scale:1}} 
                            exit={{opacity:0, scale:0.5}}
                         >
                            <ShelfPill
                                pill={pill}
                                index={index}
                                shelfId="globalFilters"
                                onRemove={() => handleRemovePill(index)}
                                onClick={() => handlePillClick(pill, index)}
                                onMovePill={() => {}}
                                onContextMenu={() => {}}
                                isNew={pill.id === newlyAddedPillId}
                            />
                         </MotionDiv>
                    ))}
                     {crossFilter && (
                         <MotionDiv initial={{opacity:0, scale:0.5}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.5}}>
                            <div className="group relative">
                                <ShelfPill
                                    pill={crossFilter.filter}
                                    index={0}
                                    shelfId="globalFilters"
                                    onRemove={() => setCrossFilter(null)}
                                    onClick={() => {}}
                                    onMovePill={() => {}}
                                    onContextMenu={() => {}}
                                />
                                 <div className="absolute -top-2 -left-2 p-1 bg-primary text-primary-foreground rounded-full animate-border-glow">
                                    <span className="icon-hover-anim"><Aperture size={12} strokeWidth={3}/></span>
                                </div>
                            </div>
                         </MotionDiv>
                     )}
                     </AnimatePresence>
                </div>
                <NlpFilterBar />
            </div>
        </div>
    );
}
