import { SetStateAction } from 'react';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import { Workspace, DashboardPage, WidgetLayout, Pill } from '../../utils/types';
import { dashboardApiService } from '../../services/dashboardApiService';
import { notificationService } from '../../services/notificationService';

export const useDashboardPages = (
    workspaces: Workspace[],
    setWorkspaces: (updater: SetStateAction<Workspace[]>) => void,
    activeWorkspaceId: string | null,
    activePageId: string | null,
    setActivePageId: (id: string | null) => void,
    setView: (view: any, options?: any) => void,
    setNewlyAddedPillId: (id: string | null) => void
) => {

    const updatePage = (id: string, updater: Partial<DashboardPage> | ((page: DashboardPage) => DashboardPage)) => {
        setWorkspaces(wss => wss.map(ws => ({
            ...ws,
            pages: (ws.pages || []).map(p => {
                if (p.id === id) {
                    return typeof updater === 'function' ? updater(p) : { ...p, ...updater };
                }
                return p;
            })
        })));
    };

    const getPage = (id: string): DashboardPage | undefined => {
        for (const ws of workspaces) {
            const page = (ws.pages || []).find(p => p.id === id);
            if (page) return page;
        }
        return undefined;
    };

    const savePage = async (page: DashboardPage) => {
        try {
            const savedPage = await dashboardApiService.savePage(page);
            updatePage(savedPage.id, savedPage);
            notificationService.success(`Page '${savedPage.name}' saved successfully!`);
        } catch (error) {
            console.error("Failed to save page:", error);
            notificationService.error("Failed to save page.");
        }
    };

    const setGlobalFilters = (updater: SetStateAction<Pill[]>) => {
        if (activePageId) {
            const page = getPage(activePageId);
            if (page) {
                const newFilters = typeof updater === 'function' ? updater(page.globalFilters) : updater;
                const updatedPage = { ...page, globalFilters: newFilters };
                updatePage(activePageId, { globalFilters: newFilters }); // Optimistic update
                savePage(updatedPage);
            }
        }
    };

    const addGlobalFilter = (pill: Omit<Pill, 'id'>) => {
        const newPillWithId: Pill = { ...pill, id: _.uniqueId('globalfilter_') };
        setGlobalFilters(current => [...current, newPillWithId]);
        setNewlyAddedPillId(newPillWithId.id);
        setTimeout(() => setNewlyAddedPillId(null), 3000);
    };

    const setLayouts = (layouts: { [breakpoint: string]: WidgetLayout[] }) => {
        if (activePageId) {
            const page = getPage(activePageId);
            if (page) {
                const updatedPage = { ...page, layouts };
                updatePage(activePageId, { layouts }); // Optimistic update
                dashboardApiService.savePage(updatedPage).catch(err => {
                    console.error("Failed to save layouts:", err);
                    notificationService.error("Failed to save layout changes.");
                });
            }
        }
    };

    const renamePage = (id: string, newName: string) => {
        const page = getPage(id);
        if (page) {
            const updatedPage = { ...page, name: newName };
            updatePage(id, { name: newName }); // Optimistic update
            savePage(updatedPage);
        }
    };

    const addNewPage = async (templatePage: Partial<DashboardPage> = {}) => {
        const newPageId = uuidv4();
        const widgetIdMap = new Map<string, string>();

        const newWidgets = (templatePage.widgets || []).map(w => {
            const newId = _.uniqueId('widget_');
            widgetIdMap.set(w.id, newId);
            return { ...w, id: newId };
        });

        const newLayouts = templatePage.layouts ? _.mapValues(templatePage.layouts, layout => {
            return layout
                .map(item => { const newId = widgetIdMap.get(item.i); return newId ? { ...item, i: newId } : null; })
                .filter((item): item is WidgetLayout => item !== null);
        }) : {};

        const newPage: DashboardPage = {
            ...templatePage,
            id: newPageId,
            name: templatePage.name || `New Page ${workspaces.flatMap(ws => ws.pages || []).length + 1}`,
            workspaceId: activeWorkspaceId || workspaces[0]?.id,
            widgets: newWidgets,
            layouts: newLayouts,
            globalFilters: templatePage.globalFilters || [],
            comments: templatePage.comments || [],
            bookmarks: templatePage.bookmarks || [],
            collapsedRows: templatePage.collapsedRows || [],
        };

        try {
            const savedPage = await dashboardApiService.createPage(newPage);

            // Explicitly create widgets for the new page and map temp IDs to real IDs
            const tempToRealIdMap = new Map<string, string>();
            const createdWidgets = await Promise.all(newWidgets.map(async widget => {
                const savedWidget = await dashboardApiService.saveWidget({ ...widget, pageId: savedPage.id });
                tempToRealIdMap.set(widget.id, savedWidget.id);
                return savedWidget;
            }));

            // Update layouts with real widget IDs
            const updatedLayouts = _.mapValues(savedPage.layouts, (layout) => {
                return layout.map(item => {
                    const realId = tempToRealIdMap.get(item.i);
                    return realId ? { ...item, i: realId } : item;
                });
            });

            // Save the page with updated layouts
            const finalPage = await dashboardApiService.savePage({ ...savedPage, layouts: updatedLayouts });

            setWorkspaces(wss => wss.map(ws =>
                ws.id === activeWorkspaceId
                    ? { ...ws, pages: [...(ws.pages || []), { ...finalPage, widgets: createdWidgets }] }
                    : ws
            ));
            setActivePageId(finalPage.id);
            setView('dashboard');
            notificationService.success(`Page '${finalPage.name}' added successfully!`);
        } catch (error) {
            console.error("Failed to save new page:", error);
            notificationService.error("Failed to add new page.");
        }
    };

    const addPage = () => setView('templates');

    const removePage = async (id: string) => {
        try {
            await dashboardApiService.deletePage(id);
            setWorkspaces(wss => wss.map(ws => ({ ...ws, pages: (ws.pages || []).filter(p => p.id !== id) })));
            if (activePageId === id) {
                setActivePageId(null);
                setView('dashboard');
            }
            notificationService.success("Page deleted successfully.");
        } catch (error) {
            console.error("Failed to delete page:", error);
            notificationService.error("Failed to delete page.");
        }
    };

    const duplicatePage = (pageId: string) => {
        let pageToCopy: DashboardPage | undefined;
        let workspaceOfPage: Workspace | undefined;

        for (const ws of workspaces) {
            const foundPage = (ws.pages || []).find(p => p.id === pageId);
            if (foundPage) {
                pageToCopy = foundPage;
                workspaceOfPage = ws;
                break;
            }
        }

        if (pageToCopy && workspaceOfPage) {
            const newPage = _.cloneDeep(pageToCopy);
            newPage.id = _.uniqueId('page_');
            newPage.name = `${pageToCopy.name} (Copy)`;

            const widgetIdMap = new Map<string, string>();
            newPage.widgets = (newPage.widgets || []).map(w => {
                const newId = _.uniqueId('widget_');
                widgetIdMap.set(w.id, newId);
                return { ...w, id: newId };
            });

            newPage.layouts = newPage.layouts ? _.mapValues(newPage.layouts, layout => {
                return layout
                    .map(item => {
                        const newId = widgetIdMap.get(item.i);
                        return newId ? { ...item, i: newId } : null;
                    })
                    .filter((item): item is WidgetLayout => item !== null);
            }) : {};

            // Optimistic update for duplication
            setWorkspaces(wss => wss.map(ws => {
                if (ws.id === workspaceOfPage!.id) {
                    const pageIndex = (ws.pages || []).findIndex(p => p.id === pageId);
                    const newPages = [...(ws.pages || [])];
                    newPages.splice(pageIndex >= 0 ? pageIndex + 1 : newPages.length, 0, newPage);
                    return { ...ws, pages: newPages };
                }
                return ws;
            }));

            // Persist the duplicated page
            dashboardApiService.createPage(newPage).then(savedPage => {
                setWorkspaces(wss => wss.map(ws => ({
                    ...ws,
                    pages: (ws.pages || []).map(p => p.id === newPage.id ? { ...savedPage, widgets: savedPage.widgets || [] } : p)
                })));
                notificationService.success(`Page "${pageToCopy!.name}" duplicated.`);
            }).catch(err => {
                console.error("Failed to save duplicated page:", err);
                notificationService.error("Failed to save duplicated page.");
                // Revert optimistic update? For now, just error.
            });
        }
    };

    return {
        updatePage,
        setGlobalFilters,
        addGlobalFilter,
        setLayouts,
        addNewPage,
        savePage,
        addPage,
        removePage,
        duplicatePage,
        renamePage
    };
};
