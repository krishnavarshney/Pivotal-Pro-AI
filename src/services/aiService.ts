import { Type } from "@google/genai";
import { Field, ChartType, AggregationType, Transformation, TransformationType, AiDataSuggestion, AIConfig, AiChatMessage, ProcessedData, AdvancedAnalysisResult, WidgetState, WhatIfResult, AiDashboardSuggestion, ProactiveInsight, PredictiveModelType, PredictiveModelResult, FilterCondition, NlpFilterResult } from '../utils/types';
import { formatValue } from "../utils/dataProcessing/formatting";
import { FORMULA_FUNCTION_DEFINITIONS } from "../utils/dataProcessing/formulaEngine";
import _ from 'lodash';

// --- Client-side Proxy Functions ---

async function proxyGenerateContent(body: any): Promise<{ text: string }> {
    const response = await fetch('/api/gemini/generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API request failed with status ${response.status}`);
    }
    return response.json();
}

async function* proxyGenerateContentStream(body: any): AsyncGenerator<{ text: string }> {
    const response = await fetch('/api/gemini/generateContentStream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
        const error = await response.json().catch(() => ({ error: `API request failed with status ${response.status}` }));
        throw new Error(error.error);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6);
                if (jsonStr === '[DONE]') {
                    return;
                }
                yield JSON.parse(jsonStr);
            }
        }
    }
}


// --- API Endpoint Functions ---

export async function fetchOllamaModels(endpoint: string): Promise<string[]> {
    const isLocalhost = endpoint.includes('//localhost:') || endpoint.includes('//127.0.0.1:');
    const fetchEndpoint = isLocalhost ? '/ollama-api' : endpoint;
    try {
        const response = await fetch(`${fetchEndpoint}/api/tags`);
        if (!response.ok) {
            throw new Error(`Ollama API responded with status ${response.status}`);
        }
        const data = await response.json();
        return data.models.map((m: any) => m.name);
    } catch (error) {
        console.error("Failed to fetch Ollama models:", error);
        return [];
    }
}

// --- Unified AI Chat Response ---

const valueShelfSchemaForChat = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The simple name of the measure field." },
            aggregation: { type: Type.STRING, enum: Object.values(AggregationType) }
        },
        required: ["name", "aggregation"]
    },
};

const chartConfigSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A concise, descriptive title for the chart." },
        chartType: { type: Type.STRING, enum: Object.values(ChartType), description: "The best chart type for the user's request." },
        shelves: {
            type: Type.OBJECT,
            properties: {
                columns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Field simple names for columns/X-axis. Usually dimensions, but can be measures for scatter plots." },
                rows: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Field simple names for rows/Y-axis. Usually dimensions, but can be measures for scatter plots." },
                category: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Field simple name for color category (e.g., in scatter plots)." },
                values: { ...valueShelfSchemaForChat, description: "The measures to be visualized for the primary Y-axis or bubble size." },
                values2: { ...valueShelfSchemaForChat, description: "Measure fields for the secondary Y-axis (for Dual Axis charts)." },
            }
        }
    },
    required: ["title", "chartType", "shelves"]
};

const getSystemInstruction = (fields: Field[], dataSample?: object[]): string => {
    const fieldsString = fields.map(f => `- "${f.simpleName}" (${f.type})`).join('\n');
    const sampleString = dataSample && dataSample.length > 0
        ? `\n\nHere is a small sample of the data (first 5 rows) to provide context:\n${JSON.stringify(dataSample.slice(0, 5), null, 2)}`
        : '';

    return `You are 'Pivotal Pro', a helpful AI assistant integrated into a business intelligence dashboard. Your goal is to help users understand their data and create visualizations.

You have access to the following fields (use the simple names provided):
${fieldsString}${sampleString}

There are two modes of response:

1.  **Chart Generation Mode**: If the user's LATEST message explicitly asks to create a chart, table, or visualization (e.g., "show me sales by country", "create a bar chart of profit by segment"), you MUST respond ONLY with a valid JSON object that conforms to the provided schema. Do not include any other text, greetings, or markdown formatting like \`\`\`json. Your entire response must be the JSON object itself. Pick the best chart type and aggregation for the request.

2.  **Insight Mode**: For any other questions or conversations (e.g., "what are the key trends?", "tell me about my data", "which category is most profitable?"), provide a concise, insightful, and easy-to-understand summary in Markdown format. Use bold text for emphasis and bullet points for lists. Be helpful and conversational.

Analyze the user's last message to decide which mode to use. If the user asks for a chart, ALWAYS use Chart Generation Mode.`;
};

