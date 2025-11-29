import { createContext, ReactNode, RefObject, Dispatch, SetStateAction } from 'react';
import { Layout } from 'react-grid-layout';

export const DashboardContext = createContext<DashboardContextProps | null>(null);

export type WidgetLayout = Layout;

export const DND_ITEM_TYPE = {
    FIELD: 'field',
    SHELF_PILL: 'shelf_pill',
    STUDIO_FIELD: 'studio_field',
    RELATIONSHIP_FIELD: 'relationship_field',
    DASHBOARD_TAB: 'dashboard_tab',
    TABLE_COLUMN: 'table_column',
    GROUPING_VALUE: 'grouping_value',
    WIDGET_CARD: 'widget_card',
    STORY_SLIDE: 'story_slide',
};

// Drag item interfaces
export interface FieldDragItem {
    name: string;
    simpleName: string;
    type: FieldType;
    isCalculated?: boolean;
    formula?: string;
}

export interface ShelfPillDragItem {
    pill: Pill;
    index: number;
    shelfId: keyof WidgetState['shelves'] | 'globalFilters';
}

export interface StudioFieldDragItem {
    field: Field;
    sourceType: FieldType;
}

export interface RelationshipFieldDragItem {
    sourceId: string;
    sourceName: string;
    fieldName: string;
}

export interface ContextMenuItem {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
}


export enum FieldType {
    DIMENSION = 'dimension',
    MEASURE = 'measure',
    DATETIME = 'datetime',
}

export interface Field {
    name: string;
    simpleName: string;
    type: FieldType;
    isCalculated?: boolean;
    formula?: string; // For numeric calculations
    transformation?: (row: any) => any; // For categorical or other data transformations
}

export enum AggregationType {
    SUM = 'SUM',
    AVERAGE = 'AVERAGE',
    COUNT = 'COUNT',
    MIN = 'MIN',
    MAX = 'MAX',
    PERCENT_OF_TOTAL = '% of Grand Total',
}

export enum FilterCondition {
    // Text & General
    EQUALS = '=',
    NOT_EQUALS = '!=',
    CONTAINS = 'contains',
    DOES_NOT_CONTAIN = 'does not contain',
    STARTS_WITH = 'starts with',
    ENDS_WITH = 'ends with',
    IS_ONE_OF = 'is one of',
    IS_NOT_ONE_OF = 'is not one of',

    // Numeric
    GREATER_THAN = '>',
    LESS_THAN = '<',
    GREATER_THAN_OR_EQUAL = '>=',
    LESS_THAN_OR_EQUAL = '<=',
    BETWEEN = 'is between',
}

export interface FilterConfig {
    condition: FilterCondition;
    values: any[];
}

export interface ValueFormat {
    prefix?: string;
    suffix?: string;
    decimalPlaces?: number;
}

export interface Pill {
    id: string;
    name: string;
    simpleName: string;
    type: FieldType;
    aggregation: AggregationType;
    isCalculated?: boolean;
    formula?: string;
    formatting?: ValueFormat;
    filter?: FilterConfig;
}

export enum ChartType {
    BAR = 'Bar',
    LINE = 'Line',
    AREA = 'Area',
    PIE = 'Pie',
    SCATTER = 'Scatter',
    RADAR = 'Radar',
    TABLE = 'Table',
    KPI = 'Kpi',
    GAUGE = 'Gauge',
    HEATMAP = 'Heatmap',
    FUNNEL = 'Funnel',
    TREEMAP = 'Treemap',
    DUAL_AXIS = 'Dual Axis',
    BOXPLOT = 'Box Plot',
    CONTROL = 'Control',
    SANKEY = 'Sankey',
    MAP = 'Map',
    BUBBLE = 'Bubble',
}

export interface TableSettings {
    theme?: 'default' | 'minimal' | 'bold-header' | 'modern' | 'condensed';
    striped?: boolean;
    headerBackgroundColor?: string;
    headerFontColor?: string;
    headerBorderColor?: string;
    headerFontSize?: number;
    gridColor?: string;
    gridStyle?: 'solid' | 'dashed' | 'dotted';
    showGrid?: boolean;
    pivotMeasureLayout?: 'horizontal' | 'vertical';
}

export interface ChartSettings {
    showLegend?: boolean;
    legendPosition?: 'top' | 'bottom' | 'left' | 'right';
    showTooltip?: boolean;
    showGrid?: boolean;
    showLabels?: boolean;
    animation?: boolean;
}

export interface SortConfig {
    fieldName: string;
    order: 'asc' | 'desc';
}

