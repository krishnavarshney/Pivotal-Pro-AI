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
    let urlToFetch = baseUrl;
    if (limit) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        urlToFetch = `${baseUrl}${separator}_limit=${limit}`;
    }

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
        const errorText = await proxyResponse.text();
        let errorMessage = `Request failed with status ${proxyResponse.status}`;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) errorMessage = errorJson.error;
        } catch (e) {
            // If parsing fails, use the raw text or a default message
            if (errorText.length < 200) errorMessage += `: ${errorText}`;
        }
        throw new Error(errorMessage);
    }

    const responseText = await proxyResponse.text();
    try {
        return JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse response as JSON:", responseText.substring(0, 200));
        throw new Error(`Received non-JSON response from API: ${responseText.substring(0, 100)}...`);
    }
};