export const getChatResponse = async (
    config: AIConfig,
    chatHistory: AiChatMessage[],
    fields: Field[],
    dataSample: object[]
): Promise<{ text: string, chartSuggestion?: object }> => {
    const systemInstruction = getSystemInstruction(fields, dataSample);

    try {
        let responseText: string;
        const latestUserMessage = chatHistory[chatHistory.length - 1].content;
        const isChartRequest = /generate a visualization for:|chart|plot|graph|show me|visualize|table|list|map|diagram/i.test(latestUserMessage);

        if (config.provider === 'gemini') {
            const result = await proxyGenerateContent({
                model: "gemini-2.5-flash",
                contents: chatHistory.map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{text: m.content}]
                })),
                config: {
                    systemInstruction,
                    responseMimeType: isChartRequest ? "application/json" : "text/plain",
                    ...(isChartRequest && { responseSchema: chartConfigSchema }),
                    temperature: 0.3
                }
            });
            responseText = result.text.trim();
        } else {
            throw new Error("AI provider is not configured correctly.");
        }

        if (isChartRequest) {
             try {
                const chartSuggestion = JSON.parse(responseText);
                // Basic validation
                if (chartSuggestion.chartType && chartSuggestion.shelves) {
                    return {
                        text: `Sure, here is the chart you requested: "${chartSuggestion.title}".`,
                        chartSuggestion
                    };
                }
            } catch (e) {
                // The model failed to produce valid JSON for a chart request, return its text response as an explanation.
                return { text: responseText, chartSuggestion: undefined };
            }
        }

        return { text: responseText, chartSuggestion: undefined };

    } catch (error) {
        console.error("Error communicating with AI:", error);
        return { text: `An error occurred while communicating with the AI: ${(error as Error).message}` };
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function* getChatResponseStream(
    config: AIConfig,
    chatHistory: AiChatMessage[],
    fields: Field[],
    dataSample: object[]
): AsyncGenerator<string> {
    const systemInstruction = getSystemInstruction(fields, dataSample);

    if (config.provider === 'gemini') {
        const stream = proxyGenerateContentStream({
            model: "gemini-2.5-flash",
            contents: chatHistory.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{text: m.content}]
            })),
            config: {
                systemInstruction,
                responseMimeType: "text/plain",
                temperature: 0.3
            }
        });

        for await (const chunk of stream) {
            const words = chunk.text.split(/(\s+)/); // Split by space, keeping spaces
            for (const word of words) {
                yield word;
                await delay(30); // Small delay for word-by-word effect
            }
        }
    } else {
        throw new Error("AI provider is not configured correctly for streaming.");
    }
}

// --- AI NLP Filter Parsing ---
const nlpFilterSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['UNAMBIGUOUS', 'AMBIGUOUS', 'NO_FILTER_DETECTED'] },
        unambiguousResult: {
            type: Type.OBJECT,
            properties: {
                fieldName: { type: Type.STRING, description: "The simple name of the field to filter." },
                condition: { type: Type.STRING, enum: Object.values(FilterCondition) },
                values: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The values to filter by. Must be an array." }
            },
            nullable: true,
        },
        ambiguousResult: {
            type: Type.OBJECT,
            properties: {
                term: { type: Type.STRING, description: "The ambiguous term found in the query." },
                possibleFields: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of possible field simple names this term could apply to." }
            },
            nullable: true,
        }
    },
    required: ['type']
};

export const getNlpFilter = async (config: AIConfig, query: string, fields: Field[]): Promise<NlpFilterResult> => {
    const fieldsString = fields.map(f => `- "${f.simpleName}" (${f.type})`).join('\n');
    const systemInstruction = `You are an expert data filter query parser. Your task is to analyze a user's natural language query and convert it into a structured filter object.
- The user will provide a query like 'show me sales in the north region' or 'filter for corporate and consumer segments'.
- You must identify the field name, the condition, and the value(s) from the query.
- Use the provided list of field simple names to find the correct field.
- If a value from the query could belong to multiple fields (e.g., 'Corporate' could be in 'Segment' or 'Customer Type'), you MUST return an 'AMBIGUOUS' type with the term and possible fields.
- For queries that ask to filter for multiple values for the same field (e.g., 'show furniture and office supplies'), use the 'IS_ONE_OF' condition. For single values, use 'EQUALS'.
- For numeric queries like 'sales over 500', use the '>' condition.
- If the query does not seem to be a filter request, return the 'NO_FILTER_DETECTED' type.
- Your entire response MUST be a valid JSON object conforming to the provided schema. Do not include any other text or markdown.

Available Fields:
${fieldsString}`;

    if (config.provider !== 'gemini') {
        throw new Error("NLP filtering is currently only available with the Gemini AI provider.");
    }
    
    const result = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: nlpFilterSchema,
            temperature: 0.1
        }
    });

    try {
        const parsedResult = JSON.parse(result.text.trim());
        if (parsedResult.type) {
            return parsedResult as NlpFilterResult;
        }
        throw new Error("AI response did not match the expected filter schema.");
    } catch (e) {
        console.error("Error parsing NLP filter response:", e, "Raw response:", result.text);
        throw new Error("Failed to get a valid filter from the AI.");
    }
};


