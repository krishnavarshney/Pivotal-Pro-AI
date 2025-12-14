import { Dispatch, SetStateAction, useCallback } from 'react';
import _ from 'lodash';
import {
    DashboardPage, WidgetState, Pill, CrossFilterState, ControlFilterState,
    AIConfig, AiChatMessage, ChatContext, Story, User, Field, Insight, InsightStatus, InsightType,
    AdvancedAnalysisResult, StoryTone, AiWidgetSuggestion, AiDashboardSuggestion, PredictiveModelResult,
    AggregationType, FieldType, FilterCondition, StoryPage, Workspace
} from '../../utils/types';
import { processWidgetData } from '../../utils/dataProcessing/widgetProcessor';
import * as aiService from '../../services/aiService';
import { notificationService } from '../../services/notificationService';
import { ModalManager } from '../../hooks/useModalManager';


export const useDashboardAI = (
    activePage: DashboardPage | undefined,
    workspaces: Workspace[],
    selectedWidgetIds: string[],
    widgets: WidgetState[],
    blendedData: any[],
    globalFilters: Pill[],
    crossFilter: CrossFilterState,
    dataContext: any,
    controlFilters: ControlFilterState,
    aiConfig: AIConfig | null,
    aiChatHistory: AiChatMessage[],
    setAiChatHistory: Dispatch<SetStateAction<AiChatMessage[]>>,
    modalManager: ModalManager,
    deselectAllWidgets: () => void,
    setStories: Dispatch<SetStateAction<Story[]>>,
    setEditingStory: Dispatch<SetStateAction<{ story: Story; focusPageId?: string; } | null>>,
    setView: (view: any, options?: any) => void,
    currentUser: User | null,
    blendedFields: { dimensions: Field[]; measures: Field[]; },
    addGlobalFilter: (pill: Omit<Pill, 'id'>) => void,
    setInsights: Dispatch<SetStateAction<Insight[]>>,
    setLoadingState: (state: { isLoading: boolean; message: string; }) => void,
    addNewPage: (templatePage?: Partial<DashboardPage>) => Promise<void>,
    saveWidget: (widget: WidgetState, layoutOverride?: any) => Promise<void>,
    setPredictiveModels: Dispatch<SetStateAction<PredictiveModelResult[]>>,
    activePageId: string | null,
    dashboardDefaults: any
) => {

    // Helper to detect if message is requesting chart creation or visualization
    const isChartRequest = (message: string): boolean => {
        const lowerMessage = message.toLowerCase();

        // Direct chart creation keywords
        const creationKeywords = ['create', 'show', 'plot', 'display', 'visualize', 'generate', 'make', 'build', 'draw'];
        const chartTypes = ['chart', 'bar chart', 'line chart', 'pie chart', 'scatter', 'table', 'graph', 'histogram'];
        const hasDirectChartRequest = creationKeywords.some(kw => lowerMessage.includes(kw)) &&
            chartTypes.some(ct => lowerMessage.includes(ct));

        // Implicit visualization patterns (questions that naturally need charts)
        const visualizationPatterns = [
            /trend.*over time/i,           // "trend over time"
            /how (?:does|do|is|are).*trend/i,  // "how does X trend"
            /compare.*(?:by|across|between)/i, // "compare X by Y"
            /breakdown.*by/i,               // "breakdown by category"
            /distribution of/i,             // "distribution of"
            /over time/i,                   // "over time" (implies time series)
            /by (?:month|quarter|year|week|day)/i, // temporal grouping
            /top \d+/i,                     // "top 10 products"
            /(?:sales|revenue|profit|quantity).*by.*(?:city|region|category|product)/i // common analytical patterns
        ];

        const hasVisualizationPattern = visualizationPatterns.some(pattern => pattern.test(message));

        return hasDirectChartRequest || hasVisualizationPattern;
    };

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

        const userMessage: AiChatMessage = { id: _.uniqueId('msg_'), role: 'user', content: message, widgetContext: context ? { widgetId: context.widgetId, widgetTitle: widgets.find(w => w.id === context.widgetId)?.title || '' } : undefined };
        const thinkingMessage: AiChatMessage = { id: _.uniqueId('msg_'), role: 'assistant', content: '...', isStreaming: true };

        setAiChatHistory(prev => [...prev, userMessage, thinkingMessage]);

        const historyForAi = [...aiChatHistory, { ...userMessage, content: fullContextMessage }];
        const allFields = blendedFields.dimensions.concat(blendedFields.measures);
        const dataSample = blendedData.slice(0, 5);

        // Detect if this is a chart creation request
        if (isChartRequest(message) && !context) {
            try {
                // Use structured response for chart generation
                const response = await aiService.getChatResponse(aiConfig, historyForAi, allFields, dataSample);
                const aiMessage: AiChatMessage = {
                    id: thinkingMessage.id,
                    role: 'assistant',
                    content: response.content || 'Here is the chart you requested.',
                    chartSuggestion: response.chartSuggestion,
                    followUpSuggestions: response.followUpSuggestions,
                    isStreaming: false
                };
                setAiChatHistory(prev => prev.map(m => m.id === thinkingMessage.id ? aiMessage : m));
            } catch (e) {
                const errorMessage: AiChatMessage = { id: thinkingMessage.id, role: 'assistant', content: `Error: ${(e as Error).message}` };
                setAiChatHistory(prev => prev.map(m => m.id === thinkingMessage.id ? errorMessage : m));
            }
        } else {
            // Use streaming for general conversation
            try {
                let fullResponse = '';
                const stream = aiService.getChatResponseStream(aiConfig, historyForAi, allFields, dataSample);
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
        setLoadingState({ isLoading: true, message: 'Generating insights...' }); // Added loading state
        try {
            const allFields = [...blendedFields.dimensions, ...blendedFields.measures];
            const simpleFields = allFields.map(f => ({ name: f.simpleName, type: f.type }));
            const dataSample = blendedData.slice(0, 50);

            const proactiveResults = await aiService.getProactiveInsights(aiConfig, simpleFields, dataSample);

            const newInsights: Insight[] = proactiveResults.map(pi => ({
                id: _.uniqueId('insight_'),
                // Handle both lowercase and capitalized field names from AI
                title: pi.title || (pi as any).Title || 'Untitled Insight',
                description: pi.summary || (pi as any).Summary || 'No description provided',
                type: (pi.type || (pi as any).Type || 'TREND') as InsightType,
                confidence: pi.confidence || (pi as any).Confidence || 0,
                status: InsightStatus.NEW,
                dataSource: dataContext.dataSources.values().next().value?.name || 'Blended Data',
                timestamp: new Date().toISOString(),
                suggestedChartPrompt: pi.suggestedChartPrompt || (pi as any)['Suggested Chart Prompt'] || undefined
            }));

            setInsights(prev => [
                ...prev.filter(i => i.status !== InsightStatus.NEW),
                ...newInsights
            ]);
            notificationService.success(`${newInsights.length} new insights generated!`);

        } catch (e) {
            notificationService.error(`Failed to generate insights: ${(e as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    }, [aiConfig, blendedData, blendedFields, dataContext.dataSources, setInsights, setLoadingState]);

    const updateInsightStatus = (id: string, status: InsightStatus) => {
        setInsights(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    };

    const exploreInsight = (prompt: string) => {
        modalManager.setWidgetEditorAIPrompt(prompt);
        modalManager.setEditingWidgetState({
            id: 'new',
            title: 'New AI Widget',
            chartType: dashboardDefaults.chartType,
            displayMode: dashboardDefaults.chartType === 'Table' ? 'table' : 'chart',
            shelves: { columns: [], rows: [], values: [], filters: [] },
            subtotalSettings: { rows: false, columns: false, grandTotal: true },
            colorPalette: dashboardDefaults.colorPalette,
            pageId: activePageId || '',
            configuration: {},
            layouts: {},
        });
        modalManager.openWidgetEditorModal();
    };

    const runAdvancedAnalysis = async (widgetId: string, analysisType: 'ANOMALY_DETECTION' | 'KEY_INFLUENCERS' | 'CLUSTERING') => {
        if (!aiConfig || !activePage) return;
        const widget = activePage.widgets.find(w => w.id === widgetId);
        if (!widget) return;
        if (!widget) return;
        // Open modal in loading state immediately
        modalManager.openAdvancedAnalysisModal(null, `AI Analysis: ${widget.title}`);

        try {
            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters);
            if (data.type === 'chart' || data.type === 'kpi' || data.type === 'table') {
                const result = await aiService.getAiAdvancedAnalysis(aiConfig, analysisType, widget, data);
                modalManager.openAdvancedAnalysisModal(result, `AI Analysis: ${widget.title}`);
            } else {
                modalManager.closeAdvancedAnalysisModal();
                notificationService.info(`Analysis for widget type '${data.type}' is not supported.`);
            }
        } catch (e) {
            modalManager.closeAdvancedAnalysisModal();
            notificationService.error(`Advanced analysis failed: ${(e as Error).message}`);
        }
    };

    const runWhatIfAnalysis = async (widgetId: string, scenarioConfig: { targetMetric: string, modifiedVariables: { [key: string]: number } }) => {
        if (!aiConfig || !activePage) return;
        const widget = activePage.widgets.find(w => w.id === widgetId);
        if (!widget) return;
        if (!widget) return;
        // Open modal in loading state immediately
        modalManager.openAdvancedAnalysisModal(null, `What-If Analysis: ${widget.title}`);

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
                modalManager.closeAdvancedAnalysisModal();
                notificationService.info(`What-If analysis requires chart or table data.`);
                return;
            }
        } catch (e) {
            modalManager.closeAdvancedAnalysisModal();
            notificationService.error(`What-If analysis failed: ${(e as Error).message}`);
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
            return await aiService.getAiWidgetAnalysis(aiConfig, widget.title, widget.chartType, data as any, tone);
        } catch (e) {
            notificationService.error(`Widget analysis failed: ${(e as Error).message}`);
            return null;
        } finally {
            setLoadingState({ isLoading: false, message: '' });
        }
    };

    const runWidgetAnalysis = async (widget: WidgetState, tone: StoryTone = 'Executive') => {
        // Open modal in loading state immediately
        modalManager.openAdvancedAnalysisModal(null, `AI Analysis: ${widget.title}`);

        // Need to bypass setGlobalLoading in getWidgetAnalysisText helper or inline it here. 
        // Logic: getWidgetAnalysisText sets loading state. We can inline the logic or pass a flag.
        // For simplicity, I'll inline the relevant parts or reuse the helper but ignore its loading state if possible?
        // getWidgetAnalysisText calls setLoadingState. This is reused by "Discuss" feature maybe?
        // Actually, getWidgetAnalysisText is used here. Let's make getWidgetAnalysisText NOT set loading state if we want scoped loading.
        // But getWidgetAnalysisText is also exposed.
        // I will refactor getWidgetAnalysisText to accept an options object to silence loading, or just do the work here safely.

        try {
            // We can call the service directly
            if (!aiConfig) { notificationService.error("AI not configured"); return; }

            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters);
            if (data.type === 'loading' || data.type === 'nodata' || data.type === 'sankey' || data.type === 'heatmap') {
                modalManager.closeAdvancedAnalysisModal();
                notificationService.info(`AI analysis for this widget type is not yet supported.`);
                return;
            }

            const analysisText = await aiService.getAiWidgetAnalysis(aiConfig, widget.title, widget.chartType, data as any, tone);

            const result: AdvancedAnalysisResult = {
                title: `AI Analysis: ${widget.title}`,
                summary: analysisText.split('\n\n')[0] || 'Analysis complete.',
                details: [{ heading: 'Key Observations', content: analysisText }]
            };
            modalManager.openAdvancedAnalysisModal(result, `AI Analysis: ${widget.title}`);

        } catch (e) {
            modalManager.closeAdvancedAnalysisModal();
            notificationService.error(`Analysis failed: ${(e as Error).message}`);
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
            displayMode: suggestion.chartType === 'Table' ? 'table' : 'chart',
            shelves: resolvedShelves, subtotalSettings: { rows: false, columns: false, grandTotal: true },
            colorPalette: dashboardDefaults.colorPalette,
            pageId: activePageId || '',
            configuration: {},
            layouts: {},
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
                    await saveWidget(newWidget);
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
        // Need access to workspaces to find page, but we only have activePage.
        // We can't access other pages here easily unless we pass workspaces.
        // For now, let's assume we can only generate from active page or we need to pass workspaces.
        // But wait, generateStoryFromPage is called with pageId.
        // If we want to support any page, we need workspaces.
        // Let's just support active page for now or pass workspaces.
        // Passing workspaces seems better.
        // But for now let's skip workspaces dependency and assume active page if id matches, or fail.

        let page = activePage;
        if (page?.id !== pageId) {
            // Find the page in workspaces
            for (const ws of workspaces) {
                const foundPage = ws.pages.find(p => p.id === pageId);
                if (foundPage) {
                    page = foundPage;
                    break;
                }
            }
        }

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
                    const annotation = await aiService.getAiWidgetAnalysis(aiConfig, widget.title, widget.chartType, data, tone);
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
                layout.map((item, index) => ({ ...item, i: `widget-${index}` }))
            );

            await addNewPage({
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

    const addPredictiveModel = (model: PredictiveModelResult) => {
        setPredictiveModels(prev => [...prev, model]);
    };

    const discussSelectedWithAI = async () => {
        if (!activePage || selectedWidgetIds.length === 0) return;
        const widgetsToDiscuss = activePage.widgets.filter(w => selectedWidgetIds.includes(w.id));

        let prompt = `I have selected ${widgetsToDiscuss.length} widgets from my dashboard. Please provide a combined analysis and find any interesting correlations or insights between them.\n\nHere are the summaries:\n\n`;

        for (const widget of widgetsToDiscuss) {
            const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters, controlFilters);
            let dataSummary = 'Data not available for summary.';
            if (data.type === 'chart') {
                dataSummary = JSON.stringify({ labels: data.labels.slice(0, 5), datasets: data.datasets.map((d: any) => ({ label: d.label, data: d.data.slice(0, 5) })) }).substring(0, 500);
            } else if (data.type === 'table') {
                dataSummary = JSON.stringify(data.rows.slice(0, 5).map((r: any) => r.values)).substring(0, 500);
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

    return {
        sendAiChatMessage,
        handleNlpFilterQuery,
        resolveNlpAmbiguity,
        generateNewInsights,
        updateInsightStatus,
        exploreInsight,
        runAdvancedAnalysis,
        runWhatIfAnalysis,
        getWidgetAnalysisText,
        runWidgetAnalysis,
        generateStoryFromInsights,
        generateStoryFromPage,
        handleGenerateAiDashboard,
        addPredictiveModel,
        discussSelectedWithAI,
        addSelectedToStory,
        createWidgetFromSuggestionObject,
        inspectInsight: async (insight: Insight) => {
            if (!aiConfig) {
                notificationService.error('AI is not configured.');
                return;
            }
            setLoadingState({ isLoading: true, message: 'Generating widget from insight...' });
            try {
                const suggestion = await aiService.getWidgetFromPrompt(aiConfig, insight.suggestedChartPrompt, [...blendedFields.dimensions, ...blendedFields.measures]);
                if (suggestion) {
                    const newWidget = createWidgetFromSuggestionObject(suggestion);
                    await saveWidget(newWidget);
                    setView('dashboard');
                    notificationService.success('Insight added to dashboard!');
                } else {
                    notificationService.error('Failed to generate widget from insight.');
                }
            } catch (error) {
                console.error("Error inspecting insight:", error);
                notificationService.error('An error occurred while inspecting the insight.');
            } finally {
                setLoadingState({ isLoading: false, message: '' });
            }
        }
    };
};
