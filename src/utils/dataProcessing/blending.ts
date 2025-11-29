import _ from 'lodash';
import { DataSource, Field, Relationship } from '../types';

// --- DATA BLENDING ENGINE ---
export const prefixKeys = (obj: any, prefix: string): any => {
    if (!obj) return {};
    return Object.keys(obj).reduce((acc, key) => {
        acc[`${prefix}.${key}`] = obj[key];
        return acc;
    }, {} as { [key: string]: any });
};

function groupByTyped<T>(collection: readonly T[], iteratee: (item: T) => any): Map<any, T[]> {
    const map = new Map<any, T[]>();
    for (const item of collection) {
        const key = iteratee(item);
        if (key === undefined || key === null) continue;
        let group = map.get(key);
        if (!group) {
            group = [];
            map.set(key, group);
        }
        group.push(item);
    }
    return map;
}

export const blendData = (
    dataSources: Map<string, DataSource>,
    relationships: Relationship[]
): { blendedData: any[]; blendedFields: { dimensions: Field[]; measures: Field[] } } => {
    if (dataSources.size === 0) {
        return { blendedData: [], blendedFields: { dimensions: [], measures: [] } };
    }

    // If no relationships or just one source, return the prefixed data from the first source
    if (relationships.length === 0 || dataSources.size === 1) {
        const firstSource = dataSources.values().next().value;
        if (!firstSource || !firstSource.data) return { blendedData: [], blendedFields: { dimensions: [], measures: [] } };

        const prefix = firstSource.name;
        const blendedData = firstSource.data.map(row => prefixKeys(row, prefix));
        const blendedFields = {
            dimensions: firstSource.fields.dimensions.map(f => ({ ...f, name: `${prefix}.${f.name}`, simpleName: f.simpleName })),
            measures: firstSource.fields.measures.map(f => ({ ...f, name: `${prefix}.${f.name}`, simpleName: f.simpleName })),
        };
        return { blendedData, blendedFields };
    }

    // --- Advanced Blending with Relationships ---

    // Determine the "base" source, ideally the one that appears most often on the "left" side of relationships.
    const sourceFrequency = _.countBy(relationships.map(r => r.sourceAId));
    const baseSourceId = _.maxBy(Object.keys(sourceFrequency), id => sourceFrequency[id]) || relationships[0].sourceAId;
    const baseSource = dataSources.get(baseSourceId);

    if (!baseSource) {
        console.error(`Base data source for blending not found. Aborting.`);
        return { blendedData: [], blendedFields: { dimensions: [], measures: [] } };
    }

    let currentBlendedData = baseSource.data.map(row => prefixKeys(row, baseSource.name));
    const joinedSourceIds = new Set([baseSourceId]);

    const allFields = {
        dimensions: baseSource.fields.dimensions.map(f => ({ ...f, name: `${baseSource.name}.${f.name}`, simpleName: f.simpleName })),
        measures: baseSource.fields.measures.map(f => ({ ...f, name: `${baseSource.name}.${f.name}`, simpleName: f.simpleName })),
    };

    // Sequentially apply joins. A more advanced version might build a join tree.
    for (const rel of relationships) {
        const sourceA = dataSources.get(rel.sourceAId);
        const sourceB = dataSources.get(rel.sourceBId);

        if (!sourceA || !sourceB) continue;

        // Determine which source is already in the blend and which is new
        const isAJoined = joinedSourceIds.has(rel.sourceAId);
        const isBJoined = joinedSourceIds.has(rel.sourceBId);

        if (isAJoined && isBJoined) continue; // Skip joins between already blended sources

        if (!isAJoined && !isBJoined) {
            console.warn(`Skipping disconnected relationship: ${sourceA.name} <-> ${sourceB.name}`);
            continue;
        }

        const existingSource = isAJoined ? sourceA : sourceB;
        const newSource = isAJoined ? sourceB : sourceA;
        const existingField = isAJoined ? rel.fieldA : rel.fieldB;
        const newField = isAJoined ? rel.fieldB : rel.fieldA;

        // Adjust join type if we reversed the sources
        let joinType = rel.type;
        if (!isAJoined) {
            if (joinType === 'left') joinType = 'right';
            else if (joinType === 'right') joinType = 'left';
        }

        const fullExistingFieldName = `${existingSource.name}.${existingField}`;
        const newSourceDataMap = groupByTyped(newSource.data, row => row[newField]);

        const nextBlendedData: any[] = [];
        const newSourcePrefixedNulls = [...newSource.fields.dimensions, ...newSource.fields.measures]
            .reduce((acc, f) => ({ ...acc, [`${newSource.name}.${f.name}`]: null }), {});

        currentBlendedData.forEach(existingRow => {
            const joinValue = existingRow[fullExistingFieldName];
            const matchingNewRows = newSourceDataMap.get(joinValue);

            if (matchingNewRows) {
                matchingNewRows.forEach(newRow => {
                    nextBlendedData.push({ ...existingRow, ...prefixKeys(newRow, newSource.name) });
                });
            } else if (joinType === 'left' || joinType === 'full') {
                nextBlendedData.push({ ...existingRow, ...newSourcePrefixedNulls });
            }
        });

        if (joinType === 'right' || joinType === 'full') {
            const joinedNewSourceKeys = new Set(currentBlendedData.map(row => row[fullExistingFieldName]));
            newSource.data.forEach(newRow => {
                if (!joinedNewSourceKeys.has(newRow[newField])) {
                    const existingSourcePrefixedNulls = Object.keys(currentBlendedData[0] || {})
                        .reduce((acc, key) => ({ ...acc, [key]: null }), {});
                    nextBlendedData.push({ ...existingSourcePrefixedNulls, ...prefixKeys(newRow, newSource.name) });
                }
            });
        }

        currentBlendedData = nextBlendedData;

        // Add new fields to the schema and mark the new source as joined
        allFields.dimensions.push(...newSource.fields.dimensions.map(f => ({ ...f, name: `${newSource.name}.${f.name}`, simpleName: f.simpleName })));
        allFields.measures.push(...newSource.fields.measures.map(f => ({ ...f, name: `${newSource.name}.${f.name}`, simpleName: f.simpleName })));
        joinedSourceIds.add(newSource.id);
    }

    return { blendedData: currentBlendedData, blendedFields: allFields };
};
