import React, { FC } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { DataProcessor } from '../common/DataProcessor';
import { Eye } from 'lucide-react';

export const CanvasPanel: FC = () => {
    const { editingWidgetState } = useDashboard();

    if (!editingWidgetState || (_.isEmpty(editingWidgetState.shelves.rows) && _.isEmpty(editingWidgetState.shelves.columns) && _.isEmpty(editingWidgetState.shelves.values) && _.isEmpty(editingWidgetState.shelves.category))) {
        return (
            <main className="flex-grow flex items-center justify-center text-muted-foreground p-8 bg-background">
                 <div className="text-center">
                    <Eye size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold">Live Preview</h3>
                    <p>Your widget preview will appear here as you build it.</p>
                </div>
            </main>
        );
    }
    return (
        <main className="flex-grow p-4 bg-background">
            <DataProcessor widget={editingWidgetState} />
        </main>
    );
};
