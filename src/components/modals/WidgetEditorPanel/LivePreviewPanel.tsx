import React, { FC } from 'react';
import _ from 'lodash';
import { useDashboard } from '../../../contexts/DashboardProvider';
import { DataProcessor } from '../../common/DataProcessor';
import { Eye } from 'lucide-react';

export const LivePreviewPanel: FC = () => {
    const { editingWidgetState } = useDashboard();

    if (!editingWidgetState || (_.isEmpty(editingWidgetState.shelves.rows) && _.isEmpty(editingWidgetState.shelves.columns) && _.isEmpty(editingWidgetState.shelves.values))) {
        return (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground p-8">
                 <div className="text-center">
                    <Eye size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold">Live Preview</h3>
                    <p>Your widget preview will appear here as you build it.</p>
                </div>
            </div>
        );
    }
    return (
        <div className="w-full h-full p-4 overflow-auto">
            <DataProcessor widget={editingWidgetState} />
        </div>
    );
};