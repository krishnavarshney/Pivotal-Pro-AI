import { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DashboardPage, WidgetState, Pill, CrossFilterState, ControlFilterState } from '../../utils/types';
import { processWidgetData } from '../../utils/dataProcessing/widgetProcessor';
import { notificationService } from '../../services/notificationService';

export const useDashboardExport = (
    activePage: DashboardPage | undefined,
    selectedWidgetIds: string[],
    blendedData: any[],
    globalFilters: Pill[],
    crossFilter: CrossFilterState,
    dataContext: any,
    controlFilters: ControlFilterState,
    setLoadingState: (state: { isLoading: boolean; message: string; }) => void,
    deselectAllWidgets: () => void
) => {

    const exportSelectedWidgets = async (format: 'PDF' | 'CSV' | 'XLSX') => {
        if (!activePage || selectedWidgetIds.length === 0) return;
        const widgetsToExport = activePage.widgets.filter(w => selectedWidgetIds.includes(w.id));
        setLoadingState({ isLoading: true, message: `Exporting ${widgetsToExport.length} widgets as ${format}...` });
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            if (format === 'CSV' || format === 'XLSX') {
                let combinedData: any[] = [];
                for (const widget of widgetsToExport) {
                    const data = processWidgetData(blendedData, widget, globalFilters, crossFilter, dataContext.parameters, controlFilters);
                    if (data.type === 'table') {
                        data.rows.forEach((row: any) => {
                            if (row.type === 'data') {
                                combinedData.push({ widget_title: widget.title, ...row.values });
                            }
                        });
                    } else if (data.type === 'chart') {
                        data.labels.forEach((label: any, index: any) => {
                            const row: { [key: string]: any } = { widget_title: widget.title, category: label };
                            data.datasets.forEach((ds: any) => {
                                row[ds.label] = ds.data[index];
                            });
                            combinedData.push(row);
                        });
                    }
                }

                if (format === 'CSV') {
                    const csv = Papa.unparse(combinedData);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', 'dashboard_export.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else { // XLSX
                    const worksheet = XLSX.utils.json_to_sheet(combinedData);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Exported Data");
                    XLSX.writeFile(workbook, "dashboard_export.xlsx");
                }
            } else if (format === 'PDF') {
                const pdf = new jsPDF('p', 'mm', 'a4');
                let yPos = 15;
                const pageHeight = pdf.internal.pageSize.getHeight();
                const pageWidth = pdf.internal.pageSize.getWidth();
                pdf.setFontSize(18);
                pdf.text(activePage.name, pageWidth / 2, 10, { align: 'center' });

                for (const widgetId of selectedWidgetIds) {
                    const element = document.getElementById(`widget-wrapper-${widgetId}`)?.querySelector('.glass-panel') as HTMLElement;
                    if (element) {
                        const canvas = await html2canvas(element, { scale: 2 });
                        const imgData = canvas.toDataURL('image/png');
                        const imgProps = pdf.getImageProperties(imgData);
                        const pdfWidth = pageWidth - 20;
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                        if (yPos + pdfHeight > pageHeight - 15) {
                            pdf.addPage();
                            yPos = 15;
                        }
                        pdf.addImage(imgData, 'PNG', 10, yPos, pdfWidth, pdfHeight);
                        yPos += pdfHeight + 10;
                    }
                }
                pdf.save(`${activePage.name}_export.pdf`);
            }
            notificationService.success(`${widgetsToExport.length} widgets exported as ${format}.`);
        } catch (error) {
            notificationService.error(`Export failed: ${(error as Error).message}`);
        } finally {
            setLoadingState({ isLoading: false, message: '' });
            deselectAllWidgets();
        }
    };

    return {
        exportSelectedWidgets
    };
};
