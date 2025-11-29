import { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Workspace, DashboardPage, UndoableState } from '../../utils/types';
import { dashboardApiService } from '../../services/dashboardApiService';
import { notificationService } from '../../services/notificationService';

const createDefaultPage = async (workspaceId: string): Promise<DashboardPage> => {
    const id = uuidv4();
    console.log(`Creating default page with ID: ${id}`);
    const newPage: DashboardPage = {
        id,
        name: 'New Page 1',
        widgets: [],
        layouts: {},
        globalFilters: [],
        comments: [],
        bookmarks: [],
        collapsedRows: [],
        workspaceId,
    };
    try {
        const savedPage = await dashboardApiService.createPage(newPage);
        return savedPage;
    } catch (error) {
        console.error('Failed to save default page to backend:', error);
        throw error;
    }
};

const createDefaultWorkspace = async (): Promise<Workspace> => {
    const newWorkspace: Workspace = {
        id: uuidv4(),
        name: 'Default Workspace',
        pages: [],
    };
    try {
        const savedWorkspace = await dashboardApiService.saveWorkspace(newWorkspace);
        const defaultPage = await createDefaultPage(savedWorkspace.id);
        return { ...savedWorkspace, pages: [defaultPage] };
    } catch (error) {
        console.error('Failed to save default workspace to backend:', error);
        const defaultPage = await createDefaultPage(newWorkspace.id);
        return { ...newWorkspace, pages: [defaultPage] };
    }
};

export const useDashboardWorkspaces = (
    isAuthenticated: boolean,
    isAuthLoading: boolean,
    setDashboardUndoableState: Dispatch<SetStateAction<UndoableState>>,
    workspaces: Workspace[],
    initialDashboardState: any
) => {
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [isWorkspacesLoading, setIsWorkspacesLoading] = useState(true);

    useEffect(() => {
        const initializeWorkspace = async () => {
            if (isAuthenticated && !isAuthLoading) {
                setIsWorkspacesLoading(true);
                try {
                    const fetchedWorkspaces = await dashboardApiService.getWorkspaces();
                    if (fetchedWorkspaces && fetchedWorkspaces.length > 0) {
                        console.log('Loaded workspaces from backend:', fetchedWorkspaces);

                        const transformedWorkspaces = fetchedWorkspaces.map(workspace => ({
                            ...workspace,
                            pages: (workspace.pages || []).map((page: any) => {
                                const parsedLayouts = typeof page.layouts === 'string' ? JSON.parse(page.layouts) : (page.layouts || {});
                                const widgets = (page.widgets || []).map((widget: any) => ({
                                    ...widget,
                                    // Ensure id, pageId, title are preserved (though they should be in widget already)
                                    id: widget.id,
                                    pageId: widget.pageId,
                                    title: widget.title,
                                }));

                                const ensuredLayouts: any = {};
                                const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];

                                breakpoints.forEach(bp => {
                                    const existingLayouts = parsedLayouts[bp] || [];
                                    const layoutMap = new Map(existingLayouts.map((l: any) => [l.i, l]));

                                    widgets.forEach((widget: any, index: any) => {
                                        if (!layoutMap.has(widget.id)) {
                                            let defaultHeight = 8;
                                            if (widget.chartType === 'Table') {
                                                defaultHeight = 12;
                                            } else if (widget.chartType === 'KPI') {
                                                defaultHeight = 4;
                                            }

                                            layoutMap.set(widget.id, {
                                                i: widget.id,
                                                x: 0,
                                                y: index * defaultHeight,
                                                w: 12,
                                                h: defaultHeight,
                                                minW: 2,
                                                minH: 2
                                            });
                                        }
                                    });

                                    ensuredLayouts[bp] = Array.from(layoutMap.values());
                                });

                                return {
                                    ...page,
                                    layouts: ensuredLayouts,
                                    widgets
                                };
                            })
                        }));

                        setDashboardUndoableState(prev => ({
                            ...prev,
                            workspaces: transformedWorkspaces,
                        }));
                    } else {
                        console.log('Initializing workspace: no existing workspaces found.');
                        const defaultWorkspace = await createDefaultWorkspace();
                        setDashboardUndoableState(prevState => ({
                            ...prevState,
                            workspaces: [defaultWorkspace],
                        }));
                    }
                } catch (error) {
                    console.error("Failed to initialize workspace from backend:", error);
                    notificationService.error("Failed to load dashboard data.");

                    if (!initialDashboardState?.workspaces?.length) {
                        try {
                            const defaultWorkspace = await createDefaultWorkspace();
                            setDashboardUndoableState(prevState => ({
                                ...prevState,
                                workspaces: [defaultWorkspace],
                            }));
                        } catch (createError) {
                            console.error("Failed to create fallback workspace:", createError);
                        }
                    }
                } finally {
                    setIsWorkspacesLoading(false);
                }
            }
        };
        initializeWorkspace();
    }, [isAuthenticated, isAuthLoading, setDashboardUndoableState, initialDashboardState]);

    useEffect(() => {
        if (workspaces && workspaces.length > 0) {
            if (!activeWorkspaceId || !workspaces.some(ws => ws.id === activeWorkspaceId)) {
                setActiveWorkspaceId(workspaces[0].id);
            }
        }
    }, [workspaces, activeWorkspaceId]);

    useEffect(() => {
        const allPages = workspaces.flatMap(ws => ws.pages || []);
        const activePageExists = allPages.some(p => p.id === activePageId);
        if (activePageId && !activePageExists) {
            setActivePageId(allPages[0]?.id || null);
        }
    }, [workspaces, activePageId]);

    const setWorkspaces = (updater: SetStateAction<Workspace[]>) => {
        setDashboardUndoableState(prev => ({
            ...prev,
            workspaces: typeof updater === 'function' ? updater(prev.workspaces) : updater,
        }));
    };

    return {
        activeWorkspaceId,
        setActiveWorkspaceId,
        activePageId,
        setActivePageId,
        setWorkspaces,
        isWorkspacesLoading,
    };
};