export const getAiChartSuggestion = async (
    config: AIConfig,
    selectedFields: Field[],
    allFields: Field[],
): Promise<Partial<WidgetState>> => {
    const systemInstruction = `You are an expert data analyst. Your task is to suggest the best possible chart configuration given a list of selected fields from a larger dataset.
    - Analyze the selected fields (name and type).
    - Choose the most appropriate chart type to visualize the relationship between these fields.
    - Assign the fields to the correct shelves (columns, rows, values), using their simple names.
    - For measure fields, choose the most logical default aggregation (e.g., SUM for 'Sales', AVERAGE for 'Discount').
    - Provide a concise and descriptive title for the chart.
    - Your entire response MUST be a valid JSON object conforming to the provided schema. Do not include any other text or markdown.

    All available fields in the dataset:
    ${allFields.map(f => `- "${f.simpleName}" (${f.type})`).join('\n')}
    `;

    const prompt = `Generate a chart configuration for the following selected fields:
    ${selectedFields.map(f => `- "${f.simpleName}" (${f.type})`).join('\n')}
    `;

    if (config.provider !== 'gemini') {
        throw new Error("AI chart suggestion is currently only available with the Gemini AI provider.");
    }

    const result = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: chartConfigSchema,
            temperature: 0.2
        }
    });

    const responseText = result.text.trim();
    try {
        const suggestion = JSON.parse(responseText);
        // Basic validation
        if (suggestion.chartType && suggestion.shelves) {
            return suggestion as Partial<WidgetState>;
        }
        throw new Error("AI response did not match the expected chart configuration schema.");
    } catch (e) {
        console.error("Error parsing AI chart suggestion:", e, "Raw response:", responseText);
        throw new Error("Failed to get a valid chart configuration from the AI.");
    }
}

// --- AI Formula Generation ---
export const getAiFormulaSuggestion = async (
    config: AIConfig,
    fields: Field[],
    prompt: string,
): Promise<string> => {
    const fieldsString = fields.map(f => `[${f.simpleName}]`).join(', ');
    const functionsString = Object.entries(FORMULA_FUNCTION_DEFINITIONS).map(([name, def]) => `- ${def.syntax}: ${def.description}`).join('\n');
    
    const systemInstruction = `You are an expert in a data analysis formula language similar to DAX or Excel formulas. Your task is to convert a user's natural language request into a valid formula.
- You MUST ONLY return the formula string. Do not include any explanation, markdown, or any text other than the formula itself.
- Field names must be enclosed in square brackets, like [Sales] or [Order Date].
- Use the provided functions correctly.

Available Fields:
${fieldsString}

Available Functions:
${functionsString}
`;

    if (config.provider !== 'gemini') {
        throw new Error("AI formula suggestion is only available with the Gemini provider.");
    }
    
    try {
        const result = await proxyGenerateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "text/plain",
                temperature: 0,
            }
        });
        return result.text.trim();
    } catch (error) {
        console.error("Error getting AI formula suggestion:", error);
        throw new Error("Failed to generate formula. Please check your AI configuration or prompt.");
    }
};


// --- AI Forecasting ---

export const getAiForecast = async (
  config: AIConfig,
  historicalData: {label: string, value: number | null}[],
  periodsToForecast: number
): Promise<number[]> => {
    const systemInstruction = `You are a time series forecasting expert. Predict future values based on historical data. The user will provide JSON data points. You MUST respond ONLY with a valid JSON array of numbers, representing the forecasted values in order. Do not include any other text or markdown.`;
    const cleanHistoricalData = historicalData.filter(d => d.value !== null && !isNaN(d.value));

    if (cleanHistoricalData.length < 3) return [];

    const prompt = `Based on this data, predict the next ${periodsToForecast} values: ${JSON.stringify(cleanHistoricalData)}`;

    try {
        let responseText: string;
        if (config.provider === 'gemini') {
            const result = await proxyGenerateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { systemInstruction, responseMimeType: "application/json", temperature: 0.5 }
            });
            responseText = result.text.trim();
        } else {
            throw new Error("AI provider not configured for forecasting.");
        }

        const forecast = JSON.parse(responseText);
        if (Array.isArray(forecast) && forecast.every(v => typeof v === 'number')) {
            return forecast;
        }
        console.error("AI forecast returned an unexpected format:", forecast);
        return [];
    } catch (error) {
        console.error("Error calling AI for forecasting:", error);
        return [];
    }
};

// --- AI Widget Analysis for Stories ---

export const getAiWidgetAnalysis = async (
    config: AIConfig,
    widgetTitle: string,
    chartType: ChartType,
    processedData: Extract<ProcessedData, { type: 'chart' } | { type: 'kpi' } | {type: 'table'}>
): Promise<string> => {
    const systemInstruction = `You are an expert data analyst. Your task is to provide a concise, insightful, and easy-to-understand summary for a chart from a business intelligence dashboard. The user will provide the chart's title, type, and the data it represents.
- Start with a clear topic sentence summarizing the main finding.
- Use bullet points to highlight 2-3 key observations, trends, or outliers.
- Keep the entire analysis to 2-3 short paragraphs.
- Be direct and focus on what the data reveals. Do not use conversational filler.
- Your response must be in Markdown format.`;

    let dataSummary = `Chart Title: "${widgetTitle}"\nChart Type: ${chartType}\n\nData:\n`;
    
    if (processedData.type === 'chart') {
        const summary = processedData.labels.map((label, index) => {
            const dataPoints = processedData.datasets.map(ds => `${ds.label}: ${formatValue(ds.data[index])}`).join(', ');
            return `- ${label}: ${dataPoints}`;
        }).slice(0, 20); // Limit to 20 data points for brevity
        dataSummary += summary.join('\n');
    } else if (processedData.type === 'kpi') {
        dataSummary += `- ${processedData.primaryValue.label}: ${processedData.primaryValue.formatted}`;
        if (processedData.secondaryValue) {
            dataSummary += `\n- ${processedData.secondaryValue.label}: ${processedData.secondaryValue.formatted}`;
        }
    } else if (processedData.type === 'table') {
        const headers = processedData.columnOrder.map(key => {
            const header = processedData.headerRows[processedData.headerRows.length - 1].find(h => h.key === key);
            return header?.label || key;
        }).join(', ');
        const rows = processedData.rows.slice(0,10).map(row => processedData.columnOrder.map(key => row.values[key]).join(', ')).join('\n');
        dataSummary += `Headers: ${headers}\nRows:\n${rows}`;
    }

    const prompt = `Please provide an analysis for the following chart:\n${dataSummary}`;
    
    if (config.provider !== 'gemini') {
        throw new Error("Widget analysis is currently only available with the Gemini AI provider.");
    }

    try {
        const result = await proxyGenerateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { systemInstruction, temperature: 0.4 }
        });
        return result.text.trim();
    } catch (error) {
        console.error("Error getting AI widget analysis:", error);
        throw new Error("Failed to generate widget analysis.");
    }
}

