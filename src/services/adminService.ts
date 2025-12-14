const API_BASE_URL = '/api/admin';

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        throw new Error(await response.text());
    }
    return response.json();
};

export const getOverview = async () => {
    return fetchWithAuth(`${API_BASE_URL}/overview`);
};

export const getUsageStats = async (period: 'day' | 'week' | 'month' = 'month') => {
    return fetchWithAuth(`${API_BASE_URL}/usage?period=${period}`);
};

export const getProviders = async () => {
    return fetchWithAuth(`${API_BASE_URL}/providers`);
};

export const toggleProvider = async (id: number, enabled: boolean) => {
    return fetchWithAuth(`${API_BASE_URL}/providers/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
    });
};

export const setProviderPriority = async (id: number, priority: number) => {
    return fetchWithAuth(`${API_BASE_URL}/providers/${id}/priority`, {
        method: 'POST',
        body: JSON.stringify({ priority }),
    });
};

export const createProvider = async (data: any) => {
    return fetchWithAuth(`${API_BASE_URL}/providers`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const deleteProvider = async (id: number) => {
    return fetchWithAuth(`${API_BASE_URL}/providers/${id}/delete`, {
        method: 'POST',
    });
};

export const fetchProviderModels = async (type: string, config: any) => {
    // Note: This calls the AI controller, not Admin controller, so the URL is different
    // We can use the same fetchWithAuth if we want, or just fetch
    return fetchWithAuth(`/api/ai/models`, {
        method: 'POST',
        body: JSON.stringify({ type, config }),
    });
};

export const getUsers = async (skip = 0, take = 20, search = '') => {
    return fetchWithAuth(`${API_BASE_URL}/users?skip=${skip}&take=${take}&search=${search}`);
};

export const suspendUser = async (id: string) => {
    return fetchWithAuth(`${API_BASE_URL}/users/${id}/suspend`, {
        method: 'POST',
    });
};

export const getAuditLogs = async (skip = 0, take = 50) => {
    return fetchWithAuth(`${API_BASE_URL}/audit?skip=${skip}&take=${take}`);
};

export const getSettings = async () => {
    return fetchWithAuth(`${API_BASE_URL}/settings`);
};

export const updateSetting = async (key: string, value: any) => {
    return fetchWithAuth(`${API_BASE_URL}/settings`, {
        method: 'POST',
        body: JSON.stringify({ key, value }),
    });
};
