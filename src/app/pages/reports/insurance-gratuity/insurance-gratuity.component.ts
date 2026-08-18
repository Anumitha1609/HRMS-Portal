import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { InsuranceGratuityService, GratuityEmployee, GratuityClaim } from '../../../services/reports/insurance-gratuity.service';
import { FiltersComponent } from '../../../shared/reports/filters/filters.component';
import { CardsComponent, SummaryCard } from '../../../shared/reports/cards/cards.component';
import { TablesComponent, TableHeader } from '../../../shared/reports/tables/tables.component';
import { ExportUtil } from '../../../shared/reports/utils/export-util';
import { ReportPrintService } from '../../../services/reports/report-print.service';

@Component({
  selector: 'app-insurance-gratuity',
  standalone: true,
  imports: [CommonModule, FiltersComponent, CardsComponent, TablesComponent],
  templateUrl: './insurance-gratuity.component.html',
  styleUrls: ['./insurance-gratuity.component.scss']
})
export class InsuranceGratuityComponent implements OnInit, OnDestroy {
  reportId = 'gratuity-calculation';
  metadata: any = {};
  reportData: any[] = [];
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
    asOnDate: '23/06/2026',
    claimDate: '23/06/2026',
    employee: 'All',
    department: 'All',
    designation: 'All',
    location: 'All',
    unit: 'All',
    category: 'All',
    empStatus: 'All',
    claimStatus: 'All'
  };

  // Eligibility insights (for calculations view)
  insights: { approaching: any[]; highLiability: any[]; retiringSoon: any[] } = {
    approaching: [],
    highLiability: [],
    retiringSoon: []
  };

  // Claim proforma details (for claim view)
  selectedClaim: GratuityClaim | null = null;

  // Toast notification state
  toastMessage = '';
  showToast = false;
  toastIcon = 'fa-circle-check';

  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private igService: InsuranceGratuityService,
    private reportPrintService: ReportPrintService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.url.subscribe(url => {
      if (url.length > 0) {
        const path = url[0].path;
        if (path === 'gratuity-calculation') this.reportId = 'calculations';
        else if (path === 'gratuity-claim') this.reportId = 'claim';
        else this.reportId = 'calculations';
      } else {
        this.reportId = 'calculations';
      }
      
      this.resetState();
      this.loadReport();
      this.loadInsights();
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
    this.selectedClaim = null;
    
    this.filters = {
      asOnDate: '23/06/2026',
      claimDate: '23/06/2026',
      employee: 'All',
      department: 'All',
      designation: 'All',
      location: 'All',
      unit: 'All',
      category: 'All',
      empStatus: 'All',
      claimStatus: 'All'
    };
  }

  loadReport() {
    this.metadata = this.igService.getReportMetadata(this.reportId);
    const result = this.igService.getReportData(
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
    
    if (this.reportId === 'claim' && this.reportData.length > 0 && !this.selectedClaim) {
      this.selectClaim(this.reportData[0]);
    }
  }

  loadInsights() {
    this.insights = this.igService.getEligibilityInsights(this.filters.asOnDate);
  }

  onFilterChange(updatedFilters: any) {
    this.filters = { ...updatedFilters };
    this.loadInsights();
  }

  onGenerateReport() {
    this.page = 1;
    this.loadReport();
    this.triggerToast('Report refreshed with active filters.');
  }

  onResetFilters() {
    this.resetState();
    this.loadReport();
    this.loadInsights();
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
    const result = this.igService.getReportData(
      this.reportId,
      this.filters,
      this.searchQuery,
      1,
      10000,
      this.sortKey,
      this.sortDir
    );
    
    const exportData = result.data;
    const filename = `${(this.metadata.title || 'Insurance_Gratuity').replace(/\s+/g, '_')}_Report`;

    setTimeout(() => {
      if (format === 'print' || format === 'pdf') {
        const empId = this.reportId === 'claim' ? this.selectedClaim?.claimNo : undefined;
        this.reportPrintService.printReport(
          'insurance-gratuity',
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
    this.igService.importExcel(this.reportId, importedRows);
    this.loadReport();
    this.loadInsights();
    this.triggerToast(`Successfully imported ${importedRows.length} records into ${this.metadata.title}.`);
  }

  onRowSelect(row: any) {
    if (this.reportId === 'claim') {
      this.selectClaim(row);
    }
  }

  selectClaim(row: any) {
    const claim = this.igService.getClaimByNo(row.claimNo);
    if (claim) {
      this.selectedClaim = claim;
    }
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