export interface ConditionalFormatRule {
    id: string;
    measureField: string; // name of the measure pill
    condition: '>' | '<' | '=' | '!=' | '>=' | '<=';
    value: number;
    backgroundColor: string;
    textColor: string;
}

export type WidgetDisplayMode = 'chart' | 'table' | 'section' | 'control';

export interface SectionSettings {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    paddingY?: number;
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface WidgetState {
    id: string;
    title: string;
    chartType: ChartType;
    displayMode: WidgetDisplayMode;
    pageId: string;
    configuration: any;
    layouts: any;
    shelves: {
        columns: Pill[];
        rows: Pill[];
        values: Pill[];
        values2?: Pill[]; // For Dual Axis charts
        filters: Pill[];
        category?: Pill[]; // for bubble charts
        bubbleSize?: Pill[]; // for bubble charts
    };
    subtotalSettings: {
        rows: boolean;
        columns: boolean;
        grandTotal?: boolean;
    };
    tableSettings?: TableSettings;
    chartSettings?: ChartSettings;
    drillPath?: { fieldName: string; value: any }[];
    kpiSettings?: {
        primaryValueIndex: number;
        secondaryValueIndex?: number;
        comparisonMode: 'value' | 'percentage';
    };
    mapSettings?: {
        geoField: string | null;
        mapType: 'world' | 'usa';
    };
    colorPalette?: string;
    sort?: SortConfig[];
    forecasting?: {
        enabled: boolean;
        periods: number;
    };
    isCrossFilterSource?: boolean; // For cross-filtering
    controlType?: 'slider' | 'dropdown'; // For dashboard controls
    targetType?: 'parameter' | 'field';
    targetId?: string; // e.g., parameter ID or field name for a control
    conditionalFormatting?: ConditionalFormatRule[]; // for tables
    controlSettings?: {
        display: 'list' | 'dropdown' | 'tabs' | 'range' | 'datepicker';
    };
    isStacked?: boolean;
    columnOrder?: string[];
    sectionSettings?: SectionSettings;
    widgetsData?: any;
}

export interface DashboardCommentMessage {
    id: string;
    author: string;
    text: string;
    timestamp: string;
}

export interface DashboardComment {
    id: string;
    widgetId: string;
    position: { x: number; y: number };
    messages: DashboardCommentMessage[];
}

export interface Bookmark {
    id: string;
    name: string;
    globalFilters: Pill[];
    crossFilter: CrossFilterState;
    controlFilters?: ControlFilterState;
}

export interface DashboardPage {
    id: string;
    name: string;
    widgets: WidgetState[];
    layouts: { [breakpoint: string]: WidgetLayout[] };
    globalFilters: Pill[];
    comments: DashboardComment[];
    bookmarks: Bookmark[];
    collapsedRows: string[];
    workspaceId?: string;
    configuration?: any;
    widgetsData?: any;
}

export interface Workspace {
    id: string;
    name: string;
    pages: DashboardPage[];
}

export interface UndoableState {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    activePageId: string | null;
    themeConfig: ThemeConfig;
    dashboardDefaults: DashboardDefaults;
}

export interface User {
    id: string;
    name: string;
    email: string;
    initials: string;
    role: 'USER' | 'ADMIN';
    password?: string; // Only for mock service, don't expose to client
    createdAt?: string;
    lastLogin?: string;
}

export enum TransformationType {
    DELETE_FIELD = 'Delete Field',
    RENAME_FIELD = 'Rename Field',
    DUPLICATE_FIELD = 'Duplicate Field',
    CHANGE_TYPE = 'Change Data Type',
    STANDARDIZE_TEXT = 'Standardize Text',
    HANDLE_NULLS = 'Handle Null Values',
    REMOVE_DUPLICATES = 'Remove Duplicates',
    CREATE_CALCULATED_FIELD = 'Create Calculated Field',
    CREATE_CATEGORICAL_COLUMN = 'Create Categorical Field',
    SPLIT_COLUMN = 'Split Column',
    MERGE_COLUMNS = 'Merge Columns',
    CONVERT_TO_DATETIME = 'Convert to Date/Time',
}

export interface CategoricalRule {
    id: string;
    sourceField: string;
    condition: FilterCondition;
    value: any;
    output: string;
}

export interface CreateCategoricalPayload {
    newFieldName: string;
    rules: CategoricalRule[];
    defaultValue?: any;
}

export interface SplitColumnPayload {
    fieldName: string;
    delimiter: string;
    newColumnNames: string[];
}

export interface MergeColumnsPayload {
    newFieldName: string;
    columnsToMerge: string[];
    separator: string;
    deleteOriginals: boolean;
}

export interface Transformation {
    id: string;
    type: TransformationType;
    payload: any;
}

export type ConnectorType = 'postgresql' | 'mysql' | 'google_analytics' | 'salesforce' | 'rest_api' | 'csv' | 'excel' | 'parquet';

export interface Connector {
    id: ConnectorType;
    name: string;
    category: 'File' | 'Database' | 'Application';
    icon: ReactNode;
    description: string;
}

export type ConnectionDetails = {
    type: ConnectorType;
    // Database
    host?: string; port?: number; database?: string; username?: string;
    // API
    baseUrl?: string; authMethod?: 'api_key' | 'bearer' | 'none'; apiKey?: string; apiHeader?: string;
};


export interface DataSource {
    id: string;
    name: string;
    description?: string;
    data: any[];
    fields: {
        dimensions: Field[];
        measures: Field[];
    };
    type?: 'database' | 'api' | 'file' | 'cloud';
    status: 'connected' | 'disconnected' | 'pending' | 'syncing' | 'error';
    lastSync?: string; // ISO date string
    connectionDetails?: ConnectionDetails;
    // New properties for DataSourcesView
    health?: number; // 0-100
    size?: number; // in MB
    tables?: number;
    queryTime?: number; // in ms
    icon?: 'database' | 'file-spreadsheet' | 'cloud' | 'api';
    technology?: string;
    transformations?: Transformation[];
}


export interface Relationship {
    id: string;
    sourceAId: string;
    fieldA: string;
    sourceBId: string;
    fieldB: string;
    type: 'inner' | 'left' | 'right' | 'full';
}

export interface HeaderCell {
    label: string;
    key: string;
    rowSpan: number;
    colSpan: number;
    isMeasureGroup?: boolean;
}
export interface TableRow {
    type: 'data' | 'subtotal' | 'grandtotal' | 'detail';
    values: { [key: string]: any };
    level?: number;
    path?: string;
    isExpandable?: boolean;
}

export type ProcessedData =
    | { type: 'loading', message?: string }
    | { type: 'nodata', message: string }
    | { type: 'kpi', primaryValue: { value: number | null, label: string, formatted: string }, secondaryValue?: { value: number | null, label: string, formatted: string } }
    | { type: 'chart', labels: (string | number)[], datasets: { label: string, data: any[], [key: string]: any }[], chartType: ChartType }
    | { type: 'sankey', nodes: { name: string }[], links: { source: string, target: string, value: number }[] }
    | { type: 'table', headerRows: HeaderCell[][], rows: TableRow[], columnOrder: string[] }
    | { type: 'heatmap', rowLabels: string[], colLabels: string[], data: (number | null)[][], valuePill: Pill };


export interface Parameter {
    id: string;
    name: string;
    type: 'number' | 'string';
    currentValue: any;
    config?: {
        min?: number;
        max?: number;
        step?: number;
    };
}

export interface AIConfig {
    provider: 'gemini' | 'ollama';
    ollamaConfig?: {
        endpoint: string;
        model: string;
    };
}

export type ChatContext = {
    widgetId: string;
} | null;

export interface AiChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    // FIX: Changed chartSuggestion to AiWidgetSuggestion to match the AI service response schema.
    chartSuggestion?: AiWidgetSuggestion;
    isStreaming?: boolean;
    widgetContext?: {
        widgetId: string;
        widgetTitle: string;
    };
    followUpSuggestions?: string[];
}

