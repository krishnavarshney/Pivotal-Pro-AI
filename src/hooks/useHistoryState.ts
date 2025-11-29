import React, { useState, useCallback } from 'react';
import _ from 'lodash';
import { UndoableState } from '../utils/types';

export const useHistoryState = <T extends UndoableState>(initialState: T, maxHistory = 50) => {
    const [historyState, setHistoryState] = useState<{ history: T[]; pointer: number }>({
        history: [initialState],
        pointer: 0
    });

    const { history, pointer } = historyState;
    const state = history[pointer];

    const setState = useCallback((newState: T | ((prevState: T) => T), fromImport = false) => {
        setHistoryState(current => {
            const { history, pointer } = current;
            const currentState = history[pointer];
            const resolvedState = typeof newState === 'function' ? (newState as (prevState: T) => T)(currentState) : newState;

            if (_.isEqual(resolvedState, currentState)) {
                return current; // No change, don't add to history
            }

            if (fromImport) {
                return {
                    history: [resolvedState],
                    pointer: 0
                };
            }

            const newHistory = history.slice(0, pointer + 1);
            newHistory.push(resolvedState);
            if (newHistory.length > maxHistory) {
                newHistory.shift();
            }

            return {
                history: newHistory,
                pointer: newHistory.length - 1
            };
        });
    }, [maxHistory]);

    const undo = useCallback(() => setHistoryState(prev => ({
        ...prev,
        pointer: Math.max(0, prev.pointer - 1)
    })), []);

    const redo = useCallback(() => setHistoryState(prev => ({
        ...prev,
        pointer: Math.min(prev.history.length - 1, prev.pointer + 1)
    })), []);

    const canUndo = pointer > 0;
    const canRedo = pointer < history.length - 1;

    return { state, setState, undo, redo, canUndo, canRedo };
};