import { Parameter } from '../types';

// --- FORMULA ENGINE ---
export const FORMULA_FUNCTION_DEFINITIONS: { [key: string]: { description: string; syntax: string; implementation: (...args: any[]) => any; category: string; } } = {
    // Text
    UPPER: {
        description: 'Converts a string to uppercase.', syntax: 'UPPER(text)', category: 'Text',
        implementation: (str: string) => (typeof str === 'string' ? str.toUpperCase() : str),
    },
    LOWER: {
        description: 'Converts a string to lowercase.', syntax: 'LOWER(text)', category: 'Text',
        implementation: (str: string) => (typeof str === 'string' ? str.toLowerCase() : str),
    },
    CONCAT: {
        description: 'Joins several text strings into one.', syntax: 'CONCAT(text1, [text2], ...)', category: 'Text',
        implementation: (...args: any[]) => args.join(''),
    },
    LEN: {
        description: 'Returns the number of characters in a text string.', syntax: 'LEN(text)', category: 'Text',
        implementation: (str: string) => (typeof str === 'string' ? str.length : 0),
    },
    TRIM: {
        description: 'Removes leading/trailing spaces from text.', syntax: 'TRIM(text)', category: 'Text',
        implementation: (str: string) => (typeof str === 'string' ? str.trim() : str),
    },
    LEFT: {
        description: 'Returns characters from the start of a string.', syntax: 'LEFT(text, num_chars)', category: 'Text',
        implementation: (str: string, count: number) => (typeof str === 'string' ? str.substring(0, count) : str),
    },
    RIGHT: {
        description: 'Returns characters from the end of a string.', syntax: 'RIGHT(text, num_chars)', category: 'Text',
        implementation: (str: string, count: number) => (typeof str === 'string' ? str.substring(str.length - count) : str),
    },
    MID: {
        description: 'Returns characters from the middle of a string.', syntax: 'MID(text, start_num, num_chars)', category: 'Text',
        implementation: (str: string, start: number, count: number) => (typeof str === 'string' ? str.substring(start - 1, start - 1 + count) : str),
    },

    // Numeric
    SUM: {
        description: 'Adds all the numbers in a range of cells.', syntax: 'SUM(number1, [number2], ...)', category: 'Numeric',
        implementation: (...args: number[]) => args.reduce((a, b) => a + (Number(b) || 0), 0),
    },
    AVERAGE: {
        description: 'Returns the average of its arguments.', syntax: 'AVERAGE(number1, [number2], ...)', category: 'Numeric',
        implementation: (...args: number[]) => args.length === 0 ? 0 : args.reduce((a, b) => a + (Number(b) || 0), 0) / args.length,
    },
    ROUND: {
        description: 'Rounds a number to a specified number of digits.', syntax: 'ROUND(number, num_digits)', category: 'Numeric',
        implementation: (num: number, decimals = 0) => {
            if (typeof num !== 'number') return num;
            const factor = Math.pow(10, decimals);
            return Math.round(num * factor) / factor;
        },
    },
    ABS: {
        description: 'Returns the absolute value of a number.', syntax: 'ABS(number)', category: 'Numeric',
        implementation: (num: number) => Math.abs(num),
    },
    POWER: {
        description: 'Returns the result of a number raised to a power.', syntax: 'POWER(number, power)', category: 'Numeric',
        implementation: (base: number, exp: number) => Math.pow(base, exp),
    },
    SQRT: {
        description: 'Returns a positive square root.', syntax: 'SQRT(number)', category: 'Numeric',
        implementation: (num: number) => Math.sqrt(num),
    },
    STDEV: {
        description: 'Estimates standard deviation based on a sample.', syntax: 'STDEV(number1, [number2], ...)', category: 'Statistical',
        implementation: (...args: number[]) => {
            const n = args.length;
            if (n < 2) return null;
            const mean = args.reduce((a, b) => a + b) / n;
            return Math.sqrt(args.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (n - 1));
        },
    },
    VARIANCE: {
        description: 'Estimates variance based on a sample.', syntax: 'VARIANCE(number1, [number2], ...)', category: 'Statistical',
        implementation: (...args: number[]) => {
            const n = args.length;
            if (n < 2) return null;
            const mean = args.reduce((a, b) => a + b) / n;
            return args.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (n - 1);
        },
    },

    // Logical
    IF: {
        description: 'Specifies a logical test to perform.', syntax: 'IF(logical_test, value_if_true, value_if_false)', category: 'Logical',
        implementation: (condition: any, thenVal: any, elseVal: any) => (condition ? thenVal : elseVal),
    },
    AND: {
        description: 'Returns TRUE if all its arguments are TRUE.', syntax: 'AND(logical1, [logical2], ...)', category: 'Logical',
        implementation: (...args: any[]) => args.every(Boolean),
    },
    OR: {
        description: 'Returns TRUE if any argument is TRUE.', syntax: 'OR(logical1, [logical2], ...)', category: 'Logical',
        implementation: (...args: any[]) => args.some(Boolean),
    },
    NOT: {
        description: 'Reverses the logic of its argument.', syntax: 'NOT(logical)', category: 'Logical',
        implementation: (arg: any) => !arg,
    },
    SWITCH: {
        description: 'Evaluates an expression against a list of values and returns the result corresponding to the first matching value.', syntax: 'SWITCH(expression, value1, result1, [default])', category: 'Logical',
        implementation: (expression: any, ...args: any[]) => {
            for (let i = 0; i < args.length - 1; i += 2) {
                if (expression === args[i]) {
                    return args[i+1];
                }
            }
            // Handle default case if it exists
            if (args.length % 2 === 1) {
                return args[args.length - 1];
            }
            return null;
        }
    },

    // Date
    TODAY: {
        description: 'Returns the current date.', syntax: 'TODAY()', category: 'Date',
        implementation: () => new Date(),
    },
    YEAR: {
        description: 'Converts a serial number to a year.', syntax: 'YEAR(date)', category: 'Date',
        implementation: (dateStr: string | number) => new Date(dateStr).getFullYear(),
    },
    MONTH: {
        description: 'Converts a serial number to a month.', syntax: 'MONTH(date)', category: 'Date',
        implementation: (dateStr: string | number) => new Date(dateStr).getMonth() + 1,
    },
    DAY: {
        description: 'Converts a serial number to a day of the month.', syntax: 'DAY(date)', category: 'Date',
        implementation: (dateStr: string | number) => new Date(dateStr).getDate(),
    },
    DATE: {
        description: 'Returns the serial number of a particular date.', syntax: 'DATE(year, month, day)', category: 'Date',
        implementation: (year: number, month: number, day: number) => new Date(year, month - 1, day),
    },
    DATEDIFF: {
        description: 'Calculates the number of days, months, or years between two dates.', syntax: 'DATEDIFF(start_date, end_date, unit)', category: 'Date',
        implementation: (start_date: string | number, end_date: string | number, unit: 'day' | 'month' | 'year') => {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            const msPerDay = 1000 * 60 * 60 * 24;
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            
            switch(unit?.toLowerCase()){
                case 'year': return endDate.getFullYear() - startDate.getFullYear();
                case 'month': return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
                case 'day':
                default:
                    return Math.ceil(diffTime / msPerDay);
            }
        },
    },
};