// --- AI Dashboard Analysis ---

const dashboardAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A high-level summary of the overall story the dashboard is telling. Should be 2-3 sentences." },
        keyTakeaways: {
            type: Type.ARRAY,
            description: "A list of 3-5 specific, insightful bullet points discovered by analyzing the charts together.",
            items: { type: Type.STRING }
        },
        nextSteps: {
            type: Type.ARRAY,
            description: "A list of 2-3 actionable suggestions for further exploration, phrased as natural language commands to generate a new chart.",
            items: {
                type: Type.OBJECT,
                properties: {
                    description: {
                        type: Type.STRING,
                        description: "The natural language prompt for the suggested chart."
                    }
                },
                required: ["description"]
            }
        }
    },
    required: ["summary", "keyTakeaways", "nextSteps"]
};

export const getAiDashboardAnalysis = async (
    config: AIConfig,
    dashboardWidgetsSummary: string
): Promise<string> => { // Returns raw string, parsing will be done in the provider
    const systemInstruction = `You are a senior business analyst. Your task is to synthesize insights from a collection of charts on a dashboard. The user will provide a summary of all visible widgets.
- Analyze the data across all charts to find connections, trends, and anomalies.
- Do not just describe each chart individually. Create a cohesive narrative about what the data means as a whole.
- The 'nextSteps' suggestions should be phrased as direct commands a user would give to generate a new chart, like 'Show me sales over time' or 'Compare profit by region'.
- Your entire response MUST be a valid JSON object conforming to the provided schema. Do not include any other text or markdown.`;

    const prompt = `Here is the data for the widgets currently on the dashboard. Please provide a holistic analysis.\n\n${dashboardWidgetsSummary}`;

    if (config.provider !== 'gemini') {
        throw new Error("Dashboard-level analysis is currently only available with the Gemini AI provider.");
    }

    try {
        const result = await proxyGenerateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema: dashboardAnalysisSchema, temperature: 0.5 }
        });
        return result.text.trim();
    } catch (error) {
        console.error("Error getting AI dashboard analysis:", error);
        throw new Error("Failed to generate dashboard analysis.");
    }
}

// --- AI Insight Starter Dashboard Generation ---
const valueShelfSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The simple name of the measure field." },
            aggregation: { type: Type.STRING, enum: Object.values(AggregationType) }
        },
        required: ["name", "aggregation"]
    },
};

const dashboardSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        page: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "A concise, descriptive name for the dashboard page." },
                widgets: {
                    type: Type.ARRAY,
                    description: "An array of 3 to 5 widget configurations.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "A concise, descriptive title for the chart." },
                            chartType: { type: Type.STRING, enum: Object.values(ChartType).filter(t => t !== ChartType.CONTROL), description: "The best chart type for this visualization." },
                            shelves: {
                                type: Type.OBJECT,
                                properties: {
                                    columns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Field simple names for columns/X-axis. Usually dimensions." },
                                    rows: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Field simple names for rows/breakdowns. Usually dimensions." },
                                    category: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Field simple name for color category (e.g., in scatter plots)." },
                                    values: { ...valueShelfSchema, description: "Measure fields for the primary Y-axis." },
                                    values2: { ...valueShelfSchema, description: "Measure fields for the secondary Y-axis (for Dual Axis charts)." },
                                    bubbleSize: { ...valueShelfSchema, description: "Measure field for bubble size." },
                                },
                            }
                        },
                        required: ["title", "chartType", "shelves"]
                    }
                },
                layouts: {
                    type: Type.OBJECT,
                    description: "An object containing layouts for different breakpoints. `lg` is required.",
                    properties: {
                        lg: {
                            type: Type.ARRAY,
                            description: "Layout for large screens (24 columns).",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    i: { type: Type.STRING, description: "The ID of the widget. This should match the widget's position in the widgets array, e.g., 'widget-0', 'widget-1'." },
                                    x: { type: Type.INTEGER },
                                    y: { type: Type.INTEGER },
                                    w: { type: Type.INTEGER },
                                    h: { type: Type.INTEGER },
                                }
                            }
                        }
                    },
                    required: ["lg"]
                }
            },
            required: ["name", "widgets", "layouts"]
        },
        calculatedFields: {
            type: Type.ARRAY,
            description: "An array of 0 to 2 useful calculated fields to create. Focus on common business metrics like ratios or growth rates.",
            items: {
                type: Type.OBJECT,
                properties: {
                    fieldName: { type: Type.STRING, description: "The name for the new calculated field." },
                    formula: { type: Type.STRING, description: "The calculation formula using available fields in brackets, e.g., 'SUM([Profit]) / SUM([Sales])'." },
                    description: { type: Type.STRING, description: "A brief explanation of what this field calculates." }
                },
                required: ["fieldName", "formula", "description"]
            }
        }
    },
    required: ["page", "calculatedFields"]
};

