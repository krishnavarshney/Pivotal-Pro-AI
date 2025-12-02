import { Workspace, DashboardPage, WidgetState } from '../utils/types';
// import * as authService from './authService'; // No longer needed as token is in HTTP-only cookie

const API_BASE_URL = '/api';

const transformWidgetFromBackend = (backendWidget: any): WidgetState => {
  const { configuration, ...rest } = backendWidget;
  if (!configuration) {
    console.error('transformWidgetFromBackend: MISSING CONFIGURATION for widget:', backendWidget);
  }
  // console.log('transformWidgetFromBackend: configuration type:', typeof configuration);
  // console.log('transformWidgetFromBackend: configuration:', configuration);
  return {
    ...rest,
    ...(configuration || {}),
    id: rest.id,
    pageId: rest.pageId,
    layouts: rest.layouts || {},
  };
};

export const dashboardApiService = {
  // Placeholder for saving/updating a workspace
  saveWorkspace: async (workspace: Workspace): Promise<Workspace> => {
    console.log('Saving workspace to backend:', workspace);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers,
      body: JSON.stringify(workspace),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Placeholder for saving/updating a page
  savePage: async (page: DashboardPage): Promise<DashboardPage> => {
    console.log('dashboardApiService.savePage called with:', page);

    // Only send fields that should be updated (exclude widgets array)
    const pagePayload = {
      id: page.id,
      workspaceId: page.workspaceId,
      name: page.name,
      layouts: typeof page.layouts === 'string' ? page.layouts : JSON.stringify(page.layouts),
      configuration: page.configuration ? (typeof page.configuration === 'string' ? page.configuration : JSON.stringify(page.configuration)) : undefined,
      globalFilters: page.globalFilters ? JSON.stringify(page.globalFilters) : undefined,
    };

    console.log('Sending page payload:', JSON.stringify(pagePayload));
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Use PATCH to update existing page
    const response = await fetch(`${API_BASE_URL}/pages/${page.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(pagePayload),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const savedPage = await response.json();
    return {
      ...savedPage,
      widgets: savedPage.widgets ? (savedPage.widgets || []).map(transformWidgetFromBackend) : page.widgets
    };
  },

  createPage: async (page: DashboardPage): Promise<DashboardPage> => {
    console.log('dashboardApiService.createPage called with:', page);

    const pagePayload = {
      id: page.id,
      name: page.name,
      workspaceId: page.workspaceId,
      layouts: JSON.stringify(page.layouts),
      configuration: page.configuration ? JSON.stringify(page.configuration) : undefined,
      widgetsData: page.widgetsData ? JSON.stringify(page.widgetsData) : undefined,
      globalFilters: page.globalFilters ? JSON.stringify(page.globalFilters) : undefined,
    };

    console.log('Sending create page payload:', JSON.stringify(pagePayload));

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${API_BASE_URL}/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pagePayload),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const savedPage = await response.json();
    return {
      ...savedPage,
      widgets: (savedPage.widgets || []).map(transformWidgetFromBackend)
    };
  },

  deletePage: async (pageId: string): Promise<void> => {
    console.log('Deleting page from backend:', pageId);
    const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  // Placeholder for saving/updating a widget
  saveWidget: async (widget: WidgetState): Promise<WidgetState> => {
    console.log('Saving widget to backend:', widget);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const { id, pageId, layouts, ...widgetConfig } = widget;
    const payload = {
      title: widget.title,
      configuration: widgetConfig,
      layouts: widget.layouts || {},
      pageId: widget.pageId,
      widgetsData: widget.widgetsData,
    };

    let url = `${API_BASE_URL}/widgets`;
    let method = 'POST';

    if (id && id !== 'new' && !id.startsWith('widget_')) {
      url = `${API_BASE_URL}/widgets/${id}`;
      method = 'PATCH';
    }

    console.log(`Sending widget payload to ${url} (${method}):`, payload);

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const savedWidget = await response.json();
    return transformWidgetFromBackend(savedWidget);
  },

  // Delete a widget
  deleteWidget: async (widgetId: string): Promise<void> => {
    console.log('Deleting widget from backend:', widgetId);
    const response = await fetch(`${API_BASE_URL}/widgets/${widgetId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  getWorkspaces: async (): Promise<Workspace[]> => {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const workspaces = await response.json();
    return workspaces.map((ws: Workspace) => ({
      ...ws,
      pages: (ws.pages || []).map((p: DashboardPage) => ({
        ...p,
        widgets: (p.widgets || []).map(transformWidgetFromBackend)
      }))
    }));
  },

  getPages: async (): Promise<DashboardPage[]> => {
    const response = await fetch(`${API_BASE_URL}/pages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const pages = await response.json();
    return pages.map((p: DashboardPage) => ({
      ...p,
      widgets: (p.widgets || []).map(transformWidgetFromBackend)
    }));
  },

  getWidgets: async (): Promise<WidgetState[]> => {
    const response = await fetch(`${API_BASE_URL}/widgets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const widgets = await response.json();
    return widgets.map(transformWidgetFromBackend);
  },
};