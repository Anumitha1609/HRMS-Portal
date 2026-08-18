import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AttendanceService } from '../../../services/reports/attendance.service';
import { SalaryService } from '../../../services/reports/salary.service';
import { IncrementService } from '../../../services/reports/increment.service';
import { InsuranceGratuityService } from '../../../services/reports/insurance-gratuity.service';
import { EmployeeDetailsService } from '../../../services/reports/employee-details.service';

@Component({
  selector: 'app-report-print',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './report-print.component.html',
  styleUrls: ['./report-print.component.scss']
})
export class ReportPrintComponent implements OnInit, AfterViewInit {
  module: string = '';
  reportId: string = '';
  reportTitle: string = '';
  monthlyLimit: number = 3;
  
  generatedDate: string = '';
  generatedTime: string = '';
  printedBy: string = 'Admin User (HR Admin)';

  filters: any = {};
  searchQuery: string = '';
  sortKey: string = '';
  sortDir: string = '';
  selectedEmpId: string = '';
  customColumns: string[] = [];

  reportData: any[] = [];
  summaryCards: any[] = [];
  metadata: any = { headers: [] };
  activeFilterList: { label: string; value: string }[] = [];

  // Special sub-layouts state
  selectedEmployee: any = null;
  payslipData: any = null;
  selectedClaim: any = null;
  employeeHistory: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private attendanceService: AttendanceService,
    private salaryService: SalaryService,
    private incrementService: IncrementService,
    private igService: InsuranceGratuityService,
    private empService: EmployeeDetailsService
  ) {}

  ngOnInit() {
    this.formatCurrentDateTime();
    
    // Parse route and query parameters
    const snapshot = this.route.snapshot;
    this.module = snapshot.params['module'] || '';
    this.reportId = snapshot.params['reportId'] || '';

    const queryParams = snapshot.queryParams;
    if (queryParams['filters']) {
      try {
        this.filters = JSON.parse(queryParams['filters']);
        if (this.filters && this.filters.monthlyLimit !== undefined) {
          this.monthlyLimit = Number(this.filters.monthlyLimit) || 3;
        }
      } catch (e) {
        this.filters = {};
      }
    }
    this.searchQuery = queryParams['searchQuery'] || '';
    this.sortKey = queryParams['sortKey'] || '';
    this.sortDir = queryParams['sortDir'] || '';
    this.selectedEmpId = queryParams['selectedEmpId'] || '';
    if (queryParams['customColumns']) {
      this.customColumns = queryParams['customColumns'].split(',');
    }

    this.loadData();
    this.buildActiveFiltersList();
  }

  ngAfterViewInit() {
    // Auto trigger print after Angular compiles the DOM
    setTimeout(() => {
      this.triggerPrint();
    }, 1000);
  }

  formatCurrentDateTime() {
    const now = new Date();
    
    // Format Date: DD-MMM-YYYY (e.g. 30-Jun-2026)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    this.generatedDate = `${day}-${month}-${year}`;

    // Format Time: HH:MM AM/PM (e.g. 01:25 PM)
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const strHours = String(hours).padStart(2, '0');
    this.generatedTime = `${strHours}:${minutes} ${ampm}`;
  }

  loadData() {
    switch (this.module) {
      case 'attendance':
        this.loadAttendanceData();
        break;
      case 'salary':
        this.loadSalaryData();
        break;
      case 'increment':
        this.loadIncrementData();
        break;
      case 'insurance-gratuity':
      case 'insurance':
        this.loadInsuranceGratuityData();
        break;
      case 'employee-details':
        this.loadEmployeeDetailsData();
        break;
    }
  }

  loadAttendanceData() {
    if (this.reportId === 'detailsview') {
      this.reportTitle = 'Leave / Permission Details View';
      if (this.selectedEmpId) {
        const req = this.attendanceService.getRequestByNumber(this.selectedEmpId);
        this.reportData = req ? [req] : [];
      } else {
        this.reportData = this.attendanceService.getMasterRequests('');
      }
      this.metadata = { headers: [] };
    } else {
      this.metadata = this.attendanceService.getReportMetadata(this.reportId);
      this.reportTitle = this.metadata.title || 'Attendance Report';
      const result = this.attendanceService.getReportData(
        this.reportId,
        this.filters,
        this.searchQuery,
        1,
        100000,
        this.sortKey,
        this.sortDir
      );
      this.reportData = result.data;
      this.summaryCards = result.summaryCards;
    }
  }

  loadSalaryData() {
    if (this.reportId === 'payslip') {
      this.reportTitle = 'Employee Pay Slip';
      this.selectedEmployee = this.salaryService.getEmployeeById(this.selectedEmpId);
      if (this.selectedEmployee) {
        this.calculatePayslip();
      }
    } else if (this.reportId === 'label') {
      this.reportTitle = 'Security Label Badges';
      const result = this.salaryService.getReportData(
        this.reportId,
        this.filters,
        this.searchQuery,
        1,
        100000,
        this.sortKey,
        this.sortDir
      );
      this.reportData = result.data;
      this.metadata = { headers: [] };
    } else {
      this.metadata = this.salaryService.getReportMetadata(this.reportId);
      this.reportTitle = this.metadata.title || 'Salary Report';
      const result = this.salaryService.getReportData(
        this.reportId,
        this.filters,
        this.searchQuery,
        1,
        100000,
        this.sortKey,
        this.sortDir
      );
      this.reportData = result.data;
      this.summaryCards = result.summaryCards;
    }
  }

  calculatePayslip() {
    if (!this.selectedEmployee) return;
    const basic = Math.round(this.selectedEmployee.revSalary * 0.8);
    const hra = Math.round(this.selectedEmployee.revSalary * 0.2);
    const pf = Math.round(basic * 0.12);
    const pt = 200;
    const tax = Math.round(this.selectedEmployee.revSalary * 0.05);
    const deductions = pf + pt + tax;
    const net = this.selectedEmployee.revSalary - deductions;

    this.payslipData = {
      basic,
      hra,
      pf,
      pt,
      tax,
      deductions,
      net
    };
  }

  loadIncrementData() {
    this.metadata = this.incrementService.getReportMetadata(this.reportId);
    this.reportTitle = this.metadata.title || 'Increment Report';
    const result = this.incrementService.getReportData(
      this.reportId,
      this.filters,
      this.searchQuery,
      1,
      100000,
      this.sortKey,
      this.sortDir
    );
    this.reportData = result.data;
    this.summaryCards = result.summaryCards;
  }

  loadInsuranceGratuityData() {
    if (this.reportId === 'claim') {
      this.reportTitle = 'Gratuity Claim Proforma (Form I)';
      this.selectedClaim = this.igService.getClaimByNo(this.selectedEmpId);
    } else {
      this.metadata = this.igService.getReportMetadata(this.reportId);
      this.reportTitle = this.metadata.title || 'Insurance & Gratuity Report';
      const result = this.igService.getReportData(
        this.reportId,
        this.filters,
        this.searchQuery,
        1,
        100000,
        this.sortKey,
        this.sortDir
      );
      this.reportData = result.data;
      this.summaryCards = result.summaryCards;
    }
  }

  loadEmployeeDetailsData() {
    if (this.reportId === 'history') {
      this.reportTitle = 'Employee History Report';
      this.employeeHistory = this.empService.getHistoryEventsForEmployee(this.selectedEmpId);
      this.selectedEmployee = this.empService.getEmployeeById(this.selectedEmpId);
    } else if (this.reportId === 'idcard') {
      this.reportTitle = 'Employee ID Card';
      this.selectedEmployee = this.empService.getEmployeeById(this.selectedEmpId);
    } else {
      this.metadata = this.empService.getReportMetadata(this.reportId, this.customColumns);
      this.reportTitle = this.metadata.title || 'Employee Details Report';
      const result = this.empService.getReportData(
        this.reportId,
        this.filters,
        this.searchQuery,
        1,
        100000,
        this.sortKey,
        this.sortDir,
        this.reportId === 'customized' ? this.customColumns : undefined
      );
      this.reportData = result.data;
      this.summaryCards = result.summaryCards;
    }
  }

  buildActiveFiltersList() {
    const list: { label: string; value: string }[] = [];
    
    // 1. First extract date ranges chronologically
    const dateKeys = ['fromDate', 'toDate', 'fromdate', 'todate', 'asOnDate', 'claimDate'];
    for (const dateKey of dateKeys) {
      const val = this.filters[dateKey];
      if (val !== undefined && val !== null && val !== '') {
        let label = dateKey.replace(/([A-Z])/g, ' $1');
        label = label.charAt(0).toUpperCase() + label.slice(1);
        list.push({ label, value: String(val) });
      }
    }

    // 2. Next load other active filters specified in report metadata
    if (this.metadata && this.metadata.filters) {
      for (const filterName of this.metadata.filters) {
        // Skip date filter keys that we already pushed
        if (['fromdate', 'todate', 'asondate', 'claimdate', 'fromDate', 'toDate'].includes(filterName)) {
          continue;
        }
        
        // Find matching key case-insensitively
        const filterKey = Object.keys(this.filters).find(k => k.toLowerCase() === filterName.toLowerCase());
        if (filterKey) {
          const val = this.filters[filterKey];
          if (val !== undefined && val !== null && val !== '') {
            let label = filterKey.replace(/([A-Z])/g, ' $1');
            label = label.charAt(0).toUpperCase() + label.slice(1);
            list.push({ label, value: String(val) });
          }
        }
      }
    }

    // 3. Fallback: if metadata didn't have filters, load everything that is not "All" or empty
    if (list.length === 0) {
      const keys = Object.keys(this.filters);
      for (const key of keys) {
        const val = this.filters[key];
        if (val !== undefined && val !== null && val !== '' && val !== 'All') {
          let label = key.replace(/([A-Z])/g, ' $1');
          label = label.charAt(0).toUpperCase() + label.slice(1);
          list.push({ label, value: String(val) });
        }
      }
    }

    if (this.searchQuery) {
      list.push({ label: 'Search Query', value: `"${this.searchQuery}"` });
    }

    this.activeFilterList = list;
  }

  getFilterPairs(): any[][] {
    const pairs = [];
    for (let i = 0; i < this.activeFilterList.length; i += 2) {
      pairs.push([
        this.activeFilterList[i],
        this.activeFilterList[i + 1] || null
      ]);
    }
    return pairs;
  }

  formatValue(value: any, field: string): string {
    if (value === undefined || value === null) return '';
    
    // Currency Columns
    if (['rate', 'gross', 'deductions', 'net', 'earnings', 'netValue', 'salary', 'bonus', 'incentives', 'insurance', 'total', 'advanceAmount', 'recoveryAmount', 'balance', 'amount', 'eligibleAmt', 'approvedAmt', 'prevSalary', 'revSalary', 'incrementAmount', 'revisionAmount', 'propSalary', 'basicSalary'].includes(field)) {
      if (typeof value === 'number') {
        return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    
    // Percentage Columns
    if (['incPercent', 'incrementPercent', 'incPercentCumulative'].includes(field)) {
      if (typeof value === 'number') {
        return value.toFixed(1) + '%';
      }
    }
    
    return String(value);
  }

  getCellClass(value: any, field: string): string {
    if (field !== 'status' && field !== 'eligible' && field !== 'approvalStatus') return '';
    const s = String(value).toLowerCase();
    
    if (this.reportId === 'leaveavail') {
      if (s === 'within limit') return 'badge-print success';
      if (s === 'monthly limit reached') return 'badge-print pending';
      if (s === 'yearly limit reached') return 'badge-print danger';
      if (s.includes('exceeded')) return 'badge-print danger';
    }

    if (['approved', 'released', 'success', 'cleared', 'eligible', 'present', 'active'].includes(s)) {
      return 'badge-print success';
    }
    if (['pending', 'recovering', 'submitted', 'draft', 'leave applied', 'probation'].includes(s)) {
      return 'badge-print pending';
    }
    if (['rejected', 'absent', 'inactive', 'failed'].includes(s)) {
      return 'badge-print danger';
    }
    return '';
  }

  isStatusField(field: string): boolean {
    return ['status', 'eligible', 'approvalStatus'].includes(field);
  }

  getColumnAlignClass(field: string): string {
    if (['empId', 'id', 'date', 'joinDate', 'fromDate', 'toDate', 'status', 'eligible', 'approvalStatus', 'reqNo', 'claimNo', 'totalDays', 'days', 'years', 'monthlyDays', 'monthlyBalance', 'yearlyDays', 'yearlyBalance'].includes(field)) {
      return 'text-center-align';
    }
    if (['rate', 'gross', 'deductions', 'net', 'earnings', 'netValue', 'salary', 'bonus', 'incentives', 'insurance', 'total', 'advanceAmount', 'recoveryAmount', 'balance', 'amount', 'eligibleAmt', 'approvedAmt', 'prevSalary', 'revSalary', 'incrementAmount', 'revisionAmount', 'propSalary', 'basicSalary', 'basic', 'hra', 'pf', 'pt', 'tax'].includes(field)) {
      return 'text-right-align';
    }
    return 'text-left-align';
  }

  isRowExceeded(row: any): boolean {
    if (this.reportId !== 'leaveavail') return false;
    return (row.monthlyDays || 0) > this.monthlyLimit || (row.yearlyDays || 0) > (this.monthlyLimit * 12);
  }

  isCellExceeded(row: any, field: string): boolean {
    if (this.reportId !== 'leaveavail') return false;
    if (field.startsWith('monthly')) return (row.monthlyDays || 0) > this.monthlyLimit;
    if (field.startsWith('yearly')) return (row.yearlyDays || 0) > (this.monthlyLimit * 12);
    return false;
  }

  getColumnStyle(field: string): { [key: string]: string } {
    if (['empId', 'id'].includes(field)) return { 'width': '8%' };
    if (['status', 'eligible', 'approvalStatus'].includes(field)) return { 'width': '10%' };
    if (['joinDate', 'fromDate', 'toDate', 'date'].includes(field)) return { 'width': '12%' };
    if (['totalDays', 'days', 'years'].includes(field)) return { 'width': '8%' };
    if (['reason', 'remarks', 'detail', 'details'].includes(field)) return { 'width': '30%' };
    return {};
  }

  triggerPrint() {
    window.addEventListener('afterprint', () => {
      this.closeWindow();
    });
    window.print();
  }

  closeWindow() {
    window.history.back();
  }
}
