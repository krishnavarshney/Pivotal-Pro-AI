import _ from 'lodash';
import { DataSource, Field, Transformation, TransformationType, FieldType, Parameter, CreateCategoricalPayload, FilterCondition, SplitColumnPayload, MergeColumnsPayload } from '../types';
import { evaluateFormulaForRow } from './formulaEngine';

export const applyTransformsToFields = (
    source: DataSource,
    transformations: Transformation[]
): { dimensions: Field[]; measures: Field[] } => {
    if (!source) return { dimensions: [], measures: [] };

    let fields = _.cloneDeep(source.fields);

    for (const t of transformations) {
        const all = [...fields.dimensions, ...fields.measures];
        switch (t.type) {
            case TransformationType.RENAME_FIELD:
                const { oldName, newName } = t.payload;
                const fieldToRename = all.find(f => f.name === oldName);
                if (fieldToRename) {
                    fieldToRename.name = newName;
                    fieldToRename.simpleName = newName;
                }
                break;
             case TransformationType.DUPLICATE_FIELD: {
                const { fieldName, newFieldName } = t.payload;
                const fieldToDuplicate = all.find(f => f.name === fieldName);
                if (fieldToDuplicate && !all.some(f => f.name === newFieldName)) {
                    const newField = { ...fieldToDuplicate, name: newFieldName, simpleName: newFieldName };
                    if (newField.type === FieldType.MEASURE) {
                        fields.measures.push(newField);
                    } else {
                        fields.dimensions.push(newField);
                    }
                }
                break;
            }
            case TransformationType.DELETE_FIELD:
                fields.dimensions = fields.dimensions.filter(f => f.name !== t.payload.name);
                fields.measures = fields.measures.filter(f => f.name !== t.payload.name);
                break;
            case TransformationType.CHANGE_TYPE: {
                const { name, to } = t.payload;
                const fieldToChange = all.find(f => f.name === name);
                if (fieldToChange && fieldToChange.type !== to) {
                    if (to === FieldType.MEASURE) {
                        fields.dimensions = fields.dimensions.filter(f => f.name !== name);
                        fields.measures.push({ ...fieldToChange, type: FieldType.MEASURE });
                    } else {
                        fields.measures = fields.measures.filter(f => f.name !== name);
                        fields.dimensions.push({ ...fieldToChange, type: FieldType.DIMENSION });
                    }
                }
                break;
            }
             case TransformationType.CONVERT_TO_DATETIME: {
                const { fieldName } = t.payload;
                const fieldToChange = all.find(f => f.name === fieldName);
                if (fieldToChange && fieldToChange.type !== FieldType.DATETIME) {
                    if (fieldToChange.type === FieldType.MEASURE) {
                        fields.measures = fields.measures.filter(f => f.name !== fieldName);
                    } else { // It's a dimension
                        fields.dimensions = fields.dimensions.filter(f => f.name !== fieldName);
                    }
                    // Datetime fields behave like dimensions for grouping purposes
                    fields.dimensions.push({ ...fieldToChange, type: FieldType.DATETIME });
                }
                break;
            }
            case TransformationType.CREATE_CALCULATED_FIELD:
                const { fieldName, formula } = t.payload;
                if (!all.some(f => f.name === fieldName)) {
                    fields.measures.push({
                        name: fieldName,
                        simpleName: fieldName,
                        type: FieldType.MEASURE,
                        isCalculated: true,
                        formula,
                    });
                }
                break;
            case TransformationType.CREATE_CATEGORICAL_COLUMN:
                const { newFieldName } = t.payload as CreateCategoricalPayload;
                 if (!all.some(f => f.name === newFieldName)) {
                    fields.dimensions.push({
                        name: newFieldName,
                        simpleName: newFieldName,
                        type: FieldType.DIMENSION,
                        isCalculated: true
                    });
                }
                break;
            case TransformationType.SPLIT_COLUMN:
                const { newColumnNames } = t.payload as SplitColumnPayload;
                newColumnNames.forEach((colName: string) => {
                     if (!all.some(f => f.name === colName)) {
                        fields.dimensions.push({
                            name: colName,
                            simpleName: colName,
                            type: FieldType.DIMENSION,
                        });
                     }
                });
                break;
            case TransformationType.MERGE_COLUMNS:
                const { newFieldName: mergeNewFieldName, columnsToMerge, deleteOriginals } = t.payload as MergeColumnsPayload;
                if (!all.some(f => f.name === mergeNewFieldName)) {
                    fields.dimensions.push({
                        name: mergeNewFieldName,
                        simpleName: mergeNewFieldName,
                        type: FieldType.DIMENSION,
                    });
                }
                if(deleteOriginals) {
                    fields.dimensions = fields.dimensions.filter(f => !columnsToMerge.includes(f.name));
                    fields.measures = fields.measures.filter(f => !columnsToMerge.includes(f.name));
                }
                break;
        }
    }
    return fields;
};

