

import React, { useState } from 'react';
import { Pill, ValueFormat, Field, TransformationType, Template, DashboardPage, AdvancedAnalysisResult, DashboardComment, WidgetState, FieldType, AggregationType, Connector } from '../utils/types';
import _ from 'lodash';

export const useModalManager = () => {
    // --- Modal States ---
    const [isWidgetEditorModalOpen, setWidgetEditorModalOpen] = useState(false);
    const [editingWidgetState, setEditingWidgetState] = useState<WidgetState | null>(null);
    const [widgetEditorAIPrompt, setWidgetEditorAIPrompt] = useState<string | null>(null);
    const [filterConfigModalState, setFilterConfigModalState] = useState<{ isOpen: boolean; pill: Pill | null; onSave: ((p: Pill) => void) | null, onBack?: () => void }>({ isOpen: false, pill: null, onSave: null });
    const [isPageFiltersModalOpen, setPageFiltersModalOpen] = useState(false);
    // FIX: Changed `selectFieldModalOpen` to `selectFieldModalState` to match the required type in `DashboardContextProps`.
    const [selectFieldModalState, setSelectFieldModalState] = useState<{ isOpen: boolean; onSave?: (pill: Pill) => void }>({ isOpen: false });
    const [isInsightHubOpen, setInsightHubOpen] = useState(false);
    const [isChatModalOpen, setChatModalOpen] = useState(false);
    const [addFieldModalState, setAddFieldModalState] = useState<{ isOpen: boolean; sourceId: string | null; initialStep?: 'formula' | 'grouping' }>({ isOpen: false, sourceId: null });
    const [valueFormatModalState, setValueFormatModalState] = useState<{ isOpen: boolean; pill: Pill | null; onSave: ((f: ValueFormat) => void) | null }>({ isOpen: false, pill: null, onSave: null });
    const [confirmationModalState, setConfirmationModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
    const [inputModalState, setInputModalState] = useState<{ isOpen: boolean; title: string; message?: string; inputLabel: string; initialValue?: string; onConfirm: (value: string) => void; inputType?: string; actionLabel?: string } | null>(null);
    const [isParameterModalOpen, setParameterModalOpen] = useState(false);
    const [isAddControlModalOpen, setAddControlModalOpen] = useState(false);
    const [templatePreviewModalState, setTemplatePreviewModalState] = useState<{ isOpen: boolean; template: Template | null }>({ isOpen: false, template: null });
    const [fieldMappingModalState, setFieldMappingModalState] = useState<{ isOpen: boolean; template: Template | null; onBack?: () => void }>({ isOpen: false, template: null });
    const [createTemplateModalState, setCreateTemplateModalState] = useState<{ isOpen: boolean; page: DashboardPage | null }>({ isOpen: false, page: null });
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [addToStoryModalState, setAddToStoryModalState] = useState<{ isOpen: boolean; widgetId: string | null }>({ isOpen: false, widgetId: null });
    const [splitColumnModalState, setSplitColumnModalState] = useState<{ isOpen: boolean; field: Field | null; onConfirm: (payload: any) => void }>({ isOpen: false, field: null, onConfirm: () => {} });
    const [mergeColumnsModalState, setMergeColumnsModalState] = useState<{ isOpen: boolean; onConfirm: (payload: any) => void; availableFields: Field[] }>({ isOpen: false, onConfirm: () => {}, availableFields: [] });
    const [advancedAnalysisModalState, setAdvancedAnalysisModalState] = useState<{ isOpen: boolean; result: AdvancedAnalysisResult | null; title: string }>({ isOpen: false, result: null, title: '' });
    const [activeCommentThread, setActiveCommentThread] = useState<DashboardComment | null>(null);
    const [whatIfConfigModalState, setWhatIfConfigModalState] = useState<{isOpen: boolean, widgetId: string | null}>({isOpen: false, widgetId: null});
    const [isGenerateStoryModalOpen, setGenerateStoryModalOpen] = useState(false);
    const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);
    const [dataLineageModalState, setDataLineageModalState] = useState<{ isOpen: boolean; widgetId: string | null; }>({ isOpen: false, widgetId: null });
    const [isPerformanceAnalyzerOpen, setPerformanceAnalyzerOpen] = useState(false);
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const [isAiInsightStarterModalOpen, setAiInsightStarterModalOpen] = useState(false);
    const [isAddDataSourceModalOpen, setAddDataSourceModalOpen] = useState(false);
    const [dataSourceConnectionModalState, setDataSourceConnectionModalState] = useState<{ isOpen: boolean; connector: Connector | null }>({ isOpen: false, connector: null });
    const [nlpDisambiguationModalState, setNlpDisambiguationModalState] = useState<{ isOpen: boolean; term: string; fields: string[] }>({ isOpen: false, term: '', fields: [] });


    const toggleFieldInEditorShelves = (field: Field) => {
        setEditingWidgetState(currentWidget => {
            if (!currentWidget) return null;
    
            const newWidget = _.cloneDeep(currentWidget);
            const allPills = _.flatMap(Object.values(newWidget.shelves), shelf => Array.isArray(shelf) ? shelf : []);
            const isPresent = allPills.some(p => p.name === field.name);
    
            if (isPresent) {
                // Remove the field from all shelves
                for (const shelfId in newWidget.shelves) {
                    const shelf = newWidget.shelves[shelfId as keyof typeof newWidget.shelves];
                    if (Array.isArray(shelf)) {
                        _.remove(shelf, p => p.name === field.name);
                    }
                }
            } else {
                // Add the field intelligently
                const newPill: Pill = {
                    id: _.uniqueId('pill_'),
                    name: field.name,
                    simpleName: field.simpleName,
                    type: field.type,
                    aggregation: field.type === FieldType.MEASURE ? AggregationType.SUM : AggregationType.COUNT,
                    isCalculated: field.isCalculated,
                    formula: field.formula,
                };
    
                if (field.type === FieldType.MEASURE) {
                    newWidget.shelves.values = [...(newWidget.shelves.values || []), newPill];
                } else if (field.type === FieldType.DATETIME) {
                    if (!newWidget.shelves.columns || newWidget.shelves.columns.length === 0) {
                        newWidget.shelves.columns = [...(newWidget.shelves.columns || []), newPill];
                    } else {
                        newWidget.shelves.rows = [...(newWidget.shelves.rows || []), newPill];
                    }
                } else { // Dimension
                     if (!newWidget.shelves.rows || newWidget.shelves.rows.length === 0) {
                        newWidget.shelves.rows = [...(newWidget.shelves.rows || []), newPill];
                    } else if (!newWidget.shelves.columns || newWidget.shelves.columns.length === 0) {
                        newWidget.shelves.columns = [...(newWidget.shelves.columns || []), newPill];
                    } else {
                         newWidget.shelves.rows = [...(newWidget.shelves.rows || []), newPill];
                    }
                }
            }
    
            return newWidget;
        });
    };

    return {
        isWidgetEditorModalOpen,
        editingWidgetState,
        widgetEditorAIPrompt,
        filterConfigModalState,
        isPageFiltersModalOpen,
        selectFieldModalState,
        isInsightHubOpen,
        isChatModalOpen,
        addFieldModalState,
        valueFormatModalState,
        confirmationModalState,
        inputModalState,
        isParameterModalOpen,
        isAddControlModalOpen,
        isTemplateModalOpen,
        templatePreviewModalState,
        fieldMappingModalState,
        createTemplateModalState,
        isCommandPaletteOpen,
        addToStoryModalState,
        splitColumnModalState,
        mergeColumnsModalState,
        advancedAnalysisModalState,
        activeCommentThread,
        whatIfConfigModalState,
        isGenerateStoryModalOpen,
        focusedWidgetId,
        dataLineageModalState,
        isPerformanceAnalyzerOpen,
        isAiInsightStarterModalOpen,
        isAddDataSourceModalOpen,
        dataSourceConnectionModalState,
        nlpDisambiguationModalState,
        setEditingWidgetState,
        setWidgetEditorAIPrompt,
        
        openWidgetEditorModal: () => setWidgetEditorModalOpen(true),
        closeWidgetEditorModal: () => { setWidgetEditorModalOpen(false); setEditingWidgetState(null); },
        updateEditingWidget: (update: Partial<WidgetState> | ((prevState: WidgetState) => WidgetState)) => setEditingWidgetState(s => (s ? (typeof update === 'function' ? update(s) : { ...s, ...update }) : null)),
        
        openFilterConfigModal: (pill, onSave, onBack) => setFilterConfigModalState({ isOpen: true, pill, onSave, onBack }),
        closeFilterConfigModal: () => setFilterConfigModalState({ isOpen: false, pill: null, onSave: null }),
        
        openPageFiltersModal: () => setPageFiltersModalOpen(true),
        closePageFiltersModal: () => setPageFiltersModalOpen(false),
        
        openSelectFieldModal: (onSave?: (pill: Pill) => void) => setSelectFieldModalState({ isOpen: true, onSave }),
        closeSelectFieldModal: () => setSelectFieldModalState({ isOpen: false, onSave: undefined }),
        
        openInsightHub: () => setInsightHubOpen(true),
        closeInsightHub: () => setInsightHubOpen(false),

        openChatModal: () => setChatModalOpen(true),
        closeChatModal: () => setChatModalOpen(false),

        openAddFieldModal: (sourceId: string, initialStep?: 'formula' | 'grouping') => setAddFieldModalState({ isOpen: true, sourceId, initialStep }),
        closeAddFieldModal: () => setAddFieldModalState({ isOpen: false, sourceId: null, initialStep: undefined }),

        openValueFormatModal: (pill, onSave) => setValueFormatModalState({ isOpen: true, pill, onSave }),
        closeValueFormatModal: () => setValueFormatModalState({ isOpen: false, pill: null, onSave: null }),
        
        openConfirmationModal: (config) => setConfirmationModalState({ ...config, isOpen: true }),
        closeConfirmationModal: () => setConfirmationModalState(null),

        openInputModal: (config) => setInputModalState({ ...config, isOpen: true }),
        closeInputModal: () => setInputModalState(null),
        
        openParameterModal: () => setParameterModalOpen(true),
        closeParameterModal: () => setParameterModalOpen(false),

        openAddControlModal: () => setAddControlModalOpen(true),
        closeAddControlModal: () => setAddControlModalOpen(false),

        openTemplateModal: () => setTemplateModalOpen(true),
        closeTemplateModal: () => setTemplateModalOpen(false),

        openTemplatePreviewModal: (template) => setTemplatePreviewModalState({ isOpen: true, template }),
        closeTemplatePreviewModal: () => setTemplatePreviewModalState({ isOpen: false, template: null }),
        
        openFieldMappingModal: (template, onBack) => setFieldMappingModalState({ isOpen: true, template, onBack }),
        closeFieldMappingModal: () => setFieldMappingModalState({ isOpen: false, template: null }),
        
        openCreateTemplateModal: (page) => setCreateTemplateModalState({ isOpen: true, page }),
        closeCreateTemplateModal: () => setCreateTemplateModalState({ isOpen: false, page: null }),
        
        openCommandPalette: () => setCommandPaletteOpen(true),
        closeCommandPalette: () => setCommandPaletteOpen(false),
        
        closeAddToStoryModal: () => setAddToStoryModalState({ isOpen: false, widgetId: null }),
        setAddToStoryModalState,
        
        openSplitColumnModal: (field, onConfirm) => setSplitColumnModalState({ isOpen: true, field, onConfirm }),
        closeSplitColumnModal: () => setSplitColumnModalState({ isOpen: false, field: null, onConfirm: () => {} }),

        openMergeColumnsModal: (onConfirm, availableFields) => setMergeColumnsModalState({ isOpen: true, onConfirm, availableFields }),
        closeMergeColumnsModal: () => setMergeColumnsModalState({ isOpen: false, onConfirm: () => {}, availableFields: [] }),
        
        openAdvancedAnalysisModal: (result, title) => setAdvancedAnalysisModalState({ isOpen: true, result, title }),
        closeAdvancedAnalysisModal: () => setAdvancedAnalysisModalState({ isOpen: false, result: null, title: '' }),

        setActiveCommentThread,
        
        openWhatIfConfigModal: (widgetId) => setWhatIfConfigModalState({isOpen: true, widgetId}),
        closeWhatIfConfigModal: () => setWhatIfConfigModalState({isOpen: false, widgetId: null}),

        openGenerateStoryModal: () => setGenerateStoryModalOpen(true),
        closeGenerateStoryModal: () => setGenerateStoryModalOpen(false),

        setFocusedWidgetId,

        openDataLineageModal: (widgetId) => setDataLineageModalState({ isOpen: true, widgetId }),
        closeDataLineageModal: () => setDataLineageModalState({ isOpen: false, widgetId: null }),

        openPerformanceAnalyzer: () => setPerformanceAnalyzerOpen(true),
        closePerformanceAnalyzer: () => setPerformanceAnalyzerOpen(false),
        
        openAiInsightStarterModal: () => setAiInsightStarterModalOpen(true),
        closeAiInsightStarterModal: () => setAiInsightStarterModalOpen(false),

        toggleFieldInEditorShelves,

        openAddDataSourceModal: () => setAddDataSourceModalOpen(true),
        closeAddDataSourceModal: () => setAddDataSourceModalOpen(false),

        openDataSourceConnectionModal: (connector) => setDataSourceConnectionModalState({ isOpen: true, connector }),
        closeDataSourceConnectionModal: () => setDataSourceConnectionModalState({ isOpen: false, connector: null }),
        
        openNlpDisambiguationModal: (term, fields) => setNlpDisambiguationModalState({ isOpen: true, term, fields }),
        closeNlpDisambiguationModal: () => setNlpDisambiguationModalState({ isOpen: false, term: '', fields: [] }),
    };
};