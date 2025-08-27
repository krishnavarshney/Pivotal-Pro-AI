import { createContext, ReactNode, RefObject, Dispatch, SetStateAction, ChangeEvent, MouseEvent } from 'react';
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
  name:string;
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
  BUBBLE = 'Bubble',
  TABLE = 'Table',
  KPI = 'KPI',
  TREEMAP = 'Treemap',
  MAP = 'Map',
  DUAL_AXIS = 'Dual Axis',
  HEATMAP = 'Heatmap',
  BOXPLOT = 'Box Plot',
  CONTROL = 'Control',
  FUNNEL = 'Funnel',
  SANKEY = 'Sankey',
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
  shelves: {
    columns: Pill[];
    rows: Pill[];
    values: Pill[];
    values2?: Pill[]; // For Dual Axis charts
    filters: Pill[];
    category?: Pill[]; // For bubble charts
    bubbleSize?: Pill[]; // For bubble charts
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
}

export interface Workspace {
    id: string;
    name: string;
    pages: DashboardPage[];
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
    status?: 'connected' | 'syncing' | 'error';
    lastSync?: string; // ISO date string
    connectionDetails?: ConnectionDetails;
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
    | { type: 'heatmap', rowLabels: string[], colLabels: string[], data: (number|null)[][], valuePill: Pill };


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
    chartSuggestion?: Partial<WidgetState>;
    isStreaming?: boolean;
    widgetContext?: {
        widgetId: string;
        widgetTitle: string;
    };
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

export interface ProactiveInsight {
    id: string;
    title: string;
    summary: string;
    severity: 'low' | 'medium' | 'high';
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

export interface StoryPage {
    id: string;
    widgetId: string;
    annotation: string;
}

export type StoryTone = 'Executive' | 'Detailed' | 'Casual';

export interface Story {
    id: string;
    title: string;
    pages: StoryPage[];
}

export type CrossFilterState = {
    sourceWidgetId: string;
    filter: Pill;
} | null;

export type ControlFilterState = Map<string, Pill>;

export interface ExplorerState {
    initialFilters: Pill[];
    initialSearchTerm: string;
}

export interface ToastNotification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
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
    whatIfResult?: WhatIfResult;
}

export type AdvancedAnalysisType = 'ANOMALY_DETECTION' | 'KEY_INFLUENCERS' | 'CLUSTERING' | 'WHAT_IF';

export interface SearchableItem {
    id: string;
    category: 'Actions' | 'Navigation' | 'Dashboards' | 'Widgets';
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
}


// --- Predictive Studio Types ---
export type PredictiveModelType = 'LINEAR_REGRESSION';

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
}

export type CurrentView = 'dashboard' | 'explorer' | 'stories' | 'studio' | 'modeler' | 'settings' | 'admin' | 'templates' | 'predictive' | 'datasources';

export interface DashboardContextProps {
    // Data
    dataSources: Map<string, DataSource>;
    addDataSourceFromFile: (file: File) => Promise<void>;
    removeDataSource: (id: string) => void;
    loadSampleData: (sampleKey: 'sales' | 'iris' | 'both') => void;
    relationships: Relationship[];
    setRelationships: Dispatch<SetStateAction<Relationship[]>>;
    dataModelerLayout: DataModelerLayout;
    setDataModelerLayout: Dispatch<SetStateAction<DataModelerLayout>>;
    dataStudioCanvasLayout: DataStudioCanvasLayout;
    setDataStudioCanvasLayout: Dispatch<SetStateAction<DataStudioCanvasLayout>>;
    blendedData: any[];
    blendedFields: { dimensions: Field[]; measures: Field[] };
    performanceTimings: Map<string, number>;
    setWidgetPerformance: (widgetId: string, duration: number) => void;
    triggerWidgetRefetch: () => void;
    refetchCounter: number;

    // AI
    aiConfig: AIConfig | null;
    saveAiConfig: (config: AIConfig) => void;
    aiChatHistory: AiChatMessage[];
    insightsByPage: Map<string, AiInsight[]>;
    sendAiChatMessage: (message: string, context?: ChatContext) => Promise<void>;
    clearAiChatHistory: () => void;
    createWidgetFromSuggestion: (suggestion: Partial<WidgetState>) => void;
    chatContext: ChatContext;
    setChatContext: Dispatch<SetStateAction<ChatContext>>;
    proactiveInsights: Map<string, ProactiveInsight[]>;
    isGeneratingInsights: boolean;
    runProactiveAnalysis: () => Promise<void>;
    hasNewInsights: boolean;
    setHasNewInsights: Dispatch<SetStateAction<boolean>>;
    
