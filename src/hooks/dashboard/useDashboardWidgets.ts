import { useState, useEffect } from 'react';
import _ from 'lodash';
import { WidgetState, WidgetLayout, DashboardPage } from '../../utils/types';
import { dashboardApiService } from '../../services/dashboardApiService';
import { notificationService } from '../../services/notificationService';
import { useModalManager } from '../../hooks/useModalManager';

type ModalManager = ReturnType<typeof useModalManager>;

export const useDashboardWidgets = (
    activePageId: string | null,
    widgets: WidgetState[],
    updatePage: (id: string, updater: Partial<DashboardPage> | ((page: DashboardPage) => DashboardPage)) => void,
    modalManager: ModalManager,
    dashboardMode: string
) => {
    const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>([]);

    useEffect(() => {
        setSelectedWidgetIds([]);
    }, [activePageId, dashboardMode]);

    const saveWidget = async (widget: WidgetState, layoutOverride?: Partial<Omit<WidgetLayout, 'i'>>) => {
        if (!activePageId) return;

        const widgetToSave: WidgetState = {
            ...widget,
            pageId: activePageId,
            configuration: widget.configuration || {},
            layouts: widget.layouts || {},
        };

        try {
            const savedWidget = await dashboardApiService.saveWidget(widgetToSave);
            console.log('useDashboardWidgets: savedWidget from API:', savedWidget);
            updatePage(activePageId, (currentPage) => {
                const existingWidgetIndex = currentPage.widgets.findIndex(w => w.id === savedWidget.id);
                let newWidgets: WidgetState[];
                let newLayouts = { ...currentPage.layouts };

                if (existingWidgetIndex > -1) {
                    newWidgets = currentPage.widgets.map((w, i) => i === existingWidgetIndex ? savedWidget : w);
                } else {
                    newWidgets = [...currentPage.widgets, savedWidget];
                    const defaultLayout = { i: savedWidget.id, x: 0, y: Infinity, w: 12, h: 8, minW: 4, minH: 4 };
                    const newLayoutItem = { ...defaultLayout, ...layoutOverride };

                    if (Object.keys(newLayouts).length === 0) {
                        ['lg', 'md', 'sm', 'xs', 'xxs'].forEach(bp => { newLayouts[bp] = [newLayoutItem]; });
                    } else {
                        Object.keys(newLayouts).forEach(key => { if (newLayouts[key]) { newLayouts[key].push(newLayoutItem); } });
                    }
                }
                return { ...currentPage, widgets: newWidgets, layouts: newLayouts };
            });
            notificationService.success(`Widget '${savedWidget.title}' saved successfully!`);
        } catch (error) {
            console.error("Failed to save widget:", error);
            notificationService.error("Failed to save widget.");
        }
    };

    const removeWidget = async (id: string) => {
        if (!activePageId) return;
        console.log('removeWidget called with id:', id);
        try {
            console.log('Calling deleteWidget API with id:', id);
            await dashboardApiService.deleteWidget(id);
            console.log('Widget deleted from backend successfully');
            updatePage(activePageId, (p) => ({
                ...p,
                widgets: p.widgets.filter(w => w.id !== id),
                layouts: _.mapValues(p.layouts, l => l.filter(item => item.i !== id)),
            }));
            notificationService.success('Widget deleted successfully.');
        } catch (error) {
            console.error('Failed to delete widget:', error);
            notificationService.error('Failed to delete widget.');
        }
    };

    const duplicateWidget = async (id: string) => {
        if (!activePageId) return;
        const widgetToCopy = widgets.find(w => w.id === id);
        if (widgetToCopy) {
            const newWidget = { ..._.cloneDeep(widgetToCopy), id: _.uniqueId('widget_'), title: `${widgetToCopy.title} (Copy)` };

            // Optimistic update
            updatePage(activePageId, (currentPage) => {
                const newWidgets = [...currentPage.widgets, newWidget];
                const layoutToCopy = _.mapValues(currentPage.layouts, l => l.find(item => item.i === id));
                const newLayouts = _.cloneDeep(currentPage.layouts);
                Object.keys(newLayouts).forEach(key => { if (layoutToCopy[key]) { newLayouts[key].push({ ...layoutToCopy[key]!, i: newWidget.id, y: Infinity }); } });
                return { ...currentPage, widgets: newWidgets, layouts: newLayouts };
            });

            try {
                const savedWidget = await dashboardApiService.saveWidget(newWidget);
                // Update with real ID if backend returns different one (though we use client-generated IDs mostly)
                if (savedWidget.id !== newWidget.id) {
                    updatePage(activePageId, (currentPage) => ({
                        ...currentPage,
                        widgets: currentPage.widgets.map(w => w.id === newWidget.id ? savedWidget : w),
                        layouts: _.mapValues(currentPage.layouts, l => l.map(item => item.i === newWidget.id ? { ...item, i: savedWidget.id } : item))
                    }));
                }
                notificationService.success(`Widget duplicated successfully.`);
            } catch (error) {
                console.error("Failed to persist duplicated widget:", error);
                notificationService.error("Failed to save duplicated widget.");
            }
        }
    };

    const toggleWidgetSelection = (widgetId: string) => {
        setSelectedWidgetIds(prev =>
            prev.includes(widgetId)
                ? prev.filter(id => id !== widgetId)
                : [...prev, widgetId]
        );
    };

    const deselectAllWidgets = () => {
        setSelectedWidgetIds([]);
    };

    const deleteSelectedWidgets = () => {
        if (!activePageId || selectedWidgetIds.length === 0) return;
        modalManager.openConfirmationModal({
            title: `Delete ${selectedWidgetIds.length} Widgets?`,
            message: 'Are you sure you want to permanently delete the selected widgets? This action cannot be undone.',
            onConfirm: () => {
                updatePage(activePageId, (p) => ({
                    ...p,
                    widgets: p.widgets.filter(w => !selectedWidgetIds.includes(w.id)),
                    layouts: _.mapValues(p.layouts, l => l.filter(item => !selectedWidgetIds.includes(item.i))),
                }));
                const count = selectedWidgetIds.length;
                setSelectedWidgetIds([]);
                notificationService.success(`${count} widget${count > 1 ? 's' : ''} deleted.`);
            }
        });
    };

    const duplicateSelectedWidgets = async () => {
        if (!activePageId || selectedWidgetIds.length === 0) return;
        const widgetsToCopy = widgets.filter(w => selectedWidgetIds.includes(w.id));
        if (widgetsToCopy.length > 0) {
            const newWidgets: WidgetState[] = [];

            updatePage(activePageId, (currentPage) => {
                const newLayoutItemsByBreakpoint: { [breakpoint: string]: WidgetLayout[] } = _.mapValues(currentPage.layouts, () => []);

                widgetsToCopy.forEach(widgetToCopy => {
                    const newWidget = { ..._.cloneDeep(widgetToCopy), id: _.uniqueId('widget_'), title: `${widgetToCopy.title} (Copy)` };
                    newWidgets.push(newWidget);

                    const layoutToCopy = _.mapValues(currentPage.layouts, l => l.find(item => item.i === widgetToCopy.id));
                    Object.keys(newLayoutItemsByBreakpoint).forEach(key => {
                        if (layoutToCopy[key]) {
                            newLayoutItemsByBreakpoint[key].push({ ...layoutToCopy[key]!, i: newWidget.id, y: Infinity });
                        }
                    });
                });

                const updatedLayouts = _.mapValues(currentPage.layouts, (layout, bp) => [
                    ...layout,
                    ...(newLayoutItemsByBreakpoint[bp] || []),
                ]);

                return {
                    ...currentPage,
                    widgets: [...currentPage.widgets, ...newWidgets],
                    layouts: updatedLayouts,
                };
            });

            try {
                await Promise.all(newWidgets.map(w => dashboardApiService.saveWidget(w)));
                notificationService.success(`${widgetsToCopy.length} widget${widgetsToCopy.length > 1 ? 's' : ''} duplicated.`);
                setSelectedWidgetIds([]);
            } catch (error) {
                console.error("Failed to persist duplicated widgets:", error);
                notificationService.error("Failed to save duplicated widgets.");
            }
        }
    };

    return {
        selectedWidgetIds,
        setSelectedWidgetIds,
        saveWidget,
        removeWidget,
        duplicateWidget,
        toggleWidgetSelection,
        deselectAllWidgets,
        deleteSelectedWidgets,
        duplicateSelectedWidgets
    };
};
