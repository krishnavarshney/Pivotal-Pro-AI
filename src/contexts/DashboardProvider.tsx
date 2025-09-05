import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, ReactNode, ChangeEvent, FC, SetStateAction } from 'react';
import _ from 'lodash';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
    WidgetState, WidgetLayout, Parameter, Story, CrossFilterState, Template, Bookmark, Workspace, 
    DashboardPage, Pill, DashboardContext, DashboardContextProps, DataSource, Field, FieldType, 
    Relationship, DataModelerLayout, Transformation, AIConfig, AiChatMessage, ThemeConfig, 
    ChartLibrary, DashboardDefaults, ContextMenuItem, ToastNotification, ExplorerState, User, 
    AdvancedAnalysisResult, AiInsight, TransformationType, ChartType, ValueFormat, DashboardComment, StoryPage, DashboardCommentMessage, WhatIfResult, StoryTone, AggregationType, AiDashboardSuggestion,
    ChatContext, ProactiveInsight, PredictiveModelResult, Connector, DataStudioCanvasLayout, ControlFilterState, FilterCondition, DashboardMode
} from '../utils/types';
import { SAMPLE_DATA_SALES, SAMPLE_DATA_IRIS, DASHBOARD_TEMPLATES } from '../utils/constants';
import { blendData } from '../utils/dataProcessing/blending';
import { applyTransformsToFields, applyTransformsToData } from '../utils/dataProcessing/transformations';
import { processWidgetData } from '../utils/dataProcessing/widgetProcessor';
import * as aiService from '../services/aiService';
import * as apiService from '../services/apiService';
import { notificationService, registerShowToast } from '../services/notificationService';
import { useAuth } from './AuthProvider';
import { useHistoryState, UndoableState } from '../hooks/useHistoryState';
import { useModalManager } from '../hooks/useModalManager';


const DASHBOARD_STATE_VERSION = 2;

const aiThinkingAnimation = {"v":"5.9.6","fr":60,"ip":0,"op":120,"w":800,"h":600,"nm":"Brain Animation","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Brain Outline","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[400,300,0],"ix":2},"a":{"a":0,"k":[150,150,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[-27.614,0],[-41.421,0],[-27.614,0],[0,0],[0,27.614],[0,41.421],[0,27.614],[0,0],[27.614,0],[41.421,0],[27.614,0],[0,0],[0,0],[-13.807,0],[-20.711,0],[-13.807,0],[0,0],[0,-27.614],[0,-41.421],[0,-27.614],[0,0],[27.614,0],[41.421,0],[27.614,0],[0,0]],"o":[[0,0],[0,0],[27.614,0],[41.421,0],[27.614,0],[0,0],[0,-27.614],[0,-41.421],[0,-27.614],[0,0],[-27.614,0],[-41.421,0],[-27.614,0],[0,0],[0,0],[13.807,0],[20.711,0],[13.807,0],[0,0],[0,27.614],[0,41.421],[0,27.614],[0,0],[-27.614,0],[-41.421,0],[-27.614,0],[0,0],[0,0]],"v":[[-150,50],[-150,-50],[-150,-100],[ -100,-150],[0,-150],[100,-150],[150,-100],[150,-50],[150,0],[150,50],[150,100],[100,150],[0,150],[-100,150],[-150,100],[-150,50],[ -125,50],[-100,50],[-75,50],[-75,0],[-75,-50],[-50,-75],[0,-75],[50,-75],[50,0],[100,0],[50,0],[50,75]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[0.2,0.8,1,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":8,"ix":5},"lc":2,"lj":2,"ml":4,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":0},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30,"s":100},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":90,"s":100},{"t":120,"s":0}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":0},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30,"s":100},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":90,"s":100},{"t":120,"s":0}],"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"nm":"Group 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":120,"st":0,"bm":0}]};

const createDefaultPage = (): DashboardPage => ({
  id: _.uniqueId('page_'),
  name: 'Main Dashboard',
  widgets: [],
  layouts: {},
  globalFilters: [],
  comments: [],
  bookmarks: [],
  collapsedRows: [],
});

const createDefaultWorkspace = (): Workspace => ({
  id: _.uniqueId('ws_'),
  name: 'Default Workspace',
  pages: [createDefaultPage()],
});

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
        const savedStateJSON = localStorage.getItem(key);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            if(key === 'pivotalProDashboardState' && savedState.version !== DASHBOARD_STATE_VERSION) {
                 return defaultValue;
            }
            return savedState;
        }
    } catch (error) {
        console.error(`Failed to load ${key} from local storage:`, error);
    }
    return defaultValue;
};

const getInitialAiConfig = (): AIConfig | null => {
    const savedConfig = getInitialState<AIConfig | null>('pivotalProAiConfig', null);
    if (savedConfig) {
        return savedConfig;
    }
    // If no config is saved, default to Gemini. We assume the API key is handled by the proxy.
    return { provider: 'gemini' };
};

export const useDashboard = (): DashboardContextProps => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};

