import React, { FC } from 'react';
import { useDashboard } from '../contexts/DashboardProvider';
import { FilterConfigModal } from './modals/FilterConfigModal';
import { SelectFieldForFilterModal } from './modals/SelectFieldForFilterModal';
import { AiAssistantModal } from './modals/AiAssistantModal';
import { AddFieldModal } from './modals/AddFieldModal';
import { ValueFormatModal } from './modals/ValueFormatModal';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { ParameterModal } from './modals/ParameterModal';
import { InputModal } from './modals/InputModal';
import { AddControlModal } from './modals/AddControlModal';
import { TemplatePreviewModal } from './modals/TemplatePreviewModal';
import { CommentThreadModal } from './modals/CommentThreadModal';
import { SplitColumnModal } from './modals/SplitColumnModal';
import { MergeColumnsModal } from './modals/MergeColumnsModal';
import { FieldMappingModal } from './modals/FieldMappingModal';
import { CommandPaletteModal } from './modals/CommandPaletteModal';
import { AdvancedAnalysisModal } from './modals/AdvancedAnalysisModal';
import { AddToStoryModal } from './modals/AddToStoryModal';
import { CreateTemplateModal } from './modals/CreateTemplateModal';
import { PerformanceAnalyzerModal } from './modals/PerformanceAnalyzerModal';
import { DataLineageModal } from './modals/DataLineageModal';
import { ChatModal } from './modals/ChatModal';
import { PageFiltersModal } from './modals/PageFiltersModal';
import { WhatIfAnalysisModal } from './modals/WhatIfAnalysisModal';
import { GenerateStoryModal } from './modals/GenerateStoryModal';
import { FocusWidgetModal } from './modals/FocusWidgetModal';
import { TemplateSelectionModal } from './modals/TemplateSelectionModal';
import { AiInsightStarterModal } from './modals/AiInsightStarterModal';
import { AddDataSourceModal } from './modals/AddDataSourceModal';
import { DataSourceConnectionModal } from './modals/DataSourceConnectionModal';
import { WidgetEditorModal } from './modals/WidgetEditorModal';
import { NlpDisambiguationModal } from './modals/NlpDisambiguationModal';