export const FORMULA_FUNCTIONS = Object.fromEntries(
    Object.entries(FORMULA_FUNCTION_DEFINITIONS).map(([name, def]) => [name, def.implementation])
);

export const evaluateFormulaForRow = (formula: string, row: any, parameters: Parameter[]): any => {
    const scope = { ...row, ...Object.fromEntries(parameters.map(p => [p.name, p.currentValue])) };
    
    // 1. Normalize function names to uppercase to avoid conflicts with JS keywords (e.g., 'if')
    let normalizedFormula = formula;
    for (const funcName of Object.keys(FORMULA_FUNCTIONS)) {
        // Use a regex to replace the function name case-insensitively, but only if it's a whole word followed by an opening parenthesis.
        const regex = new RegExp(`\\b${funcName}\\b(?=\\s*\\()`, 'gi');
        normalizedFormula = normalizedFormula.replace(regex, funcName.toUpperCase());
    }

    // 2. Replace [Field] with a valid reference `scope['Field']`
    const transformedFormula = normalizedFormula.replace(/\[([^\]]+)\]/g, (match, fieldName) => {
        return `scope['${fieldName.replace(/'/g, "\\'")}']`;
    });

    const finalCode = `
        const { ${Object.keys(FORMULA_FUNCTIONS).join(', ')} } = FORMULA_FUNCTIONS;
        return ${transformedFormula};
    `;
    
    try {
        const finalFunc = new Function('FORMULA_FUNCTIONS', 'scope', finalCode);
        return finalFunc(FORMULA_FUNCTIONS, scope);
    } catch (error) {
        console.error("Formula evaluation error:", error);
        return `#ERROR: ${(error as Error).message}`;
    }
};
