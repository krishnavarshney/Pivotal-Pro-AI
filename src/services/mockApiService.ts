import { processWidgetData } from '../utils/dataProcessing/widgetProcessor';
import { WidgetState, ProcessedData, Pill, CrossFilterState, Parameter, ControlFilterState } from '../utils/types';

/**
 * Simulates fetching and processing widget data from a backend.
 * In a real client-server architecture, this function would be an API call,
 * and the `processWidgetData` logic would live on the server.
 */
export const fetchWidgetData = async (
    widget: WidgetState,
    blendedData: any[],
    globalFilters: Pill[],
    crossFilter: CrossFilterState,
    parameters: Parameter[],
    controlFilters?: ControlFilterState
): Promise<ProcessedData> => {
    // console.log(`API: Fetching data for widget "${widget.title}"...`);
    
    // In a real app, the logic below would be on the server.
    // For this project, we process data on the client but make it async to simulate a fetch.
    const data = processWidgetData(
        blendedData,
        widget,
        globalFilters,
        crossFilter,
        parameters,
        controlFilters
    );

    // console.log(`API: Data processed for widget "${widget.title}".`);
    return data;
};