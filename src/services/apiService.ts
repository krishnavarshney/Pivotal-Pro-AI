import { ConnectionDetails } from '../utils/types';

export const fetchDataFromApi = async (connectionDetails: ConnectionDetails, limit?: number): Promise<any[]> => {
    const { type, baseUrl, authMethod, apiKey, apiHeader } = connectionDetails;
    
    if (!baseUrl) {
        throw new Error("Base URL is required for API connection.");
    }
    
    const headers: { [key: string]: string } = {};

    if (authMethod === 'api_key' && apiKey && apiHeader) {
        headers[apiHeader] = apiKey;
    } else if (authMethod === 'bearer' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Append limit if provided for testing
    const urlToFetch = limit ? `${baseUrl}?_limit=${limit}` : baseUrl;

    const proxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: urlToFetch,
            headers: headers
        })
    });

    if (!proxyResponse.ok) {
        const errorBody = await proxyResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorBody.error || `Request failed with status ${proxyResponse.status}`);
    }

    return proxyResponse.json();
};
