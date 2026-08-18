import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IncrementService, IncrementRecord } from '../../../services/reports/increment.service';
import { FiltersComponent } from '../../../shared/reports/filters/filters.component';
import { CardsComponent, SummaryCard } from '../../../shared/reports/cards/cards.component';
import { TablesComponent, TableHeader } from '../../../shared/reports/tables/tables.component';
import { ExportUtil } from '../../../shared/reports/utils/export-util';
import { ReportPrintService } from '../../../services/reports/report-print.service';

@Component({
  selector: 'app-increment',
  standalone: true,
  imports: [CommonModule, FiltersComponent, CardsComponent, TablesComponent],
  templateUrl: './increment.component.html',
  styleUrls: ['./increment.component.scss']
})
export class IncrementComponent implements OnInit, OnDestroy {
  reportId = 'increment-details';
  metadata: any = {};
  reportData: IncrementRecord[] = [];
  summaryCards: SummaryCard[] = [];
  
  // Table paging and sorting state
  total = 0;
  page = 1;
  pageSize = 10;
  sortKey = '';
  sortDir = 'asc';
  searchQuery = '';

  // Active filters state
  filters: any = {
    fromDate: '01/04/2026',
    toDate: '30/04/2026',
    employee: 'All',
    department: 'All',
    designation: 'All',
    location: 'All',
    unit: 'All',
    incrementType: 'All',
    empStatus: 'All',
    approvalStatus: 'All'
  };

  // Special timeline state for 'history' report
  selectedEmployeeId = 'EDS001';
  selectedEmployeeName = 'Arun Kumar';
  selectedEmployeeDept = 'Design';
  employeeHistory: IncrementRecord[] = [];

  // Toast notification state
  toastMessage = '';
  showToast = false;
  toastIcon = 'fa-circle-check';

  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private incrementService: IncrementService,
    private reportPrintService: ReportPrintService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.url.subscribe(url => {
      if (url.length > 0) {
        // Map child route names to service reportId
        const path = url[0].path;
        if (path === 'increment-details') this.reportId = 'details';
        else if (path === 'salary-comparison') this.reportId = 'comparison';
        else if (path === 'increment-history') this.reportId = 'history';
        else if (path === 'appraisal-rating') this.reportId = 'summary';
        else this.reportId = 'details';
      } else {
        this.reportId = 'details';
      }
      
      this.resetState();
      this.loadReport();
      this.loadEmployeeHistory();
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  resetState() {
    this.page = 1;
    this.searchQuery = '';
    this.sortKey = '';
    this.sortDir = 'asc';
    
    this.filters = {
      fromDate: '01/04/2026',
      toDate: '30/04/2026',
      employee: 'All',
      department: 'All',
      designation: 'All',
      location: 'All',
      unit: 'All',
      incrementType: 'All',
      empStatus: 'All',
      approvalStatus: 'All'
    };
  }

  loadReport() {
    this.metadata = this.incrementService.getReportMetadata(this.reportId);
    const result = this.incrementService.getReportData(
      this.reportId,
      this.filters,
      this.searchQuery,
      this.page,
      this.pageSize,
      this.sortKey,
      this.sortDir
    );
    this.reportData = result.data;
    this.total = result.total;
    this.summaryCards = result.summaryCards;
  }

  onFilterChange(updatedFilters: any) {
    this.filters = { ...updatedFilters };
  }

  onGenerateReport() {
    this.page = 1;
    this.loadReport();
    this.triggerToast('Report refreshed with active filters.');
  }

  onResetFilters() {
    this.resetState();
    this.loadReport();
    this.triggerToast('Filter fields reset to defaults.');
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.page = 1;
    this.loadReport();
  }

  onSort(field: string) {
    if (this.sortKey === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = field;
      this.sortDir = 'asc';
    }
    this.loadReport();
  }

  onPageChange(p: number) {
    this.page = p;
    this.loadReport();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.loadReport();
  }

  onExport(format: string) {
    if (format === 'email') return;
    
    this.triggerToast(`Preparing ${format.toUpperCase()} export...`);
    
    // Retrieve all records matching filters (no pagination limit)
    const result = this.incrementService.getReportData(
      this.reportId,
      this.filters,
      this.searchQuery,
      1,
      10000,
      this.sortKey,
      this.sortDir
    );
    
    const exportData = result.data;
    const filename = `${(this.metadata.title || 'Increment').replace(/\s+/g, '_')}_Report`;

    setTimeout(() => {
      if (format === 'print' || format === 'pdf') {
        const empId = this.reportId === 'increment-history' ? this.selectedEmployeeId : undefined;
        this.reportPrintService.printReport(
          'increment',
          this.reportId,
          this.filters,
          this.searchQuery,
          this.sortKey,
          this.sortDir,
          empId
        );
      } else if (format === 'excel') {
        ExportUtil.exportToExcel(this.metadata.headers, exportData, filename);
        this.triggerToast(`Excel export completed.`);
      } else if (format === 'csv') {
        ExportUtil.exportToCSV(this.metadata.headers, exportData, filename);
        this.triggerToast(`CSV export completed.`);
      }
    }, 800);
  }

  onExcelImport(importedRows: any[]) {
    if (!importedRows || importedRows.length === 0) return;
    this.incrementService.importExcel(this.reportId, importedRows);
    this.loadReport();
    this.triggerToast(`Successfully imported ${importedRows.length} records into ${this.metadata.title}.`);
  }

  onRowSelect(row: any) {
    if (row.id) {
      this.selectedEmployeeId = row.id;
      this.selectedEmployeeName = row.name || 'Employee';
      this.selectedEmployeeDept = row.dept || 'HR';
      this.loadEmployeeHistory();
    }
  }

  loadEmployeeHistory() {
    this.employeeHistory = this.incrementService.getTimelineHistoryForEmployee(this.selectedEmployeeId);
  }

  // Toast helper
  triggerToast(message: string, icon = 'fa-circle-check') {
    this.toastMessage = message;
    this.toastIcon = icon;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
