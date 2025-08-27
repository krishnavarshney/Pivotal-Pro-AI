import React, { useState, useMemo, FC, ReactNode } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { ChartType, FieldType, WidgetState, Field, SectionSettings } from '../../utils/types';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { inputClasses } from '../ui/utils';
import { SlidersHorizontal, List, CaretDown, Calendar, Hash, TextT, Tabs, ArrowLeft, MagnifyingGlass, Layout as LayoutIcon } from 'phosphor-react';
import { motion, AnimatePresence } from 'framer-motion';

const ControlCard: FC<{ icon: ReactNode; title: string; description: string; onClick: () => void; disabled?: boolean; }> = ({ icon, title, description, onClick, disabled = false }) => (
    <button onClick={onClick} disabled={disabled} className="w-full p-4 flex items-center gap-4 bg-secondary rounded-xl text-left hover:bg-accent border border-border hover:border-primary/50 transition-all disabled:opacity-50 disabled:pointer-events-none">
        <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center text-primary">{icon}</div>
        <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    </button>
);


export const AddControlModal: FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { blendedFields, parameters, saveWidget, blendedData, dashboardDefaults } = useDashboard();
    const [step, setStep] = useState<'type' | 'field' | 'display'>('type');
    const [controlType, setControlType] = useState<'dimension' | 'measure' | 'parameter' | null>(null);
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const MotionDiv = motion.div as any;

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep('type');
            setControlType(null);
            setSelectedField(null);
            setSearchTerm('');
        }, 200);
    }
    
    const handleCreateControl = (type: 'parameter' | 'field', id: string, display: WidgetState['controlSettings']['display']) => {
        const field = [...blendedFields.dimensions, ...blendedFields.measures].find(f => f.name === id);
        const parameter = parameters.find(p => p.id === id);

        const newWidget: WidgetState = {
            id: 'new',
            chartType: ChartType.CONTROL,
            displayMode: 'control',
            shelves: { columns: [], rows: [], values: [], filters: [] },
            subtotalSettings: { rows: false, columns: false, grandTotal: false },
            colorPalette: dashboardDefaults.colorPalette,
            targetType: type,
            targetId: id,
            title: field ? `Filter by ${field.simpleName}` : (parameter ? `Control: ${parameter.name}` : 'New Control'),
            controlSettings: { display },
        };
        saveWidget(newWidget);
        handleClose();
    };

    const handleCreateSectionHeader = () => {
        const newWidget: WidgetState = {
            id: 'new',
            chartType: ChartType.CONTROL,
            displayMode: 'section',
            shelves: { columns: [], rows: [], values: [], filters: [] },
            subtotalSettings: { rows: false, columns: false, grandTotal: false },
            title: 'New Section',
            sectionSettings: {
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'left',
                paddingY: 8,
            } as SectionSettings
        };
        const layoutOverride = { w: 24, h: 2, minH: 1, maxH: 2, isResizable: false };
        saveWidget(newWidget, layoutOverride);
        handleClose();
    };
    
    const hasDimensions = blendedFields.dimensions.some(f => f.type === FieldType.DIMENSION);
    const hasMeasures = blendedFields.measures.length > 0;
    const hasDatetimes = blendedFields.dimensions.some(f => f.type === FieldType.DATETIME);

    const renderTypeStep = () => (
        <div className="space-y-4">
            <ControlCard 
                icon={<TextT size={24} />} 
                title="Filter by Dimension" 
                description="Create a filter from a text, category, or date field."
                onClick={() => { setControlType('dimension'); setStep('field'); }}
                disabled={!hasDimensions && !hasDatetimes}
            />
            <ControlCard 
                icon={<Hash size={24} />} 
                title="Filter by Measure" 
                description="Create a range slider for a numeric field."
                onClick={() => { setControlType('measure'); setStep('field'); }}
                disabled={!hasMeasures}
            />
            <ControlCard
                icon={<LayoutIcon size={24} />}
                title="Section Header"
                description="Add a title bar to organize your dashboard layout."
                onClick={handleCreateSectionHeader}
            />
        </div>
    );
    
    const renderFieldStep = () => {
        const fields = controlType === 'dimension' 
            ? blendedFields.dimensions 
            : controlType === 'measure' ? blendedFields.measures : [];
        
        const filteredFields = fields.filter(f => f.simpleName.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div>
                <input type="text" placeholder="Search fields..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputClasses} mb-4`} />
                <div className="space-y-2">
                    {filteredFields.map(field => (
                        <button key={field.name} onClick={() => {
                            setSelectedField(field);
                            if (field.type === FieldType.MEASURE) {
                                handleCreateControl('field', field.name, 'range');
                            } else if (field.type === FieldType.DATETIME) {
                                handleCreateControl('field', field.name, 'datepicker');
                            } else {
                                setStep('display');
                            }
                        }} className="w-full p-2 flex items-center gap-2 hover:bg-accent rounded-lg text-left">
                            {field.type === FieldType.MEASURE ? <Hash /> : <TextT />}
                            {field.simpleName}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderDisplayOptions = () => (
        <div className="space-y-4">
            <ControlCard icon={<List size={24} />} title="List" description="Checkbox list of all values." onClick={() => handleCreateControl('field', selectedField!.name, 'list')} />
            <ControlCard icon={<CaretDown size={24} />} title="Dropdown" description="Compact dropdown menu for selection." onClick={() => handleCreateControl('field', selectedField!.name, 'dropdown')} />
            <ControlCard icon={<Tabs size={24} />} title="Tabs" description="Interactive tab buttons for filtering." onClick={() => handleCreateControl('field', selectedField!.name, 'tabs')} />
        </div>
    );

    const renderContent = () => {
        switch(step) {
            case 'field': return renderFieldStep();
            case 'display': return renderDisplayOptions();
            case 'type':
            default: return renderTypeStep();
        }
    };
    
    const getTitle = () => {
        if (step === 'field') return `Select a ${controlType}`;
        if (step === 'display') return `Choose display for "${selectedField?.simpleName}"`;
        return 'Add a Control';
    }

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogOverlay />
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                         {step !== 'type' && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 mr-2" onClick={() => setStep(step === 'display' ? 'field' : 'type')}>
                                <ArrowLeft size={16} />
                            </Button>
                         )}
                        <SlidersHorizontal size={20} /> {getTitle()}
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6 max-h-[60vh] overflow-y-auto min-h-[200px]">
                    <AnimatePresence mode="wait">
                        <MotionDiv
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                             {renderContent()}
                        </MotionDiv>
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
};