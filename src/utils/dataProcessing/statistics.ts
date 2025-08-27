import _ from 'lodash';
import { formatValue } from './formatting';

// --- STATISTICAL AND DATA SHAPING FUNCTIONS ---
export const calculateNumericStats = (data: (number | null | undefined)[]) => {
    const values = data.filter(v => typeof v === 'number' && isFinite(v)) as number[];
    if (values.length === 0) {
        return { count: 0, missing: data.length, mean: NaN, median: NaN, stdDev: NaN, min: NaN, max: NaN, sum: 0, unique: 0 };
    }

    const sum = _.sum(values);
    const mean = _.mean(values);
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    // Bessel's correction for sample standard deviation
    const stdDev = Math.sqrt(_.sum(values.map(v => Math.pow(v - mean, 2))) / (values.length > 1 ? values.length - 1 : 1));

    return {
        count: values.length,
        missing: data.length - values.length,
        mean,
        median,
        stdDev,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        sum,
        unique: new Set(values).size
    };
};

export const calculateDimensionStats = (data: any[]) => {
    const values = data.filter(v => v !== null && v !== undefined);
    const valueCounts = _.countBy(values.map(v => formatValue(v, {maximumFractionDigits: 2})));
    const uniqueCount = Object.keys(valueCounts).length;
    const topValues = _.chain(valueCounts)
        .toPairs()
        .orderBy([1], ['desc'])
        .take(10)
        .map(([value, count]) => ({ value, count }))
        .value();

    return {
        count: values.length,
        missing: data.length - values.length,
        unique: uniqueCount,
        cardinality: values.length > 0 ? (uniqueCount / values.length) * 100 : 0,
        topValues,
    };
};

export const createHistogramData = (data: (number | null | undefined)[], numBins = 20) => {
    const values = data.filter(v => typeof v === 'number' && isFinite(v)) as number[];
    if (values.length === 0) return { labels: [], data: [] };

    const min = _.min(values)!;
    const max = _.max(values)!;

    if (min === max) return { labels: [String(min)], data: [values.length] };

    const binWidth = (max - min) / numBins;
    if(binWidth === 0) return { labels: [String(min)], data: [values.length] };
    
    const bins = Array(numBins).fill(0);
    const labels = Array(numBins).fill(0).map((_, i) => {
        const binStart = min + i * binWidth;
        const binEnd = binStart + binWidth;
        return `${formatValue(binStart, {maximumFractionDigits: 2})} - ${formatValue(binEnd, {maximumFractionDigits: 2})}`;
    });

    values.forEach(value => {
        let binIndex = Math.floor((value - min) / binWidth);
        // Special case for the max value to fall into the last bin
        if (binIndex === numBins) binIndex--;
        bins[binIndex]++;
    });

    return { labels, data: bins };
};
