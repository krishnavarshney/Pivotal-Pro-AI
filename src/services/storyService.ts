import { Story } from '../utils/types';

const API_URL = '/api';

const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
    };
};

export const storyService = {
    getAll: async (workspaceId: string): Promise<Story[]> => {
        const response = await fetch(`${API_URL}/workspaces/${workspaceId}/stories`, {
            headers: getHeaders(),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch stories');
        return response.json();
    },

    create: async (workspaceId: string, story: Partial<Story>): Promise<Story> => {
        const response = await fetch(`${API_URL}/workspaces/${workspaceId}/stories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(story),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to create story');
        return response.json();
    },

    update: async (id: string, story: Partial<Story>): Promise<Story> => {
        const response = await fetch(`${API_URL}/stories/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(story),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to update story');
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/stories/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to delete story');
    }
};
