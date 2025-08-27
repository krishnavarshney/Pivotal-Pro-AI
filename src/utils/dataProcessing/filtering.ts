import _ from 'lodash';
import { Pill, FilterCondition } from '../types';

export const applyFilters = (data: { [key: string]: any }[], filters: Pill[]): { [key:string]: any }[] => {
    if (filters.length === 0) return data;

    let filtered = data;
    for (const filterPill of filters) {
        if (!filterPill.filter || !filterPill.filter.values || filterPill.filter.values.length === 0) continue;

        const { name, filter } = filterPill;
        const { condition, values } = filter;

        filtered = filtered.filter(row => {
            const rowValue = row[name];
            if (rowValue === undefined || rowValue === null) return false;

            if (rowValue instanceof Date) {
                const rowTime = rowValue.getTime();
                if (condition === FilterCondition.BETWEEN) {
                    if (!values[0] || !values[1]) return false;
                    return rowTime >= new Date(values[0]).getTime() && rowTime <= new Date(values[1]).getTime();
                }
                 // Fallback for other conditions (may not be ideal but prevents crashes)
                return true;
            }

            switch (condition) {
                case FilterCondition.IS_ONE_OF:
                    return values.some(v => _.isEqual(v, rowValue));
                case FilterCondition.IS_NOT_ONE_OF:
                    return !values.some(v => _.isEqual(v, rowValue));
                case FilterCondition.EQUALS:
                    return rowValue == values[0];
                case FilterCondition.NOT_EQUALS:
                    return rowValue != values[0];
                case FilterCondition.GREATER_THAN:
                    return rowValue > values[0];
                case FilterCondition.LESS_THAN:
                    return rowValue < values[0];
                case FilterCondition.GREATER_THAN_OR_EQUAL:
                    return rowValue >= values[0];
                case FilterCondition.LESS_THAN_OR_EQUAL:
                    return rowValue <= values[0];
                case FilterCondition.BETWEEN:
                    return rowValue >= values[0] && rowValue <= values[1];
                case FilterCondition.CONTAINS:
                    return String(rowValue).toLowerCase().includes(String(values[0]).toLowerCase());
                case FilterCondition.DOES_NOT_CONTAIN:
                    return !String(rowValue).toLowerCase().includes(String(values[0]).toLowerCase());
                case FilterCondition.STARTS_WITH:
                    return String(rowValue).toLowerCase().startsWith(String(values[0]).toLowerCase());
                case FilterCondition.ENDS_WITH:
                    return String(rowValue).toLowerCase().endsWith(String(values[0]).toLowerCase());
                default:
                    return true;
            }
        });
    }
    return filtered;
};