export const generateAiDashboard = async (
    config: AIConfig,
    fields: { name: string, type: string }[],
    dataSample: any[]
): Promise<AiDashboardSuggestion> => {
    
    const systemInstruction = `You are an expert data analyst and dashboard designer. Your task is to analyze a dataset and create a complete dashboard configuration as a single JSON object.
- The user will provide the data schema and a sample.
- You must identify key metrics, propose 0-2 useful calculated fields, design 3-5 insightful visualizations, and create a 24-column grid layout for them.
- Ensure the 'i' in the layout object corresponds to the widget's position in the widgets array (e.g., the first widget in the array should have 'i': 'widget-0', the second 'widget-1', etc.).
- The layout should be logical and visually appealing. Avoid overlapping widgets.
- Your entire response MUST be a valid JSON object conforming to the provided schema. Do not include any other text or markdown.`;

    const fieldsString = fields.map(f => `- "${f.name}" (${f.type})`).join('\n');
    const sampleString = JSON.stringify(dataSample, null, 2);

    const prompt = `Here is the data schema and a sample. Please generate a dashboard configuration.\n\nSchema:\n${fieldsString}\n\nData Sample:\n${sampleString}`;

    if (config.provider !== 'gemini') {
        throw new Error("AI Dashboard generation is currently only available with the Gemini AI provider.");
    }
    
    const result = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: dashboardSuggestionSchema,
            temperature: 0.4
        }
    });

    const responseText = result.text.trim();
    try {
        const suggestion = JSON.parse(responseText);
        if (suggestion.page && suggestion.calculatedFields) {
            return suggestion as AiDashboardSuggestion;
        }
        throw new Error("AI response did not match the expected dashboard configuration schema.");
    } catch (e) {
        console.error("Error parsing AI dashboard suggestion:", e, "Raw response:", responseText);
        throw new Error(`Failed to get a valid dashboard configuration from the AI. Raw response: ${responseText}`);
    }
};


// --- AI Advanced Analysis (Anomalies, Influencers, etc.) ---

const advancedAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A concise title for the analysis report." },
        summary: { type: Type.STRING, description: "A high-level summary of the findings, 2-3 sentences long." },
        details: {
            type: Type.ARRAY,
            description: "A list of detailed findings, such as specific anomalies, key influencers, or cluster descriptions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: { type: Type.STRING, description: "A heading for this specific finding (e.g., 'Anomaly on 2023-10-26', 'High-Profit Customer Segment')." },
                    content: { type: Type.STRING, description: "A detailed explanation of the finding, in Markdown format." }
                },
                required: ["heading", "content"]
            }
        }
    },
    required: ["title", "summary", "details"]
};

