import React from 'react';
import { DataContextProps } from '../utils/types';

export const DataContext = React.createContext<DataContextProps | null>(null);

export const useData = (): DataContextProps => {
    const context = React.useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
