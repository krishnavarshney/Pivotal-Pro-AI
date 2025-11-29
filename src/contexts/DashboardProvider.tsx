import React, { useState, useEffect, useCallback, useRef, useContext, ReactNode, FC, SetStateAction, Dispatch, useMemo } from 'react';
import _ from 'lodash';
import { 
    WidgetState, WidgetLayout, Story, CrossFilterState, Template, Bookmark, Workspace, 
    DashboardPage, Pill, DashboardContext, DashboardContextProps, Field, 
    AIConfig, AiChatMessage, ThemeConfig, 
    ChartLibrary, DashboardDefaults, ContextMenuItem, ToastNotification, ExplorerState, 
    AdvancedAnalysisResult, ChartType, ValueFormat, DashboardComment, DashboardCommentMessage, StoryTone, AggregationType,
    ChatContext, PredictiveModelResult, ControlFilterState, DashboardMode,
    Insight,
    InsightStatus,
    AiWidgetSuggestion,
    OnboardingState,
    TourName,
    UndoableState
} from '../utils/types';
import { notificationService, registerShowToast } from '../services/notificationService';
import { useAuth } from './AuthProvider';
import { useHistoryState } from '../hooks/useHistoryState';
import { useModalManager } from '../hooks/useModalManager';
import { useData } from './DataContext';
import { TOURS } from '../utils/onboardingTours';

import { useDashboardWorkspaces } from '../hooks/dashboard/useDashboardWorkspaces';
import { useDashboardPages } from '../hooks/dashboard/useDashboardPages';
import { useDashboardWidgets } from '../hooks/dashboard/useDashboardWidgets';
import { useDashboardExport } from '../hooks/dashboard/useDashboardExport';
import { useDashboardAI } from '../hooks/dashboard/useDashboardAI';