export const applyTransformsToData = (
    data: any[],
    transformations: Transformation[],
    originalFields: Field[],
    parameters: Parameter[]
): any[] => {
    if (!transformations.length) {
        return data;
    }

    let transformedData = _.cloneDeep(data);

    for (const t of transformations) {
        switch (t.type) {
            case TransformationType.RENAME_FIELD: {
                const { oldName, newName } = t.payload;
                transformedData.forEach(row => {
                    if (Object.prototype.hasOwnProperty.call(row, oldName)) {
                        row[newName] = row[oldName];
                        delete row[oldName];
                    }
                });
                break;
            }
            case TransformationType.DELETE_FIELD: {
                const { name } = t.payload;
                transformedData.forEach(row => {
                    delete row[name];
                });
                break;
            }
            case TransformationType.DUPLICATE_FIELD: {
                const { fieldName, newFieldName } = t.payload;
                transformedData.forEach(row => {
                    row[newFieldName] = row[fieldName];
                });
                break;
            }
            case TransformationType.CHANGE_TYPE: {
                const { name, to } = t.payload;
                transformedData.forEach(row => {
                    if (row[name] !== null && row[name] !== undefined) {
                        if (to === FieldType.MEASURE) {
                            const num = Number(row[name]);
                            row[name] = isNaN(num) ? null : num;
                        } else {
                            row[name] = String(row[name]);
                        }
                    }
                });
                break;
            }
            case TransformationType.STANDARDIZE_TEXT: {
                const { fieldName, operation } = t.payload;
                transformedData.forEach(row => {
                    if (typeof row[fieldName] === 'string') {
                        if (operation === 'trim') row[fieldName] = row[fieldName].trim();
                        else if (operation === 'uppercase') row[fieldName] = row[fieldName].toUpperCase();
                        else if (operation === 'lowercase') row[fieldName] = row[fieldName].toLowerCase();
                    }
                });
                break;
            }
            case TransformationType.HANDLE_NULLS: {
                const { fieldName, strategy, value } = t.payload;
                if (strategy === 'value') {
                    transformedData.forEach(row => {
                        if (row[fieldName] === null || row[fieldName] === undefined || row[fieldName] === '') {
                            row[fieldName] = value;
                        }
                    });
                } else if (strategy === 'remove_row') {
                    transformedData = transformedData.filter(row => row[fieldName] !== null && row[fieldName] !== undefined && row[fieldName] !== '');
                }
                break;
            }
            case TransformationType.REMOVE_DUPLICATES: {
                transformedData = _.uniqWith(transformedData, _.isEqual);
                break;
            }
            case TransformationType.CREATE_CALCULATED_FIELD: {
                const { fieldName, formula } = t.payload;
                transformedData.forEach(row => {
                    row[fieldName] = evaluateFormulaForRow(formula, row, parameters);
                });
                break;
            }
            case TransformationType.CREATE_CATEGORICAL_COLUMN: {
                const { newFieldName, rules, defaultValue } = t.payload as CreateCategoricalPayload;
                transformedData.forEach(row => {
                    let ruleMatched = false;
                    for (const rule of rules) {
                        if (ruleMatched) continue;
                        const rowValue = row[rule.sourceField];
                        if (rowValue === undefined || rowValue === null) continue;
                        
                        let conditionMet = false;
                        const ruleValue = rule.value;
                        switch (rule.condition) {
                            case FilterCondition.EQUALS: conditionMet = rowValue == ruleValue; break;
                            case FilterCondition.NOT_EQUALS: conditionMet = rowValue != ruleValue; break;
                            case FilterCondition.CONTAINS: conditionMet = String(rowValue).toLowerCase().includes(String(ruleValue).toLowerCase()); break;
                            case FilterCondition.DOES_NOT_CONTAIN: conditionMet = !String(rowValue).toLowerCase().includes(String(ruleValue).toLowerCase()); break;
                            case FilterCondition.STARTS_WITH: conditionMet = String(rowValue).toLowerCase().startsWith(String(ruleValue).toLowerCase()); break;
                            case FilterCondition.ENDS_WITH: conditionMet = String(rowValue).toLowerCase().endsWith(String(ruleValue).toLowerCase()); break;
                            case FilterCondition.IS_ONE_OF: conditionMet = Array.isArray(ruleValue) && ruleValue.some(v => _.isEqual(v, rowValue)); break;
                            case FilterCondition.IS_NOT_ONE_OF: conditionMet = Array.isArray(ruleValue) && !ruleValue.some(v => _.isEqual(v, rowValue)); break;
                            case FilterCondition.GREATER_THAN: conditionMet = rowValue > ruleValue; break;
                            case FilterCondition.LESS_THAN: conditionMet = rowValue < ruleValue; break;
                            case FilterCondition.GREATER_THAN_OR_EQUAL: conditionMet = rowValue >= ruleValue; break;
                            case FilterCondition.LESS_THAN_OR_EQUAL: conditionMet = rowValue <= ruleValue; break;
                            case FilterCondition.BETWEEN: conditionMet = Array.isArray(ruleValue) && rowValue >= ruleValue[0] && rowValue <= ruleValue[1]; break;
                        }

                        if (conditionMet) {
                            row[newFieldName] = rule.output;
                            ruleMatched = true;
                        }
                    }
                    if (!ruleMatched) {
                        row[newFieldName] = defaultValue;
                    }
                });
                break;
            }
            case TransformationType.SPLIT_COLUMN: {
                const { fieldName, delimiter, newColumnNames } = t.payload as SplitColumnPayload;
                transformedData.forEach(row => {
                    const value = String(row[fieldName] || '');
                    const parts = value.split(delimiter);
                    newColumnNames.forEach((colName, i) => {
                        row[colName] = parts[i] || null;
                    });
                });
                break;
            }
            case TransformationType.MERGE_COLUMNS: {
                const { newFieldName, columnsToMerge, separator, deleteOriginals } = t.payload as MergeColumnsPayload;
                transformedData.forEach(row => {
                    row[newFieldName] = columnsToMerge.map(col => row[col]).join(separator);
                    if (deleteOriginals) {
                        columnsToMerge.forEach(col => delete row[col]);
                    }
                });
                break;
            }
            case TransformationType.CONVERT_TO_DATETIME: {
                const { fieldName } = t.payload;
                transformedData.forEach(row => {
                    if (row[fieldName]) {
                        const date = new Date(row[fieldName]);
                        row[fieldName] = !isNaN(date.getTime()) ? date : null;
                    }
                });
                break;
            }
        }
    }
    return transformedData;
};
