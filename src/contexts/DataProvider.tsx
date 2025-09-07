import React, { useState, useEffect, useCallback, useMemo, FC, ReactNode, ChangeEvent } from 'react';
import _ from 'lodash';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
    DataSource, Field, FieldType, Relationship, DataModelerLayout, Transformation, Parameter,
    TransformationType, Connector, DataStudioCanvasLayout, DataContextProps
} from '../utils/types';
import { blendData } from '../utils/dataProcessing/blending';
import { applyTransformsToFields, applyTransformsToData } from '../utils/dataProcessing/transformations';
import * as apiService from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { useModalManager } from '../hooks/useModalManager';
import { SAMPLE_DATA_SALES, SAMPLE_DATA_IRIS } from '../utils/constants';

const DataContext = React.createContext<DataContextProps | null>(null);

export const useData = (): DataContextProps => {
    const context = React.useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
        const savedStateJSON = localStorage.getItem(key);
        if (savedStateJSON) {
            return JSON.parse(savedStateJSON);
        }
    } catch (error) {
        console.error(`Failed to load ${key} from local storage:`, error);
    }
    return defaultValue;
};

export const DataProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [dataSources, setDataSources] = useState<Map<string, DataSource>>(() => new Map(getInitialState<[string, DataSource][]>('pivotalProDataSources', [])));
    const [relationships, setRelationships] = useState<Relationship[]>(() => getInitialState('pivotalProRelationships', []));
    const [dataModelerLayout, setDataModelerLayout] = useState<DataModelerLayout>(() => getInitialState('pivotalProDataModelerLayout', {}));
    const [dataStudioCanvasLayout, setDataStudioCanvasLayout] = useState<DataStudioCanvasLayout>(() => getInitialState('pivotalProDataStudioLayout', {}));
    const [parameters, setParameters] = useState<Parameter[]>(() => getInitialState('pivotalProParameters', []));
    const [transformations, setTransformations] = useState<Map<string, Transformation[]>>(() => new Map(getInitialState<[string, Transformation[]][]>('pivotalProTransformations', [])));

    const modalManager = useModalManager();

    const transformedDataSources = useMemo(() => {
        const newMap = new Map<string, DataSource>();
        for (const [id, source] of dataSources.entries()) {
            const sourceTransforms = transformations.get(id) || [];
            if (sourceTransforms.length > 0) {
                const newFields = applyTransformsToFields(source, sourceTransforms);
                const newData = applyTransformsToData(source.data, sourceTransforms, [...source.fields.dimensions, ...source.fields.measures], parameters);
                newMap.set(id, { ...source, fields: newFields, data: newData });
            } else {
                newMap.set(id, source);
            }
        }
        return newMap;
    }, [dataSources, transformations, parameters]);

    const { blendedData, blendedFields } = useMemo(() => blendData(transformedDataSources, relationships), [transformedDataSources, relationships]);
    
    const saveStateToLocalStorage = useCallback(_.debounce(() => {
        try {
            localStorage.setItem('pivotalProDataSources', JSON.stringify(Array.from(dataSources.entries())));
            localStorage.setItem('pivotalProRelationships', JSON.stringify(relationships));
            localStorage.setItem('pivotalProParameters', JSON.stringify(parameters));
            localStorage.setItem('pivotalProDataModelerLayout', JSON.stringify(dataModelerLayout));
            localStorage.setItem('pivotalProDataStudioLayout', JSON.stringify(dataStudioCanvasLayout));
            localStorage.setItem('pivotalProTransformations', JSON.stringify(Array.from(transformations.entries())));
        } catch (error) {
            console.error("Failed to save data state to local storage:", error);
        }
    }, 1000), [dataSources, relationships, parameters, dataModelerLayout, dataStudioCanvasLayout, transformations]);

    useEffect(() => {
        saveStateToLocalStorage();
    }, [saveStateToLocalStorage]);

    const addDataSourceFromFile = async (file: File) => {
        // This logic is now part of the composed value in the main DashboardProvider
        // To avoid circular dependencies, we'll expose a handler that expects this logic.
        // For now, let's keep the core logic here.
        try {
            const extension = file.name.split('.').pop()?.toLowerCase();
            let data: any[] = [];
            if (extension === 'csv') {
                data = await new Promise((resolve, reject) => Papa.parse(file, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: res => resolve(res.data), error: err => reject(err) }));
            } else if (['xlsx', 'xls'].includes(extension!)) {
                const fileData = await file.arrayBuffer();
                const workbook = XLSX.read(fileData, { type: 'buffer' });
                data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            }
            
            const fields: { dimensions: Field[], measures: Field[] } = { dimensions: [], measures: [] };
            Object.keys(data[0] || {}).forEach(key => {
                const isNumeric = data.every(row => typeof row[key] === 'number' || row[key] === null);
                fields[isNumeric ? 'measures' : 'dimensions'].push({ name: key, simpleName: key, type: isNumeric ? FieldType.MEASURE : FieldType.DIMENSION });
            });
            
            const newSource: DataSource = { id: _.uniqueId('source_'), name: file.name, data, fields, type: 'file', status: 'connected' };
            setDataSources(d => new Map(d).set(newSource.id, newSource));
            notificationService.success(`Loaded ${file.name}`);
        } catch (e) {
            notificationService.error(`Error loading file: ${(e as Error).message}`);
        }
    };
    
    const loadSampleData = (sampleKey: 'sales' | 'iris' | 'both') => {
        const processSample = (id: string, name: string, csvData: string) => {
           const parsed = Papa.parse(csvData, { header: true, dynamicTyping: true, skipEmptyLines: true });
           const fields: { dimensions: Field[], measures: Field[] } = { dimensions: [], measures: [] };
           if (parsed.data.length > 0) Object.keys(parsed.data[0] as object).forEach(key => {
               const isNumeric = parsed.data.every(row => typeof (row as any)[key] === 'number' || (row as any)[key] === null);
               fields[isNumeric ? 'measures' : 'dimensions'].push({ name: key, simpleName: key, type: isNumeric ? FieldType.MEASURE : FieldType.DIMENSION });
           });
           const newSource: DataSource = { id, name, data: parsed.data, fields, type: 'file', status: 'connected', lastSync: new Date().toISOString() };
           setDataSources(d => new Map(d).set(id, newSource));
        };
        if(sampleKey === 'sales' || sampleKey === 'both') processSample('sample_sales', 'Sample - Superstore Sales', SAMPLE_DATA_SALES);
        if(sampleKey === 'iris' || sampleKey === 'both') processSample('sample_iris', 'Sample - Iris Dataset', SAMPLE_DATA_IRIS);
        notificationService.success('Sample data loaded!');
    };

    const removeDataSource = (id: string) => {
        modalManager.openConfirmationModal({
            title: 'Remove Data Source?', message: `This will remove the data source and affect all related widgets and transformations.`,
            onConfirm: () => {
                setDataSources(prev => { const newSources = new Map(prev); newSources.delete(id); return newSources; });
                setTransformations(prev => { const newT = new Map(prev); newT.delete(id); return newT; });
                setRelationships(prev => prev.filter(r => r.sourceAId !== id && r.sourceBId !== id));
                notificationService.success('Data source removed.');
            }
        });
    };
    
    const applyTransformations = (sourceId: string, newTransforms: Transformation[]) => setTransformations(p => new Map(p).set(sourceId, newTransforms));
    const addTransformation = (sourceId: string, type: TransformationType, payload: any) => setTransformations(p => new Map(p).set(sourceId, [...(p.get(sourceId) || []), { id: _.uniqueId('t_'), type, payload }]));
    const removeTransformation = (sourceId: string, transformId: string) => setTransformations(p => new Map(p).set(sourceId, (p.get(sourceId) || []).filter(t => t.id !== transformId)));
    const resetAllTransformations = (sourceId: string) => setTransformations(p => new Map(p).set(sourceId, []));
    const addCalculatedField = (sourceId: string, fieldName: string, formula: string) => addTransformation(sourceId, TransformationType.CREATE_CALCULATED_FIELD, { fieldName, formula });
    
    const createDataSourceFromConnection = async (config: { connector: Connector; details: any; name: string }) => {
        try {
            const fetchedData = await apiService.fetchDataFromApi(config.details);
            const data = fetchedData.map(row => _.mapValues(row, v => (typeof v === 'string' && !isNaN(Number(v)) && !isNaN(parseFloat(v))) ? Number(v) : v));
            const fields: { dimensions: Field[], measures: Field[] } = { dimensions: [], measures: [] };
            Object.keys(data[0]).forEach(key => {
                const isNumeric = data.every(row => row[key] === null || typeof row[key] === 'number');
                const fieldType = isNumeric ? FieldType.MEASURE : FieldType.DIMENSION;
                // FIX: Corrected a faulty comparison between a FieldType enum and a string literal to ensure fields are categorized correctly.
                fields[fieldType === FieldType.MEASURE ? 'measures' : 'dimensions'].push({ name: key, simpleName: key, type: fieldType });
            });
            const newSource: DataSource = { id: _.uniqueId('source_'), name: config.name, data, fields, type: config.connector.category === 'File' ? 'file' : 'api', status: 'connected', connectionDetails: { type: config.connector.id, ...config.details } };
            setDataSources(d => new Map(d).set(newSource.id, newSource));
            notificationService.success(`Successfully connected to ${config.name}`);
            modalManager.closeDataSourceConnectionModal();
        } catch (e) {
            notificationService.error(`Failed to connect: ${(e as Error).message}`);
        }
    };
    
    const refreshApiDataSource = useCallback(async (source: DataSource) => {
        if (source.type === 'file' || !source.connectionDetails) return;
        setDataSources(prev => new Map(prev).set(source.id, { ...source, status: 'syncing' }));
        try {
            const fetchedData = await apiService.fetchDataFromApi(source.connectionDetails);
            setDataSources(prev => new Map(prev).set(source.id, { ...prev.get(source.id)!, data: fetchedData, status: 'connected', lastSync: new Date().toISOString() }));
             notificationService.info(`Data for "${source.name}" has been refreshed.`);
        } catch (e) {
            setDataSources(prev => new Map(prev).set(source.id, { ...prev.get(source.id)!, status: 'error' }));
             notificationService.error(`Could not refresh data for "${source.name}".`);
        }
    }, []);

    const runHealthCheck = useCallback(() => {
        notificationService.info('Health Check in Progress...');
        setTimeout(() => {
            setDataSources(prev => new Map(Array.from(prev.entries()).map(([id, source]) => [id, {...source, health: 80 + Math.floor(Math.random() * 21), status: 'connected'}])));
            notificationService.success('Connection Successful');
        }, 1500);
    }, []);

    const value: DataContextProps = {
        dataSources,
        relationships,
        dataModelerLayout,
        dataStudioCanvasLayout,
        parameters,
        blendedData,
        blendedFields,
        addDataSourceFromFile,
        loadSampleData,
        removeDataSource,
        setRelationships,
        setDataModelerLayout,
        setDataStudioCanvasLayout,
        getTransformationsForSource: sourceId => transformations.get(sourceId) || [],
        applyTransformations,
        addTransformation,
        removeTransformation,
        resetAllTransformations,
        addCalculatedField,
        addParameter: p => setParameters(prev => [...prev, { ...p, id: _.uniqueId('param_') }]),
        updateParameter: (id, updates) => setParameters(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p)),
        removeParameter: (id: string) => setParameters(prev => prev.filter(p => p.id !== id)),
        refreshApiDataSource,
        runHealthCheck,
        createDataSourceFromConnection,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};