    // UI
    themeConfig: ThemeConfig;
    setThemeConfig: Dispatch<SetStateAction<ThemeConfig>>;
    toggleThemeMode: () => void;
    setThemeName: (name: string) => void;
    chartLibrary: ChartLibrary;
    setChartLibrary: Dispatch<SetStateAction<ChartLibrary>>;
    dashboardDefaults: DashboardDefaults;
    setDashboardDefaults: Dispatch<SetStateAction<DashboardDefaults>>;
    contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null;
    openContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
    closeContextMenu: () => void;
    currentView: CurrentView;
    setView: (view: CurrentView, options?: any) => void;
    explorerState: ExplorerState | null;
    studioSourceId: string | null;
    isDataStudioOnboardingNeeded: boolean;
    completeDataStudioOnboarding: () => void;
    notifications: ToastNotification[];
    showToast: (options: Omit<ToastNotification, 'id'>) => void;
    removeToast: (id: string) => void;
    loadingState: { isLoading: boolean; message: string; lottieAnimation?: any; };
    isInsightHubOpen: boolean;
    openInsightHub: () => void;
    closeInsightHub: () => void;
    isChatModalOpen: boolean;
    openChatModal: () => void;
    closeChatModal: () => void;
    isCommandPaletteOpen: boolean;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    scrollToWidgetId: string | null;
    setScrollToWidgetId: Dispatch<SetStateAction<string | null>>;
    dashboardMode: 'view' | 'comment';
    setDashboardMode: Dispatch<SetStateAction<'view' | 'comment'>>;
    isHelpModeActive: boolean;
    toggleHelpMode: () => void;
    
    // Modals
    isWidgetEditorModalOpen: boolean;
    editingWidgetState: WidgetState | null;
    openWidgetEditorModal: (widgetId?: string | null) => void;
    closeWidgetEditorModal: () => void;
    updateEditingWidget: (update: Partial<WidgetState> | ((prevState: WidgetState) => WidgetState)) => void;
    saveEditingWidget: () => void;
    populateEditorFromAI: (suggestion: Partial<WidgetState>) => void;
    widgetEditorAIPrompt: string | null;
    setWidgetEditorAIPrompt: Dispatch<SetStateAction<string | null>>;
    openEditorWithAIPrompt: (prompt: string) => void;
    toggleFieldInEditorShelves: (field: Field) => void;
    
    filterConfigModalState: { isOpen: boolean; pill: Pill | null; onSave: ((p: Pill) => void) | null; onBack?: (() => void) | undefined; };
    openFilterConfigModal: (pill: Pill, onSave: (p: Pill) => void, onBack?: () => void) => void;
    closeFilterConfigModal: () => void;

    isPageFiltersModalOpen: boolean;
    openPageFiltersModal: () => void;
    closePageFiltersModal: () => void;
    
    selectFieldModalOpen: boolean;
    openSelectFieldModal: () => void;
    closeSelectFieldModal: () => void;

    addFieldModalState: { isOpen: boolean; sourceId: string | null; initialStep?: 'formula' | 'grouping'; };
    openAddFieldModal: (sourceId: string, initialStep?: 'formula' | 'grouping') => void;
    closeAddFieldModal: () => void;
    
    valueFormatModalState: { isOpen: boolean; pill: Pill | null; onSave: ((f: ValueFormat) => void) | null; };
    openValueFormatModal: (pill: Pill, onSave: (f: ValueFormat) => void) => void;
    closeValueFormatModal: () => void;

    confirmationModalState: { isOpen: boolean; title: string; message: string; onConfirm: () => void | Promise<void>; } | null;
    openConfirmationModal: (config: { title: string; message: string; onConfirm: () => void | Promise<void>; }) => void;
    closeConfirmationModal: () => void;
    
    inputModalState: { isOpen: boolean; title: string; message?: string; inputLabel: string; initialValue?: string; onConfirm: (value: string) => void | Promise<void>; inputType?: string; actionLabel?: string; } | null;
    openInputModal: (config: Omit<NonNullable<DashboardContextProps['inputModalState']>, 'isOpen'>) => void;
    closeInputModal: () => void;

