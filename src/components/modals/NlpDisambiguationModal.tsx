
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { HelpCircle } from 'lucide-react';

interface NlpDisambiguationModalProps {
    isOpen: boolean;
    onClose: () => void;
    term: string;
    fields: string[];
    onResolve: (term: string, field: string) => void;
}

export const NlpDisambiguationModal: React.FC<NlpDisambiguationModalProps> = ({ isOpen, onClose, term, fields, onResolve }) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HelpCircle size={20} className="text-primary" />
                        Clarification Needed
                    </DialogTitle>
                    <DialogDescription>
                        The term "{term}" was found in multiple fields. Please select which field you'd like to filter.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-3">
                    {fields.map(field => (
                        <Button
                            key={field}
                            variant="outline"
                            className="w-full justify-start text-base py-6"
                            onClick={() => onResolve(term, field)}
                        >
                            {field}
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