export const DashboardProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    
    // --- State Initialization ---
    const initialDashboardState = getInitialState('pivotalProDashboardState', null);
    const transformationsFromOldStorage = getInitialState<[string, Transformation[]][]>('pivotalProTransformations', []);

    const initialUndoableState: UndoableState = {
        workspaces: initialDashboardState?.workspaces?.length ? initialDashboardState.workspaces : [createDefaultWorkspace()],
        transformations: initialDashboardState?.transformations || transformationsFromOldStorage,
    };
    
    // --- Custom Hooks for State Management ---
    const modalManager = useModalManager();
    const { 
        state: dashboardUndoableState, 
        setState: setDashboardUndoableState, 
        undo: historyUndo, 
        redo: historyRedo, 
        canUndo, canRedo 
    } = useHistoryState(initialUndoableState);

    const { workspaces, transformations: transformationsArray } = dashboardUndoableState;

    // --- Data State ---
    const [dataSources, setDataSources] = useState<Map<string, DataSource>>(() => new Map(getInitialState<[string, DataSource][]>('pivotalProDataSources', [])));
    const [relationships, setRelationships] = useState<Relationship[]>(() => getInitialState('pivotalProRelationships', []));
    const [dataModelerLayout, setDataModelerLayout] = useState<DataModelerLayout>(() => getInitialState('pivotalProDataModelerLayout', {}));
    const [dataStudioCanvasLayout, setDataStudioCanvasLayout] = useState<DataStudioCanvasLayout>(() => getInitialState('pivotalProDataStudioLayout', {}));
    
    // --- AI State ---
    const [aiConfig, setAiConfig] = useState<AIConfig | null>(getInitialAiConfig);
    const [aiChatHistory, setAiChatHistory] = useState<AiChatMessage[]>([]);
    const [chatContext, setChatContext] = useState<ChatContext>(null);
    const [insightsByPage, setInsightsByPage] = useState<Map<string, AiInsight[]>>(new Map());
    const [proactiveInsights, setProactiveInsights] = useState<Map<string, ProactiveInsight[]>>(new Map());
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const [hasNewInsights, setHasNewInsights] = useState(false);
    
    // --- UI State ---
    const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => getInitialState('pivotalProTheme', { name: 'pivotal-pro', mode: 'light' }));
    const [chartLibrary, setChartLibrary] = useState<ChartLibrary>(() => getInitialState('pivotalProChartLibrary', 'echarts'));
    const [dashboardDefaults, setDashboardDefaults] = useState<DashboardDefaults>(() => getInitialState('pivotalProDefaults', { colorPalette: 'Pivotal Pro', chartType: ChartType.BAR }));
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, items: ContextMenuItem[] } | null>(null);
    const [currentView, setCurrentView] = useState<DashboardContextProps['currentView']>('dashboard');
    const [explorerState, setExplorerState] = useState<ExplorerState | null>(null);
    const [studioSourceId, setStudioSourceId] = useState<string | null>(null);
    const [isDataStudioOnboardingNeeded, setDataStudioOnboardingNeeded] = useState(() => getInitialState('pivotalProStudioOnboarding', true));
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);
    const [loadingState, setLoadingState] = useState<{ isLoading: boolean; message: string; lottieAnimation?: any }>({ isLoading: false, message: '' });
    const [scrollToWidgetId, setScrollToWidgetId] = useState<string | null>(null);
    const [dashboardMode, setDashboardMode] = useState<DashboardMode>('view');
    const [isHelpModeActive, setIsHelpModeActive] = useState(false);
    
    // --- Performance & Lineage State ---
    const [performanceTimings, setPerformanceTimings] = useState<Map<string, number>>(new Map());
    const [refetchCounter, setRefetchCounter] = useState(0);

    // --- Dashboard State ---
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(workspaces[0].id);
    const [activePageId, setActivePageId] = useState<string | null>(() => getInitialState('pivotalProActivePageId', null));
    const [parameters, setParameters] = useState<Parameter[]>(() => getInitialState('pivotalProParameters', []));
    const [stories, setStories] = useState<Story[]>(() => getInitialState('pivotalProStories', []));
    const [editingStory, setEditingStory] = useState<{ story: Story; focusPageId?: string; } | null>(null);
    const [userTemplates, setUserTemplates] = useState<Template[]>(() => getInitialState('pivotalProUserTemplates', []));
    const [crossFilter, setCrossFilter] = useState<CrossFilterState>(null);
    const [controlFilters, setControlFilters] = useState<ControlFilterState>(new Map());
    const [predictiveModels, setPredictiveModels] = useState<PredictiveModelResult[]>([]);
    
    // --- Derived State & Refs ---
    const transformations = useMemo(() => new Map(transformationsArray), [transformationsArray]);
    
    const transformedDataSources = useMemo(() => {
        const newMap = new Map<string, DataSource>();
        for (const [id, source] of dataSources.entries()) {
            const sourceTransforms = transformations.get(id) || [];
            if (sourceTransforms.length > 0) {
                const newFields = applyTransformsToFields(source, sourceTransforms);
                const newData = applyTransformsToData(source.data, sourceTransforms, [...source.fields.dimensions, ...source.fields.measures], parameters);
                newMap.set(id, {
                    ...source,
                    fields: newFields,
                    data: newData,
                });
            } else {
                newMap.set(id, source);
            }
        }
        return newMap;
    }, [dataSources, transformations, parameters]);

    const { blendedData, blendedFields } = useMemo(() => blendData(transformedDataSources, relationships), [transformedDataSources, relationships]);

    // FIX: This effect ensures that an invalid activePageId (e.g., from a deleted page)
    // is reset, but it correctly leaves a null activePageId alone, which is the
    // required state for viewing the dashboard home page.
    useEffect(() => {
        const allPages = workspaces.flatMap(ws => ws.pages || []);
        const activePageExists = allPages.some(p => p.id === activePageId);

        // Only reset the active page ID if it's set to a page that no longer exists.
        // A null ID is a valid state for the dashboard overview and should not be changed.
        if (activePageId && !activePageExists) {
            setActivePageId(allPages[0]?.id || null);
        }
    }, [workspaces, activePageId]);

    const activePage = useMemo(() => workspaces.flatMap(ws => ws.pages || []).find(p => p.id === activePageId), [workspaces, activePageId]);
    const widgets = useMemo(() => activePage?.widgets || [], [activePage]);
    const layouts = useMemo(() => activePage?.layouts || {}, [activePage]);
    const globalFilters = useMemo(() => activePage?.globalFilters || [], [activePage]);
    const collapsedRows = useMemo(() => activePage?.collapsedRows || [], [activePage]);
    const importInputRef = useRef<HTMLInputElement>(null);
    const [newlyAddedPillId, setNewlyAddedPillId] = useState<string | null>(null);
    
    // --- UI Callbacks ---
    const showToast = useCallback((options: Omit<ToastNotification, 'id'>) => {
        const id = _.uniqueId('toast_');
        setNotifications(prev => [...prev, { ...options, id }]);
        setTimeout(() => removeToast(id), options.duration || 5000);
    }, []);

    useEffect(() => {
        registerShowToast(showToast);
    }, [showToast]);

    // --- Persistence ---
    const saveStateToLocalStorage = useCallback(_.debounce(() => {
        try {
            const stateToSave = {
                version: DASHBOARD_STATE_VERSION,
                workspaces,
                transformations: Array.from(transformations.entries()),
            };
            localStorage.setItem('pivotalProDashboardState', JSON.stringify(stateToSave));
            localStorage.setItem('pivotalProActivePageId', JSON.stringify(activePageId));
            localStorage.setItem('pivotalProDataSources', JSON.stringify(Array.from(dataSources.entries())));
            localStorage.setItem('pivotalProRelationships', JSON.stringify(relationships));
            localStorage.setItem('pivotalProParameters', JSON.stringify(parameters));
            localStorage.setItem('pivotalProStories', JSON.stringify(stories));
            localStorage.setItem('pivotalProAiConfig', JSON.stringify(aiConfig));
            localStorage.setItem('pivotalProTheme', JSON.stringify(themeConfig));
            localStorage.setItem('pivotalProChartLibrary', JSON.stringify(chartLibrary));
            localStorage.setItem('pivotalProDefaults', JSON.stringify(dashboardDefaults));
            localStorage.setItem('pivotalProUserTemplates', JSON.stringify(userTemplates));
            localStorage.setItem('pivotalProDataModelerLayout', JSON.stringify(dataModelerLayout));
            localStorage.setItem('pivotalProDataStudioLayout', JSON.stringify(dataStudioCanvasLayout));
        } catch (error) {
            console.error("Failed to save state to local storage:", error);
            notificationService.error("Could not save dashboard state.");
        }
    }, 1000), [workspaces, transformations, relationships, parameters, stories, aiConfig, themeConfig, chartLibrary, dashboardDefaults, userTemplates, dataModelerLayout, dataStudioCanvasLayout, dataSources, activePageId]);

    useEffect(() => {
        saveStateToLocalStorage();
    }, [saveStateToLocalStorage]);

    
    const removeToast = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const setView = (view: DashboardContextProps['currentView'], options?: any) => {
        if (options?.initialFilters) setExplorerState(options);
        if (options?.sourceId) setStudioSourceId(options.sourceId);
        setCurrentView(view);
    };

    // --- Dashboard Management Callbacks ---
    const setWorkspaces = (updater: SetStateAction<Workspace[]>) => {
        setDashboardUndoableState(prev => ({
            ...prev,
            workspaces: typeof updater === 'function' ? updater(prev.workspaces) : updater,
        }));
    };
    
    const updatePage = (id: string, updater: Partial<DashboardPage> | ((page: DashboardPage) => DashboardPage)) => {
        setWorkspaces(wss => wss.map(ws => ({
            ...ws,
            pages: (ws.pages || []).map(p => {
                if (p.id === id) {
                    return typeof updater === 'function' ? updater(p) : { ...p, ...updater };
                }
                return p;
            })
        })));
    };

    const setGlobalFilters = (updater: SetStateAction<Pill[]>) => {
        if(activePageId) updatePage(activePageId, p => ({ ...p, globalFilters: typeof updater === 'function' ? updater(p.globalFilters) : updater }));
    };

    const addGlobalFilter = (pill: Omit<Pill, 'id'>) => {
        const newPillWithId: Pill = { ...pill, id: _.uniqueId('globalfilter_') };
        setGlobalFilters(current => [...current, newPillWithId]);
        setNewlyAddedPillId(newPillWithId.id);
        setTimeout(() => setNewlyAddedPillId(null), 3000);
    };

    const setLayouts = (layouts: { [breakpoint: string]: WidgetLayout[] }) => {
         if(activePageId) updatePage(activePageId, { layouts });
    };

    const addNewPage = (templatePage: Partial<DashboardPage> = {}) => {
        const defaultPage = createDefaultPage();
        const widgetIdMap = new Map<string, string>();
    
        const newWidgets = (templatePage.widgets || []).map(w => {
            const newId = _.uniqueId('widget_');
            widgetIdMap.set(w.id, newId);
            return { ...w, id: newId };
        });
    
        const newLayouts = templatePage.layouts ? _.mapValues(templatePage.layouts, layout => {
            return layout
                .map(item => { const newId = widgetIdMap.get(item.i); return newId ? { ...item, i: newId } : null; })
                .filter((item): item is WidgetLayout => item !== null);
        }) : {};
    
        const newPage: DashboardPage = {
            ...createDefaultPage(), ...templatePage, id: defaultPage.id,
            name: templatePage.name || `New Page ${workspaces.flatMap(ws => ws.pages || []).length + 1}`,
            widgets: newWidgets, layouts: newLayouts,
        };
    
        setWorkspaces(wss => wss.map(ws => (ws.id === activeWorkspaceId) ? { ...ws, pages: [...(ws.pages || []), newPage] } : ws));
        setActivePageId(newPage.id);
        setCurrentView('dashboard');
    };
    
    const addPage = () => setCurrentView('templates');
    
    const removePage = (id: string) => {
        setWorkspaces(wss => wss.map(ws => ({ ...ws, pages: (ws.pages || []).filter(p => p.id !== id) })));
        if (activePageId === id) {
            setActivePageId(null);
            setView('dashboard');
        }
    };
    
    const addTransformation = (sourceId: string, type: TransformationType, payload: any) => setDashboardUndoableState(p => { const currentTransformsMap = new Map(p.transformations); const c = currentTransformsMap.get(sourceId) || []; const n = new Map(currentTransformsMap).set(sourceId, [...c, { id: _.uniqueId('t_'), type, payload }]); return { ...p, transformations: Array.from(n.entries()) }; });
    const addCalculatedField = (sourceId: string, fieldName: string, formula: string) => addTransformation(sourceId, TransformationType.CREATE_CALCULATED_FIELD, { fieldName, formula });


    const saveWidget = (widget: WidgetState, layoutOverride?: Partial<Omit<WidgetLayout, 'i'>>) => {
        if (!activePageId) return;
        updatePage(activePageId, (currentPage) => {
            const newWidgets = [...currentPage.widgets];
            const index = newWidgets.findIndex(w => w.id === widget.id);
            if (index > -1) {
                newWidgets[index] = widget;
            } else {
                const newWidget = { ...widget, id: _.uniqueId('widget_') };
                newWidgets.push(newWidget);
                const newLayouts = _.cloneDeep(currentPage.layouts);
                const defaultLayout = { i: newWidget.id, x: 0, y: Infinity, w: 12, h: 8, minW: 4, minH: 4 };
                const newLayoutItem = { ...defaultLayout, ...layoutOverride };

                if (Object.keys(newLayouts).length === 0) {
                    ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(bp => { newLayouts[bp] = [newLayoutItem]; });
                } else {
                    Object.keys(newLayouts).forEach(key => { if (newLayouts[key]) { newLayouts[key].push(newLayoutItem); } });
                }
                return { ...currentPage, widgets: newWidgets, layouts: newLayouts };
            }
            return { ...currentPage, widgets: newWidgets };
        });
    };

    const removeWidget = (id: string) => {
        if(!activePageId) return;
        updatePage(activePageId, (p) => ({ ...p, widgets: p.widgets.filter(w => w.id !== id), layouts: _.mapValues(p.layouts, l => l.filter(item => item.i !== id)), }));
    };

    const duplicateWidget = (id: string) => {
        if (!activePageId) return;
        const widgetToCopy = widgets.find(w => w.id === id);
        if (widgetToCopy) {
            const newWidget = { ..._.cloneDeep(widgetToCopy), id: _.uniqueId('widget_'), title: `${widgetToCopy.title} (Copy)` };
            updatePage(activePageId, (currentPage) => {
                const newWidgets = [...currentPage.widgets, newWidget];
                const layoutToCopy = _.mapValues(currentPage.layouts, l => l.find(item => item.i === id));
                const newLayouts = _.cloneDeep(currentPage.layouts);
                Object.keys(newLayouts).forEach(key => { if (layoutToCopy[key]) { newLayouts[key].push({ ...layoutToCopy[key]!, i: newWidget.id, y: Infinity }); } });
                return { ...currentPage, widgets: newWidgets, layouts: newLayouts };
            });
        }
    };
    
    const duplicatePage = (pageId: string) => {
        let pageToCopy: DashboardPage | undefined;
        let workspaceOfPage: Workspace | undefined;

        for (const ws of workspaces) {
            const foundPage = (ws.pages || []).find(p => p.id === pageId);
            if (foundPage) {
                pageToCopy = foundPage;
                workspaceOfPage = ws;
                break;
            }
        }

        if (pageToCopy && workspaceOfPage) {
            const newPage = _.cloneDeep(pageToCopy);
            newPage.id = _.uniqueId('page_');
            newPage.name = `${pageToCopy.name} (Copy)`;

            const widgetIdMap = new Map<string, string>();
            newPage.widgets = (newPage.widgets || []).map(w => {
                const newId = _.uniqueId('widget_');
                widgetIdMap.set(w.id, newId);
                return { ...w, id: newId };
            });

            newPage.layouts = newPage.layouts ? _.mapValues(newPage.layouts, layout => {
                return layout
                    .map(item => {
                        const newId = widgetIdMap.get(item.i);
                        return newId ? { ...item, i: newId } : null;
                    })
                    .filter((item): item is WidgetLayout => item !== null);
            }) : {};

            setWorkspaces(wss => wss.map(ws => {
                if (ws.id === workspaceOfPage!.id) {
                    const pageIndex = (ws.pages || []).findIndex(p => p.id === pageId);
                    const newPages = [...(ws.pages || [])];
                    newPages.splice(pageIndex >= 0 ? pageIndex + 1 : newPages.length, 0, newPage);
                    return { ...ws, pages: newPages };
                }
                return ws;
            }));

            notificationService.success(`Page "${pageToCopy.name}" duplicated.`);
        }
    };

    // --- Data Management Callbacks ---
    const addDataSourceFromFile = async (file: File) => {
        setLoadingState({ isLoading: true, message: `Loading ${file.name}...` });
        try {
            const extension = file.name.split('.').pop()?.toLowerCase();
            let data: any[] = [];
            let parsedData: any[] = [];

            if (extension === 'csv') {
                parsedData = await new Promise((resolve, reject) => {
                    Papa.parse(file, { header: true, dynamicTyping: true, skipEmptyLines: true,
                        complete: (results) => { if (results.errors.length) reject(new Error(results.errors.map(e => e.message).join(', '))); else resolve(results.data); },
                        error: (err) => reject(err),
                    });
                });
            } else if (['xlsx', 'xls'].includes(extension!)) {
                const fileData = await file.arrayBuffer();
                const workbook = XLSX.read(fileData, { type: 'buffer' });
                parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            } else { throw new Error(`Unsupported file type: .${extension}`); }

            if (parsedData.length === 0) throw new Error("File is empty or could not be parsed.");

            data = parsedData.map(row => _.mapValues(row, v => (typeof v === 'string' && !isNaN(Number(v)) && !isNaN(parseFloat(v))) ? Number(v) : v));

            const fields: { dimensions: Field[], measures: Field[] } = { dimensions: [], measures: [] };
            Object.keys(data[0]).forEach(key => {
                const isNumeric = data.every(row => row[key] === null || row[key] === undefined || row[key] === '' || typeof row[key] === 'number');
                const isDateTime = !isNumeric && data.some(row => (row[key] && !/^\d+(\.\d+)?$/.test(String(row[key])) && !isNaN(new Date(String(row[key])).getTime())));
                const fieldType = isNumeric ? FieldType.MEASURE : (isDateTime ? FieldType.DATETIME : FieldType.DIMENSION);
                fields[fieldType === FieldType.MEASURE ? 'measures' : 'dimensions'].push({ name: key, simpleName: key, type: fieldType });
            });

            data.forEach(row => {
                 fields.measures.forEach(f => { const v = row[f.name]; row[f.name] = (v === null || v === undefined || v === '') ? null : (isNaN(Number(v)) ? null : Number(v)); });
                 fields.dimensions.filter(f => f.type === FieldType.DATETIME).forEach(f => { if (row[f.name]) { const d = new Date(row[f.name]); row[f.name] = !isNaN(d.getTime()) ? d : null; } });
            });

            const newSource: DataSource = { 
                id: _.uniqueId('source_'), 
                name: file.name.replace(/\.[^/.]+$/, ""), 
                data, 
                fields,
                type: 'file',
                status: 'connected',
                lastSync: new Date().toISOString()
            };
            setDataSources(d => new Map(d).set(newSource.id, newSource));
            notificationService.success(`Successfully loaded ${file.name}`);
            
            if(aiConfig) {
                 setTimeout(() => {
                    notificationService.info("Get started with AI-powered analysis!", { duration: 10000,
                        action: { label: 'Suggest Charts', onClick: modalManager.openChatModal }
                    })
                }, 1000);
            }
        } catch (e) {
            notificationService.error(`Error loading file: ${(e as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };
    
    const loadSampleData = (sampleKey: 'sales' | 'iris' | 'both') => {
         const processSample = (id: string, name: string, csvData: string) => {
            try {
                const parsed = Papa.parse(csvData, { header: true, dynamicTyping: true, skipEmptyLines: true });
                if (parsed.errors.length > 0) throw new Error(parsed.errors.map(e => e.message).join(', '));
                const fields: { dimensions: Field[], measures: Field[] } = { dimensions: [], measures: [] };
                if (parsed.data.length > 0) {
                    Object.keys(parsed.data[0] as object).forEach(key => {
                        const isNumeric = parsed.data.every(row => typeof (row as any)[key] === 'number' || (row as any)[key] === null);
                        fields[isNumeric ? 'measures' : 'dimensions'].push({ name: key, simpleName: key, type: isNumeric ? FieldType.MEASURE : FieldType.DIMENSION });
                    });
                }
                const newSource: DataSource = {
                    id, name, data: parsed.data, fields,
                    type: 'file',
                    status: 'connected',
                    lastSync: new Date(new Date().getTime() - Math.random() * 1000 * 3600 * 24).toISOString(),
                    description: 'Sample data loaded from a local file.',
                    health: 90 + Math.floor(Math.random() * 11),
                    size: parseFloat((0.5 + Math.random() * 2).toFixed(1)),
                    tables: Math.floor(5 + Math.random() * 20),
                    queryTime: Math.floor(50 + Math.random() * 100),
                    icon: 'file-spreadsheet',
                    technology: 'CSV File',
                };
                setDataSources(d => new Map(d).set(id, newSource));
            } catch (e) { notificationService.error(`Error parsing sample data "${name}": ${(e as Error).message}`); }
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
                setDashboardUndoableState(prev => { const newTMap = new Map(prev.transformations); newTMap.delete(id); return { ...prev, transformations: Array.from(newTMap.entries()) }; });
                setRelationships(prev => prev.filter(r => r.sourceAId !== id && r.sourceBId !== id));
                notificationService.success('Data source removed.');
            }
        });
    };
    
    // --- AI Callbacks ---
    const sendAiChatMessage = async (message: string, context?: ChatContext) => {
        if (!aiConfig) { notificationService.error("AI is not configured."); return; }
        
        let fullContextMessage = message;
        if (context) {
            const widget = widgets.find(w => w.id === context.widgetId);
            if (widget) {
                const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, parameters);
                fullContextMessage = `In the context of the widget titled "${widget.title}", which is a ${widget.chartType} chart, answer the following question: ${message}.\n\nWidget Data Summary:\n${JSON.stringify(data, null, 2).substring(0, 1500)}`;
            }
        }

        const userMessage: AiChatMessage = { id: _.uniqueId('msg_'), role: 'user', content: message, widgetContext: context ? { widgetId: context.widgetId, widgetTitle: widgets.find(w=>w.id === context.widgetId)?.title || ''} : undefined };
        const thinkingMessage: AiChatMessage = { id: _.uniqueId('msg_'), role: 'assistant', content: '...', isStreaming: true };
        
        setAiChatHistory(prev => [...prev, userMessage, thinkingMessage]);
        
        if (aiConfig.provider === 'gemini') {
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            try {
                let fullResponse = '';
                const stream = aiService.getChatResponseStream(aiConfig, [...aiChatHistory, userMessage], allFields, blendedData.slice(0, 5));
                for await (const chunk of stream) {
                    fullResponse += chunk;
                    setAiChatHistory(prev => prev.map(m => m.id === thinkingMessage.id ? { ...m, content: fullResponse } : m));
                }
                setAiChatHistory(prev => prev.map(m => m.id === thinkingMessage.id ? { ...m, isStreaming: false } : m));
            } catch (e) {
                const errorMessage: AiChatMessage = { id: _.uniqueId('msg_'), role: 'assistant', content: `Error: ${(e as Error).message}` };
                setAiChatHistory(prev => prev.filter(m => m.id !== thinkingMessage.id).concat(errorMessage));
            }
        }
    };

    const handleNlpFilterQuery = async (query: string) => {
        if (!aiConfig) {
            notificationService.error('AI is not configured.');
            return;
        }
        setLoadingState({ isLoading: true, message: 'Parsing your request with AI...' });
        try {
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            const result = await aiService.getNlpFilter(aiConfig, query, allFields);

            if (result.type === 'UNAMBIGUOUS' && result.unambiguousResult) {
                const { fieldName, condition, values } = result.unambiguousResult;
                const field = allFields.find(f => f.simpleName === fieldName);
                if (field) {
                    addGlobalFilter({
                        name: field.name,
                        simpleName: field.simpleName,
                        type: field.type,
                        aggregation: field.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT,
                        filter: { condition, values },
                    });
                    notificationService.success(`Filter added for "${field.simpleName}".`);
                }
            } else if (result.type === 'AMBIGUOUS' && result.ambiguousResult) {
                modalManager.openNlpDisambiguationModal(result.ambiguousResult.term, result.ambiguousResult.possibleFields);
            } else {
                notificationService.info("Couldn't find a filter in your request. Try something like 'show sales in the east region'.");
            }
        } catch (error) {
            notificationService.error(`AI filter parsing failed: ${(error as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };

    const resolveNlpAmbiguity = (term: string, fieldSimpleName: string) => {
        modalManager.closeNlpDisambiguationModal();
        const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
        const field = allFields.find(f => f.simpleName === fieldSimpleName);
        if (field) {
            addGlobalFilter({
                name: field.name,
                simpleName: field.simpleName,
                type: field.type,
                aggregation: field.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT,
                filter: { condition: FilterCondition.IS_ONE_OF, values: [term] },
            });
            notificationService.success(`Filter added for "${field.simpleName}".`);
        }
    };

    const generateDashboardInsights = async () => {
        if (!aiConfig || !activePage) return;
        setIsGeneratingInsights(true);
        try {
            const widgetDataSummaries = await Promise.all(
                activePage.widgets.map(async (widget) => {
                    const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, parameters);
                    if (data.type === 'nodata' || data.type === 'loading' || data.type === 'heatmap') return null;
                    return `Widget: "${widget.title}" (Type: ${widget.chartType})\nData:\n${JSON.stringify(data)}\n---`;
                })
            );
            const fullSummary = widgetDataSummaries.filter(Boolean).join('\n');
            if (!fullSummary) { notificationService.info('Not enough data on the dashboard to generate insights.'); return; }
            const rawResult = await aiService.getAiDashboardAnalysis(aiConfig, fullSummary);
            const result: AiInsight = { id: _.uniqueId('insight_'), timestamp: new Date().toISOString(), ...JSON.parse(rawResult) };
            setInsightsByPage(prev => new Map(prev).set(activePage.id, [result]));
        } catch (e) { notificationService.error(`Failed to generate insights: ${(e as Error).message}`); } 
        finally { setIsGeneratingInsights(false); }
    };

    const runProactiveAnalysis = useCallback(async () => {
        if (!aiConfig || !activePage) return;
        setIsGeneratingInsights(true);
        try {
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            const simpleFields = allFields.map(f => ({ name: f.simpleName, type: f.type }));
            const dataSample = blendedData.slice(0, 50);

            const insights = await aiService.getProactiveInsights(aiConfig, simpleFields, dataSample);
            
            if (insights.length > 0) {
                const insightsWithIds: ProactiveInsight[] = insights.map(i => ({ ...i, id: _.uniqueId('pi_') }));
                setProactiveInsights(prev => new Map(prev).set(activePage.id, insightsWithIds));
                setHasNewInsights(true);
            } else {
                 setProactiveInsights(prev => new Map(prev).set(activePage.id, []));
            }
        } catch (e) {
            notificationService.error(`Failed to get proactive insights: ${(e as Error).message}`);
        } finally {
            setIsGeneratingInsights(false);
        }
    }, [aiConfig, activePage, blendedData, blendedFields]);

    // --- Widget Editor Logic ---
    const openWidgetEditorModal = (widgetId?: string | null) => {
        const widgetToEdit = widgetId ? widgets.find(w => w.id === widgetId) : null;

        if (widgetToEdit) {
            modalManager.setEditingWidgetState(_.cloneDeep(widgetToEdit));
        } else {
            modalManager.setEditingWidgetState({
                id: 'new',
                title: 'New Widget',
                chartType: dashboardDefaults.chartType,
                displayMode: dashboardDefaults.chartType === ChartType.TABLE ? 'table' : 'chart',
                shelves: { columns: [], rows: [], values: [], filters: [] },
                subtotalSettings: { rows: false, columns: false, grandTotal: true },
                colorPalette: dashboardDefaults.colorPalette,
            });
        }
        modalManager.openWidgetEditorModal();
    };

    const openWidgetEditorForNewWidget = (chartType: ChartType) => {
        const displayMode = chartType === ChartType.TABLE ? 'table' : (chartType === ChartType.CONTROL ? 'control' : 'chart');
        
        let widgetDefaults: Partial<WidgetState> = {};
        if (chartType === ChartType.CONTROL) {
            widgetDefaults.title = 'New Control';
            widgetDefaults.controlSettings = { display: 'list' };
        } else {
            widgetDefaults.title = `New ${chartType}`;
        }
    
        modalManager.setEditingWidgetState({
            id: 'new',
            chartType: chartType,
            displayMode: displayMode,
            shelves: { columns: [], rows: [], values: [], filters: [] },
            subtotalSettings: { rows: false, columns: false, grandTotal: true },
            colorPalette: dashboardDefaults.colorPalette,
            ...widgetDefaults,
        } as WidgetState);
    
        modalManager.openWidgetEditorModal();
    };

    const saveEditingWidget = () => {
        if (modalManager.editingWidgetState) {
            saveWidget(modalManager.editingWidgetState);
            modalManager.closeWidgetEditorModal();
        }
    };
    
    const populateEditorFromAI = (suggestion: Partial<WidgetState>) => {
        const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
    
        const resolvePill = (pill: Partial<Pill>): Pill | null => {
            if (!pill.name) return null;
            const field = allFields.find(f => f.simpleName === pill.name || f.name === pill.name);
            if (!field) return null;
            return {
                id: _.uniqueId('pill_'),
                name: field.name,
                simpleName: field.simpleName,
                type: field.type,
                aggregation: pill.aggregation || (field.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT),
            };
        };
    
        const resolvedShelves = {
            columns: (suggestion.shelves?.columns || []).map(resolvePill).filter((p): p is Pill => p !== null),
            rows: (suggestion.shelves?.rows || []).map(resolvePill).filter((p): p is Pill => p !== null),
            values: (suggestion.shelves?.values || []).map(resolvePill).filter((p): p is Pill => p !== null),
            values2: (suggestion.shelves?.values2 || []).map(resolvePill).filter((p): p is Pill => p !== null),
            filters: (suggestion.shelves?.filters || []).map(resolvePill).filter((p): p is Pill => p !== null),
            category: (suggestion.shelves?.category || []).map(resolvePill).filter((p): p is Pill => p !== null),
            bubbleSize: (suggestion.shelves?.bubbleSize || []).map(resolvePill).filter((p): p is Pill => p !== null),
        };
    
        modalManager.setEditingWidgetState({
            id: 'new',
            title: suggestion.title || 'AI Suggested Widget',
            chartType: suggestion.chartType || dashboardDefaults.chartType,
            displayMode: suggestion.chartType === ChartType.TABLE ? 'table' : 'chart',
            shelves: resolvedShelves,
            subtotalSettings: { rows: false, columns: false, grandTotal: true },
            colorPalette: dashboardDefaults.colorPalette,
        } as WidgetState);
    
        modalManager.openWidgetEditorModal();
    };
    
    const openEditorWithAIPrompt = (prompt: string) => {
        modalManager.setWidgetEditorAIPrompt(prompt);
        modalManager.setEditingWidgetState({
            id: 'new',
            title: 'New AI Widget',
            chartType: dashboardDefaults.chartType,
            displayMode: dashboardDefaults.chartType === ChartType.TABLE ? 'table' : 'chart',
            shelves: { columns: [], rows: [], values: [], filters: [] },
            subtotalSettings: { rows: false, columns: false, grandTotal: true },
            colorPalette: dashboardDefaults.colorPalette,
        });
        modalManager.openWidgetEditorModal();
    };

    const runAdvancedAnalysis = async (widgetId: string, analysisType: 'ANOMALY_DETECTION' | 'KEY_INFLUENCERS' | 'CLUSTERING') => {
        if (!aiConfig || !activePage) return;
        const widget = activePage.widgets.find(w => w.id === widgetId);
        if (!widget) return;
        setLoadingState({ isLoading: true, message: `Running ${analysisType.replace('_', ' ')}...`, lottieAnimation: aiThinkingAnimation });
        try {
            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, parameters);
            if (data.type === 'chart' || data.type === 'kpi' || data.type === 'table') {
                const result = await aiService.getAiAdvancedAnalysis(aiConfig, analysisType, widget, data);
                modalManager.openAdvancedAnalysisModal(result, `AI Analysis: ${widget.title}`);
            } else {
                notificationService.info(`Analysis for widget type '${data.type}' is not supported.`);
            }
        } catch (e) {
            notificationService.error(`Advanced analysis failed: ${(e as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };
    
    const runWhatIfAnalysis = async (widgetId: string, scenarioConfig: { targetMetric: string, modifiedVariables: { [key: string]: number } }) => {
        if (!aiConfig || !activePage) return;
        const widget = activePage.widgets.find(w => w.id === widgetId);
        if (!widget) return;
        setLoadingState({ isLoading: true, message: 'Running What-If simulation...', lottieAnimation: aiThinkingAnimation });
        try {
            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, parameters);
            if (data.type === 'chart' || data.type === 'table') {
                const whatIfResult = await aiService.getAiWhatIfAnalysis(aiConfig, widget, data, scenarioConfig);
                const result: AdvancedAnalysisResult = {
                    title: `What-If Scenario: ${widget.title}`,
                    summary: `This simulation predicts the impact of your changes on the target metric "${scenarioConfig.targetMetric}".`,
                    details: [],
                    whatIfResult
                };
                modalManager.openAdvancedAnalysisModal(result, `What-If Analysis: ${widget.title}`);
            } else {
                 notificationService.info(`What-If analysis requires chart or table data.`);
                 return;
            }
        } catch (e) {
            notificationService.error(`What-If analysis failed: ${(e as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };
    
    const getWidgetAnalysisText = async (widget: WidgetState, tone: StoryTone = 'Executive'): Promise<string | null> => {
        if (!aiConfig) {
            notificationService.error("AI not configured");
            return null;
        }
        setLoadingState({ isLoading: true, message: `Analyzing "${widget.title}"...`, lottieAnimation: aiThinkingAnimation });
        try {
            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, parameters);
             if (data.type === 'loading' || data.type === 'nodata' || data.type === 'sankey' || data.type === 'heatmap') {
                notificationService.info(`AI analysis for this widget type is not yet supported.`);
                return null;
            }
            return await aiService.getAiWidgetAnalysis(aiConfig, widget.title, widget.chartType, data as any);
        } catch(e) {
            notificationService.error(`Widget analysis failed: ${(e as Error).message}`);
            return null;
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    }
    
    const runWidgetAnalysis = async (widget: WidgetState, tone: StoryTone = 'Executive') => {
        const analysisText = await getWidgetAnalysisText(widget, tone);
        if (analysisText) {
             const result: AdvancedAnalysisResult = {
                title: `AI Analysis: ${widget.title}`,
                summary: analysisText.split('\n\n')[0] || 'Analysis complete.',
                details: [{ heading: 'Key Observations', content: analysisText }]
            };
            modalManager.openAdvancedAnalysisModal(result, `AI Analysis: ${widget.title}`);
        }
    };
    
    const createWidgetFromSuggestionObject = (suggestion: Partial<WidgetState>): WidgetState => {
        const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
    
        const resolvePill = (pillInfo: any, isValueShelf: boolean): Pill | null => {
            const simpleName = isValueShelf ? (pillInfo as any).name : pillInfo;
            const aggregation = isValueShelf ? (pillInfo as any).aggregation : undefined;
            const field = allFields.find(f => f.simpleName === simpleName);
            if (!field) return null;
            
            return {
                id: _.uniqueId('pill_'), name: field.name, simpleName: field.simpleName, type: field.type,
                aggregation: aggregation || (field.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT),
            };
        };

        const resolvedShelves: WidgetState['shelves'] = { columns: [], rows: [], values: [], filters: [], values2: [], category: [], bubbleSize: [] };
        
        for (const shelfKey in suggestion.shelves) {
            const shelf = (suggestion.shelves as any)[shelfKey];
            if (Array.isArray(shelf)) {
                const isValueShelf = ['values', 'values2', 'bubbleSize'].includes(shelfKey);
                (resolvedShelves as any)[shelfKey] = shelf.map(pillInfo => resolvePill(pillInfo, isValueShelf)).filter(Boolean);
            }
        }

        return {
            id: _.uniqueId('widget_'), title: suggestion.title || 'AI Suggested Widget',
            chartType: suggestion.chartType || dashboardDefaults.chartType,
            displayMode: suggestion.chartType === ChartType.TABLE ? 'table' : 'chart',
            shelves: resolvedShelves, subtotalSettings: { rows: false, columns: false, grandTotal: true },
            colorPalette: dashboardDefaults.colorPalette,
        } as WidgetState;
    };

    const generateStoryFromInsights = async (insights: ProactiveInsight[]) => {
        if (!aiConfig) return;
        setLoadingState({ isLoading: true, message: 'Generating story from insights...', lottieAnimation: aiThinkingAnimation });
        modalManager.closeInsightHub();
        try {
            const storyPages: StoryPage[] = [];
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            
            for (const insight of insights) {
                const chatHistory: AiChatMessage[] = [{ id: '1', role: 'user', content: `Generate a visualization for: ${insight.suggestedChartPrompt}` }];
                const { chartSuggestion } = await aiService.getChatResponse(aiConfig, chatHistory, allFields, blendedData.slice(0, 5));

                if (chartSuggestion) {
                    const newWidget = createWidgetFromSuggestionObject(chartSuggestion as Partial<WidgetState>);
                    saveWidget(newWidget);
                    storyPages.push({ 
                        id: _.uniqueId('spage_'), 
                        type: 'insight',
                        title: insight.title,
                        widgetId: newWidget.id, 
                        annotation: `**${insight.title}**\n\n${insight.summary}`,
                        presenterNotes: ''
                    });
                }
            }

            if (storyPages.length === 0) {
                notificationService.info("Could not generate any visualizations from the insights.");
                return;
            }

            const now = new Date().toISOString();
            const newStory: Story = {
                id: _.uniqueId('story_'),
                title: "AI Generated Story from Insights",
                description: `A story automatically generated on ${new Date().toLocaleDateString()} based on proactive data insights.`,
                author: currentUser?.name || 'AI Assistant',
                createdAt: now,
                updatedAt: now,
                pages: storyPages
            };
            setStories(s => [...s, newStory]);
            setEditingStory({ story: newStory });
            setView('stories');
            notificationService.success(`Successfully generated story!`);

        } catch (e) {
            notificationService.error(`Failed to generate story from insights: ${(e as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };
    
    const generateStoryFromPage = async (pageId: string, title: string, tone: StoryTone) => {
        if (!aiConfig) return;
        const page = workspaces.flatMap(ws => ws.pages).find(p => p.id === pageId);
        if (!page || page.widgets.length === 0) {
            notificationService.info('Selected page has no widgets to create a story from.');
            return;
        }
        setLoadingState({ isLoading: true, message: 'Generating story with AI...', lottieAnimation: aiThinkingAnimation });
        try {
            const storyPages: StoryPage[] = [];
            for (const widget of page.widgets) {
                const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, parameters);
                if (data.type === 'chart' || data.type === 'kpi' || data.type === 'table') {
                    const annotation = await aiService.getAiWidgetAnalysis(aiConfig, widget.title, widget.chartType, data);
                    storyPages.push({
                        id: _.uniqueId('page_'),
                        type: 'insight',
                        title: `Insight from ${widget.title}`,
                        widgetId: widget.id,
                        annotation: annotation || `Analysis of ${widget.title}.`,
                        presenterNotes: ''
                    });
                }
            }
    
            if (storyPages.length === 0) {
                notificationService.info("No widgets on this page were suitable for AI analysis.");
                return;
            }
    
            const now = new Date().toISOString();
            const newStory: Story = {
                id: _.uniqueId('story_'),
                title,
                description: `A story automatically generated from the '${page.name}' dashboard on ${new Date().toLocaleDateString()}.`,
                author: currentUser?.name || 'AI Assistant',
                createdAt: now,
                updatedAt: now,
                pages: storyPages
            };
            setStories(s => [...s, newStory]);
            setEditingStory({ story: newStory });
            notificationService.success(`Successfully generated "${title}"!`);
        } catch (e) {
            notificationService.error(`Failed to generate story: ${(e as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };
    
    const createPageFromTemplate = (template: Template, mappings: Map<string, string>) => {
        const newPage = _.cloneDeep(template.page);
        newPage.widgets?.forEach(widget => {
            Object.values(widget.shelves).forEach(shelf => {
                if (Array.isArray(shelf)) {
                    shelf.forEach(pill => {
                        const templateFieldName = pill.name.match(/{{(.*?)}}/)?.[1];
                        if (templateFieldName) {
                            const mappedFieldName = mappings.get(templateFieldName);
                            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
                            const sourceField = allFields.find(f => f.name === mappedFieldName);
                            if (mappedFieldName && sourceField) {
                                pill.name = mappedFieldName;
                                pill.simpleName = sourceField.simpleName;
                                pill.type = sourceField.type;
                            }
                        }
                    });
                }
            });
        });
        addNewPage(newPage);
        notificationService.success(`New page created from "${template.name}" template.`);
    };

    const createTemplateFromPage = (page: DashboardPage, templateDetails: Omit<Template, 'id' | 'page' | 'requiredFields'>) => {
        const newTemplate: Template = {
            ...templateDetails,
            id: _.uniqueId('usertemplate_'),
            page,
            requiredFields: []
        };
        setUserTemplates(current => [...current, newTemplate]);
        notificationService.success(`Template "${newTemplate.name}" saved.`);
    };
    
    const handleImportDashboard = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedState = JSON.parse(event.target?.result as string);
                if (importedState.version && importedState.workspaces) {
                    setDashboardUndoableState(importedState, true);
                    if (importedState.relationships) setRelationships(importedState.relationships);
                    if (importedState.parameters) setParameters(importedState.parameters);
                    if (importedState.stories) setStories(importedState.stories);
                    if (importedState.aiConfig) setAiConfig(importedState.aiConfig);
                    if (importedState.themeConfig) setThemeConfig(importedState.themeConfig);
                    if (importedState.chartLibrary) setChartLibrary(importedState.chartLibrary);
                    if (importedState.dashboardDefaults) setDashboardDefaults(importedState.dashboardDefaults);
                    if (importedState.userTemplates) setUserTemplates(importedState.userTemplates);
                    if (importedState.dataModelerLayout) setDataModelerLayout(importedState.dataModelerLayout);
                    notificationService.success('Dashboard imported successfully!');
                } else {
                    throw new Error('Invalid dashboard file format.');
                }
            } catch (error) {
                notificationService.error(`Failed to import dashboard: ${(error as Error).message}`);
            }
        };
        reader.readAsText(file);
        if(importInputRef.current) importInputRef.current.value = '';
    };

    const resetDashboard = () => {
        modalManager.openConfirmationModal({
            title: 'Reset Dashboard Page?',
            message: 'This will clear all widgets and layouts on the current page. This action cannot be undone.',
            onConfirm: () => {
                if (activePage) {
                    updatePage(activePage.id, p => ({ ...p, widgets: [], layouts: {} }));
                    notificationService.success('Dashboard page has been reset.');
                }
            },
        });
    };

    const addBookmark = (name: string) => {
        if (!activePageId) return;
        const newBookmark: Bookmark = { id: _.uniqueId('bookmark_'), name, globalFilters, crossFilter };
        updatePage(activePageId, p => ({ ...p, bookmarks: [...(p.bookmarks || []), newBookmark] }));
        notificationService.success(`Bookmark "${name}" created.`);
    };
    const applyBookmark = (bookmark: Bookmark) => {
        if (!activePageId) return;
        setGlobalFilters(bookmark.globalFilters);
        setCrossFilter(bookmark.crossFilter);
        notificationService.info(`Applied bookmark "${bookmark.name}".`);
    };
    const removeBookmark = (bookmarkId: string) => {
        if (!activePageId) return;
        updatePage(activePageId, p => ({ ...p, bookmarks: (p.bookmarks || []).filter(b => b.id !== bookmarkId) }));
    };

    const handleExportDashboard = () => {
        const stateToExport = {
            version: DASHBOARD_STATE_VERSION,
            workspaces,
            transformations: Array.from(transformations.entries()),
            relationships,
            parameters,
            stories,
            aiConfig,
            themeConfig,
            chartLibrary,
            dashboardDefaults,
            userTemplates,
            dataModelerLayout,
            dataStudioCanvasLayout,
        };
        const blob = new Blob([JSON.stringify(stateToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pivotal-pro-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        notificationService.success('Dashboard exported.');
    };

    const clearApplicationState = () => {
        localStorage.clear();
        window.location.reload();
    };
    
    const handleGenerateAiDashboard = async () => {
        modalManager.closeAiInsightStarterModal();
        if (!aiConfig) {
            notificationService.error('AI is not configured.');
            return;
        }
        if (dataSources.size === 0) {
            notificationService.error('Please add a data source first.');
            return;
        }
    
        setLoadingState({ isLoading: true, message: 'AI is analyzing your data...', lottieAnimation: aiThinkingAnimation });
    
        try {
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            const simpleFields = allFields.map(f => ({ name: f.simpleName, type: f.type }));
            const dataSample = blendedData.slice(0, 20).map(row => {
                const simpleRow: { [key: string]: any } = {};
                for (const field of allFields) {
                    simpleRow[field.simpleName] = row[field.name];
                }
                return simpleRow;
            });
    
            await new Promise(resolve => setTimeout(resolve, 1500));
            setLoadingState({ isLoading: true, message: 'Generating insights and visualizations...', lottieAnimation: aiThinkingAnimation });
    
            const suggestion: AiDashboardSuggestion = await aiService.generateAiDashboard(aiConfig, simpleFields, dataSample);
            
            setLoadingState({ isLoading: true, message: 'Building your new dashboard...', lottieAnimation: aiThinkingAnimation });
    
            const firstSourceId = dataSources.keys().next().value;
            if (firstSourceId) {
                for (const cf of suggestion.calculatedFields) {
                    const formulaWithFullNames = cf.formula.replace(/\[([^\]]+)\]/g, (match, simpleName) => {
                        const field = allFields.find(f => f.simpleName === simpleName);
                        return field ? `[${field.name}]` : match;
                    });
                    addCalculatedField(firstSourceId, cf.fieldName, formulaWithFullNames);
                }
            }
    
            const resolvedWidgets: WidgetState[] = suggestion.page.widgets.map((w, index) => {
                const resolvedShelves: WidgetState['shelves'] = { columns: [], rows: [], values: [], filters: [] };
                for (const shelfKey in w.shelves) {
                    const shelf = (w.shelves as any)[shelfKey] as any[];
                    if (Array.isArray(shelf)) {
                        const isValueShelf = ['values', 'values2', 'bubbleSize'].includes(shelfKey);
                        (resolvedShelves as any)[shelfKey] = shelf.map(pillInfo => {
                            const simpleName = isValueShelf ? pillInfo.name : pillInfo;
                            const aggregation = isValueShelf ? pillInfo.aggregation : undefined;
            
                            const field = allFields.find(f => f.simpleName === simpleName);
                            if (!field) return null;
            
                            return {
                                id: _.uniqueId('pill_'),
                                name: field.name,
                                simpleName: field.simpleName,
                                type: field.type,
                                aggregation: aggregation || (field.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT),
                            } as Pill;
                        }).filter(Boolean);
                    }
                }
                return {
                    id: `widget-${index}`,
                    title: w.title,
                    chartType: w.chartType,
                    displayMode: w.chartType === ChartType.TABLE ? 'table' : 'chart',
                    shelves: resolvedShelves,
                    subtotalSettings: { rows: false, columns: false, grandTotal: true },
                };
            });
    
            const remappedLayouts = _.mapValues(suggestion.page.layouts, layout => 
                layout.map((item, index) => ({...item, i: `widget-${index}`}))
            );
    
            addNewPage({
                name: suggestion.page.name,
                widgets: resolvedWidgets,
                layouts: remappedLayouts,
            });
            
            notificationService.success("Your new AI-generated dashboard is ready!");
        } catch (e) {
            notificationService.error(`AI dashboard generation failed: ${(e as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };

    const createDataSourceFromConnection = async (config: { connector: Connector; details: any; name: string }) => {
        setLoadingState({ isLoading: true, message: `Connecting to ${config.name}...` });
        try {
            const fetchedData = await apiService.fetchDataFromApi(config.details);

            if (!Array.isArray(fetchedData) || fetchedData.length === 0) {
                throw new Error("API did not return a valid array of data.");
            }

            const data = fetchedData.map(row => _.mapValues(row, v => (typeof v === 'string' && !isNaN(Number(v)) && !isNaN(parseFloat(v))) ? Number(v) : v));

            const fields: { dimensions: Field[], measures: Field[] } = { dimensions: [], measures: [] };
            Object.keys(data[0]).forEach(key => {
                const isNumeric = data.every(row => row[key] === null || row[key] === undefined || row[key] === '' || typeof row[key] === 'number');
                const isDateTime = !isNumeric && data.some(row => (row[key] && !/^\d+(\.\d+)?$/.test(String(row[key])) && !isNaN(new Date(String(row[key])).getTime())));
                const fieldType = isNumeric ? FieldType.MEASURE : (isDateTime ? FieldType.DATETIME : FieldType.DIMENSION);
                fields[fieldType === FieldType.MEASURE ? 'measures' : 'dimensions'].push({ name: key, simpleName: key, type: fieldType });
            });

            const newSource: DataSource = {
                id: _.uniqueId('source_'),
                name: config.name,
                description: `Connection via ${config.connector.name}`,
                data,
                fields,
                type: config.connector.category === 'File' ? 'file' : config.connector.category === 'Database' ? 'database' : 'api',
                status: 'connected',
                lastSync: new Date().toISOString(),
                connectionDetails: {
                    type: config.connector.id,
                    ...config.details
                }
            };

            setDataSources(d => new Map(d).set(newSource.id, newSource));
            notificationService.success(`Successfully connected to ${config.name}`);
            modalManager.closeDataSourceConnectionModal();
            setView('studio', { sourceId: newSource.id });
        } catch (e) {
            notificationService.error(`Failed to connect: ${(e as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };

    const refreshApiDataSource = useCallback(async (source: DataSource) => {
        if (source.type === 'file') {
            notificationService.info(`"${source.name}" is a file-based source and cannot be refreshed automatically.`);
            return;
        }
        if (!source.connectionDetails) return;

        setDataSources(prev => new Map(prev).set(source.id, { ...source, status: 'syncing' }));
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)); // Simulate network delay
        try {
            const fetchedData = await apiService.fetchDataFromApi(source.connectionDetails);
            if (!Array.isArray(fetchedData)) throw new Error("API did not return a valid array.");
            
            setDataSources(prev => {
                const currentSource = prev.get(source.id);
                if (!currentSource) return prev;
                return new Map(prev).set(source.id, { 
                    ...currentSource, 
                    data: fetchedData, 
                    status: 'connected', 
                    lastSync: new Date().toISOString() 
                });
            });
             notificationService.info(`Data for "${source.name}" has been refreshed.`);
        } catch (e) {
            console.error(`Failed to refresh data for ${source.name}:`, e);
            setDataSources(prev => {
                 const currentSource = prev.get(source.id);
                 if (!currentSource) return prev;
                 return new Map(prev).set(source.id, { ...currentSource, status: 'error' });
            });
             notificationService.error(`Could not refresh data for "${source.name}".`);
        }
    }, []);

    useEffect(() => {
        const initialDataSources = getInitialState<[string, DataSource][]>('pivotalProDataSources', []);
        initialDataSources.forEach(([id, source]) => {
            if (source.type === 'api' && source.connectionDetails) {
                // Initial fetch is now more for show, actual refresh is manual
            }
        });
    }, []);

    const setControlFilter = useCallback((widgetId: string, filterPill: Pill | null) => {
        setControlFilters(prev => {
            const newMap = new Map(prev);
            if (filterPill) {
                newMap.set(widgetId, { ...filterPill, id: widgetId }); // Use widgetId as pillId for uniqueness
            } else {
                newMap.delete(widgetId);
            }
            return newMap;
        });
    }, []);

    const addPredictiveModel = (model: PredictiveModelResult) => {
        setPredictiveModels(prev => [...prev, model]);
    };
    
    const saveStory = (story: Story) => {
        setStories(prev => {
            const i = prev.findIndex(s => s.id === story.id);
            const storyToSave = { ...story, updatedAt: new Date().toISOString() };
            if (i > -1) {
                const n = [...prev];
                n[i] = storyToSave;
                return n;
            }
            return [...prev, storyToSave];
        });
    };
    
    const createStoryFromWidget = (widgetId: string) => {
        const allWidgets = workspaces.flatMap(ws => ws.pages).flatMap(p => p.widgets);
        const widget = allWidgets.find(w => w.id === widgetId);
        const now = new Date().toISOString();
        const newStory: Story = {
            id: _.uniqueId('story_'),
            title: `${widget?.title || 'New'} Story`,
            description: '',
            author: currentUser?.name || 'Unknown',
            createdAt: now,
            updatedAt: now,
            pages: [{ 
                id: _.uniqueId('page_'),
                type: 'insight',
                title: widget?.title || 'New Insight',
                widgetId, 
                annotation: '',
                presenterNotes: ''
            }]
        };
        setStories(s => [...s, newStory]);
        setEditingStory({ story: newStory, focusPageId: newStory.pages[0].id });
        modalManager.closeAddToStoryModal();
    };

    const addWidgetToStory = (storyId: string, widgetId: string) => {
        const allWidgets = workspaces.flatMap(ws => ws.pages).flatMap(p => p.widgets);
        const widget = allWidgets.find(w => w.id === widgetId);
        const newPage: StoryPage = { 
            id: _.uniqueId('page_'), 
            type: 'insight',
            title: widget?.title || 'New Insight',
            widgetId, 
            annotation: '',
            presenterNotes: ''
        };
        const story = stories.find(s => s.id === storyId);
        if(story) {
            const updatedStory = { ...story, pages: [...story.pages, newPage] };
            setStories(s => s.map(st => st.id === storyId ? updatedStory : st));
            setEditingStory({ story: updatedStory, focusPageId: newPage.id });
            modalManager.closeAddToStoryModal();
        }
    };
    const runHealthCheck = useCallback(() => {
        notificationService.info('Health Check in Progress', {
            description: 'Checking connection status for all data sources...',
        });
    
        setTimeout(() => {
            setDataSources(prevSources => {
                const newSources = new Map<string, DataSource>();
                prevSources.forEach((source, id) => {
                    const health = 80 + Math.floor(Math.random() * 21);
                    
                    const updatedSource: DataSource = {
                        ...source,
                        health,
                        status: source.status === 'pending' ? 'pending' : (Math.random() > 0.1 ? 'connected' : 'disconnected'),
                        lastSync: new Date().toISOString(),
                    };
                    newSources.set(id, updatedSource);
                });
                return newSources;
            });
            
            notificationService.success('Connection Successful', { description: 'Successfully checked all data sources.' });
        }, 2500);
    }, []);

    const value: DashboardContextProps = {
        // State
        dataSources, relationships, dataModelerLayout, blendedData, blendedFields, performanceTimings,
        aiConfig, aiChatHistory, insightsByPage, isGeneratingInsights,
        themeConfig, chartLibrary, dashboardDefaults, contextMenu, currentView, explorerState, studioSourceId,
        isDataStudioOnboardingNeeded, notifications, loadingState, scrollToWidgetId, dashboardMode, isHelpModeActive,
        workspaces, activePageId, activePage, widgets, layouts, globalFilters, parameters, stories, editingStory,
        userTemplates, crossFilter, controlFilters, canUndo, canRedo, refetchCounter, predictiveModels, dataStudioCanvasLayout,
        newlyAddedPillId,

        // Callbacks & Setters
        addDataSourceFromFile,
        removeDataSource, loadSampleData, setRelationships, setDataModelerLayout, setDataStudioCanvasLayout,
        setWidgetPerformance: (widgetId: string, duration: number) => setPerformanceTimings(p => new Map(p).set(widgetId, duration)),
        triggerWidgetRefetch: () => setRefetchCounter(c => c + 1),
        saveAiConfig: setAiConfig, sendAiChatMessage, clearAiChatHistory: () => setAiChatHistory([]),
        createWidgetFromSuggestion: (suggestion) => { modalManager.closeChatModal(); populateEditorFromAI(suggestion); },
        chatContext, setChatContext, proactiveInsights, runProactiveAnalysis, hasNewInsights, setHasNewInsights,
        setThemeConfig, toggleThemeMode: () => setThemeConfig(t => ({...t, mode: t.mode === 'dark' ? 'light' : 'dark'})),
        setThemeName: (name: string) => setThemeConfig(t => ({...t, name})),
        setChartLibrary, setDashboardDefaults,
        openContextMenu: (x, y, items) => setContextMenu({ x, y, items }), closeContextMenu: () => setContextMenu(null),
        setView, completeDataStudioOnboarding: () => setDataStudioOnboardingNeeded(false),
        removeToast,
        setScrollToWidgetId, setDashboardMode, toggleHelpMode: () => setIsHelpModeActive(p => !p),
        setWorkspaces, setActivePageId, addPage, removePage, updatePage,
        setLayouts, setGlobalFilters, addGlobalFilter, removeWidget, saveWidget, duplicateWidget, duplicatePage,
        setCrossFilter, setControlFilter, addParameter: p => setParameters(prev => [...prev, { ...p, id: _.uniqueId('param_') }]),
        updateParameter: (id, updates) => setParameters(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p)),
        removeParameter: (id: string) => setParameters(prev => prev.filter(p => p.id !== id)),
        saveStory,
        removeStory: id => setStories(s => s.filter(story => story.id !== id)),
        undo: historyUndo, redo: historyRedo,
        importInputRef, handleImportDashboard, resetDashboard, addNewPage,
        setUserTemplates, addBookmark, applyBookmark, removeBookmark,
        isRowCollapsed: path => collapsedRows.includes(path),
        toggleRowCollapse: path => { if(activePageId) updatePage(activePageId, { collapsedRows: collapsedRows.includes(path) ? collapsedRows.filter(p => p !== path) : [...collapsedRows, path] }); },
        expandAllRows: () => { if(activePageId) updatePage(activePageId, { collapsedRows: [] })},
        collapseAllRows: paths => { if(activePageId) updatePage(activePageId, { collapsedRows: paths })},
        setEditingStory,
        handleWidgetAddToStory: widgetId => modalManager.setAddToStoryModalState({isOpen: true, widgetId}),
        createStoryFromWidget,
        addWidgetToStory,
        handleExportDashboard, saveStateToLocalStorage, clearApplicationState,
        applyTransformations: (sourceId, newTransforms) => setDashboardUndoableState(p => { const n = new Map(p.transformations); n.set(sourceId, newTransforms); return { ...p, transformations: Array.from(n.entries()) }; }),
        getTransformationsForSource: sourceId => transformations.get(sourceId) || [],
        addTransformation,
        removeTransformation: (sourceId, transformId) => setDashboardUndoableState(p => { const currentTransformsMap = new Map(p.transformations); const c = currentTransformsMap.get(sourceId) || []; const n = new Map(currentTransformsMap).set(sourceId, c.filter(t => t.id !== transformId)); return { ...p, transformations: Array.from(n.entries()) }; }),
        resetAllTransformations: sourceId => setDashboardUndoableState(p => { const n = new Map(p.transformations); n.set(sourceId, []); return { ...p, transformations: Array.from(n.entries()) }; }),
        addCalculatedField,
        addComment: (widgetId, position) => { if (!activePageId || !currentUser) return; const newComment: DashboardComment = { id: _.uniqueId('comment_'), widgetId, position, messages: [{ id: _.uniqueId('msg_'), author: currentUser.name, text: '', timestamp: new Date().toISOString() }] }; updatePage(activePageId, p => ({ ...p, comments: [...(p.comments || []), newComment] })); modalManager.setActiveCommentThread(newComment); },
        updateComment: (commentId, messages) => { if (!activePageId) return; updatePage(activePageId, p => ({ ...p, comments: (p.comments || []).map(c => c.id === commentId ? { ...c, messages } : c) })); },
        deleteComment: (commentId) => { if (!activePageId) return; updatePage(activePageId, p => ({ ...p, comments: (p.comments || []).filter(c => c.id !== commentId) })); },
        generateDashboardInsights,
        runAdvancedAnalysis,
        runWhatIfAnalysis,
        runWidgetAnalysis,
        getWidgetAnalysisText,
        generateStoryFromPage,
        generateStoryFromInsights,
        createPageFromTemplate,
        createTemplateFromPage,
        handleGenerateAiDashboard,
        addPredictiveModel,
        refreshApiDataSource,
        runHealthCheck,
        createDataSourceFromConnection,
        ...modalManager,
        openWidgetEditorModal,
        openWidgetEditorForNewWidget,
        saveEditingWidget,
        populateEditorFromAI,
        openEditorWithAIPrompt,
        resolveNlpAmbiguity,
        handleNlpFilterQuery,
        setNewlyAddedPillId,
    };

    return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