    isParameterModalOpen: boolean;
    openParameterModal: () => void;
    closeParameterModal: () => void;
    
    isAddControlModalOpen: boolean;
    openAddControlModal: () => void;
    closeAddControlModal: () => void;

    isTemplateModalOpen: boolean;
    openTemplateModal: () => void;
    closeTemplateModal: () => void;

    templatePreviewModalState: { isOpen: boolean; template: Template | null };
    openTemplatePreviewModal: (template: Template) => void;
    closeTemplatePreviewModal: () => void;

    activeCommentThread: DashboardComment | null;
    setActiveCommentThread: Dispatch<SetStateAction<DashboardComment | null>>;
    
    splitColumnModalState: { isOpen: boolean; field: Field; onConfirm: (payload: any) => void; } | null;
    openSplitColumnModal: (field: Field, onConfirm: (payload: any) => void) => void;
    closeSplitColumnModal: () => void;
    
    mergeColumnsModalState: { isOpen: boolean; onConfirm: (payload: any) => void; availableFields: Field[]; } | null;
    openMergeColumnsModal: (onConfirm: (payload: any) => void, availableFields: Field[]) => void;
    closeMergeColumnsModal: () => void;
    
    fieldMappingModalState: { isOpen: boolean; template: Template | null; onBack?: () => void; };
    openFieldMappingModal: (template: Template, onBack?: () => void) => void;
    closeFieldMappingModal: () => void;

    advancedAnalysisModalState: { isOpen: boolean; result: AdvancedAnalysisResult | null; title: string; };
    openAdvancedAnalysisModal: (result: AdvancedAnalysisResult, title: string) => void;
    closeAdvancedAnalysisModal: () => void;

    addToStoryModalState: { isOpen: boolean; widgetId: string | null; };
    closeAddToStoryModal: () => void;
    
    createTemplateModalState: { isOpen: boolean; page: DashboardPage | null; };
    openCreateTemplateModal: (page: DashboardPage) => void;
    closeCreateTemplateModal: () => void;

    dataLineageModalState: { isOpen: boolean; widgetId: string | null; };
    openDataLineageModal: (widgetId: string) => void;
    closeDataLineageModal: () => void;
    
    isPerformanceAnalyzerOpen: boolean;
    openPerformanceAnalyzer: () => void;
    closePerformanceAnalyzer: () => void;

    whatIfConfigModalState: { isOpen: boolean; widgetId: string | null; };
    openWhatIfConfigModal: (widgetId: string) => void;
    closeWhatIfConfigModal: () => void;
    isGenerateStoryModalOpen: boolean;
    openGenerateStoryModal: () => void;
    closeGenerateStoryModal: () => void;
    focusedWidgetId: string | null;
    setFocusedWidgetId: Dispatch<SetStateAction<string | null>>;
    isAiInsightStarterModalOpen: boolean;
    openAiInsightStarterModal: () => void;
    closeAiInsightStarterModal: () => void;
    handleGenerateAiDashboard: () => Promise<void>;

    isAddDataSourceModalOpen: boolean;
    openAddDataSourceModal: () => void;
    closeAddDataSourceModal: () => void;

    dataSourceConnectionModalState: { isOpen: boolean; connector: Connector | null };
    openDataSourceConnectionModal: (connector: Connector) => void;
    closeDataSourceConnectionModal: () => void;
    createDataSourceFromConnection: (config: { connector: Connector; details: any; name: string }) => Promise<void>;
    
    nlpDisambiguationModalState: { isOpen: boolean, term: string, fields: string[] };
    openNlpDisambiguationModal: (term: string, fields: string[]) => void;
    closeNlpDisambiguationModal: () => void;
    resolveNlpAmbiguity: (term: string, field: string) => void;
    handleNlpFilterQuery: (query: string) => Promise<void>;
    newlyAddedPillId: string | null;
    setNewlyAddedPillId: Dispatch<SetStateAction<string | null>>;