export const getAiAdvancedAnalysis = async (
    config: AIConfig,
    analysisType: 'ANOMALY_DETECTION' | 'KEY_INFLUENCERS' | 'CLUSTERING',
    widget: WidgetState,
    processedData: Extract<ProcessedData, { type: 'chart' } | { type: 'kpi' } | { type: 'table' }>
): Promise<AdvancedAnalysisResult> => {
    
    let systemInstruction = `You are an expert data analyst. Your task is to perform an advanced analysis on a dataset from a business intelligence dashboard.
    Your entire response MUST be a valid JSON object conforming to the provided schema. Do not include any other text or markdown.`;
    
    let userPrompt = ``;
    
    switch(analysisType) {
        case 'ANOMALY_DETECTION':
            userPrompt = `Perform anomaly detection on the following dataset. Identify any significant outliers, spikes, or dips in the data that deviate from the normal pattern. For each anomaly, provide a brief explanation of what makes it unusual.`;
            break;
        case 'KEY_INFLUENCERS':
            userPrompt = `Perform a key influencer analysis on the following dataset. Identify the primary dimensions and values that are driving the main measure. Explain the impact of each influencer.`;
            break;
        case 'CLUSTERING':
            userPrompt = `Perform a clustering analysis on the following dataset. Group the data points into distinct, meaningful clusters. For each cluster, provide a descriptive name and a summary of its key characteristics.`;
            break;
    }
    
    let dataSummary = `Analysis Task: ${analysisType}\nWidget Title: "${widget.title}"\nChart Type: ${widget.chartType}\n\nData:\n`;
    
    if (processedData.type === 'chart') {
        const summary = processedData.labels.map((label, index) => {
            const dataPoints = processedData.datasets.map(ds => `${ds.label}: ${formatValue(ds.data[index])}`).join(', ');
            return `- ${label}: ${dataPoints}`;
        }).slice(0, 50);
        dataSummary += summary.join('\n');
    } else if (processedData.type === 'kpi') {
        dataSummary += `- ${processedData.primaryValue.label}: ${processedData.primaryValue.formatted}`;
        if (processedData.secondaryValue) {
            dataSummary += `\n- ${processedData.secondaryValue.label}: ${processedData.secondaryValue.formatted}`;
        }
    } else if (processedData.type === 'table') {
        const headers = processedData.columnOrder.map(key => {
            const header = processedData.headerRows[processedData.headerRows.length - 1].find(h => h.key === key);
            return header?.label || key;
        }).join(', ');
        const rows = processedData.rows.slice(0, 20).map(row => processedData.columnOrder.map(key => formatValue(row.values[key])).join(', ')).join('\n');
        dataSummary += `Headers: ${headers}\nRows:\n${rows}`;
    }
    
    userPrompt += `\n\nDataset:\n${dataSummary}`;

    if (config.provider !== 'gemini') {
        throw new Error("Advanced analysis is currently only available with the Gemini AI provider.");
    }
    
    const result = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: advancedAnalysisSchema, temperature: 0.5 }
    });
    
    const responseText = result.text.trim();
    try {
        const parsedResult = JSON.parse(responseText);
        if (parsedResult.title && parsedResult.summary && Array.isArray(parsedResult.details)) {
            return parsedResult as AdvancedAnalysisResult;
        } else {
            throw new Error("Parsed JSON does not match the expected schema.");
        }
    } catch (error) {
         console.error("Error parsing advanced analysis response:", error, "Raw response:", responseText);
         return {
             title: `AI Analysis: ${analysisType.replace('_', ' ')}`,
             summary: "The AI returned a text-based analysis instead of a structured one.",
             details: [{ heading: "Raw Response", content: responseText }]
         };
    }
}

// --- AI What-If Analysis ---

const whatIfAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        predictedValue: { type: Type.NUMBER, description: "The single predicted value for the target metric under the new scenario." },
        confidenceInterval: {
            type: Type.ARRAY,
            description: "An array of two numbers representing the lower and upper bounds of the 95% confidence interval for the prediction.",
            items: { type: Type.NUMBER }
        },
        sensitivityAnalysis: {
            type: Type.ARRAY,
            description: "An analysis of which input variables had the most impact on the outcome. Express impact as a percentage.",
            items: {
                type: Type.OBJECT,
                properties: {
                    variable: { type: Type.STRING, description: "The simple name of the input variable that was changed." },
                    impact: { type: Type.NUMBER, description: "The percentage impact this variable's change had on the target metric's change." }
                },
                required: ["variable", "impact"]
            }
        }
    },
    required: ["predictedValue", "confidenceInterval", "sensitivityAnalysis"]
};


export const getAiWhatIfAnalysis = async (
    config: AIConfig,
    widget: WidgetState,
    processedData: Extract<ProcessedData, { type: 'chart' } | { type: 'table' }>,
    scenarioConfig: { targetMetric: string, modifiedVariables: { [key: string]: number } }
): Promise<WhatIfResult> => {
    const systemInstruction = `You are a predictive modeling expert. Your task is to perform a "what-if" analysis. Given a dataset summary and a scenario of changed variables, predict the outcome for a target metric.
- Analyze the relationships in the data summary.
- Apply the changes from the scenario.
- Predict the new value for the target metric.
- Provide a 95% confidence interval for your prediction.
- Analyze the sensitivity to determine which change had the most impact on the outcome. Impact should be a percentage. For example, if a 10% increase in 'Price' causes a 5% decrease in 'Sales', the impact is -50.
- Your entire response MUST be a valid JSON object conforming to the provided schema. Do not include any other text or markdown.`;

    let dataSummary = `Widget Title: "${widget.title}"\nChart Type: ${widget.chartType}\n\nData Summary:\n`;
    if (processedData.type === 'chart') {
        const summary = processedData.labels.map((label, index) => {
            const dataPoints = processedData.datasets.map(ds => `${ds.label}: ${formatValue(ds.data[index])}`).join(', ');
            return `- ${label}: ${dataPoints}`;
        }).slice(0, 50);
        dataSummary += summary.join('\n');
    } else if (processedData.type === 'table') {
        const headers = processedData.columnOrder.map(key => {
            const header = processedData.headerRows[processedData.headerRows.length - 1].find(h => h.key === key);
            return header?.label || key;
        }).join(', ');
        const rows = processedData.rows.slice(0, 20).map(row => processedData.columnOrder.map(key => formatValue(row.values[key])).join(', ')).join('\n');
        dataSummary += `Headers: ${headers}\nRows:\n${rows}`;
    }

    const scenarioDescription = Object.entries(scenarioConfig.modifiedVariables)
        .map(([variable, multiplier]) => {
            const change = ((multiplier - 1) * 100).toFixed(0);
            return `- The variable "${variable}" is changed by ${change}%`;
        }).join('\n');

    const prompt = `
Data Summary:
${dataSummary}

Scenario:
Predict the new value for the target metric "${scenarioConfig.targetMetric}" given the following changes:
${scenarioDescription}
`;

    if (config.provider !== 'gemini') throw new Error("What-if analysis is only available with the Gemini provider.");

    const result = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: whatIfAnalysisSchema, temperature: 0.3 }
    });
    
    const responseText = result.text.trim();
    try {
        const parsedResult = JSON.parse(responseText);
        if (parsedResult.predictedValue !== undefined && Array.isArray(parsedResult.confidenceInterval) && Array.isArray(parsedResult.sensitivityAnalysis)) {
            return parsedResult as WhatIfResult;
        }
        throw new Error("Parsed JSON does not match the expected schema.");
    } catch (e) {
        console.error("Error parsing what-if analysis response:", e, "Raw response:", responseText);
        throw new Error(`Failed to get a valid what-if analysis from the AI. Raw response: ${responseText}`);
    }
};


