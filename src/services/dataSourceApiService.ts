import { DataSource, Transformation } from '../utils/types';

const API_BASE_URL = '/api/data-sources';

export const dataSourceApiService = {
    getAll: async (workspaceId: string): Promise<DataSource[]> => {
        const response = await fetch(`${API_BASE_URL}?workspaceId=${workspaceId}`);
        if (!response.ok) throw new Error('Failed to fetch data sources');
        return response.json();
    },

    getOne: async (id: string): Promise<DataSource> => {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch data source');
        return response.json();
    },

    create: async (dataSource: Partial<DataSource> & { workspaceId: string }): Promise<DataSource> => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workspaceId: dataSource.workspaceId,
                name: dataSource.name,
                type: dataSource.type,
                connectionDetails: dataSource.connectionDetails,
                fieldsSchema: dataSource.fields, // Map 'fields' to 'fieldsSchema' for backend
                data: dataSource.data, // Send data for file uploads (MVP approach)
            }),
        });
        if (!response.ok) throw new Error('Failed to create data source');
        return response.json();
    },

    update: async (id: string, updates: Partial<DataSource> & { transformations?: Transformation[] }): Promise<DataSource> => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update data source');
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete data source');
    },
};
