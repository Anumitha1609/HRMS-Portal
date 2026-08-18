import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EMPLOYEE_MASTER, EmployeeMaster } from '../../data/employee-data';
import { ToastService } from '../../services/toast.service';

interface SalaryReviewRow {
  empCode: string;
  name: string;
  category: string;
  location: string;
  department: string;
  designation: string;
  monthlyCtc: number;
  basic: number;
  hra: number;
  allowance: number;
  deductions: number;
  netPay: number;
}

@Component({
  selector: 'app-salary-removal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './salary-removal.component.html',
  styleUrls: ['./salary-removal.component.scss'],
})
export class SalaryRemovalComponent {
  constructor(private readonly cdr: ChangeDetectorRef, private readonly toast: ToastService) {}

  readonly categories = ['Employee', 'Contract Staff', 'All'];
  readonly locations = ['All', 'Domestic', 'Acer Project'];
  readonly pageSizeOptions = [10, 20, 50, 100];

  category = 'Employee';
  location = 'All';
  startDate = this.monthStartISO();
  endDate = this.monthEndISO();
  employeeId = '';
  employeeName = '';

  reviewed = false;
  removed = false;
  confirmOpen = false;

  selectedCodes: string[] = [];
  removedCodes: string[] = [];

  pageSize = 20;
  pageNumber = 1;

  private monthStartISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private monthEndISO(): string {
    const d = new Date();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return end.toISOString().slice(0, 10);
  }

  private toSalaryRow(employee: EmployeeMaster): SalaryReviewRow {
    const { basic, hra, conveyance, otherAllowance } = employee.earnings;
    const { pf, professionalTax, incomeTax } = employee.deductions;
    const monthlyCtc = basic + hra + conveyance + otherAllowance;
    const deductions = pf + professionalTax + incomeTax;

    return {
      empCode: employee.empCode,
      name: employee.empName,
      category: employee.category,
      location: employee.location,
      department: employee.department,
      designation: employee.designation,
      monthlyCtc,
      basic,
      hra,
      allowance: conveyance + otherAllowance,
      deductions,
      netPay: monthlyCtc - deductions,
    };
  }

  // ----- Derived values -----

  get reviewRows(): SalaryReviewRow[] {
    if (!this.reviewed) return [];
    const id = this.employeeId.trim().toLowerCase();
    const name = this.employeeName.trim().toLowerCase();
    const removed = new Set(this.removedCodes);

    return EMPLOYEE_MASTER.filter((employee) => {
      if (removed.has(employee.empCode)) return false;
      if (this.category !== 'All' && employee.category !== this.category) return false;
      if (this.location !== 'All' && employee.location !== this.location) return false;
      if (id && !employee.empCode.toLowerCase().includes(id)) return false;
      if (name && !employee.empName.toLowerCase().includes(name)) return false;
      return true;
    }).map((employee) => this.toSalaryRow(employee));
  }

  get selectedRows(): SalaryReviewRow[] {
    const selected = new Set(this.selectedCodes);
    return this.reviewRows.filter((row) => selected.has(row.empCode));
  }

  get totalNetPay(): number {
    return this.reviewRows.reduce((sum, row) => sum + row.netPay, 0);
  }

  get selectedNetPay(): number {
    return this.selectedRows.reduce((sum, row) => sum + row.netPay, 0);
  }

  get totalRecords(): number {
    return this.reviewRows.length;
  }

  get pagedRows(): SalaryReviewRow[] {
    const all = this.reviewRows;
    const size = this.pageSize;
    const page = Math.max(1, this.pageNumber);
    const start = (page - 1) * size;
    return all.slice(start, start + size);
  }

  get pagesCount(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  get summary() {
    return [
      { label: 'Category', value: this.category },
      { label: 'Location', value: this.location },
      { label: 'Period', value: `${this.startDate} to ${this.endDate}` },
      { label: 'Selected Employees', value: this.selectedRows.length.toString() },
      { label: 'Selected Net Pay', value: this.formatCurrency(this.selectedNetPay) },
    ];
  }

  // ----- Actions -----

  clearFilter(): void {
    this.category = 'Employee';
    this.location = 'All';
    this.employeeId = '';
    this.employeeName = '';
    this.removed = false;
    this.reviewed = false;
    this.selectedCodes = [];
    this.pageNumber = 1;
  }

  reviewSalary(): void {
    this.reviewed = true;
    this.removed = false;
    this.selectedCodes = [];
    this.pageNumber = 1;
  }

  setPageSize(size: number): void {
    this.pageSize = Number(size);
    this.pageNumber = 1;
  }

  gotoPage(p: number): void {
    const max = this.pagesCount;
    this.pageNumber = Math.min(max, Math.max(1, p));
  }

  openConfirm(): void {
    if (!this.selectedRows.length) return;
    this.confirmOpen = true;
  }

  cancelConfirm(): void {
    this.confirmOpen = false;
  }

  confirmRemoval(): void {
    const selected = this.selectedRows.map((row) => row.empCode);
    this.confirmOpen = false;
    this.removedCodes = Array.from(new Set([...this.removedCodes, ...selected]));
    this.selectedCodes = [];
    this.removed = true;
    this.toast.success(`Salary removed for ${selected.length} employee record(s).`);
    this.cdr.detectChanges();
  }

  toggleSelection(empCode: string, checked: boolean): void {
    this.selectedCodes = checked
      ? Array.from(new Set([...this.selectedCodes, empCode]))
      : this.selectedCodes.filter((code) => code !== empCode);
  }

  toggleAll(checked: boolean): void {
    this.selectedCodes = checked ? this.reviewRows.map((row) => row.empCode) : [];
  }

  isSelected(empCode: string): boolean {
    return this.selectedCodes.includes(empCode);
  }

  allSelected(): boolean {
    return !!this.reviewRows.length && this.selectedRows.length === this.reviewRows.length;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }
}
