import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SalaryService, SalaryRecord, EmployeeProfile } from '../../../services/reports/salary.service';
import { FiltersComponent } from '../../../shared/reports/filters/filters.component';
import { CardsComponent, SummaryCard } from '../../../shared/reports/cards/cards.component';
import { TablesComponent, TableHeader } from '../../../shared/reports/tables/tables.component';
import { ExportUtil } from '../../../shared/reports/utils/export-util';
import { ReportPrintService } from '../../../services/reports/report-print.service';

declare var Chart: any; // Reference the global Chart.js from index.html

@Component({
  selector: 'app-salary',
  standalone: true,
  imports: [CommonModule, FiltersComponent, CardsComponent, TablesComponent],
  templateUrl: './salary.component.html',
  styleUrls: ['./salary.component.scss']
})
export class SalaryComponent implements OnInit, OnDestroy, AfterViewInit {
  reportId = 'payroll';
  metadata: any = {};
  reportData: SalaryRecord[] = [];
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
    month: '05',
    year: '2026',
    employee: 'All',
    department: 'All',
    designation: 'All',
    location: 'All',
    unit: 'All',
    category: 'All',
    empstatus: 'All',
    payrollstatus: 'All'
  };

  // Special view states
  employees: EmployeeProfile[] = [];
  selectedEmpId = 'EDS001';
  selectedEmployee: EmployeeProfile | null = null;
  payslipData: any = null;

  // Chart instances
  chart1: any = null;
  chart2: any = null;

  // Toast notification state
  toastMessage = '';
  showToast = false;
  toastIcon = 'fa-circle-check';

  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private salaryService: SalaryService,
    private reportPrintService: ReportPrintService
  ) {}

  ngOnInit() {
    this.employees = this.salaryService.getEmployeeList();
    this.selectedEmployee = this.employees[0];
    
    this.routeSub = this.route.url.subscribe(url => {
      if (url.length > 0) {
        this.reportId = url[0].path;
      } else {
        this.reportId = 'payroll';
      }
      
      this.resetState();
      this.loadReport();
      
      // Re-trigger chart rendering if view is already initialized
      setTimeout(() => this.renderCharts(), 50);
    });

    // Handle query params if any (e.g., ?empId=EDS002 for payslip)
    this.route.queryParams.subscribe(params => {
      if (params['empId']) {
        this.selectedEmpId = params['empId'];
        this.selectedEmployee = this.salaryService.getEmployeeById(this.selectedEmpId) || this.employees[0];
        this.calculatePayslip();
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    this.destroyCharts();
  }

  ngAfterViewInit() {
    this.renderCharts();
  }

  resetState() {
    this.page = 1;
    this.searchQuery = '';
    this.sortKey = '';
    this.sortDir = 'asc';
    
    this.filters = {
      month: '05',
      year: '2026',
      employee: 'All',
      department: 'All',
      designation: 'All',
      location: 'All',
      unit: 'All',
      category: 'All',
      empstatus: 'All',
      payrollstatus: 'All'
    };
  }

  loadReport() {
    if (this.reportId === 'payslip') {
      this.calculatePayslip();
      return;
    }

    this.metadata = this.salaryService.getReportMetadata(this.reportId);
    const result = this.salaryService.getReportData(
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

  // Filter change trigger
  onFilterChange(updatedFilters: any) {
    this.filters = { ...updatedFilters };
    if (this.reportId === 'payslip' && this.filters.employee && this.filters.employee !== 'All') {
      const employeeValue = this.filters.employee;
      const employee = this.salaryService.getEmployeeById(employeeValue) ||
        this.salaryService.getEmployeeList().find(e => e.name.toLowerCase() === String(employeeValue).toLowerCase());

      if (employee) {
        this.selectedEmpId = employee.id;
        this.selectedEmployee = employee;
      } else {
        this.selectedEmpId = String(employeeValue);
        this.selectedEmployee = this.salaryService.getEmployeeById(this.selectedEmpId) || this.employees[0];
      }

      this.calculatePayslip();
    }
  }

  onGenerateReport() {
    this.page = 1;
    this.loadReport();
    this.renderCharts();
    this.triggerToast('Report refreshed with active filters.');
  }

  onResetFilters() {
    this.resetState();
    this.loadReport();
    this.renderCharts();
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
    if (this.reportId !== 'payslip') {
      const result = this.salaryService.getReportData(
        this.reportId,
        this.filters,
        this.searchQuery,
        1,
        10000,
        this.sortKey,
        this.sortDir
      );
      exportData = result.data;
    }
    
    const filename = `${(this.metadata.title || 'Salary').replace(/\s+/g, '_')}_Report`;

    setTimeout(() => {
      if (format === 'print' || format === 'pdf') {
        const empId = (this.reportId === 'payslip') ? this.selectedEmpId : undefined;
        this.reportPrintService.printReport(
          'salary',
          this.reportId,
          this.filters,
          this.searchQuery,
          this.sortKey,
          this.sortDir,
          empId
        );
      } else if (format === 'excel') {
        ExportUtil.exportToExcel(this.metadata.headers || [], exportData, filename);
        this.triggerToast(`Excel export completed.`);
      } else if (format === 'csv') {
        ExportUtil.exportToCSV(this.metadata.headers || [], exportData, filename);
        this.triggerToast(`CSV export completed.`);
      }
    }, 800);
  }

  // Mock excel uploader integration
  onExcelImport(importedRows: any[]) {
    if (!importedRows || importedRows.length === 0) return;
    this.salaryService.importExcel(this.reportId, importedRows);
    this.loadReport();
    this.renderCharts();
    this.triggerToast(`Successfully imported ${importedRows.length} records into ${this.metadata.title}.`);
  }

  // Row selection triggers
  onRowSelect(row: any) {
    // If we click on a row in payroll/consolidated/bankcredit, let's offer to view their payslip
    const empId = row.id;
    if (empId) {
      this.router.navigate(['/reports/salary/payslip'], { queryParams: { empId } });
    }
  }

  // Special Payslip Calculator
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

  onEmployeeSelect(event: Event) {
    this.selectedEmpId = (event.target as HTMLSelectElement).value;
    this.selectedEmployee = this.salaryService.getEmployeeById(this.selectedEmpId) || this.employees[0];
    this.calculatePayslip();
  }

  // Dynamic Chart.js visualizations
  renderCharts() {
    this.destroyCharts();

    const chartCanvas1 = document.getElementById('chartCanvas1') as HTMLCanvasElement;
    const chartCanvas2 = document.getElementById('chartCanvas2') as HTMLCanvasElement;

    if (!chartCanvas1 || !chartCanvas2) return;

    const ctx1 = chartCanvas1.getContext('2d');
    const ctx2 = chartCanvas2.getContext('2d');

    if (!ctx1 || !ctx2) return;

    if (this.reportId === 'salarysummary') {
      const labels = this.reportData.map(r => r.department || '');
      const dataNet = this.reportData.map(r => r.net || 0);
      const dataCount = this.reportData.map(r => r.count || 0);

      this.chart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Net Disbursed (₹)',
            data: dataNet,
            backgroundColor: '#2563eb',
            hoverBackgroundColor: '#1d4ed8',
            borderRadius: 8,
            barPercentage: 0.55
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 12,
              cornerRadius: 8,
              titleFont: { family: 'Inter, system-ui, sans-serif', size: 11, weight: 'bold' },
              bodyFont: { family: 'Inter, system-ui, sans-serif', size: 11 },
              displayColors: false
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Inter, system-ui, sans-serif', size: 10, weight: '500' }, color: '#64748b' }
            },
            y: {
              grid: { color: '#f1f5f9', drawBorder: false },
              ticks: { font: { family: 'Inter, system-ui, sans-serif', size: 10 }, color: '#64748b' }
            }
          }
        }
      });

      this.chart2 = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: dataCount,
            backgroundColor: ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 8,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { family: 'Inter, system-ui, sans-serif', size: 10, weight: '600' },
                color: '#475569'
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 12,
              cornerRadius: 8,
              titleFont: { family: 'Inter, system-ui, sans-serif', size: 11, weight: 'bold' },
              bodyFont: { family: 'Inter, system-ui, sans-serif', size: 11 }
            }
          },
          cutout: '65%'
        }
      });
    } 
    else if (this.reportId === 'salaryabstract') {
      const labels = this.reportData.map(r => r.head || '');
      const dataEarn = this.reportData.map(r => r.earnings || 0);
      const dataDed = this.reportData.map(r => r.deductions || 0);

      this.chart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: labels.filter((_, i) => dataEarn[i] > 0),
          datasets: [{
            label: 'Earnings Components (₹)',
            data: dataEarn.filter(v => v > 0),
            backgroundColor: '#10b981',
            hoverBackgroundColor: '#047857',
            borderRadius: 8,
            barPercentage: 0.55
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 12,
              cornerRadius: 8,
              titleFont: { family: 'Inter, system-ui, sans-serif', size: 11, weight: 'bold' },
              bodyFont: { family: 'Inter, system-ui, sans-serif', size: 11 },
              displayColors: false
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Inter, system-ui, sans-serif', size: 10, weight: '500' }, color: '#64748b' }
            },
            y: {
              grid: { color: '#f1f5f9', drawBorder: false },
              ticks: { font: { family: 'Inter, system-ui, sans-serif', size: 10 }, color: '#64748b' }
            }
          }
        }
      });

      this.chart2 = new Chart(ctx2, {
        type: 'pie',
        data: {
          labels: labels.filter((_, i) => dataDed[i] > 0),
          datasets: [{
            data: dataDed.filter(v => v > 0),
            backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#64748b'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 8,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { family: 'Inter, system-ui, sans-serif', size: 10, weight: '600' },
                color: '#475569'
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 12,
              cornerRadius: 8,
              titleFont: { family: 'Inter, system-ui, sans-serif', size: 11, weight: 'bold' },
              bodyFont: { family: 'Inter, system-ui, sans-serif', size: 11 }
            }
          }
        }
      });
    }
    else if (this.reportId === 'unitgrade' || this.reportId === 'functionalunit') {
      const labels = this.reportData.map(r => r.unit || '');
      const dataGross = this.reportData.map(r => r.gross || 0);
      const dataNet = this.reportData.map(r => r.net || 0);

      this.chart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Gross Budget (₹)', data: dataGross, backgroundColor: '#818cf8', hoverBackgroundColor: '#4f46e5', borderRadius: 6, barPercentage: 0.5, categoryPercentage: 0.8 },
            { label: 'Net Disbursed (₹)', data: dataNet, backgroundColor: '#34d399', hoverBackgroundColor: '#059669', borderRadius: 6, barPercentage: 0.5, categoryPercentage: 0.8 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 8,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { family: 'Inter, system-ui, sans-serif', size: 10, weight: '600' },
                color: '#475569'
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 12,
              cornerRadius: 8,
              titleFont: { family: 'Inter, system-ui, sans-serif', size: 11, weight: 'bold' },
              bodyFont: { family: 'Inter, system-ui, sans-serif', size: 11 }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Inter, system-ui, sans-serif', size: 10, weight: '500' }, color: '#64748b' }
            },
            y: {
              grid: { color: '#f1f5f9', drawBorder: false },
              ticks: { font: { family: 'Inter, system-ui, sans-serif', size: 10 }, color: '#64748b' }
            }
          }
        }
      });

      this.chart2 = new Chart(ctx2, {
        type: 'polarArea',
        data: {
          labels,
          datasets: [{
            data: this.reportData.map(r => r.count || 1),
            backgroundColor: ['rgba(37, 99, 235, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(239, 68, 68, 0.8)'],
            borderWidth: 1,
            borderColor: '#e2e8f0'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 8,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { family: 'Inter, system-ui, sans-serif', size: 10, weight: '600' },
                color: '#475569'
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              padding: 12,
              cornerRadius: 8,
              titleFont: { family: 'Inter, system-ui, sans-serif', size: 11, weight: 'bold' },
              bodyFont: { family: 'Inter, system-ui, sans-serif', size: 11 }
            }
          },
          scales: {
            r: {
              grid: { color: '#f1f5f9' },
              ticks: { display: false }
            }
          }
        }
      });
    }
  }

  destroyCharts() {
    if (this.chart1) {
      this.chart1.destroy();
      this.chart1 = null;
    }
    if (this.chart2) {
      this.chart2.destroy();
      this.chart2 = null;
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
