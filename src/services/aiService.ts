import { Type } from "@google/genai";
import { Field, ChartType, AggregationType, Transformation, TransformationType, AiDataSuggestion, AIConfig, AiChatMessage, ProcessedData, AdvancedAnalysisResult, WidgetState, WhatIfResult, AiDashboardSuggestion, ProactiveInsight, FilterCondition, NlpFilterResult, InsightType, AiWidgetSuggestion } from '../utils/types';
import { formatValue } from "../utils/dataProcessing/formatting";
import { FORMULA_FUNCTION_DEFINITIONS } from "../utils/dataProcessing/formulaEngine";
import _ from 'lodash';

// --- Client-side Proxy Functions ---


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

async function* streamOllama(endpoint: string, body: any): AsyncGenerator<string> {
    const isLocalhost = endpoint.includes('//localhost:') || endpoint.includes('//127.0.0.1:');
    const fetchEndpoint = isLocalhost ? '/ollama-api' : endpoint;

    const response = await fetch(`${fetchEndpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, stream: true })
    });

    if (!response.ok || !response.body) {
        throw new Error(`Ollama API failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Ollama sends multiple JSON objects in one chunk sometimes, or partials
        // But typically it's NDJSON
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                if (json.message && json.message.content) {
                    yield json.message.content;
                }
                if (json.done) return;
            } catch (e) {
                // partial JSON, ignore or buffer (simple implementation ignores for now, 
                // but for robustness we might need buffering like proxyGenerateContentStream)
            }
        }
    }
}

// --- Generic Proxy for OpenAI/Anthropic ---
async function callExternalApi(url: string, method: string, headers: any, body: any): Promise<any> {
    const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url,
            method,
            headers,
            body
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `API request failed with status ${response.status}` }));
        throw new Error(error.error?.message || error.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
}

// --- Provider Implementations ---

interface AIRequestOptions {
    systemInstruction?: string;
    responseSchema?: any;
    temperature?: number;
    jsonMode?: boolean;
}

