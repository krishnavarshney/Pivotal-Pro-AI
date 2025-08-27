
import React, { useState, useMemo, FC, ReactNode } from 'react';
import _ from 'lodash';
import { MagnifyingGlass, PuzzlePiece, Plus, ChartBar, Funnel, Bank } from 'phosphor-react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Template } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import { inputClasses, cn } from '../ui/utils';
import { Badge } from '../ui/Badge';
import { DASHBOARD_TEMPLATES } from '../../utils/constants';

const TemplatePreview: FC<{ templateId: string }> = ({ templateId }) => {
    const commonClasses = "absolute text-muted-foreground/50 transition-all duration-300 group-hover:text-primary/80";
    switch (templateId) {
        case 'blank':
            return <Plus size={64} weight="light" className="transition-transform group-hover:scale-110" />;
        case 'sales_review':
            return (
                <div className="w-full h-full relative overflow-hidden">
                    <ChartBar size={80} weight="thin" className={`${commonClasses} -bottom-4 -right-5 rotate-[15deg] group-hover:-translate-x-1 group-hover:-translate-y-1`} />
                    <div className={`${commonClasses} top-2 left-2 h-10 w-20 rounded-md bg-muted/50 border-2 border-dashed border-muted-foreground/30`}></div>
                </div>
            );
        case 'marketing_perf':
            return (
                 <div className="w-full h-full relative overflow-hidden">
                    <Funnel size={100} weight="thin" className={`${commonClasses} -bottom-6 -right-6 rotate-[-15deg] group-hover:scale-105`} />
                 </div>
            );
        case 'finance_health':
            return (
                 <div className="w-full h-full relative overflow-hidden">
                    <Bank size={80} weight="thin" className={`${commonClasses} bottom-2 right-2 group-hover:scale-105`} />
                     <div className={`${commonClasses} top-2 left-2 h-12 w-16 rounded-md bg-muted/50 border-2 border-dashed border-muted-foreground/30`}></div>
                </div>
            );
        default:
            return <PuzzlePiece size={48} weight="light" />;
    }
};

const TemplateCard: FC<{ template: Template; onSelect: () => void; }> = ({ template, onSelect }) => (
    <div onClick={onSelect} className="group relative cursor-pointer overflow-hidden rounded-xl glass-card shadow-sm transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1 flex flex-col">
        <div className="h-48 bg-secondary/50 flex items-center justify-center relative">
            <TemplatePreview templateId={template.id} />
        </div>
        <div className="p-6 text-center flex-grow flex flex-col">
            <h3 className="font-bold text-lg text-foreground">{template.name}</h3>
            <p className="text-sm text-muted-foreground mt-2 flex-grow">{template.description}</p>
        </div>
        <Badge variant="secondary" className="absolute top-3 right-3">{template.category}</Badge>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold transition-transform group-hover:scale-105">Select Template</button>
        </div>
    </div>
);


export const TemplateSelectionModal: FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { addNewPage, openFieldMappingModal, userTemplates, openTemplateModal } = useDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    const allTemplates = [...DASHBOARD_TEMPLATES, ...userTemplates];
    const categories = ['All', ..._.uniq(allTemplates.map(t => t.category))];

    const filteredTemplates = useMemo(() => {
        return allTemplates.filter(template => {
            const categoryMatch = selectedCategory === 'All' || template.category === selectedCategory;
            const searchMatch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || template.description.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [allTemplates, searchTerm, selectedCategory]);

    const handleSelect = (template: Template) => {
        if (template.requiredFields && template.requiredFields.length > 0) {
            openFieldMappingModal(template, openTemplateModal);
        } else {
            addNewPage(template.page);
        }
        onClose();
    };

    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent containerClassName="w-[95%] lg:w-3/5 max-w-screen-2xl" className="max-h-[85vh] flex flex-col p-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><PuzzlePiece size={20}/>Create New Page from Template</DialogTitle>
                    <DialogDescription>Select a pre-built template or start from scratch to accelerate your analysis.</DialogDescription>
                </DialogHeader>
                
                <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-72">
                        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                        <input type="text" placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={cn(inputClasses, 'pl-9')} />
                    </div>
                    <div className="flex-grow flex items-center gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn('px-3 py-1.5 text-sm font-semibold rounded-full border-2', selectedCategory === cat ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary border-transparent hover:border-border')}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <main className="flex-grow p-6 overflow-y-auto bg-secondary/30">
                     {filteredTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredTemplates.map(template => (
                                <TemplateCard key={template.id} template={template} onSelect={() => handleSelect(template)} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <MagnifyingGlass size={48} weight="light" className="mb-4" />
                            <h3 className="font-semibold text-lg text-foreground">No Templates Found</h3>
                            <p>Your search for "{searchTerm}" did not match any templates.</p>
                        </div>
                    )}
                </main>
            </DialogContent>
        </Dialog>
    );
};