import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, ReactNode, ChangeEvent, FC, SetStateAction } from 'react';
import _ from 'lodash';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
    WidgetState, WidgetLayout, Story, CrossFilterState, Template, Bookmark, Workspace, 
    DashboardPage, Pill, DashboardContext, DashboardContextProps, Field, FieldType, 
    AIConfig, AiChatMessage, ThemeConfig, 
    ChartLibrary, DashboardDefaults, ContextMenuItem, ToastNotification, ExplorerState, User, 
    AdvancedAnalysisResult, AiInsight, TransformationType, ChartType, ValueFormat, DashboardComment, StoryPage, DashboardCommentMessage, WhatIfResult, StoryTone, AggregationType, AiDashboardSuggestion,
    ChatContext, ProactiveInsight, PredictiveModelResult, ControlFilterState, DashboardMode,
    FilterCondition,
    Insight,
    InsightStatus,
    AuthContextProps,
    AiWidgetSuggestion,
    OnboardingState,
    TourName
} from '../utils/types';
import { DASHBOARD_TEMPLATES } from '../utils/constants';
import { processWidgetData } from '../utils/dataProcessing/widgetProcessor';
import * as aiService from '../services/aiService';
import { notificationService, registerShowToast } from '../services/notificationService';
import { useAuth } from './AuthProvider';
import { useHistoryState, UndoableState } from '../hooks/useHistoryState';
import { useModalManager } from '../hooks/useModalManager';
import { useData } from './DataProvider';
import { TOURS } from '../utils/onboardingTours';


