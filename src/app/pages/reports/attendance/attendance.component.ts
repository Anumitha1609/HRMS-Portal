import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AttendanceService, AttendanceRecord } from '../../../services/reports/attendance.service';
import { FiltersComponent } from '../../../shared/reports/filters/filters.component';
import { CardsComponent, SummaryCard } from '../../../shared/reports/cards/cards.component';
import { TablesComponent, TableHeader } from '../../../shared/reports/tables/tables.component';
import { FormsModule } from '@angular/forms';
import { ExportUtil } from '../../../shared/reports/utils/export-util';
import { ReportPrintService } from '../../../services/reports/report-print.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FiltersComponent, CardsComponent, TablesComponent, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit, OnDestroy {
  reportId = 'overtime';
  metadata: any = {};
  reportData: AttendanceRecord[] = [];
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
    fromDate: '01/05/2026',
    toDate: '31/05/2026',
    department: 'All',
    designation: 'All',
    employee: 'All',
    status: 'All',
    leaveType: 'All',
    expCategory: 'All',
    monthlyLimit: 3
  };

  // Master-Detail specific state
  masterRequests: AttendanceRecord[] = [];
  selectedRequest: AttendanceRecord | null = null;
  masterSearch = '';

  // Toast notification state
  toastMessage = '';
  showToast = false;
  toastIcon = 'fa-circle-check';

  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private reportPrintService: ReportPrintService
  ) {}

  ngOnInit() {
    // Subscribe to child route parameter or URL segment
    this.routeSub = this.route.url.subscribe(url => {
      if (url.length > 0) {
        this.reportId = url[0].path;
      } else {
        this.reportId = 'overtime';
      }
      
      this.resetState();
      this.loadReport();
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
    this.selectedRequest = null;
    this.masterSearch = '';
    
    // Set default filter values
    this.filters = {
      fromDate: '01/05/2026',
      toDate: '31/05/2026',
      department: 'All',
      designation: 'All',
      employee: 'All',
      status: 'All',
      leaveType: 'All',
      expCategory: 'All',
      monthlyLimit: 3
    };
  }

  loadReport() {
    this.metadata = this.attendanceService.getReportMetadata(this.reportId);
    
    if (this.reportId === 'detailsview') {
      // Load Master-Detail requests
      this.loadMasterGrid();
    } else {
      // Load standard report data
      const result = this.attendanceService.getReportData(
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
  }

  // Standard report handlers
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
    const result = this.attendanceService.getReportData(
      this.reportId,
      this.filters,
      this.searchQuery,
      1,
      10000,
      this.sortKey,
      this.sortDir
    );
    
    const exportData = result.data;
    const filename = `${this.metadata.title.replace(/\s+/g, '_')}_Report`;

    setTimeout(() => {
      if (format === 'print' || format === 'pdf') {
        const reqNo = this.reportId === 'detailsview' ? this.selectedRequest?.reqNo : undefined;
        this.reportPrintService.printReport(
          'attendance',
          this.reportId,
          this.filters,
          this.searchQuery,
          this.sortKey,
          this.sortDir,
          reqNo
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

  // Functional Excel import handler
  onExcelImport(importedRows: any[]) {
    if (!importedRows || importedRows.length === 0) return;
    
    this.attendanceService.importExcel(this.reportId, importedRows);
    this.loadReport();
    this.triggerToast(`Successfully imported ${importedRows.length} records into ${this.metadata.title}.`);
  }

  // Master-Detail specific handlers
  loadMasterGrid() {
    this.masterRequests = this.attendanceService.getMasterRequests(this.masterSearch);
    if (this.masterRequests.length > 0 && !this.selectedRequest) {
      this.selectedRequest = this.masterRequests[0];
    }
  }

  onMasterSearch(query: string) {
    this.masterSearch = query;
    this.loadMasterGrid();
  }

  selectRequest(req: AttendanceRecord) {
    this.selectedRequest = req;
  }

  downloadAttachment() {
    if (!this.selectedRequest || !this.selectedRequest.details?.attachment) return;
    this.triggerToast(`Downloading ${this.selectedRequest.details.attachment}...`);
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
