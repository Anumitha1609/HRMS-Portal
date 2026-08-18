import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportPrintService {
  constructor() {}

  printReport(
    module: string,
    reportId: string,
    filters: any,
    searchQuery?: string,
    sortKey?: string,
    sortDir?: string,
    selectedEmpId?: string,
    customColumns?: string[]
  ) {
    const params: any = {};
    if (filters) {
      params.filters = JSON.stringify(filters);
    }
    if (searchQuery !== undefined && searchQuery !== null) {
      params.searchQuery = searchQuery;
    }
    if (sortKey) {
      params.sortKey = sortKey;
    }
    if (sortDir) {
      params.sortDir = sortDir;
    }
    if (selectedEmpId) {
      params.selectedEmpId = selectedEmpId;
    }
    if (customColumns && customColumns.length > 0) {
      params.customColumns = customColumns.join(',');
    }

    const queryParams = new URLSearchParams(params).toString();
    const url = `/reports/${module}/${reportId}/print?${queryParams}`;
    window.open(url, '_self');
  }
}
