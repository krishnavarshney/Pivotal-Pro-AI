import React, { FC } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

export const FloatingActionButton: FC = () => {
    const { openWidgetEditorModal, dashboardMode, activePage } = useDashboard();
    const shouldShow = activePage && dashboardMode === 'edit';

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    id="onboarding-fab"
                    initial={{ scale: 0, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0, y: 50, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="fixed bottom-6 right-6 z-40"
                >
                    <Tooltip content="Create New Widget" placement="left">
                        <Button
                            onClick={() => openWidgetEditorModal()}
                            className="h-14 w-14 rounded-full shadow-lg"
                        >
                            <Plus size={24} />
                        </Button>
                    </Tooltip>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