export interface AiDataSuggestion {
    title: string;
    description: string;
    transformationType: TransformationType;
    payload: any;
}

export interface AiInsightNextStep {
    description: string;
}

export interface AiInsight {
    id: string;
    timestamp: string;
    summary: string;
    keyTakeaways: string[];
    nextSteps: AiInsightNextStep[];
}

export enum InsightType {
    ANOMALY = 'Anomaly',
    PREDICTION = 'Prediction',
    OPTIMIZATION = 'Optimization',
    FORECAST = 'Forecast',
    PERFORMANCE = 'Performance',
    USAGE = 'Usage',
}

export enum InsightStatus {
    NEW = 'new',
    SAVED = 'saved',
    DISMISSED = 'dismissed',
}

export interface Insight {
    id: string;
    title: string;
    description: string;
    type: InsightType;
    confidence: number;
    status: InsightStatus;
    dataSource: string;
    timestamp: string; // ISO string
    suggestedChartPrompt: string;
}

export interface ProactiveInsight {
    title: string;
    summary: string;
    type: InsightType;
    confidence: number;
    involvedFields: string[];
    suggestedChartPrompt: string;
}


export interface AiCalculatedFieldSuggestion {
    fieldName: string;
    formula: string;
    description: string;
}

export interface AiWidgetSuggestion {
    title: string;
    chartType: ChartType;
    shelves: {
        columns?: string[];
        rows?: string[];
        values?: { name: string; aggregation: AggregationType }[];
        values2?: { name: string; aggregation: AggregationType }[];
        category?: string[];
        bubbleSize?: { name: string; aggregation: AggregationType }[];
    };
}