const DASHBOARD_STATE_VERSION = 2;

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
    const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const dataContext = useData();
    if (!dataContext) {
      throw new Error("DashboardProvider must be used within a DataProvider");
    }
    const { blendedData, blendedFields } = dataContext;

    // --- State Initialization ---
    const initialDashboardState = useMemo(() => getInitialState<any>('pivotalProDashboardState', null), []);

    const initialUndoableState: UndoableState = {
        workspaces: initialDashboardState?.workspaces?.length ? initialDashboardState.workspaces : [],
        activeWorkspaceId: null,
        activePageId: null,
        themeConfig: { name: 'pivotal-pro', mode: 'light' },
        dashboardDefaults: { colorPalette: 'Pivotal Pro', chartType: ChartType.BAR },
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

    const { 
        activeWorkspaceId, setActiveWorkspaceId, 
        activePageId, setActivePageId, 
        setWorkspaces,
        isWorkspacesLoading
    } = useDashboardWorkspaces(isAuthenticated, isAuthLoading, setDashboardUndoableState, workspaces, initialDashboardState);

    // --- AI State ---
    const [aiConfig, setAiConfig] = useState<AIConfig | null>(getInitialAiConfig);
    const [aiChatHistory, setAiChatHistory] = useState<AiChatMessage[]>([]);
    const [chatContext, setChatContext] = useState<ChatContext>(null);
    const [insights, setInsights] = useState<Insight[]>(() => getInitialState('pivotalProInsights', []));
    
    // --- UI State ---
    const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => getInitialState('pivotalProTheme', { name: 'pivotal-pro', mode: 'light' }));
    const [chartLibrary, setChartLibrary] = useState<ChartLibrary>(() => getInitialState('pivotalProChartLibrary', 'echarts'));
    const [dashboardDefaults, setDashboardDefaults] = useState<DashboardDefaults>(() => getInitialState('pivotalProDefaults', { colorPalette: 'Pivotal Pro', chartType: ChartType.BAR }));
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, items: ContextMenuItem[] } | null>(null);
    const [currentView, setCurrentView] = useState<DashboardContextProps['currentView']>('dashboard');
    const [explorerState, setExplorerState] = useState<ExplorerState | null>(null);
    const [studioSourceId, setStudioSourceId] = useState<string | null>(null);
    const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
    const [allNotifications, setAllNotifications] = useState<ToastNotification[]>(() => getInitialState('pivotalProNotifications', []));
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [loadingState, setLoadingState] = useState<{ isLoading: boolean; message: string }>({ isLoading: false, message: '' });
    const [scrollToWidgetId, setScrollToWidgetId] = useState<string | null>(null);
    const [activeDatasetId, setActiveDatasetId] = useState<string | 'blended'>(() => {
        const sources = Array.from(dataContext.dataSources.values());
        return sources.length > 1 ? 'blended' : (sources[0]?.id || 'blended');
    });
    const [dashboardMode, setDashboardMode] = useState<DashboardMode>('view');
    const [isHelpModeActive, setIsHelpModeActive] = useState(false);
    const [newlyAddedPillId, setNewlyAddedPillId] = useState<string | null>(null);
    
    // --- Feature State ---
    const [stories, setStories] = useState<Story[]>(() => getInitialState('pivotalProStories', []));
    const [editingStory, setEditingStory] = useState<{ story: Story, focusPageId?: string } | null>(null);
    const [userTemplates, setUserTemplates] = useState<Template[]>(() => getInitialState('pivotalProUserTemplates', []));
    const [crossFilter, setCrossFilter] = useState<CrossFilterState>(null);
    const [controlFilters, setControlFilters] = useState<ControlFilterState>({});
    const [refetchCounter, setRefetchCounter] = useState(0);
    const [predictiveModels, setPredictiveModels] = useState<PredictiveModelResult[]>(() => getInitialState('pivotalProPredictiveModels', []));
    const [performanceTimings, setPerformanceTimings] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        registerShowToast((options) => {
            const newToast: ToastNotification = {
                id: _.uniqueId('toast_'),
                ...options,
                read: false,
                timestamp: new Date().toISOString()
            };
            setToastNotifications(prev => [...prev, newToast]);
            setAllNotifications(prev => [newToast, ...prev]);

            // Auto remove after 5 seconds
            setTimeout(() => {
                setToastNotifications(prev => prev.filter(t => t.id !== newToast.id));
            }, 5000);
        });
    }, []);


    // --- Onboarding State ---
    const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => getInitialState('pivotalProOnboarding', {
        isTourActive: false,
        currentTour: null,
        currentStep: 0,
        completedTours: []
    }));

    // --- Derived State ---
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const activePage = activeWorkspace?.pages?.find(p => p.id === activePageId);
    const widgets = activePage?.widgets || [];
    const layouts = activePage?.layouts || {};
    const globalFilters = activePage?.globalFilters || [];
    const collapsedRows = activePage?.collapsedRows || [];
    const unreadNotificationCount = allNotifications.filter(n => !n.read).length;

    const setView = (view: any, options?: any) => {
        setCurrentView(view);
        if (options?.sourceId) setStudioSourceId(options.sourceId);
        if (options?.explorerState) setExplorerState(options.explorerState);
    };

    // --- Helper Functions ---
    const setControlFilter = (widgetId: string, filter: Pill | null) => {
        setControlFilters(prev => {
            if (filter === null) {
                const newState = { ...prev };
                delete newState[widgetId];
                return newState;
            }
            return { ...prev, [widgetId]: filter };
        });
    };

    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImportDashboard = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            dataContext.addDataSourceFromFile(file);
            if (importInputRef.current) {
                importInputRef.current.value = '';
            }
        }
    };
    
    const { 
        updatePage, setGlobalFilters, addGlobalFilter, setLayouts, addNewPage, addPage, removePage, duplicatePage, renamePage 
    } = useDashboardPages(workspaces, setWorkspaces, activeWorkspaceId, activePageId, setActivePageId, setView, setNewlyAddedPillId);

    const {
        selectedWidgetIds, saveWidget, removeWidget, duplicateWidget, toggleWidgetSelection, deselectAllWidgets, deleteSelectedWidgets, duplicateSelectedWidgets
    } = useDashboardWidgets(activePageId, widgets, updatePage, modalManager, dashboardMode);

    const { exportSelectedWidgets } = useDashboardExport(activePage, selectedWidgetIds, blendedData, globalFilters, crossFilter, dataContext, controlFilters, setLoadingState, deselectAllWidgets);

    const {
        sendAiChatMessage, handleNlpFilterQuery, resolveNlpAmbiguity, generateNewInsights, updateInsightStatus, exploreInsight, runAdvancedAnalysis, runWhatIfAnalysis, getWidgetAnalysisText, runWidgetAnalysis, generateStoryFromInsights, generateStoryFromPage, handleGenerateAiDashboard, addPredictiveModel, discussSelectedWithAI, addSelectedToStory, createWidgetFromSuggestionObject
    } = useDashboardAI(activePage, selectedWidgetIds, widgets, blendedData, globalFilters, crossFilter, dataContext, controlFilters, aiConfig, aiChatHistory, setAiChatHistory, modalManager, deselectAllWidgets, setStories, setEditingStory, setView, currentUser, blendedFields, addGlobalFilter, setInsights, setLoadingState, addNewPage, saveWidget, setPredictiveModels, activePageId, dashboardDefaults);

    // --- Other Methods ---
    const removeToast = (id: string) => setToastNotifications(prev => prev.filter(t => t.id !== id));
    const openNotificationPanel = () => setIsNotificationPanelOpen(true);
    const closeNotificationPanel = () => setIsNotificationPanelOpen(false);
    const markAllNotificationsAsRead = () => setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const clearAllNotifications = () => setAllNotifications([]);

    const saveStory = (story: Story) => {
        setStories(prev => {
            const index = prev.findIndex(s => s.id === story.id);
            if (index >= 0) return prev.map(s => s.id === story.id ? story : s);
            return [...prev, story];
        });
        setEditingStory(null);
        notificationService.success(`Story "${story.title}" saved.`);
    };

    const createStoryFromWidget = (widgetId: string) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return;
        const newStory: Story = {
            id: _.uniqueId('story_'),
            title: `Story about ${widget.title}`,
            description: `Created from widget ${widget.title}`,
            author: currentUser?.name || 'User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pages: [{
                id: _.uniqueId('spage_'),
                type: 'insight',
                title: widget.title,
                widgetId: widget.id,
                annotation: '',
                presenterNotes: ''
            }]
        };
        setStories(prev => [...prev, newStory]);
        setEditingStory({ story: newStory });
        setView('stories');
    };

    const addWidgetToStory = (storyId: string, widgetId: string) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return;
        setStories(prev => prev.map(s => {
            if (s.id === storyId) {
                return {
                    ...s,
                    pages: [...s.pages, {
                        id: _.uniqueId('spage_'),
                        type: 'insight',
                        title: widget.title,
                        widgetId: widget.id,
                        annotation: '',
                        presenterNotes: ''
                    }]
                };
            }
            return s;
        }));
        notificationService.success(`Added ${widget.title} to story.`);
        modalManager.closeAddToStoryModal();
    };

    const handleExportDashboard = () => {
        // Placeholder for full dashboard export
        notificationService.info("Full dashboard export coming soon.");
    };

    const saveStateToLocalStorage = useCallback(_.debounce(() => {
        try {
            const stateToSave = {
                version: DASHBOARD_STATE_VERSION,
                workspaces
            };
            localStorage.setItem('pivotalProDashboardState', JSON.stringify(stateToSave));
            localStorage.setItem('pivotalProAiConfig', JSON.stringify(aiConfig));
            localStorage.setItem('pivotalProTheme', JSON.stringify(themeConfig));
            localStorage.setItem('pivotalProChartLibrary', JSON.stringify(chartLibrary));
            localStorage.setItem('pivotalProDefaults', JSON.stringify(dashboardDefaults));
            localStorage.setItem('pivotalProInsights', JSON.stringify(insights));
            localStorage.setItem('pivotalProStories', JSON.stringify(stories));
            localStorage.setItem('pivotalProUserTemplates', JSON.stringify(userTemplates));
            localStorage.setItem('pivotalProNotifications', JSON.stringify(allNotifications));
            localStorage.setItem('pivotalProPredictiveModels', JSON.stringify(predictiveModels));
            localStorage.setItem('pivotalProOnboarding', JSON.stringify(onboardingState));
        } catch (error) {
            console.error("Failed to save dashboard state:", error);
        }
    }, 1000), [workspaces, aiConfig, themeConfig, chartLibrary, dashboardDefaults, insights, stories, userTemplates, allNotifications, predictiveModels, onboardingState]);

    useEffect(() => {
        saveStateToLocalStorage();
    }, [saveStateToLocalStorage]);

    // --- Onboarding ---
    const startOnboardingTour = (tourName: TourName, step?: number) => {
        setOnboardingState(prev => ({ ...prev, currentTour: tourName, currentStep: step || 0, isTourActive: true }));
    };
    const advanceOnboardingStep = (direction: 'next' | 'back') => {
        setOnboardingState(prev => {
            if (!prev.currentTour) return prev;
            const tour = TOURS[prev.currentTour];
            // FIX: Ensure TOURS[prev.currentTour] exists before accessing steps
            if (!tour) return prev;
            
            if (direction === 'next') {
                if (prev.currentStep < tour.length - 1) {
                    return { ...prev, currentStep: prev.currentStep + 1 };
                } else {
                    return { 
                        ...prev, 
                        isTourActive: false, 
                        currentTour: null, 
                        completedTours: [...prev.completedTours, prev.currentTour] 
                    };
                }
            } else {
                if (prev.currentStep > 0) {
                    return { ...prev, currentStep: prev.currentStep - 1 };
                }
                return prev;
            }
        });
    };
    const exitOnboarding = () => setOnboardingState(prev => ({ ...prev, isTourActive: false, currentTour: null }));

    // --- Comments ---
    const addComment = (widgetId: string, position: { x: number; y: number }) => {
        if (!activePageId) return;
        const newComment: DashboardComment = {
            id: _.uniqueId('comment_'),
            widgetId,
            position,
            messages: []
        };
        updatePage(activePageId, p => ({ ...p, comments: [...(p.comments || []), newComment] }));
        modalManager.setActiveCommentThread(newComment);
    };

    const updateComment = (commentId: string, messages: DashboardCommentMessage[]) => {
        if (!activePageId) return;
        updatePage(activePageId, p => ({
            ...p,
            comments: (p.comments || []).map(c => c.id === commentId ? { ...c, messages } : c)
        }));
    };

    const deleteComment = (commentId: string) => {
        if (!activePageId) return;
        updatePage(activePageId, p => ({
            ...p,
            comments: (p.comments || []).filter(c => c.id !== commentId)
        }));
        if (modalManager.activeCommentThread?.id === commentId) {
            modalManager.setActiveCommentThread(null);
        }
    };
    


    // --- Widget Editor ---
    const openWidgetEditorModal = (widgetId?: string | null) => {
        if (widgetId) {
            const widget = widgets.find(w => w.id === widgetId);
            if (widget) {
                modalManager.setEditingWidgetState(widget);
                modalManager.openWidgetEditorModal();
            }
        } else {
            // Always create new widget state to ensure fresh start
            openWidgetEditorForNewWidget();
        }
    };

    const openWidgetEditorForNewWidget = (chartType: ChartType = dashboardDefaults.chartType) => {
        let targetPageId = activePageId;
        
        // Fallback logic: If no active page, try to find one from the active workspace or first workspace
        if (!targetPageId && workspaces.length > 0) {
             const ws = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
             targetPageId = ws.pages?.[0]?.id;
        }

        modalManager.setEditingWidgetState({
            id: 'new',
            title: 'New Widget',
            chartType: chartType,
            displayMode: chartType === 'Table' ? 'table' : 'chart',
            shelves: { columns: [], rows: [], values: [], filters: [] },
            subtotalSettings: { rows: false, columns: false, grandTotal: true },
            colorPalette: dashboardDefaults.colorPalette,
            pageId: targetPageId || '',
            configuration: {},
            layouts: {},
        });
        modalManager.openWidgetEditorModal();
    };

    const saveEditingWidget = async () => {
        if (modalManager.editingWidgetState) {
            await saveWidget(modalManager.editingWidgetState);
            modalManager.closeWidgetEditorModal();
        }
    };

    const populateEditorFromAI = (suggestion: AiWidgetSuggestion) => {
        const newWidget = createWidgetFromSuggestionObject(suggestion);
        modalManager.setEditingWidgetState(newWidget);
        modalManager.openWidgetEditorModal();
    };

    const openEditorWithAIPrompt = (prompt: string) => {
        modalManager.setWidgetEditorAIPrompt(prompt);
        openWidgetEditorForNewWidget();
    };

    const resetDashboard = () => {
        modalManager.openConfirmationModal({
            title: 'Reset Dashboard?',
            message: 'This will clear all your workspaces, pages, and widgets. This action cannot be undone.',
            onConfirm: () => {
                setWorkspaces([]);
                setActiveWorkspaceId(null);
                setActivePageId(null);
                localStorage.removeItem('pivotalProDashboardState');
                window.location.reload();
            }
        });
    };

    const clearApplicationState = () => {
        modalManager.openConfirmationModal({
            title: 'Clear Application State?',
            message: 'This will clear ALL application data including data sources and settings. This action cannot be undone.',
            onConfirm: () => {
                localStorage.clear();
                window.location.reload();
            }
        });
    };

    const createPageFromTemplate = async (template: Template, _mappings: Map<string, string>) => {
        // Implementation for template creation with mappings would go here
        // For now, basic implementation
        await addNewPage({
            name: template.name,
            widgets: template.page?.widgets || [],
            layouts: template.page?.layouts || {},
            globalFilters: template.page?.globalFilters || []
        });
        notificationService.success(`Created page from template "${template.name}"`);
    };

    const createTemplateFromPage = (page: DashboardPage, templateDetails: Omit<Template, 'id' | 'page' | 'requiredFields'>) => {
        const newTemplate: Template = {
            id: _.uniqueId('template_'),
            ...templateDetails,
            page: page,
            requiredFields: [], // Logic to extract required fields would go here
        };
        setUserTemplates(prev => [...prev, newTemplate]);
        notificationService.success(`Template "${templateDetails.name}" created.`);
    };

    const addBookmark = (name: string) => {
        if (!activePageId) return;
        const newBookmark: Bookmark = {
            id: _.uniqueId('bookmark_'),
            name,
            globalFilters: _.cloneDeep(globalFilters),
            crossFilter: _.cloneDeep(crossFilter),
            controlFilters: _.cloneDeep(controlFilters)
        };
        updatePage(activePageId, p => ({ ...p, bookmarks: [...(p.bookmarks || []), newBookmark] }));
        notificationService.success(`Bookmark "${name}" added.`);
    };

    const applyBookmark = (bookmark: Bookmark) => {
        if (!activePageId) return;
        updatePage(activePageId, { globalFilters: bookmark.globalFilters });
        setCrossFilter(bookmark.crossFilter || null);
        setControlFilters(bookmark.controlFilters || {});
        notificationService.success(`Bookmark "${bookmark.name}" applied.`);
    };

    const removeBookmark = (id: string) => {
        if (!activePageId) return;
        updatePage(activePageId, p => ({ ...p, bookmarks: (p.bookmarks || []).filter(b => b.id !== id) }));
    };

    const composedDataContext = {
        ...dataContext,
        // Ensure we override or add any specific dashboard-level data context extensions here if needed
    };

    const value: DashboardContextProps = {
        ...composedDataContext,
        isWorkspacesLoading,
        performanceTimings,
        aiConfig, aiChatHistory, insights, isGeneratingInsights: loadingState.isLoading && loadingState.message.includes('insights'),
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
        activeDatasetId, setActiveDataset: setActiveDatasetId,
        setWorkspaces, setActivePageId, addPage, removePage, updatePage, renamePage,
        setLayouts, setGlobalFilters, addGlobalFilter, removeWidget, saveWidget, duplicateWidget, duplicatePage,
        setCrossFilter, setControlFilter, 
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
        addComment,
        updateComment,
        deleteComment,
        ...modalManager,

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