// --- AI Data Studio Suggestions ---

const aiSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "A list of suggested data transformations.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A short, clear title for the suggestion." },
                    description: { type: Type.STRING, description: "A user-friendly explanation of why this transformation is useful." },
                    transformationType: { type: Type.STRING, enum: Object.values(TransformationType) },
                    payloadJson: { type: Type.STRING, description: "A JSON string representing the payload object for the transformation. Example: for RENAME_FIELD, this would be '{\"oldName\": \"Customer Name\", \"newName\": \"Client Name\"}'." }
                },
                required: ["title", "description", "transformationType", "payloadJson"]
            }
        }
    }
};

const getSuggestionSystemInstruction = (): string => {
    return `You are a data analysis expert. Your task is to analyze a dataset's schema and a sample of its data to suggest helpful data cleaning transformations.
- Focus on common, high-impact transformations like standardizing text casing, handling nulls, or renaming fields for clarity.
- The 'payloadJson' field MUST be a valid JSON string. For example, for RENAME_FIELD, the value for payloadJson should be a string like: '{"oldName": "Customer Name", "newName": "Client Name"}'. Do NOT use single quotes inside the JSON string.
- The available transformation types are: RENAME_FIELD, STANDARDIZE_TEXT, HANDLE_NULLS, CHANGE_TYPE.
- Do not suggest transformations that are already in the user's pipeline.
- Suggest renaming fields with underscores or poor capitalization to be more readable (e.g., 'customer_name' to 'Customer Name').
- Your entire response must be a valid JSON object conforming to the provided schema.`;
}

export const getAiDataStudioSuggestions = async (
    config: AIConfig,
    fields: Field[],
    dataSample: object[],
    existingTransforms: Transformation[]
): Promise<AiDataSuggestion[]> => {
    const fieldsString = fields.map(f => `- "${f.name}" (type: ${f.type})`).join('\n');
    const sampleString = JSON.stringify(dataSample, null, 2);
    const existingTransformsString = existingTransforms.map(t => `- ${t.type}: ${JSON.stringify(t.payload)}`).join('\n');
    const systemInstruction = getSuggestionSystemInstruction();

    const prompt = `
Dataset Schema:
${fieldsString}

Data Sample (first 5 rows):
${sampleString}

Existing Transformations (do not suggest these again):
${existingTransformsString || 'None'}

Please suggest relevant data transformations.`;

    try {
        let responseText: string;
        if (config.provider === 'gemini') {
            const result = await proxyGenerateContent({
                model: "gemini-2.5-flash", contents: prompt,
                config: { systemInstruction, responseMimeType: "application/json", responseSchema: aiSuggestionSchema, temperature: 0.2 }
            });
            responseText = result.text.trim();
        } else {
             throw new Error("AI provider not configured for suggestions.");
        }
        
        const parsedResponse = JSON.parse(responseText);
        if (parsedResponse && Array.isArray(parsedResponse.suggestions)) {
            return parsedResponse.suggestions.map((s: any) => {
                try {
                    return {
                        title: s.title,
                        description: s.description,
                        transformationType: s.transformationType,
                        payload: JSON.parse(s.payloadJson)
                    };
                } catch (e) {
                    console.error("Failed to parse payloadJson for suggestion:", s);
                    return null;
                }
            }).filter((s: AiDataSuggestion | null): s is AiDataSuggestion => s !== null);
        }
        return [];
    } catch (error) {
        console.error("Error getting AI data studio suggestions:", error);
        return [];
    }
};

// --- AI Proactive Insights ---

const proactiveInsightSchema = {
    type: Type.OBJECT,
    properties: {
        insights: {
            type: Type.ARRAY,
            description: "A list of 3-5 proactive insights, anomalies, or trends found in the data.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A concise headline for the insight." },
                    summary: { type: Type.STRING, description: "A one-sentence summary explaining the finding." },
                    severity: { type: Type.STRING, enum: ['low', 'medium', 'high'], description: "The importance or impact of this finding." },
                    involvedFields: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The simple names of the fields involved in this insight." },
                    suggestedChartPrompt: { type: Type.STRING, description: "A natural language command to generate a chart that visualizes this insight." }
                },
                required: ["title", "summary", "severity", "involvedFields", "suggestedChartPrompt"]
            }
        }
    },
    required: ["insights"]
};