    // Dashboard state
    workspaces: Workspace[];
    setWorkspaces: (updater: SetStateAction<Workspace[]>) => void;
    activePageId: string | null;
    activePage: DashboardPage | undefined;
    setActivePageId: Dispatch<SetStateAction<string | null>>;
    addPage: () => void;
    removePage: (id: string) => void;
    updatePage: (id: string, updates: Partial<DashboardPage> | ((page: DashboardPage) => DashboardPage)) => void;
    widgets: WidgetState[];
    layouts: { [breakpoint: string]: WidgetLayout[] };
    globalFilters: Pill[];
    setLayouts: (layouts: { [breakpoint: string]: WidgetLayout[] }) => void;
    setGlobalFilters: (updater: SetStateAction<Pill[]>) => void;
    addGlobalFilter: (pill: Omit<Pill, 'id'>) => void;
    removeWidget: (id: string) => void;
    saveWidget: (widget: WidgetState, layoutOverride?: Partial<Omit<WidgetLayout, 'i'>>) => void;
    duplicateWidget: (id: string) => void;
    duplicatePage: (pageId: string) => void;
    
    crossFilter: CrossFilterState;
    setCrossFilter: Dispatch<SetStateAction<CrossFilterState>>;
    controlFilters: ControlFilterState;
    setControlFilter: (widgetId: string, filterPill: Pill | null) => void;
    
    parameters: Parameter[];
    addParameter: (p: Omit<Parameter, 'id'>) => void;
    updateParameter: (id: string, updates: Partial<Parameter>) => void;
    removeParameter: (id: string) => void;
    
    stories: Story[];
    saveStory: (story: Story) => void;
    removeStory: (id: string) => void;

    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    importInputRef: RefObject<HTMLInputElement>;
    handleImportDashboard: (event: ChangeEvent<HTMLInputElement>) => void;
    resetDashboard: () => void;
    addNewPage: (templatePage?: Partial<DashboardPage>) => void;
    
    userTemplates: Template[];
    setUserTemplates: Dispatch<SetStateAction<Template[]>>;
    addBookmark: (name: string) => void;
    applyBookmark: (bookmark: Bookmark) => void;
    removeBookmark: (bookmarkId: string) => void;
    
    isRowCollapsed: (path: string) => boolean;
    toggleRowCollapse: (path: string) => void;
    expandAllRows: () => void;
    collapseAllRows: (paths: string[]) => void;
    editingStory: { story: Story; focusPageId?: string; } | null;
    setEditingStory: Dispatch<SetStateAction<{ story: Story; focusPageId?: string; } | null>>;
    handleWidgetAddToStory: (widgetId: string) => void;
    createStoryFromWidget: (widgetId: string) => void;
    addWidgetToStory: (storyId: string, widgetId: string) => void;
    handleExportDashboard: () => void;
    saveStateToLocalStorage: () => void;
    clearApplicationState: () => void;
    applyTransformations: (sourceId: string, newTransforms: Transformation[]) => void;
    getTransformationsForSource: (sourceId: string) => Transformation[];
    addTransformation: (sourceId: string, type: TransformationType, payload: any) => void;
    removeTransformation: (sourceId: string, transformId: string) => void;
    resetAllTransformations: (sourceId: string) => void;
    addCalculatedField: (sourceId: string, fieldName: string, formula: string) => void;
    addComment: (widgetId: string, position: { x: number; y: number }) => void;
    updateComment: (commentId: string, messages: DashboardCommentMessage[]) => void;
    deleteComment: (commentId: string) => void;
    generateDashboardInsights: () => Promise<void>;
    runAdvancedAnalysis: (widgetId: string, analysisType: 'ANOMALY_DETECTION' | 'KEY_INFLUENCERS' | 'CLUSTERING') => Promise<void>;
    runWhatIfAnalysis: (widgetId: string, scenarioConfig: { targetMetric: string, modifiedVariables: { [key: string]: number } }) => Promise<void>;
    runWidgetAnalysis: (widget: WidgetState, tone?: StoryTone) => Promise<void>;
    getWidgetAnalysisText: (widget: WidgetState, tone?: StoryTone) => Promise<string | null>;
    generateStoryFromPage: (pageId: string, title: string, tone: StoryTone) => Promise<void>;
    generateStoryFromInsights: (insights: ProactiveInsight[]) => Promise<void>;
    createPageFromTemplate: (template: Template, mappings: Map<string, string>) => void;
    createTemplateFromPage: (page: DashboardPage, templateDetails: Omit<Template, 'id' | 'page' | 'requiredFields'>) => void;

    // Predictive Studio
    predictiveModels: PredictiveModelResult[];
    addPredictiveModel: (model: PredictiveModelResult) => void;
}