import { ValueFormat, AggregationType } from '../types';

export const formatValue = (value: any, format?: ValueFormat & { maximumFractionDigits?: number }, aggregation?: AggregationType): string => {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) return '-';
    
    if (value instanceof Date) {
        return value.toLocaleDateString();
    }
    
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    
    // Handle Percentage of Total formatting
    if (aggregation === AggregationType.PERCENT_OF_TOTAL) {
        if (typeof value === 'number') {
            return `${(value * 100).toFixed(2)}%`;
        }
        return '–';
    }

    if (typeof value !== 'number') return String(value);

    const { prefix = '', suffix = '', decimalPlaces } = format || {};
    const maxDecimals = format?.maximumFractionDigits ?? 2;

    const numberPart = decimalPlaces !== undefined && decimalPlaces !== null
        ? value.toLocaleString(undefined, {
              minimumFractionDigits: decimalPlaces,
              maximumFractionDigits: decimalPlaces,
          })
        : value.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: maxDecimals,
          });

    return `${prefix}${numberPart}${suffix}`;
};
