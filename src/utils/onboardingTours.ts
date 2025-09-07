import { OnboardingStep } from './types';

export const TOURS: Record<string, OnboardingStep[]> = {
    dashboard: [
        {
            elementId: 'onboarding-sidebar',
            title: 'Welcome to Pivotal Pro!',
            content: 'This sidebar is your main navigation hub. You can access all major features like the Data Studio and Data Modeler from here.',
            placement: 'right',
        },
        {
            elementId: 'onboarding-fab',
            title: 'Create Your First Widget',
            content: 'Click here to open the Widget Editor. This is where you\'ll build all your visualizations, from simple KPIs to complex charts.',
            placement: 'left',
        },
        {
            elementId: 'onboarding-filters',
            title: 'Filter Your Data',
            content: 'Add filters that apply to the entire page, or even ask our AI to create filters from natural language commands.',
            placement: 'bottom',
        },
    ],
    widgetEditor: [
        {
            elementId: 'onboarding-widget-editor-fields',
            title: 'Data Fields & AI Prompt',
            content: 'All the fields from your dataset are listed here. You can click to add them, drag them to shelves, or simply describe the chart you want in the AI prompt bar above.',
            placement: 'right',
        },
        {
            elementId: 'onboarding-widget-editor-properties',
            title: 'Build Your Chart',
            content: 'This is where you configure your visualization. Drag fields here or see them appear after using the AI prompt. Dimensions (blue/purple) define the "what" and "how", while Measures (green) define the "how much".',
            placement: 'right',
        },
        {
            elementId: 'onboarding-widget-editor-preview',
            title: 'Live Preview',
            content: 'As you configure your widget, a live preview will appear here instantly. Click "Save Widget" when you\'re done.',
            placement: 'left',
        },
    ],
    dataStudio: [
        {
            elementId: 'onboarding-datastudio-sidebar',
            title: 'The Control Panel',
            content: 'This sidebar is your main workspace. Manage sources, view final fields, and build your transformation pipeline step-by-step.',
            placement: 'right',
        },
        {
            elementId: 'onboarding-datastudio-actions',
            title: 'Add Transformations',
            content: 'Add calculated fields or group values manually. Or, use the power of AI to get smart suggestions for cleaning your data.',
            placement: 'top',
        },
        {
            elementId: 'onboarding-datagrid',
            title: 'Your Live Data Canvas',
            content: "This is a live preview of your data. As you add transformation steps, you'll see the changes reflected here instantly.",
            placement: 'top',
        },
    ],
    dataModeler: [
        {
            elementId: 'sidebar-content', // Generic ID for sidebar content area
            title: 'Data Sources',
            content: 'Add tables from your available data sources to the canvas to begin building relationships.',
            placement: 'right',
        },
        {
            elementId: 'data-modeler-canvas', // Requires adding id="data-modeler-canvas" to the main element in DataModelerView
            title: 'Visual Join Canvas',
            content: 'Drag a field from one table and drop it onto a matching field in another table to create a join. This defines how your data is connected.',
            placement: 'bottom',
        },
        {
            elementId: 'data-modeler-inspector', // Requires adding id="data-modeler-inspector" to the aside element
            title: 'Join Inspector',
            content: 'Once a join is created, click the line connecting the tables to configure its properties, like changing the join type from Inner to Left.',
            placement: 'left',
        },
    ],
    stories: [
        {
            elementId: 'story-view-header-actions', // Requires an ID on the header action group in DataStoryView
            title: 'Create Your First Story',
            content: 'Data Stories let you weave your charts into a compelling, slide-by-slide narrative. Create one manually or let AI generate one for you.',
            placement: 'bottom',
        },
    ],
    predictive: [
        {
            elementId: 'predictive-step-1', // Requires ID on the first step's container
            title: 'Select Model Type',
            content: 'Start by choosing the type of prediction you want to make, such as predicting a number (Regression) or a category (Classification).',
            placement: 'right',
        },
        {
            elementId: 'predictive-step-2', // Requires ID on the second step's container
            title: 'Select Target Variable',
            content: 'This is the specific field you want the model to predict.',
            placement: 'right',
        },
        {
            elementId: 'predictive-step-3', // Requires ID on the third step's container
            title: 'Select Feature Variables',
            content: 'These are the input variables that you think might influence your target. The AI will determine which ones are most important.',
            placement: 'right',
        },
        {
            elementId: 'predictive-run-button', // Requires ID on the run button
            title: 'Run the Model',
            content: 'Click here to let the AI build and analyze the model. Results, including performance metrics and a simulator, will appear on the right.',
            placement: 'top',
        },
    ]
};