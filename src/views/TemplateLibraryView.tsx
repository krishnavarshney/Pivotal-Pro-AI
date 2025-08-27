import React, { useState, useMemo } from 'react';
import _ from 'lodash';
import { MagnifyingGlass, FunnelSimple, Star, Clock, ListBullets, ChartBar, Wallet, Users, X, CheckCircle, ArrowRight } from 'phosphor-react';
import { useDashboard } from '../contexts/DashboardProvider';
import { Template } from '../utils/types';
import { ViewHeader } from '../components/common/ViewHeader';
import { inputClasses, cn } from '../components/ui/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Sheet, SheetContent } from '../components/ui/Sheet';
import { DASHBOARD_TEMPLATES } from '../utils/constants';
import { motion } from 'framer-motion';
import { useMediaQuery } from '../hooks/useMediaQuery';

const categoryIcons: Record<string, React.ReactNode> = {
    'All': <ListBullets size={16} />,
    'Sales': <ChartBar size={16} />,
    'Marketing': <Wallet size={16} />,
    'Finance': <Wallet size={16} />,
    'Operations': <ListBullets size={16} />,
    'HR Analytics': <Users size={16} />,
    'General': <ListBullets size={16} />,
    'Custom': <ListBullets size={16} />,
};

const difficultyColors: Record<string, string> = {
    'Beginner': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Intermediate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Advanced': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Star key={i} weight={i < rating ? 'fill' : 'regular'} className={`text-yellow-400 ${i < rating ? 'opacity-100' : 'opacity-50'}`} />
        ))}
    </div>
);

const TemplateCard: React.FC<{ template: Template; onSelect: () => void; onPreview: () => void; }> = ({ template, onSelect, onPreview }) => {
    const MotionDiv = motion.div as any;
    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group relative bg-card rounded-xl border border-border shadow-sm transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1 flex flex-col"
        >
            <div className="h-40 bg-secondary/30 flex items-center justify-center relative p-4 border-b border-border">
                <div className="w-full h-full border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground">
                    Template Preview
                </div>
                <Badge className={cn("absolute top-3 right-3", difficultyColors[template.difficulty || 'Beginner'])}>
                    {template.difficulty || 'Beginner'}
                </Badge>
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-lg text-foreground">{template.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground my-2">
                    <StarRating rating={template.rating || 0} />
                    <span>({(template.downloads || 0).toLocaleString()} downloads)</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 flex-grow">{template.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {(template.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
                <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <ListBullets size={16} className="text-primary"/>
                        <span className="text-muted-foreground">Includes {(template.includedWidgets || []).length} widgets</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary"/>
                        <span className="text-muted-foreground">Setup time: {template.setupTime || 'N/A'}</span>
                    </div>
                </div>
            </div>
             <div className="p-4 border-t border-border flex items-center gap-2">
                <Button variant="outline" className="w-full" onClick={onPreview}>Preview</Button>
                <Button className="w-full" onClick={onSelect}>Use Template</Button>
            </div>
        </MotionDiv>
    );
};

export const TemplateLibraryView: React.FC = () => {
    const { addNewPage, openFieldMappingModal, userTemplates, openTemplatePreviewModal, setView } = useDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState('popularity');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const isMobile = useMediaQuery('(max-width: 1023px)');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    const allTemplates = [...DASHBOARD_TEMPLATES, ...userTemplates];
    const categories = ['All', ..._.uniq(allTemplates.map(t => t.category))];

    const filteredAndSortedTemplates = useMemo(() => {
        let templates = allTemplates.filter(template => {
            const categoryMatch = selectedCategory === 'All' || template.category === selectedCategory;
            const searchMatch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || template.description.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });

        if (sort === 'popularity') {
            templates = _.orderBy(templates, ['downloads'], ['desc']);
        } else if (sort === 'name') {
            templates = _.orderBy(templates, ['name'], ['asc']);
        }
        
        return templates;
    }, [allTemplates, searchTerm, selectedCategory, sort]);

    const handleSelect = (template: Template) => {
        if (template.requiredFields && template.requiredFields.length > 0) {
            openFieldMappingModal(template, () => setView('templates'));
        } else {
            addNewPage(template.page);
        }
    };
    
    const FilterPanel = () => (
        <div className="h-full flex flex-col">
            <h3 className="font-semibold text-foreground px-2 pt-4 pb-2 flex-shrink-0">Categories</h3>
            <div className="space-y-1 p-2 overflow-y-auto">
                {categories.map(cat => (
                    <button key={cat} onClick={() => {
                        setSelectedCategory(cat);
                        if(isMobile) setIsFilterOpen(false);
                    }} className={cn('w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', selectedCategory === cat ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                        {categoryIcons[cat] || <ListBullets size={16} />}
                        <span>{cat}</span>
                        <span className="ml-auto text-xs">{cat === 'All' ? allTemplates.length : allTemplates.filter(t => t.category === cat).length}</span>
                    </button>
                ))}
            </div>
        </div>
    );
    
    return (
        <div className="h-full flex flex-col bg-background">
            <ViewHeader icon={<ListBullets size={24} />} title="Dashboard Templates" showBackToDashboard={true}>
                 <div className="relative w-full max-w-xs">
                    <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <input type="text" placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={cn(inputClasses, 'pl-9 h-10')} />
                </div>
                 {isMobile && <Button variant="outline" onClick={() => setIsFilterOpen(true)}><FunnelSimple /> Filter</Button>}
            </ViewHeader>
            <div className="flex-grow flex min-h-0">
                <aside className="w-64 flex-shrink-0 bg-background border-r border-border hidden lg:flex flex-col">
                    <FilterPanel />
                </aside>
                {isMobile && (
                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                           <FilterPanel />
                        </SheetContent>
                    </Sheet>
                )}

                <main className="flex-grow flex flex-col min-h-0">
                    <div className="flex-shrink-0 p-4 border-b border-border flex items-center justify-between">
                         <p className="text-sm text-muted-foreground">Showing {filteredAndSortedTemplates.length} templates</p>
                         <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Sort by:</label>
                             <select value={sort} onChange={e => setSort(e.target.value)} className={cn(inputClasses, 'h-9 text-sm pr-8')}>
                                <option value="popularity">Popularity</option>
                                <option value="name">Name</option>
                            </select>
                         </div>
                    </div>
                    <div className="flex-grow p-6 overflow-y-auto bg-secondary/30">
                        {filteredAndSortedTemplates.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredAndSortedTemplates.map(template => (
                                    <TemplateCard 
                                        key={template.id} 
                                        template={template} 
                                        onSelect={() => handleSelect(template)} 
                                        onPreview={() => openTemplatePreviewModal(template)} 
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                <MagnifyingGlass size={48} weight="light" className="mb-4" />
                                <h3 className="font-semibold text-lg text-foreground">No Templates Found</h3>
                                <p>Your search for "{searchTerm}" did not match any templates.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};