export interface AiDashboardSuggestion {
    page: {
        name: string;
        widgets: AiWidgetSuggestion[];
        layouts: { [breakpoint: string]: WidgetLayout[] };
    };
    calculatedFields: AiCalculatedFieldSuggestion[];
}

export interface NlpFilterResult {
    type: 'UNAMBIGUOUS' | 'AMBIGUOUS' | 'NO_FILTER_DETECTED';
    unambiguousResult?: {
        fieldName: string;
        condition: FilterCondition;
        values: any[];
    }
    ambiguousResult?: {
        term: string;
        possibleFields: string[];
    }
}

export type StoryPageType = 'title' | 'insight' | 'layout' | 'text';

export interface StoryPage {
    id: string;
    type: StoryPageType;
    title?: string;
    subtitle?: string; // for title slide
    annotation?: string; // for insight, text, & title slide content
    presenterNotes?: string; // for all slides
    widgetId?: string; // for insight slide
    widgetIds?: string[]; // for layout slide
    layoutConfig?: { [breakpoint: string]: WidgetLayout[] }; // for layout slide
    insightLayout?: 'left' | 'right'; // for insight slide
}

export type StoryTone = 'Executive' | 'Detailed' | 'Casual';

export interface Story {
    id: string;
    title: string;
    description?: string;
    author?: string;
    createdAt?: string;
    updatedAt?: string;
    pages: StoryPage[];
}

export type CrossFilterState = {
    sourceWidgetId: string;
    filter: Pill;
} | null;

export type ControlFilterState = Record<string, Pill>;

export interface ExplorerState {
    initialFilters: Pill[];
    initialSearchTerm: string;
}

export interface ToastNotification {
    id: string;
    message: string;
    description?: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
    timestamp: string;
    read: boolean;
}

export type ChartLibrary = 'recharts' | 'apexcharts' | 'echarts';

export interface CustomThemeConfig {
    primary?: string;
    background?: string;
    card?: string;
    foreground?: string;
    accent?: string;
    radius?: number; // rem
    font?: 'sans' | 'serif' | 'mono';
}

export interface ThemeConfig {
    name: string;
    mode: 'light' | 'dark';
    custom?: CustomThemeConfig;
}

export interface DashboardDefaults {
    colorPalette: string;
    chartType: ChartType;
}

export interface DataStudioNodeLayout {
    id: string; // transformId or 'source' | 'output'
    x: number;
    y: number;
}
export interface DataStudioCanvasLayout {
    [sourceId: string]: {
        nodes: DataStudioNodeLayout[]
    };
}