export const ModalsContainer: FC = () => {
    const {
        filterConfigModalState,
        closeFilterConfigModal,
        isPageFiltersModalOpen,
        closePageFiltersModal,
        selectFieldModalOpen,
        closeSelectFieldModal,
        isInsightHubOpen,
        closeInsightHub,
        isChatModalOpen,
        closeChatModal,
        addFieldModalState,
        closeAddFieldModal,
        valueFormatModalState,
        closeValueFormatModal,
        confirmationModalState,
        closeConfirmationModal,
        isParameterModalOpen,
        closeParameterModal,
        inputModalState,
        closeInputModal,
        isAddControlModalOpen,
        closeAddControlModal,
        templatePreviewModalState,
        closeTemplatePreviewModal,
        activeCommentThread,
        setActiveCommentThread,
        splitColumnModalState,
        closeSplitColumnModal,
        mergeColumnsModalState,
        closeMergeColumnsModal,
        fieldMappingModalState,
        closeFieldMappingModal,
        isCommandPaletteOpen,
        closeCommandPalette,
        advancedAnalysisModalState,
        closeAdvancedAnalysisModal,
        addToStoryModalState,
        closeAddToStoryModal,
        createTemplateModalState,
        closeCreateTemplateModal,
        whatIfConfigModalState,
        closeWhatIfConfigModal,
        isGenerateStoryModalOpen,
        closeGenerateStoryModal,
        isTemplateModalOpen,
        closeTemplateModal,
        isAiInsightStarterModalOpen,
        closeAiInsightStarterModal,
        handleGenerateAiDashboard,
        showToast,
        handleImportDashboard, 
        importInputRef,
        isAddDataSourceModalOpen,
        closeAddDataSourceModal,
        dataSourceConnectionModalState,
        closeDataSourceConnectionModal,
        nlpDisambiguationModalState,
        closeNlpDisambiguationModal,
        resolveNlpAmbiguity
    } = useDashboard();

    return (
        <>
            <WidgetEditorModal />
            <FilterConfigModal 
                 isOpen={filterConfigModalState.isOpen}
                 onClose={closeFilterConfigModal}
                 pill={filterConfigModalState.pill}
                 onSave={filterConfigModalState.onSave || (() => {})}
                 onBack={filterConfigModalState.onBack}
            />
            <PageFiltersModal isOpen={isPageFiltersModalOpen} onClose={closePageFiltersModal} />
            <SelectFieldForFilterModal isOpen={selectFieldModalOpen} onClose={closeSelectFieldModal} />
            <AiAssistantModal isOpen={isInsightHubOpen} onClose={closeInsightHub} />
            <ChatModal isOpen={isChatModalOpen} onClose={closeChatModal} />
            <AddFieldModal 
                isOpen={addFieldModalState.isOpen}
                onClose={closeAddFieldModal}
                sourceId={addFieldModalState.sourceId}
                initialStep={addFieldModalState.initialStep}
            />
            <ValueFormatModal 
                isOpen={valueFormatModalState.isOpen}
                onClose={closeValueFormatModal}
                pill={valueFormatModalState.pill}
                onSave={valueFormatModalState.onSave || (() => {})}
            />
            <ConfirmationModal 
                isOpen={!!confirmationModalState?.isOpen}
                onClose={closeConfirmationModal}
                title={confirmationModalState?.title || ''}
                message={confirmationModalState?.message || ''}
                onConfirm={confirmationModalState?.onConfirm || (() => {})}
            />
            <ParameterModal isOpen={isParameterModalOpen} onClose={closeParameterModal} />
            <InputModal
                isOpen={!!inputModalState?.isOpen}
                onClose={closeInputModal}
                title={inputModalState?.title || ''}
                message={inputModalState?.message}
                inputLabel={inputModalState?.inputLabel || ''}
                initialValue={inputModalState?.initialValue}
                onConfirm={inputModalState?.onConfirm || (() => {})}
                inputType={inputModalState?.inputType}
                actionLabel={inputModalState?.actionLabel}
            />
            <AddControlModal isOpen={isAddControlModalOpen} onClose={closeAddControlModal} />
            <TemplatePreviewModal
                isOpen={templatePreviewModalState.isOpen}
                onClose={closeTemplatePreviewModal}
                template={templatePreviewModalState.template}
            />
            <FieldMappingModal 
                isOpen={fieldMappingModalState.isOpen}
                onClose={closeFieldMappingModal}
                template={fieldMappingModalState.template}
                onBack={fieldMappingModalState.onBack}
            />
            <CommandPaletteModal isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />
            <CommentThreadModal
                comment={activeCommentThread}
                onClose={() => setActiveCommentThread(null)}
            />
            <SplitColumnModal
                isOpen={splitColumnModalState?.isOpen ?? false}
                onClose={closeSplitColumnModal}
                field={splitColumnModalState?.field || null}
                onConfirm={splitColumnModalState?.onConfirm || (() => {})}
            />
            <MergeColumnsModal
                isOpen={mergeColumnsModalState?.isOpen ?? false}
                onClose={closeMergeColumnsModal}
                onConfirm={mergeColumnsModalState?.onConfirm || (() => {})}
                availableFields={mergeColumnsModalState?.availableFields || []}
            />
            <AdvancedAnalysisModal
                isOpen={advancedAnalysisModalState.isOpen}
                onClose={closeAdvancedAnalysisModal}
                result={advancedAnalysisModalState.result}
                title={advancedAnalysisModalState.title}
            />
            <AddToStoryModal
                isOpen={addToStoryModalState.isOpen}
                onClose={closeAddToStoryModal}
                widgetId={addToStoryModalState.widgetId}
            />
            <CreateTemplateModal 
                isOpen={createTemplateModalState.isOpen}
                onClose={closeCreateTemplateModal}
                page={createTemplateModalState.page}
            />
            <WhatIfAnalysisModal 
                isOpen={whatIfConfigModalState.isOpen}
                onClose={closeWhatIfConfigModal}
                widgetId={whatIfConfigModalState.widgetId}
            />
            <GenerateStoryModal 
                isOpen={isGenerateStoryModalOpen}
                onClose={closeGenerateStoryModal}
            />
            <AiInsightStarterModal
                isOpen={isAiInsightStarterModalOpen}
                onClose={closeAiInsightStarterModal}
                onConfirm={handleGenerateAiDashboard}
            />
            <TemplateSelectionModal isOpen={isTemplateModalOpen} onClose={closeTemplateModal} />
            <PerformanceAnalyzerModal />
            <DataLineageModal />
            <FocusWidgetModal />
            <AddDataSourceModal isOpen={isAddDataSourceModalOpen} onClose={closeAddDataSourceModal} />
            <DataSourceConnectionModal
                isOpen={dataSourceConnectionModalState.isOpen}
                onClose={closeDataSourceConnectionModal}
                connector={dataSourceConnectionModalState.connector}
            />
             <NlpDisambiguationModal
                isOpen={nlpDisambiguationModalState.isOpen}
                onClose={closeNlpDisambiguationModal}
                onResolve={resolveNlpAmbiguity}
                term={nlpDisambiguationModalState.term}
                fields={nlpDisambiguationModalState.fields}
            />
            <input type="file" accept=".csv,.xlsx,.xls,.parquet" onChange={(e) => handleImportDashboard(e)} ref={importInputRef} className="hidden" />
        </>
    );
};