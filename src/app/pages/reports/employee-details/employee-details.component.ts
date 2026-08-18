import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { EmployeeDetailsService, EmployeeDetailsRecord, EmployeeHistoryEvent } from '../../../services/reports/employee-details.service';
import { FiltersComponent } from '../../../shared/reports/filters/filters.component';
import { CardsComponent, SummaryCard } from '../../../shared/reports/cards/cards.component';
import { TablesComponent, TableHeader } from '../../../shared/reports/tables/tables.component';
import { FormsModule } from '@angular/forms';
import { ExportUtil } from '../../../shared/reports/utils/export-util';
import { ReportPrintService } from '../../../services/reports/report-print.service';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule, FiltersComponent, CardsComponent, TablesComponent, FormsModule, RouterModule],
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss']
})
export class EmployeeDetailsComponent implements OnInit, OnDestroy {
  reportId = 'headcount';
  pathName = 'general-directory';
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
    department: '',
    designation: '',
    location: '',
    status: '',
    category: '',
    shift: '',
    bloodgroup: '',
    month: '05',
    fromdate: '',
    todate: ''
  };

  // Customized Report columns state
  allColumns: { [key: string]: { label: string; group: string } } = {};
  columnKeys: string[] = [];
  selectedColumns: string[] = ['empId', 'empName', 'department', 'designation', 'location', 'joinDate', 'status'];

  // History timeline state
  selectedEmpId = 'EMP001';
  selectedEmpName = 'Rajesh Kumar';
  selectedEmpDept = 'Engineering';
  employeeHistory: EmployeeHistoryEvent[] = [];

  // Profile Dossiers Grid search state
  dossierSearch = '';
  dossierList: EmployeeDetailsRecord[] = [];

  // Toast notification state
  toastMessage = '';
  showToast = false;
  toastIcon = 'fa-circle-check';

  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private empService: EmployeeDetailsService,
    private reportPrintService: ReportPrintService
  ) {}

  ngOnInit() {
    this.allColumns = this.empService.getAllColumnDefinitions();
    this.columnKeys = Object.keys(this.allColumns);
    
    this.routeSub = this.route.url.subscribe(url => {
      if (url.length > 0) {
        this.pathName = url[0].path;
        // Map paths to service report IDs
        if (this.pathName === 'general-directory') this.reportId = 'headcount';
        else if (this.pathName === 'qualification') this.reportId = 'personal';
        else if (this.pathName === 'experience-history') this.reportId = 'history';
        else if (this.pathName === 'birthday-list') this.reportId = 'birthday';
        else if (this.pathName === 'head-count') this.reportId = 'headcount';
        else if (this.pathName === 'family-details') this.reportId = 'personal';
        else if (this.pathName === 'blood-group') this.reportId = 'bloodgroup';
        else if (this.pathName === 'separations') this.reportId = 'idcard';
        else if (this.pathName === 'profile-dossiers') this.reportId = 'dossiers';
        else if (this.pathName === 'customized-report') this.reportId = 'customized';
        else if (this.pathName === 'shift-details') this.reportId = 'shift';
        else if (this.pathName === 'personal-details') this.reportId = 'personal';
        else if (this.pathName === 'id-card') this.reportId = 'idcard';
        else if (this.pathName === 'employee-history') this.reportId = 'history';
        else this.reportId = 'headcount';
      } else {
        this.reportId = 'headcount';
        this.pathName = 'general-directory';
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
    this.dossierSearch = '';
    
    this.filters = {
      department: '',
      designation: '',
      location: '',
      status: '',
      category: '',
      shift: '',
      bloodgroup: '',
      month: '05',
      fromdate: '',
      todate: ''
    };
  }

  loadReport() {
    if (this.reportId === 'dossiers') {
      this.loadDossiers();
      return;
    }

    // Pass selectedColumns to getReportMetadata/Data for customized reports
    this.metadata = this.empService.getReportMetadata(
      this.reportId, 
      this.reportId === 'customized' ? this.selectedColumns : undefined
    );

    const result = this.empService.getReportData(
      this.reportId,
      this.filters,
      this.searchQuery,
      this.page,
      this.pageSize,
      this.sortKey,
      this.sortDir,
      this.reportId === 'customized' ? this.selectedColumns : undefined
    );
    this.reportData = result.data;
    this.total = result.total;
    this.summaryCards = result.summaryCards;
  }

  loadDossiers() {
    const list = this.empService.getEmployeeList();
    if (this.dossierSearch) {
      const q = this.dossierSearch.toLowerCase();
      this.dossierList = list.filter(e => 
        e.empName.toLowerCase().includes(q) || 
        e.empId.toLowerCase().includes(q) || 
        e.designation.toLowerCase().includes(q) || 
        e.department.toLowerCase().includes(q)
      );
    } else {
      this.dossierList = list;
    }
    // Calculate simple summary cards for dossiers
    this.summaryCards = [
      { label: 'Total Dossiers', value: this.dossierList.length, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
      { label: 'Active Roster', value: this.dossierList.filter(e => e.status === 'Active').length, icon: 'fa-user-check', color: 'bg-emerald-50 text-enterprise-success-text' },
      { label: 'Probationary Staff', value: this.dossierList.filter(e => e.status === 'Probation').length, icon: 'fa-user-clock', color: 'bg-amber-50 text-enterprise-pending-text' },
      { label: 'Grid Scope', value: 'Directories', icon: 'fa-address-card', color: 'bg-purple-50 text-purple-600' }
    ];
  }

  onDossierSearchChange() {
    this.loadDossiers();
  }

  // Column checkbox toggler (customized report)
  toggleColumn(col: string) {
    const idx = this.selectedColumns.indexOf(col);
    if (idx > -1) {
      if (this.selectedColumns.length > 1) {
        this.selectedColumns.splice(idx, 1);
      } else {
        this.triggerToast('You must select at least one column.', 'fa-circle-exclamation');
      }
    } else {
      this.selectedColumns.push(col);
    }
    this.loadReport();
  }

  // Group columns helper
  getColumnsByGroup(groupName: string): string[] {
    return this.columnKeys.filter(k => this.allColumns[k].group === groupName);
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
    let exportData: any[] = [];
    let headersToUse = this.metadata.headers || [];
    
    if (this.reportId === 'dossiers') {
      exportData = this.dossierList;
      headersToUse = [
        { field: 'empId', label: 'Employee ID' },
        { field: 'empName', label: 'Employee Name' },
        { field: 'department', label: 'Department' },
        { field: 'designation', label: 'Designation' },
        { field: 'location', label: 'Location' },
        { field: 'joinDate', label: 'Date of Joining' },
        { field: 'qualification', label: 'Qualification' },
        { field: 'email', label: 'Email Address' },
        { field: 'basicSalary', label: 'Basic Salary' }
      ];
    } else {
      const result = this.empService.getReportData(
        this.reportId,
        this.filters,
        this.searchQuery,
        1,
        10000,
        this.sortKey,
        this.sortDir,
        this.reportId === 'customized' ? this.selectedColumns : undefined
      );
      exportData = result.data;
    }
    
    const filename = `${(this.metadata.title || 'Employee_Details').replace(/\s+/g, '_')}_Report`;

    setTimeout(() => {
      if (format === 'print' || format === 'pdf') {
        const empId = (this.reportId === 'history' || this.reportId === 'idcard') ? this.selectedEmpId : undefined;
        this.reportPrintService.printReport(
          'employee-details',
          this.reportId,
          this.filters,
          this.searchQuery,
          this.sortKey,
          this.sortDir,
          empId,
          this.reportId === 'customized' ? this.selectedColumns : undefined
        );
      } else if (format === 'excel') {
        ExportUtil.exportToExcel(headersToUse, exportData, filename);
        this.triggerToast(`Excel export completed.`);
      } else if (format === 'csv') {
        ExportUtil.exportToCSV(headersToUse, exportData, filename);
        this.triggerToast(`CSV export completed.`);
      }
    }, 800);
  }

  onExcelImport(importedRows: any[]) {
    if (!importedRows || importedRows.length === 0) return;
    this.empService.importExcel(this.reportId, importedRows);
    this.loadReport();
    this.triggerToast(`Successfully imported ${importedRows.length} records into ${this.metadata.title}.`);
  }

  onRowSelect(row: any) {
    const empId = row.empId || row.id;
    if (empId) {
      this.selectedEmpId = empId;
      this.selectedEmpName = row.empName || row.name || 'Employee';
      this.selectedEmpDept = row.department || row.dept || 'HR';
      this.loadEmployeeHistory();
    }
  }

  loadEmployeeHistory() {
    this.employeeHistory = this.empService.getHistoryEventsForEmployee(this.selectedEmpId);
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