export interface DataModelerLayout {
    [sourceId: string]: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface TemplateField {
    id: string;
    displayName: string;
    description: string;
    required: boolean;
    type: FieldType;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    page: Partial<DashboardPage>;
    requiredFields: TemplateField[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    rating: number; // from 1 to 5
    downloads: number;
    tags: string[];
    includedWidgets: string[];
    setupTime: string;
}

export interface WhatIfResult {
    predictedValue: number;
    confidenceInterval: [number, number];
    sensitivityAnalysis: {
        variable: string;
        impact: number; // e.g., a percentage
    }[];
}

export interface AdvancedAnalysisResult {
    title: string;
    summary: string;
    details: {
        heading: string;
        content: string;
    }[];
    // FIX: Added 'whatIfResult' property to the interface to allow for what-if analysis results.
    whatIfResult?: WhatIfResult;
}

export type AdvancedAnalysisType = 'ANOMALY_DETECTION' | 'KEY_INFLUENCERS' | 'CLUSTERING' | 'WHAT_IF';

export interface SearchableItem {
    id: string;
    /** The category for grouping items in the command palette. */
    category: 'Actions' | 'Navigation' | 'Dashboards' | 'Widgets' | 'Quick Settings';
    title: string;
    description?: string;
    context?: string;
    icon: ReactNode;
    action: () => void;
    shortcut?: string[];
}

export interface AuthContextProps {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    revalidate: () => Promise<void>;
}


// --- Predictive Studio Types ---
export enum PredictiveModelType {
    LINEAR_REGRESSION = 'Linear Regression',
    LOGISTIC_REGRESSION = 'Logistic Regression (Binary)',
    CLASSIFICATION = 'Classification (Multiclass)',
    TIME_SERIES_FORECASTING = 'Time Series Forecasting',
    RANDOM_FOREST_CLASSIFIER = 'Random Forest Classifier',
    K_MEANS_CLUSTERING = 'K-Means Clustering',
}

export interface PerformanceMetric {
    name: string; // e.g., "R-squared", "Mean Absolute Error"
    value: number;
    interpretation: string;
}

export interface FeatureImportance {
    feature: string;
    importance: number; // e.g., a percentage or a score
}

export interface ModelCoefficient {
    feature: string;
    coefficient: number;
    stdError: number;
    pValue: number;
}

export interface ModelSummary {
    targetVariable: string;
    featureVariables: string[];
    modelType: PredictiveModelType;
    aiSummary: string;
    formula: string; // e.g., "12.34 + 5.67 * [Ad Spend] - 2.1 * [Discount]"
}

export interface PredictiveModelResult {
    id: string;
    timestamp: string;
    summary: ModelSummary;
    performanceMetrics: PerformanceMetric[];
    featureImportance: FeatureImportance[];
    coefficients: ModelCoefficient[];
    predictionVsActuals: { actual: number; predicted: number; }[];
    residuals: { predicted: number; residual: number; }[];
}

export type CurrentView = 'dashboard' | 'explorer' | 'stories' | 'studio' | 'modeler' | 'settings' | 'admin' | 'templates' | 'predictive' | 'datasources' | 'insightHub' | 'onboarding';

export type DashboardMode = 'view' | 'comment' | 'edit';

export type TourName = 'dashboard' | 'widgetEditor' | 'dataStudio' | 'dataModeler' | 'stories' | 'predictive';

export interface OnboardingStep {
    elementId: string;
    title: string;
    content: string;
    placement: 'top' | 'bottom' | 'left' | 'right';
    preAction?: (actions: { startOnboardingTour: (tour: TourName, step?: number) => void }) => void;
}

export interface OnboardingState {
    isTourActive: boolean;
    currentTour: TourName | null;
    currentStep: number;
    completedTours: TourName[];
}

export interface GettingStartedGuideItem {
    id: TourName;
    title: string;
    description: string;
    icon: ReactNode;
    view: CurrentView;
}


// FIX: Added the missing `DataContextProps` interface and updated `DashboardContextProps` to extend it, which resolves a circular dependency and type export error between the data and dashboard providers.
export interface DataContextProps {
    dataSources: Map<string, DataSource>;
    relationships: Relationship[];
    dataModelerLayout: DataModelerLayout;
    dataStudioCanvasLayout: DataStudioCanvasLayout;
    parameters: Parameter[];
    blendedData: any[];
    blendedFields: { dimensions: Field[]; measures: Field[] };
    addDataSourceFromFile: (file: File) => Promise<void>;
    loadSampleData: (sampleKey: 'sales' | 'iris' | 'both') => void;
    removeDataSource: (id: string) => void;
    setRelationships: Dispatch<SetStateAction<Relationship[]>>;
    setDataModelerLayout: Dispatch<SetStateAction<DataModelerLayout>>;
    setDataStudioCanvasLayout: Dispatch<SetStateAction<DataStudioCanvasLayout>>;
    getTransformationsForSource: (sourceId: string) => Transformation[];
    applyTransformations: (sourceId: string, newTransforms: Transformation[]) => void;
    addTransformation: (sourceId: string, type: TransformationType, payload: any) => void;
    removeTransformation: (sourceId: string, transformId: string) => void;
    resetAllTransformations: (sourceId: string) => void;
    addCalculatedField: (sourceId: string, fieldName: string, formula: string) => void;
    addParameter: (p: Omit<Parameter, 'id'>) => void;
    performanceTimings: Map<string, number>;
    aiConfig: AIConfig | null;
    aiChatHistory: AiChatMessage[];
    insights: Insight[];
    isGeneratingInsights: boolean;
    themeConfig: ThemeConfig;
    chartLibrary: ChartLibrary;
    dashboardDefaults: DashboardDefaults;
    contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null;
    currentView: CurrentView;
    explorerState: ExplorerState | null;
    studioSourceId: string | null;
    toastNotifications: ToastNotification[];
    allNotifications: ToastNotification[];
    unreadNotificationCount: number;
    isNotificationPanelOpen: boolean;
    loadingState: { isLoading: boolean; message: string; };
    scrollToWidgetId: string | null;
    dashboardMode: DashboardMode;
    isHelpModeActive: boolean;
    activeDatasetId: string | 'blended';
    isGettingStartedModalOpen: boolean;
    workspaces: Workspace[];
    activePageId: string | null;
    activePage: DashboardPage | undefined;
    widgets: WidgetState[];
    layouts: { [breakpoint: string]: WidgetLayout[] };
    globalFilters: Pill[];
    stories: Story[];
    editingStory: { story: Story; focusPageId?: string } | null;
    userTemplates: Template[];
    crossFilter: CrossFilterState;
    controlFilters: ControlFilterState;
    canUndo: boolean;
    canRedo: boolean;
    refetchCounter: number;
    predictiveModels: PredictiveModelResult[];
    newlyAddedPillId: string | null;
    selectedWidgetIds: string[];
    onboardingState: OnboardingState;

    // Callbacks & Setters
    openGettingStartedModal: () => void;
    closeGettingStartedModal: () => void;
    startOnboardingTour: (tour: TourName, step?: number) => void;
    advanceOnboardingStep: (direction: 'next' | 'back') => void;
    exitOnboarding: () => void;
    setWidgetPerformance: (widgetId: string, duration: number) => void;
    triggerWidgetRefetch: () => void;
    saveAiConfig: Dispatch<SetStateAction<AIConfig | null>>;
    sendAiChatMessage: (message: string, context?: ChatContext) => Promise<void>;
    clearAiChatHistory: () => void;
    // FIX: Changed suggestion type to AiWidgetSuggestion.
    createWidgetFromSuggestion: (suggestion: AiWidgetSuggestion) => void;
    chatContext: ChatContext;
    setChatContext: Dispatch<SetStateAction<ChatContext>>;
    setInsights: Dispatch<SetStateAction<Insight[]>>;
    generateNewInsights: () => Promise<void>;
    updateInsightStatus: (id: string, status: InsightStatus) => void;
    exploreInsight: (prompt: string) => void;
    setThemeConfig: Dispatch<SetStateAction<ThemeConfig>>;
    toggleThemeMode: () => void;
    setThemeName: (name: string) => void;
    setChartLibrary: Dispatch<SetStateAction<ChartLibrary>>;
    setDashboardDefaults: Dispatch<SetStateAction<DashboardDefaults>>;
    openContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
    closeContextMenu: () => void;
    setView: (view: CurrentView, options?: any) => void;
    removeToast: (id: string) => void;
    openNotificationPanel: () => void;
    closeNotificationPanel: () => void;
    markAllNotificationsAsRead: () => void;
    clearAllNotifications: () => void;
    setScrollToWidgetId: Dispatch<SetStateAction<string | null>>;
    setDashboardMode: Dispatch<SetStateAction<DashboardMode>>;
    toggleHelpMode: () => void;
    setActiveDataset: (datasetId: string | 'blended') => void;
    setWorkspaces: (updater: SetStateAction<Workspace[]>) => void;
    setActivePageId: Dispatch<SetStateAction<string | null>>;
    addPage: () => void;
    addNewPage: (page: DashboardPage) => void;
    removePage: (id: string) => void;
    updatePage: (pageId: string, updates: Partial<DashboardPage> | ((page: DashboardPage) => DashboardPage)) => void;
    duplicatePage: (pageId: string) => void;
    renamePage: (id: string, newName: string) => void;
    setUserTemplates: Dispatch<SetStateAction<Template[]>>;
    addBookmark: (name: string) => void;
    applyBookmark: (bookmark: Bookmark) => void;
    removeBookmark: (bookmarkId: string) => void;
    isRowCollapsed: (path: string) => boolean;
    toggleRowCollapse: (path: string) => void;
    expandAllRows: () => void;
    collapseAllRows: (paths: string[]) => void;
    setEditingStory: Dispatch<SetStateAction<{ story: Story; focusPageId?: string } | null>>;
    handleWidgetAddToStory: (widgetId: string) => void;
    createStoryFromWidget: (widgetId: string) => void;
    addWidgetToStory: (storyId: string, widgetId: string) => void;
    saveStory: (story: Story) => void;
    removeStory: (id: string) => void;
    handleExportDashboard: () => void;
    saveStateToLocalStorage: () => void;
    clearApplicationState: () => void;
    addComment: (widgetId: string, position: { x: number; y: number }) => void;
    updateComment: (commentId: string, messages: DashboardCommentMessage[]) => void;
    deleteComment: (commentId: string) => void;
    runAdvancedAnalysis: (widgetId: string, analysisType: 'ANOMALY_DETECTION' | 'KEY_INFLUENCERS' | 'CLUSTERING') => Promise<void>;
    // FIX: Added 'runWhatIfAnalysis' to the interface.
    runWhatIfAnalysis: (widgetId: string, scenarioConfig: { targetMetric: string, modifiedVariables: { [key: string]: number } }) => Promise<void>;
    getWidgetAnalysisText: (widget: WidgetState, tone?: StoryTone) => Promise<string | null>;
    // FIX: Added 'runWidgetAnalysis' to the interface.
    runWidgetAnalysis: (widget: WidgetState, tone?: StoryTone) => Promise<void>;
    generateStoryFromPage: (pageId: string, title: string, tone: StoryTone) => Promise<void>;
    generateStoryFromInsights: (insights: Insight[]) => Promise<void>;
    createPageFromTemplate: (template: Template, mappings: Map<string, string>) => void;
    createTemplateFromPage: (page: DashboardPage, templateDetails: Omit<Template, 'id' | 'page' | 'requiredFields'>) => void;
    handleGenerateAiDashboard: () => Promise<void>;
    addPredictiveModel: (model: PredictiveModelResult) => void;
    openWidgetEditorModal: (widgetId?: string | null) => void;
    openWidgetEditorForNewWidget: (chartType?: ChartType) => void;
    saveEditingWidget: () => void;
    // FIX: Changed suggestion type to AiWidgetSuggestion.
    populateEditorFromAI: (suggestion: AiWidgetSuggestion) => void;
    openEditorWithAIPrompt: (prompt: string) => void;
    resolveNlpAmbiguity: (term: string, fieldSimpleName: string) => void;
    handleNlpFilterQuery: (query: string) => Promise<void>;
    setNewlyAddedPillId: Dispatch<SetStateAction<string | null>>;
    toggleWidgetSelection: (widgetId: string) => void;
    deleteSelectedWidgets: () => void;
    duplicateSelectedWidgets: () => void;
    deselectAllWidgets: () => void;
    exportSelectedWidgets: (format: 'PDF' | 'CSV' | 'XLSX') => Promise<void>;
    discussSelectedWithAI: () => Promise<void>;
    addSelectedToStory: () => void;

    // Modal Manager props
    isWidgetEditorModalOpen: boolean;
    editingWidgetState: WidgetState | null;
    widgetEditorAIPrompt: string | null;
    filterConfigModalState: { isOpen: boolean; pill: Pill | null; onSave: ((p: Pill) => void) | null; onBack?: () => void };
    isPageFiltersModalOpen: boolean;
    selectFieldModalState: { isOpen: boolean, onSave?: (pill: Pill) => void };
    isChatModalOpen: boolean;
    addFieldModalState: { isOpen: boolean; sourceId: string | null; initialStep?: 'formula' | 'grouping' };
    valueFormatModalState: { isOpen: boolean; pill: Pill | null; onSave: ((f: ValueFormat) => void) | null };
    confirmationModalState: { isOpen: boolean; title: string; message: string; onConfirm: () => void } | null;
    inputModalState: { isOpen: boolean; title: string; message?: string; inputLabel: string; initialValue?: string; onConfirm: (value: string) => void | Promise<void>; inputType?: string; actionLabel?: string } | null;
    isParameterModalOpen: boolean;
    isAddControlModalOpen: boolean;
    isTemplateModalOpen: boolean;
    templatePreviewModalState: { isOpen: boolean; template: Template | null };
    fieldMappingModalState: { isOpen: boolean; template: Template | null; onBack?: () => void };
    createTemplateModalState: { isOpen: boolean; page: DashboardPage | null };
    isCommandPaletteOpen: boolean;
    addToStoryModalState: { isOpen: boolean; widgetId: string | null };
    splitColumnModalState: { isOpen: boolean; field: Field | null; onConfirm: (payload: any) => void };
    mergeColumnsModalState: { isOpen: boolean; onConfirm: (payload: any) => void; availableFields: Field[] };
    advancedAnalysisModalState: { isOpen: boolean; result: AdvancedAnalysisResult | null; title: string };
    activeCommentThread: DashboardComment | null;
    whatIfConfigModalState: { isOpen: boolean; widgetId: string | null };
    isGenerateStoryModalOpen: boolean;
    focusedWidgetId: string | null;
    dataLineageModalState: { isOpen: boolean; widgetId: string | null };
    isPerformanceAnalyzerOpen: boolean;
    isAiInsightStarterModalOpen: boolean;
    isAddDataSourceModalOpen: boolean;
    dataSourceConnectionModalState: { isOpen: boolean; connector: Connector | null };
    nlpDisambiguationModalState: { isOpen: boolean; term: string; fields: string[] };
    setEditingWidgetState: Dispatch<SetStateAction<WidgetState | null>>;
    setWidgetEditorAIPrompt: Dispatch<SetStateAction<string | null>>;
    closeWidgetEditorModal: () => void;
    updateEditingWidget: (update: Partial<WidgetState> | ((prevState: WidgetState) => WidgetState)) => void;
    openFilterConfigModal: (pill: Pill, onSave: (p: Pill) => void, onBack?: () => void) => void;
    closeFilterConfigModal: () => void;
    openPageFiltersModal: () => void;
    closePageFiltersModal: () => void;
    openSelectFieldModal: (onSave?: (pill: Pill) => void) => void;
    closeSelectFieldModal: () => void;
    openChatModal: () => void;
    closeChatModal: () => void;
    openAddFieldModal: (sourceId: string, initialStep?: 'formula' | 'grouping') => void;
    closeAddFieldModal: () => void;
    openValueFormatModal: (pill: Pill, onSave: (f: ValueFormat) => void) => void;
    closeValueFormatModal: () => void;
    openConfirmationModal: (config: { title: string; message: string; onConfirm: () => void; }) => void;
    closeConfirmationModal: () => void;
    openInputModal: (config: { title: string; message?: string; inputLabel: string; initialValue?: string; onConfirm: (value: string) => void | Promise<void>; inputType?: string; actionLabel?: string; }) => void;
    closeInputModal: () => void;
    openParameterModal: () => void;
    closeParameterModal: () => void;
    openAddControlModal: () => void;
    closeAddControlModal: () => void;
    openTemplateModal: () => void;
    closeTemplateModal: () => void;
    openTemplatePreviewModal: (template: Template) => void;
    closeTemplatePreviewModal: () => void;
    openFieldMappingModal: (template: Template, onBack?: () => void) => void;
    closeFieldMappingModal: () => void;
    openCreateTemplateModal: (page: DashboardPage) => void;
    closeCreateTemplateModal: () => void;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    closeAddToStoryModal: () => void;
    setAddToStoryModalState: Dispatch<SetStateAction<{ isOpen: boolean; widgetId: string | null }>>;
    openSplitColumnModal: (field: Field, onConfirm: (payload: any) => void) => void;
    closeSplitColumnModal: () => void;
    openMergeColumnsModal: (onConfirm: (payload: any) => void, availableFields: Field[]) => void;
    closeMergeColumnsModal: () => void;
    openAdvancedAnalysisModal: (result: AdvancedAnalysisResult, title: string) => void;
    closeAdvancedAnalysisModal: () => void;
    setActiveCommentThread: Dispatch<SetStateAction<DashboardComment | null>>;
    openWhatIfConfigModal: (widgetId: string) => void;
    closeWhatIfConfigModal: () => void;
    openGenerateStoryModal: () => void;
    closeGenerateStoryModal: () => void;
    setFocusedWidgetId: Dispatch<SetStateAction<string | null>>;
    openDataLineageModal: (widgetId: string) => void;
    closeDataLineageModal: () => void;
    saveWidget: (widget: WidgetState, layoutOverride?: Partial<Omit<WidgetLayout, 'i'>>) => Promise<void>;
    openPerformanceAnalyzer: () => void;
    closePerformanceAnalyzer: () => void;
    openAiInsightStarterModal: () => void;
    closeAiInsightStarterModal: () => void;
    toggleFieldInEditorShelves: (field: Field) => void;
    openAddDataSourceModal: () => void;
    closeAddDataSourceModal: () => void;
    openDataSourceConnectionModal: (connector: Connector) => void;
    closeDataSourceConnectionModal: () => void;
    openNlpDisambiguationModal: (term: string, fields: string[]) => void;
    closeNlpDisambiguationModal: () => void;
    removeWidget: (id: string) => void;
    duplicateWidget: (id: string) => void;
    setGlobalFilters: Dispatch<SetStateAction<Pill[]>>;
    addGlobalFilter: (pill: Omit<Pill, 'id'>) => void;
    setCrossFilter: Dispatch<SetStateAction<CrossFilterState>>;
    setControlFilter: (widgetId: string, filter: Pill | null) => void;
    setLayouts: (layouts: { [breakpoint: string]: WidgetLayout[] }) => void;
    undo: () => void;
    redo: () => void;
    resetDashboard: () => void;
    importInputRef: RefObject<HTMLInputElement | null>;
    handleImportDashboard: (e: React.ChangeEvent<HTMLInputElement>) => void;
}