async function generateWithProvider(config: AIConfig, prompt: string | AiChatMessage[], options: AIRequestOptions = {}): Promise<string> {
    const provider = config.activeProvider;
    const providerConfig = config.providers[provider];
    const model = config.activeModelId;

    if (!providerConfig.enabled) {
        throw new Error(`Provider ${provider} is not enabled.`);
    }

    // --- Google Gemini ---
    if (provider === 'gemini') {
        const contents = Array.isArray(prompt)
            ? prompt.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))
            : [{ role: 'user', parts: [{ text: prompt }] }];

        const result = await proxyGenerateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: options.systemInstruction,
                responseMimeType: options.responseSchema ? "application/json" : "text/plain",
                responseSchema: options.responseSchema,
                temperature: options.temperature ?? 0.5
            }
        });
        return result.text;
    }

    // --- OpenAI ---
    if (provider === 'openai') {
        if (!providerConfig.apiKey) throw new Error("OpenAI API Key is missing.");

        const messages = [];
        if (options.systemInstruction) {
            messages.push({ role: 'system', content: options.systemInstruction });
        }
        if (Array.isArray(prompt)) {
            messages.push(...prompt.map(m => ({ role: m.role, content: m.content })));
        } else {
            messages.push({ role: 'user', content: prompt });
        }

        const body: any = {
            model: model,
            messages: messages,
            temperature: options.temperature ?? 0.5,
        };

        if (options.responseSchema || options.jsonMode) {
            body.response_format = { type: "json_object" };
        }

        const result = await callExternalApi(
            'https://api.openai.com/v1/chat/completions',
            'POST',
            { 'Authorization': `Bearer ${providerConfig.apiKey}` },
            body
        );

        return result.choices[0].message.content;
    }

    // --- Anthropic ---
    if (provider === 'anthropic') {
        if (!providerConfig.apiKey) throw new Error("Anthropic API Key is missing.");

        const messages = [];
        if (Array.isArray(prompt)) {
            messages.push(...prompt.map(m => ({ role: m.role, content: m.content })));
        } else {
            messages.push({ role: 'user', content: prompt });
        }

        const body: any = {
            model: model,
            messages: messages,
            max_tokens: 4096,
            temperature: options.temperature ?? 0.5,
        };

        if (options.systemInstruction) {
            body.system = options.systemInstruction;
        }

        const result = await callExternalApi(
            'https://api.anthropic.com/v1/messages',
            'POST',
            {
                'x-api-key': providerConfig.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body
        );

        return result.content[0].text;
    }

    // --- Ollama ---
    if (provider === 'ollama') {
        const endpoint = providerConfig.baseUrl || 'http://localhost:11434';
        const isLocalhost = endpoint.includes('//localhost:') || endpoint.includes('//127.0.0.1:');
        const fetchEndpoint = isLocalhost ? '/ollama-api' : endpoint;

        const messages = [];
        if (options.systemInstruction) {
            messages.push({ role: 'system', content: options.systemInstruction });
        }
        if (Array.isArray(prompt)) {
            messages.push(...prompt.map(m => ({ role: m.role, content: m.content })));
        } else {
            messages.push({ role: 'user', content: prompt });
        }

        const body: any = {
            model: model,
            messages: messages,
            stream: false,
            options: {
                temperature: options.temperature ?? 0.5
            }
        };

        if (options.responseSchema || options.jsonMode) {
            body.format = "json";
        }

        const response = await fetch(`${fetchEndpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Ollama API failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.message.content;
    }

    throw new Error(`Provider ${provider} not implemented.`);
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

const chartSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A concise, descriptive title for the chart." },
        chartType: { type: Type.STRING, enum: Object.values(ChartType), description: "The best chart type for the user's request." },
        shelves: {
            type: Type.OBJECT,
            properties: {
                columns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Dimension fields for the column shelf (e.g., X-axis, table columns)." },
                rows: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Dimension fields for the row shelf (e.g., grouping, color legend, table rows)." },
                category: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Dimension field for color encoding in charts like scatter plots." },
                values: { ...valueShelfSchemaForChat, description: "The measure fields to be visualized (e.g., bar height, line value)." },
                values2: { ...valueShelfSchemaForChat, description: "Measure fields for a secondary Y-axis in Dual Axis charts." },
            }
        }
    },
    required: ["title", "chartType", "shelves"]
};

const aiChatResponseSchema = {
    type: Type.OBJECT,
    properties: {
        responseText: { type: Type.STRING, description: "The conversational text response to the user's query." },
        chartSuggestion: { ...chartSuggestionSchema, nullable: true },
        followUpSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 2-3 short, relevant follow-up questions the user might ask next.",
            nullable: true
        }
    },
    required: ["responseText"]
};


const getSystemInstruction = (fields: Field[], dataSample?: object[]): string => {
    const fieldsString = fields.map(f => `- "${f.simpleName}" (${f.type})`).join('\n');
    const sampleString = dataSample && dataSample.length > 0
        ? `\n\nHere is a small sample of the data (first 5 rows) to provide context:\n${JSON.stringify(dataSample.slice(0, 5), null, 2)}`
        : '';

    return `You are 'Pivotal Pro', a helpful AI assistant integrated into a business intelligence dashboard. Your goal is to help users understand their data and create visualizations.

You have access to the following fields (use the simple names provided):
${fieldsString}${sampleString}

Your entire response MUST be a single, valid JSON object that conforms to the provided schema. Do not include any other text, greetings, or markdown formatting like \`\`\`json.

- If the user asks to create a chart, table, or visualization (e.g., "show me sales and profit by country and category"), populate the 'chartSuggestion' object. Choose the best chart type. Place dimensions like 'country' and 'category' into the 'rows' or 'columns' arrays. Place measures like 'sales' and 'profit' into the 'values' array. The 'responseText' should be a confirmation like "Certainly, here is the chart you requested."
- If the user asks a general question (e.g., "what are the key trends?"), provide a concise, insightful answer in Markdown format in the 'responseText' field and leave 'chartSuggestion' as null.
- After every response, whether it's a chart or text, provide 2-3 relevant follow-up questions in the 'followUpSuggestions' array to guide the user's analysis.`;
};

export const getChatResponse = async (
    config: AIConfig,
    chatHistory: AiChatMessage[],
    fields: Field[],
    dataSample: object[]
): Promise<Partial<AiChatMessage>> => {
    const systemInstruction = getSystemInstruction(fields, dataSample);

    try {
        const responseText = await generateWithProvider(config, chatHistory, {
            systemInstruction,
            responseSchema: aiChatResponseSchema,
            temperature: 0.3,
            jsonMode: true
        });

        const parsedResponse = JSON.parse(responseText);
        return {
            content: parsedResponse.responseText,
            chartSuggestion: parsedResponse.chartSuggestion,
            followUpSuggestions: parsedResponse.followUpSuggestions,
        };

    } catch (error) {
        console.error("Error communicating with AI:", error);
        return { content: `An error occurred while communicating with the AI: ${(error as Error).message}` };
    }
};



export async function* getChatResponseStream(
    config: AIConfig,
    chatHistory: AiChatMessage[],
    fields: Field[],
    dataSample: object[]
): AsyncGenerator<string> {
    // This is now a simplified text-only stream for better UX. Rich objects are handled by getChatResponse.
    const sampleString = dataSample && dataSample.length > 0
        ? `\n\nHere is a small sample of the data (first 5 rows) to provide context:\n${JSON.stringify(dataSample.slice(0, 5), null, 2)}`
        : '';

    const systemInstruction = `You are 'Pivotal Pro', an AI assistant. Provide a concise, helpful answer to the user's last question based on the chat history and available data fields. Respond in Markdown format.

    Available Fields:
    ${fields.map(f => `- "${f.simpleName}" (${f.type})`).join('\n')}${sampleString}
    `;

    if (config.activeProvider === 'gemini') {
        const stream = proxyGenerateContentStream({
            model: config.activeModelId,
            contents: chatHistory.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
            config: {
                systemInstruction,
                responseMimeType: "text/plain",
                temperature: 0.3
            }
        });

        for await (const chunk of stream) {
            yield chunk.text;
        }
    } else if (config.activeProvider === 'ollama') {
        const providerConfig = config.providers.ollama;
        const endpoint = providerConfig.baseUrl || 'http://localhost:11434';

        const messages = [];
        if (config.activeProvider === 'ollama') { // Re-check to satisfy TS if needed, but logic flow ensures it
            const systemInstruction = `You are 'Pivotal Pro', an AI assistant. Provide a concise, helpful answer to the user's last question based on the chat history and available data fields. Respond in Markdown format.
            Available Fields:
            ${fields.map(f => `- "${f.simpleName}" (${f.type})`).join('\n')}${sampleString}
            `;
            messages.push({ role: 'system', content: systemInstruction });
        }

        messages.push(...chatHistory.map(m => ({ role: m.role, content: m.content })));

        const stream = streamOllama(endpoint, {
            model: config.activeModelId,
            messages: messages,
            options: { temperature: 0.3 }
        });

        for await (const chunk of stream) {
            yield chunk;
        }

    } else {
        // Fallback to non-streaming for other providers for now
        const response = await generateWithProvider(config, chatHistory, {
            systemInstruction,
            temperature: 0.3
        });
        yield response;
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

    try {
        const responseText = await generateWithProvider(config, query, {
            systemInstruction,
            responseSchema: nlpFilterSchema,
            temperature: 0.1,
            jsonMode: true
        });

        const parsedResult = JSON.parse(responseText);
        if (parsedResult.type) {
            return parsedResult as NlpFilterResult;
        }
        throw new Error("AI response did not match the expected filter schema.");
    } catch (e) {
        console.error("Error parsing NLP filter response:", e);
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

    try {
        const responseText = await generateWithProvider(config, prompt, {
            systemInstruction,
            responseSchema: chartSuggestionSchema,
            temperature: 0.2,
            jsonMode: true
        });

        const suggestion = JSON.parse(responseText);
        if (suggestion.chartType && suggestion.shelves) {
            return suggestion as Partial<WidgetState>;
        }
        throw new Error("AI response did not match the expected chart configuration schema.");
    } catch (e) {
        console.error("Error parsing AI chart suggestion:", e);
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
    const functionsString = Object.values(FORMULA_FUNCTION_DEFINITIONS).map(def => `- ${def.syntax}: ${def.description}`).join('\n');

    const systemInstruction = `You are an expert in a data analysis formula language similar to DAX or Excel formulas. Your task is to convert a user's natural language request into a valid formula.
- You MUST ONLY return the formula string. Do not include any explanation, markdown, or any text other than the formula itself.
- Field names must be enclosed in square brackets, like [Sales] or [Order Date].
- Use the provided functions correctly.

Available Fields:
${fieldsString}

Available Functions:
${functionsString}
`;

    try {
        const responseText = await generateWithProvider(config, prompt, {
            systemInstruction,
            temperature: 0,
        });
        return responseText.trim();
    } catch (error) {
        console.error("Error getting AI formula suggestion:", error);
        throw new Error("Failed to generate formula. Please check your AI configuration or prompt.");
    }
};


// --- AI Forecasting ---

export const getAiForecast = async (
    config: AIConfig,
    historicalData: { label: string, value: number | null }[],
    periodsToForecast: number
): Promise<number[]> => {
    const systemInstruction = `You are a time series forecasting expert. Predict future values based on historical data. The user will provide JSON data points. You MUST respond ONLY with a valid JSON array of numbers, representing the forecasted values in order. Do not include any other text or markdown.`;
    const cleanHistoricalData = historicalData.filter(d => d.value !== null && !isNaN(d.value));

    if (cleanHistoricalData.length < 3) return [];

    const prompt = `Based on this data, predict the next ${periodsToForecast} values: ${JSON.stringify(cleanHistoricalData)}`;

    try {
        const responseText = await generateWithProvider(config, prompt, {
            systemInstruction,
            temperature: 0.5,
            jsonMode: true
        });

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
    processedData: Extract<ProcessedData, { type: 'chart' } | { type: 'kpi' } | { type: 'table' }>,
    tone: string = 'Executive'
): Promise<string> => {
    const systemInstruction = `You are an expert data analyst. Your task is to provide a concise, insightful, and easy-to-understand summary for a chart from a business intelligence dashboard. The user will provide the chart's title, type, and the data it represents.
- Adopt a "${tone}" tone.
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
        const rows = processedData.rows.slice(0, 10).map(row => processedData.columnOrder.map(key => row.values[key]).join(', ')).join('\n');
        dataSummary += `Headers: ${headers}\nRows:\n${rows}`;
    }

    const prompt = `Please provide an analysis for the following chart:\n${dataSummary}`;

    try {
        const responseText = await generateWithProvider(config, prompt, {
            systemInstruction,
            temperature: 0.4
        });
        return responseText.trim();
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

    try {
        const responseText = await generateWithProvider(config, prompt, {
            systemInstruction,
            responseSchema: dashboardAnalysisSchema,
            temperature: 0.5,
            jsonMode: true
        });
        return responseText.trim();
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
- Your entire response MUST be a valid JSON object conforming to the provided schema.
- **CRITICAL**: The JSON object MUST have exactly two top-level keys: "page" and "calculatedFields". Even if there are no calculated fields, you MUST return "calculatedFields": [].`;

    const fieldsString = fields.map(f => `- "${f.name}" (${f.type})`).join('\n');
    const sampleString = JSON.stringify(dataSample, null, 2);

    const prompt = `Here is the data schema and a sample. Please generate a dashboard configuration.\n\nSchema:\n${fieldsString}\n\nData Sample:\n${sampleString}`;

    try {
        const responseText = await generateWithProvider(config, prompt, {
            systemInstruction,
            responseSchema: dashboardSuggestionSchema,
            temperature: 0.4,
            jsonMode: true
        });

        const suggestion = JSON.parse(responseText);
        if (suggestion.page && suggestion.calculatedFields) {
            return suggestion as AiDashboardSuggestion;
        }
        throw new Error("AI response did not match the expected dashboard configuration schema.");
    } catch (e) {
        console.error("Error parsing AI dashboard suggestion:", e);
        throw new Error(`Failed to get a valid dashboard configuration from the AI.`);
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

    switch (analysisType) {
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

    try {
        const responseText = await generateWithProvider(config, userPrompt, {
            systemInstruction,
            responseSchema: advancedAnalysisSchema,
            temperature: 0.5,
            jsonMode: true
        });

        const parsedResult = JSON.parse(responseText);
        if (parsedResult.title && parsedResult.summary && Array.isArray(parsedResult.details)) {
            return parsedResult as AdvancedAnalysisResult;
        } else {
            throw new Error("Parsed JSON does not match the expected schema.");
        }
    } catch (error) {
        console.error("Error parsing advanced analysis response:", error);
        return {
            title: `AI Analysis: ${analysisType.replace('_', ' ')}`,
            summary: "The AI returned a text-based analysis instead of a structured one.",
            details: [{ heading: "Error", content: "Failed to parse AI response." }]
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
    const systemInstruction = `You are an expert in predictive analytics and what-if analysis. Your task is to simulate the impact of changing certain variables on a target metric based on the provided dataset.
    - Use the provided data to infer relationships between variables.
    - Estimate the new value of the target metric given the modifications.
    - Provide a confidence interval and a sensitivity analysis.
    - Your entire response MUST be a valid JSON object conforming to the provided schema. Do not include any other text or markdown.`;

    let dataSummary = `Widget Title: "${widget.title}"\nData:\n`;

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

    const prompt = `Perform a What-If analysis.
    Target Metric: "${scenarioConfig.targetMetric}"
    Scenario: Modify the following variables: ${JSON.stringify(scenarioConfig.modifiedVariables)}
    
    Dataset:
    ${dataSummary}`;

    try {
        const responseText = await generateWithProvider(config, prompt, {
            systemInstruction,
            responseSchema: whatIfAnalysisSchema,
            temperature: 0.5,
            jsonMode: true
        });

        const result = JSON.parse(responseText);
        return result as WhatIfResult;
    } catch (error) {
        console.error("Error performing What-If analysis:", error);
        throw new Error("Failed to perform What-If analysis.");
    }
};

export const getProactiveInsights = async (
    config: AIConfig,
    fields: { name: string, type: string }[],
    dataSample: any[]
): Promise<ProactiveInsight[]> => {
    // Implementation for proactive insights
    // For brevity, using a simplified prompt and schema here, similar to others
    const systemInstruction = `You are an expert data analyst. Analyze the provided dataset sample and schema to discover 3-5 significant and actionable insights.
    For each insight:
    1. **Title**: A short, catchy, human-readable headline (do not use file names or technical jargon).
    2. **Summary**: A clear explanation of the finding.
    3. **Type**: Classify as 'Anomaly', 'Trend', 'Correlation', 'Outlier', or 'Distribution'.
    4. **Confidence**: A score between 0 and 100.
    5. **Involved Fields**: List the field names used.
    6. **Suggested Chart Prompt**: A natural language command to visualize this insight (e.g., "Show Sales by Region as a Bar Chart", "Plot Revenue over Time"). This prompt MUST be understandable by a chart generation AI.
    
    Return a JSON array of these insights.`;

    const prompt = `
    Dataset Schema:
    ${fields.map(f => `- ${f.name} (${f.type})`).join('\n')}

    Data Sample (first 10 rows):
    ${JSON.stringify(dataSample.slice(0, 10))}
    
    Find the most interesting patterns, outliers, or trends in this data.`;

    const insightSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                type: { type: Type.STRING, enum: Object.values(InsightType) },
                confidence: { type: Type.NUMBER },
                involvedFields: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedChartPrompt: { type: Type.STRING, description: "A natural language command to generate a chart for this insight." }
            },
            required: ["title", "summary", "type", "confidence", "involvedFields", "suggestedChartPrompt"]
        }
    };

    try {
        const responseText = await generateWithProvider(config, prompt, {
            systemInstruction,
            responseSchema: insightSchema,
            temperature: 0.7,
            jsonMode: true
        });

        const cleanedResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedResponse);

        // Handle case where AI wraps array in an object key like "insights"
        if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
            const possibleArray = Object.values(parsed).find(val => Array.isArray(val));
            if (possibleArray) return possibleArray as ProactiveInsight[];
        }

        return Array.isArray(parsed) ? parsed as ProactiveInsight[] : [];
    } catch (e) {
        console.error("Error generating proactive insights", e);
        return [];
    }
};

const dataStudioSuggestionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            transformationType: { type: Type.STRING, enum: Object.values(TransformationType) },
            payload: { type: Type.OBJECT, description: "The payload required for the transformation type." }
        },
        required: ["title", "description", "transformationType", "payload"]
    }
};

export const getAiDataStudioSuggestions = async (
    config: AIConfig,
    fields: Field[],
    dataSample: any[],
    currentTransformations: Transformation[]
): Promise<AiDataSuggestion[]> => {
    const systemInstruction = `You are an expert data engineer. Analyze the dataset schema and sample to suggest 3 useful data transformations to clean or enhance the data.
    - Focus on common tasks like:
      - Extracting parts of dates (e.g., Year, Month).
      - Categorizing numeric values (e.g., High/Low Sales).
      - Cleaning text (trimming, standardizing).
      - Handling nulls.
    - Do not suggest transformations that have already been applied.
    - Return a JSON array of suggestions.
    - The 'payload' must match the structure required for the chosen TransformationType.
      - For 'Create Calculated Field': { fieldName: string, formula: string }
      - For 'Create Categorical Field': { newFieldName: string, sourceFieldName: string, rules: { operator: string, value: any, label: string }[], defaultLabel: string }
      - For 'Standardize Text': { fieldName: string, operation: 'uppercase'|'lowercase'|'trim' }
      - For 'Handle Null Values': { fieldName: string, strategy: 'value'|'drop'|'mean', value?: any }
      - For 'Convert to Date/Time': { fieldName: string }
    `;

    const prompt = `
    Fields: ${fields.map(f => `${f.simpleName} (${f.type})`).join(', ')}
    Sample Data: ${JSON.stringify(dataSample)}
    Current Transformations: ${JSON.stringify(currentTransformations)}
    `;

    try {
        const responseText = await generateWithProvider(config, prompt, {
            systemInstruction,
            responseSchema: dataStudioSuggestionSchema,
            temperature: 0.4,
            jsonMode: true
        });

        // Clean markdown code blocks from response
        const cleanedResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedResponse) as AiDataSuggestion[];
    } catch (e) {
        console.error("Error getting Data Studio suggestions:", e);
        throw new Error("Failed to get suggestions.");
    }
};

export const getAiConfig = async (): Promise<AIConfig> => {
    try {
        const response = await fetch('/api/ai/config', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch AI config');
        const data = await response.json();
        // Ensure default structure if empty
        if (!data || Object.keys(data).length === 0) {
            return {
                activeProvider: 'gemini',
                activeModelId: 'gemini-2.5-flash',
                providers: {
                    gemini: { enabled: true, models: [{ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', providerId: 'gemini' }] },
                    openai: { enabled: false, models: [] },
                    anthropic: { enabled: false, models: [] },
                    ollama: { enabled: false, models: [] }
                }
            };
        }
        return data;
    } catch (error) {
        console.error('Error fetching AI config:', error);
        // Fallback to default
        return {
            activeProvider: 'gemini',
            activeModelId: 'gemini-2.5-flash',
            providers: {
                gemini: { enabled: true, models: [{ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', providerId: 'gemini' }] },
                openai: { enabled: false, models: [] },
                anthropic: { enabled: false, models: [] },
                ollama: { enabled: false, models: [] }
            }
        };
    }
};

export const saveAiConfig = async (config: AIConfig): Promise<void> => {
    try {
        const response = await fetch('/api/ai/config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(config)
        });
        if (!response.ok) throw new Error('Failed to save AI config');
    } catch (error) {
        console.error('Error saving AI config:', error);
        throw error;
    }
};

const widgetSuggestionSchema = {
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
};

export const getWidgetFromPrompt = async (
    config: AIConfig,
    prompt: string,
    fields: { name: string, type: string }[]
): Promise<AiWidgetSuggestion | null> => {
    const systemInstruction = `You are an expert data visualization assistant. Your task is to generate a single chart configuration based on a user's natural language request.
    - Select the most appropriate chart type.
    - Map the user's intent to the available data fields.
    - Ensure field names match exactly with the provided schema.
    - Your entire response MUST be a valid JSON object conforming to the provided schema.`;

    const fieldsString = fields.map(f => `- "${f.name}" (${f.type})`).join('\n');
    const userPrompt = `Available Fields:\n${fieldsString}\n\nUser Request: "${prompt}"\n\nGenerate a chart configuration.`;

    try {
        const responseText = await generateWithProvider(config, userPrompt, {
            systemInstruction,
            responseSchema: widgetSuggestionSchema,
            temperature: 0.3,
            jsonMode: true
        });

        // Clean markdown code blocks from response
        const cleanedResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedResponse) as AiWidgetSuggestion;
    } catch (e) {
        console.error("Error generating widget from prompt:", e);
        return null;
    }
};