const DASHBOARD_STATE_VERSION = 2;

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
    const dataContext = useData();
    if (!dataContext) {
      throw new Error("DashboardProvider must be used within a DataProvider");
    }
    const { blendedData, blendedFields } = dataContext;

    // --- State Initialization ---
    const initialDashboardState = getInitialState('pivotalProDashboardState', null);

    const initialUndoableState: UndoableState = {
        workspaces: initialDashboardState?.workspaces?.length ? initialDashboardState.workspaces : [createDefaultWorkspace()],
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

    const { workspaces } = dashboardUndoableState;

    // --- AI State ---
    const [aiConfig, setAiConfig] = useState<AIConfig | null>(getInitialAiConfig);
    const [aiChatHistory, setAiChatHistory] = useState<AiChatMessage[]>([]);
    const [chatContext, setChatContext] = useState<ChatContext>(null);
    const [insights, setInsights] = useState<Insight[]>(() => getInitialState('pivotalProInsights', []));
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    
    // --- UI State ---
    const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => getInitialState('pivotalProTheme', { name: 'pivotal-pro', mode: 'light' }));
    const [chartLibrary, setChartLibrary] = useState<ChartLibrary>(() => getInitialState('pivotalProChartLibrary', 'echarts'));
    const [dashboardDefaults, setDashboardDefaults] = useState<DashboardDefaults>(() => getInitialState('pivotalProDefaults', { colorPalette: 'Pivotal Pro', chartType: ChartType.BAR }));
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, items: ContextMenuItem[] } | null>(null);
    const [currentView, setCurrentView] = useState<DashboardContextProps['currentView']>('dashboard');
    const [explorerState, setExplorerState] = useState<ExplorerState | null>(null);
    const [studioSourceId, setStudioSourceId] = useState<string | null>(null);
    const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
    const [allNotifications, setAllNotifications] = useState<ToastNotification[]>(() => getInitialState('pivotalProAllNotifications', []));
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [loadingState, setLoadingState] = useState<{ isLoading: boolean; message: string; }>({ isLoading: false, message: '' });
    const [scrollToWidgetId, setScrollToWidgetId] = useState<string | null>(null);
    const [dashboardMode, setDashboardMode] = useState<DashboardMode>('view');
    const [isHelpModeActive, setIsHelpModeActive] = useState(false);
    const [onboardingState, setOnboardingState] = useState<OnboardingState>(() =>
        getInitialState('pivotalProOnboardingState', {
            isTourActive: false,
            currentTour: null,
            currentStep: 0,
            completedTours: [],
        })
    );
    
    // --- Performance & Lineage State ---
    const [performanceTimings, setPerformanceTimings] = useState<Map<string, number>>(new Map());
    const [refetchCounter, setRefetchCounter] = useState(0);

    // --- Dashboard State ---
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(workspaces[0].id);
    const [activePageId, setActivePageId] = useState<string | null>(() => getInitialState('pivotalProActivePageId', null));
    const [stories, setStories] = useState<Story[]>(() => getInitialState('pivotalProStories', []));
    const [editingStory, setEditingStory] = useState<{ story: Story; focusPageId?: string; } | null>(null);
    const [userTemplates, setUserTemplates] = useState<Template[]>(() => getInitialState('pivotalProUserTemplates', []));
    const [crossFilter, setCrossFilter] = useState<CrossFilterState>(null);
    const [controlFilters, setControlFilters] = useState<ControlFilterState>(new Map());
    const [predictiveModels, setPredictiveModels] = useState<PredictiveModelResult[]>([]);
    const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>([]);
    
    // Derived State & Refs ---
    const unreadNotificationCount = useMemo(() => allNotifications.filter(n => !n.read).length, [allNotifications]);
    
    useEffect(() => {
        const allPages = workspaces.flatMap(ws => ws.pages || []);
        const activePageExists = allPages.some(p => p.id === activePageId);
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

    useEffect(() => {
        setSelectedWidgetIds([]);
    }, [activePageId, dashboardMode]);
    
    // --- Onboarding Callbacks ---
    const startOnboardingTour = useCallback((tour: TourName, step = 0) => {
        const tourSteps = TOURS[tour];
        if (!tourSteps || step >= tourSteps.length) {
            console.warn(`Tour "${tour}" or step ${step} does not exist.`);
            return;
        }
        setOnboardingState(prev => ({ ...prev, isTourActive: true, currentTour: tour, currentStep: step }));
    }, []);

    const advanceOnboardingStep = useCallback((direction: 'next' | 'back') => {
        setOnboardingState(prev => {
            if (!prev.currentTour) return prev;
            const tour = TOURS[prev.currentTour];
            if (!tour) return prev;

            if (direction === 'next') {
                if (prev.currentStep < tour.length - 1) {
                    return { ...prev, currentStep: prev.currentStep + 1 };
                } else {
                    const completedTour = prev.currentTour;
                    return {
                        ...prev,
                        isTourActive: false,
                        currentTour: null,
                        currentStep: 0,
                        completedTours: _.uniq([...prev.completedTours, completedTour]),
                    };
                }
            } else { // back
                if (prev.currentStep > 0) {
                    return { ...prev, currentStep: prev.currentStep - 1 };
                }
            }
            return prev;
        });
    }, []);

    const exitOnboarding = useCallback(() => {
        setOnboardingState(prev => ({
            ...prev,
            isTourActive: false,
            currentTour: null,
            currentStep: 0,
        }));
    }, []);

    // --- UI Callbacks ---
    const showToast = useCallback((options: Omit<ToastNotification, 'id'>) => {
        const newNotification: ToastNotification = { ...options, id: _.uniqueId('toast_') };
        setToastNotifications(prev => [...prev, newNotification]);
        setAllNotifications(prev => [newNotification, ...prev.slice(0, 99)]);
        setTimeout(() => removeToast(newNotification.id), options.duration || 5000);
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
            };
            localStorage.setItem('pivotalProDashboardState', JSON.stringify(stateToSave));
            localStorage.setItem('pivotalProActivePageId', JSON.stringify(activePageId));
            localStorage.setItem('pivotalProInsights', JSON.stringify(insights));
            localStorage.setItem('pivotalProStories', JSON.stringify(stories));
            localStorage.setItem('pivotalProAiConfig', JSON.stringify(aiConfig));
            localStorage.setItem('pivotalProTheme', JSON.stringify(themeConfig));
            localStorage.setItem('pivotalProChartLibrary', JSON.stringify(chartLibrary));
            localStorage.setItem('pivotalProDefaults', JSON.stringify(dashboardDefaults));
            localStorage.setItem('pivotalProUserTemplates', JSON.stringify(userTemplates));
            localStorage.setItem('pivotalProAllNotifications', JSON.stringify(allNotifications));
            localStorage.setItem('pivotalProOnboardingState', JSON.stringify(onboardingState));
        } catch (error) {
            console.error("Failed to save state to local storage:", error);
            notificationService.error("Could not save dashboard state.");
        }
    }, 1000), [workspaces, activePageId, insights, stories, aiConfig, themeConfig, chartLibrary, dashboardDefaults, userTemplates, allNotifications, onboardingState]);

    useEffect(() => {
        saveStateToLocalStorage();
    }, [saveStateToLocalStorage]);

    const removeToast = (id: string) => {
        setToastNotifications(prev => prev.filter(n => n.id !== id));
    };

    const setView = (view: DashboardContextProps['currentView'], options?: any) => {
        if (options?.initialFilters) setExplorerState(options);
        if (options?.sourceId) setStudioSourceId(options.sourceId);
        setCurrentView(view);
    };
    
    const markAllNotificationsAsRead = useCallback(() => {
        setAllNotifications(prev => prev.map(n => n.read ? n : { ...n, read: true }));
    }, []);

    const openNotificationPanel = () => {
        setIsNotificationPanelOpen(true);
        markAllNotificationsAsRead();
    };
    const closeNotificationPanel = () => setIsNotificationPanelOpen(false);
    
    const clearAllNotifications = () => {
        modalManager.openConfirmationModal({
            title: "Clear All Notifications?",
            message: "This will permanently delete all notifications from your history.",
            onConfirm: () => {
                setAllNotifications([]);
                closeNotificationPanel();
            }
        });
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

    const toggleWidgetSelection = (widgetId: string) => {
        setSelectedWidgetIds(prev =>
            prev.includes(widgetId)
                ? prev.filter(id => id !== widgetId)
                : [...prev, widgetId]
        );
    };

    const deselectAllWidgets = () => {
        setSelectedWidgetIds([]);
    };

    const deleteSelectedWidgets = () => {
        if (!activePageId || selectedWidgetIds.length === 0) return;
        modalManager.openConfirmationModal({
            title: `Delete ${selectedWidgetIds.length} Widgets?`,
            message: 'Are you sure you want to permanently delete the selected widgets? This action cannot be undone.',
            onConfirm: () => {
                updatePage(activePageId, (p) => ({
                    ...p,
                    widgets: p.widgets.filter(w => !selectedWidgetIds.includes(w.id)),
                    layouts: _.mapValues(p.layouts, l => l.filter(item => !selectedWidgetIds.includes(item.i))),
                }));
                const count = selectedWidgetIds.length;
                setSelectedWidgetIds([]);
                notificationService.success(`${count} widget${count > 1 ? 's' : ''} deleted.`);
            }
        });
    };

    const duplicateSelectedWidgets = () => {
        if (!activePageId || selectedWidgetIds.length === 0) return;
        const widgetsToCopy = widgets.filter(w => selectedWidgetIds.includes(w.id));
        if (widgetsToCopy.length > 0) {
            updatePage(activePageId, (currentPage) => {
                const newWidgets: WidgetState[] = [];
                const newLayoutItemsByBreakpoint: { [breakpoint: string]: WidgetLayout[] } = _.mapValues(currentPage.layouts, () => []);

                widgetsToCopy.forEach(widgetToCopy => {
                    const newWidget = { ..._.cloneDeep(widgetToCopy), id: _.uniqueId('widget_'), title: `${widgetToCopy.title} (Copy)` };
                    newWidgets.push(newWidget);
                    
                    const layoutToCopy = _.mapValues(currentPage.layouts, l => l.find(item => item.i === widgetToCopy.id));
                    Object.keys(newLayoutItemsByBreakpoint).forEach(key => {
                        if (layoutToCopy[key]) {
                            newLayoutItemsByBreakpoint[key].push({ ...layoutToCopy[key]!, i: newWidget.id, y: Infinity });
                        }
                    });
                });

                const updatedLayouts = _.mapValues(currentPage.layouts, (layout, bp) => [
                    ...layout,
                    ...(newLayoutItemsByBreakpoint[bp] || []),
                ]);

                return {
                    ...currentPage,
                    widgets: [...currentPage.widgets, ...newWidgets],
                    layouts: updatedLayouts,
                };
            });
            notificationService.success(`${widgetsToCopy.length} widget${widgetsToCopy.length > 1 ? 's' : ''} duplicated.`);
            setSelectedWidgetIds([]);
        }
    };

    const exportSelectedWidgets = async (format: 'PDF' | 'CSV' | 'XLSX') => {
        if (!activePage || selectedWidgetIds.length === 0) return;
        const widgetsToExport = activePage.widgets.filter(w => selectedWidgetIds.includes(w.id));
        setLoadingState({ isLoading: true, message: `Exporting ${widgetsToExport.length} widgets as ${format}...` });
        await new Promise(resolve => setTimeout(resolve, 500)); 

        try {
            if (format === 'CSV' || format === 'XLSX') {
                let combinedData: any[] = [];
                for (const widget of widgetsToExport) {
                    const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters, controlFilters);
                    if (data.type === 'table') {
                        data.rows.forEach(row => {
                            if (row.type === 'data') {
                                combinedData.push({ widget_title: widget.title, ...row.values });
                            }
                        });
                    } else if (data.type === 'chart') {
                        data.labels.forEach((label, index) => {
                            const row: { [key: string]: any } = { widget_title: widget.title, category: label };
                            data.datasets.forEach(ds => {
                                row[ds.label] = ds.data[index];
                            });
                            combinedData.push(row);
                        });
                    }
                }

                if (format === 'CSV') {
                    const csv = Papa.unparse(combinedData);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', 'dashboard_export.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else { // XLSX
                    const worksheet = XLSX.utils.json_to_sheet(combinedData);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Exported Data");
                    XLSX.writeFile(workbook, "dashboard_export.xlsx");
                }
            } else if (format === 'PDF') {
                const pdf = new jsPDF('p', 'mm', 'a4');
                let yPos = 15;
                const pageHeight = pdf.internal.pageSize.getHeight();
                const pageWidth = pdf.internal.pageSize.getWidth();
                pdf.setFontSize(18);
                pdf.text(activePage.name, pageWidth / 2, 10, { align: 'center' });

                for (const widgetId of selectedWidgetIds) {
                    const element = document.getElementById(`widget-wrapper-${widgetId}`)?.querySelector('.glass-panel') as HTMLElement;
                    if (element) {
                        const canvas = await html2canvas(element, { scale: 2 });
                        const imgData = canvas.toDataURL('image/png');
                        const imgProps = pdf.getImageProperties(imgData);
                        const pdfWidth = pageWidth - 20;
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                        if (yPos + pdfHeight > pageHeight - 15) {
                            pdf.addPage();
                            yPos = 15;
                        }
                        pdf.addImage(imgData, 'PNG', 10, yPos, pdfWidth, pdfHeight);
                        yPos += pdfHeight + 10;
                    }
                }
                pdf.save(`${activePage.name}_export.pdf`);
            }
            notificationService.success(`${widgetsToExport.length} widgets exported as ${format}.`);
        } catch (error) {
            notificationService.error(`Export failed: ${(error as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
            deselectAllWidgets();
        }
    };
    
    const discussSelectedWithAI = async () => {
        if (!activePage || selectedWidgetIds.length === 0) return;
        const widgetsToDiscuss = activePage.widgets.filter(w => selectedWidgetIds.includes(w.id));
        
        let prompt = `I have selected ${widgetsToDiscuss.length} widgets from my dashboard. Please provide a combined analysis and find any interesting correlations or insights between them.\n\nHere are the summaries:\n\n`;
        
        for (const widget of widgetsToDiscuss) {
            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters, controlFilters);
            let dataSummary = 'Data not available for summary.';
            if (data.type === 'chart') {
                dataSummary = JSON.stringify({ labels: data.labels.slice(0, 5), datasets: data.datasets.map(d => ({ label: d.label, data: d.data.slice(0, 5) })) }).substring(0, 500);
            } else if (data.type === 'table') {
                dataSummary = JSON.stringify(data.rows.slice(0, 5).map(r => r.values)).substring(0, 500);
            }
            prompt += `--- Widget: "${widget.title}" (${widget.chartType}) ---\nData Sample: ${dataSummary}...\n\n`;
        }
    
        sendAiChatMessage(prompt);
        modalManager.openChatModal();
        deselectAllWidgets();
    };
    
    const addSelectedToStory = () => {
        if (!activePage || selectedWidgetIds.length === 0) return;
        const widgetsToAdd = activePage.widgets.filter(w => selectedWidgetIds.includes(w.id));
    
        const now = new Date().toISOString();
        const newStory: Story = {
            id: _.uniqueId('story_'),
            title: `Story from ${activePage.name}`,
            description: `A story created from ${widgetsToAdd.length} selected widgets.`,
            author: currentUser?.name || 'User',
            createdAt: now,
            updatedAt: now,
            pages: widgetsToAdd.map(widget => ({
                id: _.uniqueId('spage_'),
                type: 'insight',
                title: `Insight from ${widget.title}`,
                widgetId: widget.id,
                annotation: `*Analysis for ${widget.title}...*`,
                presenterNotes: ''
            }))
        };
        setStories(s => [...s, newStory]);
        setEditingStory({ story: newStory });
        setView('stories');
        deselectAllWidgets();
        notificationService.success(`New story created with ${widgetsToAdd.length} widgets.`);
    };

    // --- AI Callbacks ---
    const sendAiChatMessage = async (message: string, context?: ChatContext) => {
        if (!aiConfig) { notificationService.error("AI is not configured."); return; }
        
        let fullContextMessage = message;
        if (context) {
            const widget = widgets.find(w => w.id === context.widgetId);
            if (widget) {
                const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters);
                fullContextMessage = `In the context of the widget titled "${widget.title}", which is a ${widget.chartType} chart, answer the following question: ${message}.\n\nWidget Data Summary:\n${JSON.stringify(data, null, 2).substring(0, 1500)}`;
            }
        }

        const userMessage: AiChatMessage = { id: _.uniqueId('msg_'), role: 'user', content: message, widgetContext: context ? { widgetId: context.widgetId, widgetTitle: widgets.find(w=>w.id === context.widgetId)?.title || ''} : undefined };
        const thinkingMessage: AiChatMessage = { id: _.uniqueId('msg_'), role: 'assistant', content: '...', isStreaming: true };
        
        setAiChatHistory(prev => [...prev, userMessage, thinkingMessage]);
        
        if (aiConfig.provider === 'gemini') {
            try {
                let fullResponse = '';
                const stream = aiService.getChatResponseStream(aiConfig, [...aiChatHistory, userMessage], blendedFields.dimensions.concat(blendedFields.measures), blendedData.slice(0, 5));
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

    const generateNewInsights = useCallback(async () => {
        if (!aiConfig) return;
        setIsGeneratingInsights(true);
        try {
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            const simpleFields = allFields.map(f => ({ name: f.simpleName, type: f.type }));
            const dataSample = blendedData.slice(0, 50);

            const proactiveResults = await aiService.getProactiveInsights(aiConfig, simpleFields, dataSample);
            
            const newInsights: Insight[] = proactiveResults.map(pi => ({
                id: _.uniqueId('insight_'),
                title: pi.title,
                description: pi.summary,
                type: pi.type,
                confidence: pi.confidence,
                status: InsightStatus.NEW,
                dataSource: dataContext.dataSources.values().next().value?.name || 'Blended Data',
                timestamp: new Date().toISOString(),
                suggestedChartPrompt: pi.suggestedChartPrompt
            }));

            setInsights(prev => [
                ...prev.filter(i => i.status !== InsightStatus.NEW),
                ...newInsights
            ]);
            notificationService.success(`${newInsights.length} new insights generated!`);

        } catch (e) {
            notificationService.error(`Failed to generate insights: ${(e as Error).message}`);
        } finally {
            setIsGeneratingInsights(false);
        }
    }, [aiConfig, blendedData, blendedFields, dataContext.dataSources]);

    const updateInsightStatus = (id: string, status: InsightStatus) => {
        setInsights(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    };

    const exploreInsight = (prompt: string) => {
        openEditorWithAIPrompt(prompt);
    };

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
    
    const populateEditorFromAI = (suggestion: AiWidgetSuggestion) => {
        const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
    
        const resolvePill = (pillInfo: any, isValueShelf: boolean): Pill | null => {
            const simpleName = isValueShelf ? (pillInfo as any).name : pillInfo;
            const aggregation = isValueShelf ? (pillInfo as any).aggregation : undefined;
            const field = allFields.find(f => f.simpleName === simpleName);
            if (!field) {
                console.warn(`AI suggested a field "${simpleName}" that does not exist.`);
                return null;
            }
            
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
                (resolvedShelves as any)[shelfKey] = shelf.map(pillInfo => resolvePill(pillInfo, isValueShelf)).filter((p): p is Pill => p !== null);
            }
        }
    
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
        setLoadingState({ isLoading: true, message: `Running ${analysisType.replace('_', ' ')}...` });
        try {
            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters);
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
        setLoadingState({ isLoading: true, message: 'Running What-If simulation...' });
        try {
            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters);
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
        setLoadingState({ isLoading: true, message: `Analyzing "${widget.title}"...` });
        try {
            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters);
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
    
    const createWidgetFromSuggestionObject = (suggestion: AiWidgetSuggestion): WidgetState => {
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

    const generateStoryFromInsights = async (insights: Insight[]) => {
        if (!aiConfig) return;
        setLoadingState({ isLoading: true, message: 'Generating story from insights...' });
        setView('insightHub');
        try {
            const storyPages: StoryPage[] = [];
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            
            for (const insight of insights) {
                const chatHistory: AiChatMessage[] = [{ id: '1', role: 'user', content: `Generate a visualization for: ${insight.suggestedChartPrompt}` }];
                const { chartSuggestion } = await aiService.getChatResponse(aiConfig, chatHistory, allFields, blendedData.slice(0, 5));

                if (chartSuggestion) {
                    const newWidget = createWidgetFromSuggestionObject(chartSuggestion);
                    saveWidget(newWidget);
                    storyPages.push({ 
                        id: _.uniqueId('spage_'), 
                        type: 'insight',
                        title: insight.title,
                        widgetId: newWidget.id, 
                        annotation: `**${insight.title}**\n\n${insight.description}`,
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
        setLoadingState({ isLoading: true, message: 'Generating story with AI...' });
        try {
            const storyPages: StoryPage[] = [];
            for (const widget of page.widgets) {
                const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters);
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
                    setDashboardUndoableState({ workspaces: importedState.workspaces }, true);
                    if (importedState.aiConfig) setAiConfig(importedState.aiConfig);
                    // ... import other states
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
            // ... export other states
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
        if (dataContext.dataSources.size === 0) {
            notificationService.error('Please add a data source first.');
            return;
        }
    
        setLoadingState({ isLoading: true, message: 'AI is analyzing your data...' });
    
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
            setLoadingState({ isLoading: true, message: 'Generating insights and visualizations...' });
    
            const suggestion: AiDashboardSuggestion = await aiService.generateAiDashboard(aiConfig, simpleFields, dataSample);
            
            setLoadingState({ isLoading: true, message: 'Building your new dashboard...' });
    
            const firstSourceId = dataContext.dataSources.keys().next().value;
            if (firstSourceId) {
                for (const cf of suggestion.calculatedFields) {
                    const formulaWithFullNames = cf.formula.replace(/\[([^\]]+)\]/g, (match, simpleName) => {
                        const field = allFields.find(f => f.simpleName === simpleName);
                        return field ? `[${field.name}]` : match;
                    });
                    dataContext.addCalculatedField(firstSourceId, cf.fieldName, formulaWithFullNames);
                }
            }
    
            const resolvedWidgets: WidgetState[] = suggestion.page.widgets.map((w, index) => {
                const newWidget = createWidgetFromSuggestionObject(w);
                return { ...newWidget, id: `widget-${index}` };
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

    const setControlFilter = useCallback((widgetId: string, filterPill: Pill | null) => {
        setControlFilters(prev => {
            const newMap = new Map(prev);
            if (filterPill) {
                newMap.set(widgetId, { ...filterPill, id: widgetId }); 
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

    const addComment = (widgetId: string, position: { x: number; y: number }) => {
        if (!activePage) return;
        const newComment: DashboardComment = {
            id: _.uniqueId('comment_'),
            widgetId,
            position,
            messages: [{ id: _.uniqueId('msg_'), author: currentUser?.name || 'User', text: '', timestamp: new Date().toISOString() }]
        };
        updatePage(activePage.id, p => ({ ...p, comments: [...(p.comments || []), newComment] }));
        modalManager.setActiveCommentThread(newComment);
    };

    const updateComment = (commentId: string, messages: DashboardCommentMessage[]) => {
        if (!activePage) return;
        updatePage(activePage.id, p => ({ ...p, comments: (p.comments || []).map(c => c.id === commentId ? { ...c, messages } : c) }));
    };

    const deleteComment = (commentId: string) => {
        if (!activePage) return;
        updatePage(activePage.id, p => ({ ...p, comments: (p.comments || []).filter(c => c.id !== commentId) }));
    };

    const { activeCommentThread, setActiveCommentThread: originalSetActiveCommentThread, ...restOfModalManager } = modalManager;
    const setActiveCommentThreadWithCleanup = (comment: DashboardComment | null) => {
        if (comment === null && activeCommentThread) {
            const isNewAndEmpty = activeCommentThread.messages.length === 1 && activeCommentThread.messages[0].text === '';
            if (isNewAndEmpty) {
                deleteComment(activeCommentThread.id);
            }
        }
        originalSetActiveCommentThread(comment);
    };
    

    const composedDataContext = {
      ...dataContext,
      handleImportDashboard: (e: ChangeEvent<HTMLInputElement>) => dataContext.addDataSourceFromFile(e.target.files![0]).then(() => {
        if(importInputRef.current) importInputRef.current.value = '';
      }),
    };

    const value: DashboardContextProps = {
        ...composedDataContext,
        performanceTimings,
        aiConfig, aiChatHistory, insights, isGeneratingInsights,
        themeConfig, chartLibrary, dashboardDefaults, contextMenu, currentView, explorerState, studioSourceId,
        toastNotifications, allNotifications, unreadNotificationCount, isNotificationPanelOpen,
        loadingState, scrollToWidgetId, dashboardMode, isHelpModeActive,
        workspaces, activePageId, activePage, widgets, layouts, globalFilters, stories, editingStory,
        userTemplates, crossFilter, controlFilters, canUndo, canRedo, refetchCounter, predictiveModels,
        newlyAddedPillId, selectedWidgetIds,
        onboardingState,
        startOnboardingTour,
        advanceOnboardingStep,
        exitOnboarding,
        setWidgetPerformance: (widgetId: string, duration: number) => setPerformanceTimings(p => new Map(p).set(widgetId, duration)),
        triggerWidgetRefetch: () => setRefetchCounter(c => c + 1),
        saveAiConfig: setAiConfig, sendAiChatMessage, clearAiChatHistory: () => setAiChatHistory([]),
        createWidgetFromSuggestion: (suggestion) => { modalManager.closeChatModal(); populateEditorFromAI(suggestion); },
        chatContext, setChatContext, setInsights, generateNewInsights, updateInsightStatus, exploreInsight,
        setThemeConfig, toggleThemeMode: () => setThemeConfig(t => ({...t, mode: t.mode === 'dark' ? 'light' : 'dark'})),
        setThemeName: (name: string) => setThemeConfig(t => ({...t, name})),
        setChartLibrary, setDashboardDefaults,
        openContextMenu: (x, y, items) => setContextMenu({ x, y, items }), closeContextMenu: () => setContextMenu(null),
        setView, 
        removeToast, openNotificationPanel, closeNotificationPanel, markAllNotificationsAsRead, clearAllNotifications,
        setScrollToWidgetId, setDashboardMode, toggleHelpMode: () => setIsHelpModeActive(p => !p),
        setWorkspaces, setActivePageId, addPage, removePage, updatePage,
        setLayouts, setGlobalFilters, addGlobalFilter, removeWidget, saveWidget, duplicateWidget, duplicatePage,
        setCrossFilter, setControlFilter, 
        saveStory,
        removeStory: id => setStories(s => s.filter(story => story.id !== id)),
        undo: historyUndo, redo: historyRedo,
        importInputRef, resetDashboard, addNewPage,
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
        addComment,
        updateComment,
        deleteComment,
        ...restOfModalManager,
        activeCommentThread,
        setActiveCommentThread: setActiveCommentThreadWithCleanup,
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
        openWidgetEditorModal,
        openWidgetEditorForNewWidget,
        saveEditingWidget,
        populateEditorFromAI,
        openEditorWithAIPrompt,
        resolveNlpAmbiguity,
        handleNlpFilterQuery,
        setNewlyAddedPillId,
        toggleWidgetSelection,
        deleteSelectedWidgets,
        duplicateSelectedWidgets,
        deselectAllWidgets,
        exportSelectedWidgets,
        discussSelectedWithAI,
        addSelectedToStory,
    };

    return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