export const getProactiveInsights = async (
    config: AIConfig,
    fields: { name: string, type: string }[],
    dataSample: any[]
): Promise<Omit<ProactiveInsight, 'id'>[]> => {
    const systemInstruction = `You are a proactive data analyst. Your task is to scan a dataset and identify interesting anomalies, trends, or outliers without being prompted.
    - Analyze the provided data schema and sample.
    - Find up to 5 significant insights. Focus on relationships that might be unexpected or actionable.
    - For each insight, provide a clear title, a brief summary, a severity level, the fields involved, and a natural language prompt to create a chart for further investigation.
    - Your entire response MUST be a valid JSON object conforming to the provided schema. Do not include any other text or markdown.`;

    const fieldsString = fields.map(f => `- "${f.name}" (${f.type})`).join('\n');
    const sampleString = JSON.stringify(dataSample, null, 2);
    const prompt = `Here is the data schema and a sample. Please generate proactive insights.\n\nSchema:\n${fieldsString}\n\nData Sample:\n${sampleString}`;
    
    if (config.provider !== 'gemini') {
        throw new Error("Proactive insights are only available with the Gemini AI provider.");
    }

    const result = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: proactiveInsightSchema,
            temperature: 0.6
        }
    });
    
    const responseText = result.text.trim();
    try {
        const parsed = JSON.parse(responseText);
        if (parsed.insights && Array.isArray(parsed.insights)) {
            return parsed.insights;
        }
        throw new Error("AI response did not match the expected proactive insights schema.");
    } catch (e) {
        console.error("Error parsing proactive insights:", e, "Raw response:", responseText);
        throw new Error(`Failed to get a valid insight configuration from the AI.`);
    }
};

// --- AI Predictive Modeling ---

const predictiveModelSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.OBJECT,
            properties: {
                targetVariable: { type: Type.STRING },
                featureVariables: { type: Type.ARRAY, items: { type: Type.STRING } },
                modelType: { type: Type.STRING, enum: ['LINEAR_REGRESSION'] },
                aiSummary: { type: Type.STRING, description: "A concise, 1-2 paragraph summary of the model's performance and key findings in plain English." },
                formula: { type: Type.STRING, description: "The mathematical formula for the model, e.g., '12.34 + 5.67 * [Ad Spend] - 2.1 * [Discount]'." }
            },
            required: ["targetVariable", "featureVariables", "modelType", "aiSummary", "formula"]
        },
        performanceMetrics: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Metric name, e.g., 'R-squared', 'Mean Absolute Error'." },
                    value: { type: Type.NUMBER },
                    interpretation: { type: Type.STRING, description: "A one-sentence explanation of what this metric means." }
                },
                required: ["name", "value", "interpretation"]
            }
        },
        featureImportance: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    feature: { type: Type.STRING, description: "Name of the feature variable." },
                    importance: { type: Type.NUMBER, description: "A score from 0 to 1 indicating relative importance." }
                },
                required: ["feature", "importance"]
            }
        },
        coefficients: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    feature: { type: Type.STRING, description: "Feature name or '(Intercept)'." },
                    coefficient: { type: Type.NUMBER },
                    stdError: { type: Type.NUMBER },
                    pValue: { type: Type.NUMBER }
                },
                required: ["feature", "coefficient", "stdError", "pValue"]
            }
        }
    },
    required: ["summary", "performanceMetrics", "featureImportance", "coefficients"]
};


export const runPredictiveModel = async (
    config: AIConfig,
    modelType: PredictiveModelType,
    target: Field,
    features: Field[],
    data: any[]
): Promise<PredictiveModelResult> => {
    
    const systemInstruction = `You are a virtual data scientist. Your task is to perform a ${modelType} on the provided dataset and return a comprehensive, structured analysis.
    - The user will specify a target variable and a set of feature variables.
    - Analyze the provided data sample to understand the relationships.
    - Calculate all necessary statistical metrics for the model.
    - Provide a clear, plain-English summary of the results.
    - Construct the mathematical formula for the model.
    - Your entire response MUST be a valid JSON object conforming to the provided schema. Do not include any other text or markdown.`;

    const fields = [target, ...features];
    const dataSample = data.map(row => _.pick(row, fields.map(f => f.name)));

    const prompt = `
    Please perform a ${modelType} with the following configuration:
    - Target Variable: "${target.simpleName}"
    - Feature Variables: ${features.map(f => `"${f.simpleName}"`).join(', ')}

    Here is a sample of the data (up to 50 rows):
    ${JSON.stringify(dataSample.slice(0, 50), null, 2)}
    `;

    if (config.provider !== 'gemini') {
        throw new Error("Predictive modeling is currently only available with the Gemini AI provider.");
    }
    
    const result = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: predictiveModelSchema,
            temperature: 0.2
        }
    });

    const responseText = result.text.trim();
    try {
        const parsed = JSON.parse(responseText);
        if (parsed.summary && parsed.performanceMetrics && parsed.featureImportance && parsed.coefficients) {
            return {
                id: _.uniqueId('pm_'),
                timestamp: new Date().toISOString(),
                ...parsed
            } as PredictiveModelResult;
        }
        throw new Error("AI response did not match the expected predictive model schema.");
    } catch (e) {
        console.error("Error parsing predictive model response:", e, "Raw response:", responseText);
        throw new Error(`Failed to get a valid model from the AI. Raw response: ${responseText}`);
    }
};