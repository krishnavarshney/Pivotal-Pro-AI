import React, { useState, useCallback } from 'react';
import _ from 'lodash';
import { Workspace, Transformation } from '../utils/types';

export type UndoableState = {
    workspaces: Workspace[];
    transformations: [string, Transformation[]][];
};

export const useHistoryState = <T extends UndoableState>(initialState: T, maxHistory = 50) => {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [pointer, setPointer] = useState(0);

    const state = history[pointer];

    const setState = useCallback((newState: T | ((prevState: T) => T), fromImport = false) => {
        setHistory(currentHistory => {
            const resolvedState = typeof newState === 'function' ? (newState as (prevState: T) => T)(currentHistory[pointer]) : newState;
            if (_.isEqual(resolvedState, currentHistory[pointer])) {
                return currentHistory; // No change, don't add to history
            }

            if (fromImport) {
                const newHistory = [resolvedState];
                setPointer(0);
                return newHistory;
            }
            
            const newHistory = currentHistory.slice(0, pointer + 1);
            newHistory.push(resolvedState);
            if (newHistory.length > maxHistory) {
                newHistory.shift();
            }
            setPointer(newHistory.length - 1);
            return newHistory;
        });
    }, [pointer, maxHistory]);

    const undo = () => setPointer(p => Math.max(0, p - 1));
    const redo = () => setPointer(p => Math.min(history.length - 1, p + 1));

    const canUndo = pointer > 0;
    const canRedo = pointer < history.length - 1;

    return { state, setState, undo, redo, canUndo, canRedo };
};