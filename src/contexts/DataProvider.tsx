import React, { useState, useEffect, useCallback, useMemo, FC, ReactNode, useRef } from 'react';
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
import { dataSourceApiService } from '../services/dataSourceApiService';
import { notificationService } from '../services/notificationService';
import { useModalManager } from '../hooks/useModalManager';
import { SAMPLE_DATA_SALES, SAMPLE_DATA_IRIS } from '../utils/constants';
import { DataContext } from './DataContext';
import { UploadProgress } from '../components/ui/UploadProgressModal';
import { useAuth } from './AuthProvider';

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
    const [dataSources, setDataSources] = useState<Map<string, DataSource>>(new Map());
    const [relationships, setRelationships] = useState<Relationship[]>(() => getInitialState('pivotalProRelationships', []));
    const [dataModelerLayout, setDataModelerLayout] = useState<DataModelerLayout>(() => getInitialState('pivotalProDataModelerLayout', {}));
    const [dataStudioCanvasLayout, setDataStudioCanvasLayout] = useState<DataStudioCanvasLayout>(() => getInitialState('pivotalProDataStudioLayout', {}));
    const [parameters, setParameters] = useState<Parameter[]>(() => getInitialState('pivotalProParameters', []));
    const [isDataSourcesLoading, setIsDataSourcesLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

    const modalManager = useModalManager();
    const { user } = useAuth();
    const previousUserIdRef = useRef<string | null>(null);

    // Derived transformations map for compatibility
    const transformations = useMemo(() => {
        const map = new Map<string, Transformation[]>();
        dataSources.forEach(ds => {
            if (ds.transformations) {
                map.set(ds.id, ds.transformations);
            }
        });
        return map;
    }, [dataSources]);

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
    
    // Load data sources from backend
    const loadDataSources = useCallback(async (workspaceId: string) => {
        setIsDataSourcesLoading(true);
        try {
            const sources = await dataSourceApiService.getAll(workspaceId);
            // Ensure all sources have proper fields structure
            const sourcesWithFields = sources.map(s => ({
                ...s,
                fields: s.fields || { dimensions: [], measures: [] }
            }));
            const sourcesMap = new Map(sourcesWithFields.map(s => [s.id, s]));
            setDataSources(sourcesMap);
        } catch (error) {
            console.error("Failed to load data sources:", error);
            notificationService.error("Failed to load data sources.");
        } finally {
            setIsDataSourcesLoading(false);
        }
    }, []);

    // Save other state to local storage (Relationships, Layouts, etc. - MVP: keep these local for now)
    const saveStateToLocalStorage = useCallback(_.debounce(() => {
        try {
            localStorage.setItem('pivotalProRelationships', JSON.stringify(relationships));
            localStorage.setItem('pivotalProParameters', JSON.stringify(parameters));
            localStorage.setItem('pivotalProDataModelerLayout', JSON.stringify(dataModelerLayout));
            localStorage.setItem('pivotalProDataStudioLayout', JSON.stringify(dataStudioCanvasLayout));
        } catch (error) {
            console.error("Failed to save data state to local storage:", error);
        }
    }, 1000), [relationships, parameters, dataModelerLayout, dataStudioCanvasLayout]);

    useEffect(() => {
        saveStateToLocalStorage();
    }, [saveStateToLocalStorage]);

    // Clear data sources when user changes (logout/login with different user)
    useEffect(() => {
        const currentUserId = user?.id || null;
        
        // If user changed (not just initial load)
        if (previousUserIdRef.current !== null && previousUserIdRef.current !== currentUserId) {
            // Clear all data sources and related state
            setDataSources(new Map());
            setRelationships([]);
            setParameters([]);
            setUploadProgress(null);
            
            // Reload data sources for new user
            if (currentUserId) {
                const initDataSources = async () => {
                    let workspaceId = '';
                    try {
                        const dashboardState = JSON.parse(localStorage.getItem('pivotalProDashboardState') || '{}');
                        if (dashboardState.workspaces && dashboardState.workspaces.length > 0) {
                            workspaceId = dashboardState.activeWorkspaceId || dashboardState.workspaces[0].id;
                        }
                    } catch (e) {}
                    
                    if (workspaceId) {
                        await loadDataSources(workspaceId);
                    }
                };
                initDataSources();
            }
        }
        
        // Update previous user ID
        previousUserIdRef.current = currentUserId;
    }, [user?.id, loadDataSources]);

    // Load data sources on mount
    useEffect(() => {
        const initDataSources = async () => {
            let workspaceId = '';
            try {
                const dashboardState = JSON.parse(localStorage.getItem('pivotalProDashboardState') || '{}');
                if (dashboardState.workspaces && dashboardState.workspaces.length > 0) {
                    workspaceId = dashboardState.activeWorkspaceId || dashboardState.workspaces[0].id;
                }
            } catch (e) {}
            
            if (workspaceId) {
                await loadDataSources(workspaceId);
            }
        };
        initDataSources();
    }, [loadDataSources]);

    const addDataSourceFromFile = async (file: File) => {
        try {
            // Initialize progress
            setUploadProgress({
                fileName: file.name,
                progress: 0,
                stage: 'uploading',
                message: 'Reading file...',
                fileSize: file.size,
                uploadedSize: 0,
            });

            const extension = file.name.split('.').pop()?.toLowerCase();
            let data: any[] = [];

            // Simulate upload progress
            await new Promise(resolve => setTimeout(resolve, 300));
            setUploadProgress(prev => prev ? { ...prev, progress: 30, uploadedSize: file.size * 0.3 } : null);

            // Parsing stage
            setUploadProgress(prev => prev ? { ...prev, progress: 40, stage: 'parsing', message: 'Parsing data...' } : null);

            if (extension === 'csv') {
                data = await new Promise((resolve, reject) => Papa.parse(file, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: res => resolve(res.data), error: err => reject(err) }));
            } else if (['xlsx', 'xls'].includes(extension!)) {
                const fileData = await file.arrayBuffer();
                const workbook = XLSX.read(fileData, { type: 'buffer' });
                data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            }

            setUploadProgress(prev => prev ? { ...prev, progress: 60, uploadedSize: file.size } : null);
            
            // Processing stage
            setUploadProgress(prev => prev ? { ...prev, progress: 70, stage: 'processing', message: 'Analyzing fields...' } : null);

            const fields: { dimensions: Field[], measures: Field[] } = { dimensions: [], measures: [] };
            Object.keys(data[0] || {}).forEach(key => {
                const isNumeric = data.every(row => typeof row[key] === 'number' || row[key] === null);
                fields[isNumeric ? 'measures' : 'dimensions'].push({ name: key, simpleName: key, type: isNumeric ? FieldType.MEASURE : FieldType.DIMENSION });
            });

            setUploadProgress(prev => prev ? { ...prev, progress: 85, message: 'Creating data source...' } : null);
            
            let workspaceId = '';
            try {
                const dashboardState = JSON.parse(localStorage.getItem('pivotalProDashboardState') || '{}');
                if (dashboardState.workspaces && dashboardState.workspaces.length > 0) {
                    workspaceId = dashboardState.workspaces[0].id;
                }
            } catch (e) {}

            if (!workspaceId) {
                console.warn("No workspace ID found for new data source. Using default.");
                workspaceId = 'default-workspace';
            }

            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

            const newSourcePayload = { 
                workspaceId,
                name: file.name, 
                data, 
                fields, 
                type: 'file' as const, 
                status: 'connected' as const,
                size: parseFloat(fileSizeMB) || 0.01,
                tables: 1,
                queryTime: Math.floor(Math.random() * 50) + 10
            };
            
            const createdSource = await dataSourceApiService.create(newSourcePayload);
            const sourceWithData = { ...createdSource, data: createdSource.data || data, fields: createdSource.fields || fields };
            setDataSources(d => new Map(d).set(createdSource.id, sourceWithData));

            // Complete
            setUploadProgress(prev => prev ? { ...prev, progress: 100, stage: 'complete', message: 'Upload complete!' } : null);
            
            // Close progress modal after a delay
            setTimeout(() => {
                setUploadProgress(null);
                notificationService.success(`Loaded ${file.name}`);
                modalManager.openTemplateModal();
            }, 1500);
        } catch (e) {
            setUploadProgress(prev => prev ? { ...prev, progress: 100, stage: 'error', message: (e as Error).message } : null);
            setTimeout(() => {
                setUploadProgress(null);
                notificationService.error(`Error loading file: ${(e as Error).message}`);
            }, 2000);
        }
    };
    
    const loadSampleData = async (sampleKey: 'sales' | 'iris' | 'both') => {
        let workspaceId = '';
        try {
            const dashboardState = JSON.parse(localStorage.getItem('pivotalProDashboardState') || '{}');
            if (dashboardState.workspaces && dashboardState.workspaces.length > 0) {
                workspaceId = dashboardState.activeWorkspaceId || dashboardState.workspaces[0].id;
            }
        } catch (e) {}

        if (!workspaceId) {
             workspaceId = 'default-workspace';
        }

        const processSample = async (name: string, csvData: string, size: number) => {
           const parsed = Papa.parse(csvData, { header: true, dynamicTyping: true, skipEmptyLines: true });
           const fields: { dimensions: Field[], measures: Field[] } = { dimensions: [], measures: [] };
           if (parsed.data.length > 0) Object.keys(parsed.data[0] as object).forEach(key => {
               const isNumeric = parsed.data.every(row => typeof (row as any)[key] === 'number' || (row as any)[key] === null);
               fields[isNumeric ? 'measures' : 'dimensions'].push({ name: key, simpleName: key, type: isNumeric ? FieldType.MEASURE : FieldType.DIMENSION });
           });
           
           const newSourcePayload = {
               workspaceId,
               name,
               data: parsed.data,
               fields,
               type: 'file' as const,
               status: 'connected' as const,
               size,
               tables: 1,
               queryTime: Math.floor(Math.random() * 30) + 5
           };

           try {
               const createdSource = await dataSourceApiService.create(newSourcePayload);
               const sourceWithData = { ...createdSource, data: createdSource.data || parsed.data, fields: createdSource.fields || fields };
               setDataSources(d => new Map(d).set(createdSource.id, sourceWithData));
           } catch (error) {
               console.error("Failed to create sample data source:", error);
               notificationService.error(`Failed to load ${name}`);
           }
        };

        if(sampleKey === 'sales' || sampleKey === 'both') await processSample('Sample - Superstore Sales', SAMPLE_DATA_SALES, 1.5);
        if(sampleKey === 'iris' || sampleKey === 'both') await processSample('Sample - Iris Dataset', SAMPLE_DATA_IRIS, 0.02);
        
        notificationService.success('Sample data loaded!');
        modalManager.openTemplateModal();
    };

    const removeDataSource = async (id: string) => {
        try {
            await dataSourceApiService.delete(id);
            setDataSources(prev => { 
                const newSources = new Map(prev); 
                newSources.delete(id); 
                return newSources; 
            });
            setRelationships(prev => prev.filter(r => r.sourceAId !== id && r.sourceBId !== id));
            notificationService.success('Data source removed.');
        } catch (e) {
            console.error("Remove failed:", e);
            notificationService.error("Failed to remove data source.");
        }
    };
    
    const updateTransformationsInDb = async (sourceId: string, newTransforms: Transformation[]) => {
        try {
            setDataSources(prev => {
                const source = prev.get(sourceId);
                if (!source) return prev;
                return new Map(prev).set(sourceId, { ...source, transformations: newTransforms });
            });
            
            await dataSourceApiService.update(sourceId, { transformations: newTransforms });
        } catch (e) {
            console.error("Failed to save transformations:", e);
            notificationService.error("Failed to save changes.");
        }
    };

    const applyTransformations = (sourceId: string, newTransforms: Transformation[]) => updateTransformationsInDb(sourceId, newTransforms);
    
    const addTransformation = (sourceId: string, type: TransformationType, payload: any) => {
        const currentTransforms = transformations.get(sourceId) || [];
        const newTransforms = [...currentTransforms, { id: _.uniqueId('t_'), type, payload }];
        updateTransformationsInDb(sourceId, newTransforms);
    };

    const removeTransformation = (sourceId: string, transformId: string) => {
        const currentTransforms = transformations.get(sourceId) || [];
        const newTransforms = currentTransforms.filter(t => t.id !== transformId);
        updateTransformationsInDb(sourceId, newTransforms);
    };

    const resetAllTransformations = (sourceId: string) => updateTransformationsInDb(sourceId, []);
    
    const addCalculatedField = (sourceId: string, fieldName: string, formula: string) => addTransformation(sourceId, TransformationType.CREATE_CALCULATED_FIELD, { fieldName, formula });
    
    const createDataSourceFromConnection = async (config: { connector: Connector; details: any; name: string }) => {
        try {
            const fetchedData = await apiService.fetchDataFromApi(config.details);
            const data = fetchedData.map(row => _.mapValues(row, v => (typeof v === 'string' && !isNaN(Number(v)) && !isNaN(parseFloat(v))) ? Number(v) : v));
            const fields: { dimensions: Field[], measures: Field[] } = { dimensions: [], measures: [] };
            Object.keys(data[0]).forEach(key => {
                const isNumeric = data.every(row => row[key] === null || typeof row[key] === 'number');
                const fieldType = isNumeric ? FieldType.MEASURE : FieldType.DIMENSION;
                fields[fieldType === FieldType.MEASURE ? 'measures' : 'dimensions'].push({ name: key, simpleName: key, type: fieldType });
            });
            
            let workspaceId = '';
            try {
                const dashboardState = JSON.parse(localStorage.getItem('pivotalProDashboardState') || '{}');
                if (dashboardState.workspaces && dashboardState.workspaces.length > 0) {
                    workspaceId = dashboardState.workspaces[0].id;
                }
            } catch (e) {}
            if (!workspaceId) workspaceId = 'default-workspace';

            const estimatedSize = (JSON.stringify(data).length / (1024 * 1024)).toFixed(2);

            const newSourcePayload = { 
                workspaceId,
                name: config.name, 
                data, 
                fields, 
                type: (config.connector.category === 'File' ? 'file' : 'api') as DataSource['type'], 
                status: 'connected' as const, 
                connectionDetails: { type: config.connector.id, ...config.details },
                size: parseFloat(estimatedSize) || 0.05,
                tables: 1,
                queryTime: Math.floor(Math.random() * 100) + 20
            };

            const createdSource = await dataSourceApiService.create(newSourcePayload);
            const sourceWithData = { ...createdSource, data: createdSource.data || data, fields: createdSource.fields || fields };
            setDataSources(d => new Map(d).set(createdSource.id, sourceWithData));
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
            const updatedSource = await dataSourceApiService.update(source.id, { 
                data: fetchedData, 
                status: 'connected', 
            });
            
            setDataSources(prev => new Map(prev).set(source.id, { ...updatedSource, lastSync: new Date().toISOString() }));
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
        loadDataSources,
        isDataSourcesLoading,
        uploadProgress,
        setUploadProgress,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};