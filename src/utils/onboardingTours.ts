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
            elementId: 'onboarding-widget-editor-fields',
            title: 'Data Fields',
            content: 'All the fields from your dataset are listed here. You can also ask our AI to create a chart for you with a natural language prompt.',
            placement: 'right',
            preAction: ({ startOnboardingTour }) => startOnboardingTour('widgetEditor', 0),
        },
        {
            elementId: 'onboarding-widget-editor-properties',
            title: 'Build Your Chart',
            content: 'Drag fields from the left panel onto these shelves to configure your chart. Dimensions create labels and groups, while measures provide the numeric values.',
            placement: 'right',
        },
        {
            elementId: 'onboarding-widget-editor-preview',
            title: 'Live Preview',
            content: 'As you configure your widget, a live preview will appear here instantly. Click "Save Widget" when you\'re done.',
            placement: 'left',
        },
    ],
    widgetEditor: [
         {
            elementId: 'onboarding-widget-editor-fields',
            title: 'Data Fields',
            content: 'All the fields from your dataset are listed here. You can also ask our AI to create a chart for you with a natural language prompt.',
            placement: 'right',
        },
        {
            elementId: 'onboarding-widget-editor-properties',
            title: 'Build Your Chart',
            content: 'Drag fields from the left panel onto these shelves to configure your chart. Dimensions create labels and groups, while measures provide the numeric values.',
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
            content: 'This sidebar is your main workspace. Manage sources, view final fields, and build your transformation pipeline.',
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
            placement: 'bottom',
        },
    ],
    dataModeler: [
        {
            elementId: 'onboarding-datamodeler-sidebar',
            title: 'Data Sources',
            content: 'Add tables from your available data sources to the canvas to begin building relationships.',
            placement: 'right',
        },
        {
            elementId: 'onboarding-datamodeler-canvas',
            title: 'Visual Join Canvas',
            content: 'Drag a field from one table and drop it onto a matching field in another table to create a join. This defines how your data is connected.',
            placement: 'bottom',
        },
        {
            elementId: 'onboarding-datamodeler-inspector',
            title: 'Join Inspector',
            content: 'Once a join is created, click the line connecting the tables to configure its properties, like changing the join type from Inner to Left.',
            placement: 'left',
        },
    ],
    stories: [
        {
            elementId: 'onboarding-story-new',
            title: 'Create Your First Story',
            content: 'Data Stories let you weave your charts into a compelling, slide-by-slide narrative. Create one manually or let AI generate one for you.',
            placement: 'bottom',
        },
    ],
    predictive: [
        {
            elementId: 'onboarding-predictive-step-1',
            title: 'Select Model Type',
            content: 'Start by choosing the type of prediction you want to make, such as predicting a number (Regression) or a category (Classification).',
            placement: 'right',
        },
        {
            elementId: 'onboarding-predictive-step-2',
            title: 'Select Target Variable',
            content: 'This is the specific field you want the model to predict.',
            placement: 'right',
        },
        {
            elementId: 'onboarding-predictive-step-3',
            title: 'Select Feature Variables',
            content: 'These are the input variables that you think might influence your target. The AI will determine which ones are most important.',
            placement: 'right',
        },
        {
            elementId: 'onboarding-predictive-run',
            title: 'Run the Model',
            content: 'Click here to let the AI build and analyze the model. Results, including performance metrics and a simulator, will appear on the right.',
            placement: 'top',
        },
    ]
};
