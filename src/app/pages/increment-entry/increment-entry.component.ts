import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeePickerComponent } from '../../shared/components/employee-picker/employee-picker.component';
import { Employee, IncrementRecord } from '../../core/models/employee.model';
import { EmployeeService } from '../../core/services/employee.service';
import { ExcelService, PreviewRow } from '../../core/services/excel.service';

interface SalaryLine {
  component: string;
  current: number;
  revised: string; // store as string to allow free typing; parse when computing totals
}

function defaultLines(basic: number): SalaryLine[] {
  const round = (n: number) => Math.round(n);
  return [
    { component: 'Basic', current: round(basic * 0.5), revised: String(round(basic * 0.5)) },
    { component: 'HRA', current: round(basic * 0.2), revised: String(round(basic * 0.2)) },
    { component: 'TA', current: round(basic * 0.05), revised: String(round(basic * 0.05)) },
    { component: 'CA', current: round(basic * 0.05), revised: String(round(basic * 0.05)) },
    { component: 'Other Allowance', current: round(basic * 0.1), revised: String(round(basic * 0.1)) },
    { component: 'F.Medical', current: round(basic * 0.05), revised: String(round(basic * 0.05)) },
    { component: 'V.Allowance', current: round(basic * 0.05), revised: String(round(basic * 0.05)) }
  ];
}

interface BulkEmployeeRow {
  employee: Employee;
  revisedSalary: number;
}

@Component({
  selector: 'app-increment-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeePickerComponent],
  templateUrl: './increment-entry.component.html',
  styleUrl: './increment-entry.component.scss'
})
export class IncrementEntryComponent {
  // Increment Type: 'single', 'bulk', or 'excel'
  readonly incrementType = signal<'single' | 'bulk' | 'excel'>('single');

  // Single Employee Mode
  readonly employee = signal<Employee | null>(null);
  readonly effectiveDate = signal('2026-06-10');
  readonly lines = signal<SalaryLine[]>([]);
  readonly saved = signal(false);
  readonly saveError = signal('');

  // Bulk Employee Mapping Mode
  readonly bulkIncrementAmount = signal('0');
  readonly bulkIncrementPercent = signal('');
  readonly bulkRemarks = signal('');
  readonly bulkSearch = signal('');
  readonly bulkDepartment = signal('');
  readonly bulkDesignation = signal('');
  readonly bulkSelectedEmpCodes = signal<string[]>([]);
  readonly incrementRecords = signal<IncrementRecord[]>([]);

  // Excel Upload Mode
  readonly excelFile = signal<File | null>(null);
  readonly previewRows = signal<PreviewRow[]>([]);
  readonly excelUploaded = signal(false);
  readonly excelError = signal('');
  readonly excelSuccess = signal(false);

  constructor(
    private employeeService: EmployeeService,
    private excelService: ExcelService
  ) {}

  onEmployeeSelected(emp: Employee | null) {
    this.employee.set(emp);
    this.saved.set(false);
    this.saveError.set('');
    this.lines.set(emp ? defaultLines(Math.round(emp.currentCtc / 12)) : []);
  }

  increase(line: SalaryLine): number {
    const rev = Number(line.revised);
    return (isNaN(rev) ? 0 : rev) - line.current;
  }

  increasePct(line: SalaryLine): number {
    const rev = Number(line.revised);
    return line.current ? Math.round((( (isNaN(rev) ? 0 : rev) - line.current) / line.current) * 1000) / 10 : 0;
  }

  applyPercentToAll(pct: number) {
    this.lines.update((lines: SalaryLine[]) =>
      lines.map((l: SalaryLine) => ({ ...l, revised: String(Math.round(l.current * (1 + pct / 100))) }))
    );
  }

  compareNumbers(revised: string, current: number): boolean {
    return Number(revised) !== current;
  }

  onRevisedChange(line: SalaryLine, value: string | number) {
    // Deprecated: kept for backward compatibility but not used by template
    const num = value === '' ? 0 : typeof value === 'number' ? value : Number(value);
    console.log('[IncrementEntry] onRevisedChange (legacy):', { component: line.component, raw: value, parsed: num });
    this.lines.update((lines) =>
      lines.map((l) => (l.component === line.component ? { ...l, revised: isNaN(num) ? l.revised : String(num) } : l))
    );
  }

  onRevisedInput(line: SalaryLine, ev: Event) {
    const raw = (ev.target as HTMLInputElement).value;
    // Update the existing object without recreating it
    this.lines.update((lines: SalaryLine[]) => {
      const updated = [...lines];
      const idx = updated.findIndex((l: SalaryLine) => l.component === line.component);
      if (idx >= 0) {
        updated[idx].revised = raw;
      }
      return updated;
    });
  }

  trackByComponent(_index: number, item: SalaryLine) {
    return item.component;
  }

  trackByEmployee(_index: number, item: Employee) {
    return item.empCode;
  }

  trackByBulkEmployeeRow(_index: number, item: BulkEmployeeRow) {
    return item.employee.empCode;
  }

  trackByPreviewRow(_index: number, item: PreviewRow) {
    return item.employeeCode;
  }

  onIncrementTypeChange(selectedType: 'single' | 'bulk' | 'excel') {
    this.incrementType.set(selectedType);
    this.saveError.set('');
    this.saved.set(false);
    if (selectedType === 'bulk') {
      this.employee.set(null);
      this.lines.set([]);
    } else if (selectedType === 'excel') {
      this.employee.set(null);
      this.lines.set([]);
      this.resetExcelUpload();
    }
  }

  // Filtered employees for bulk mode
  readonly filteredEmployees = computed(() => {
    const term = this.bulkSearch().trim().toLowerCase();
    const department = this.bulkDepartment();
    const designation = this.bulkDesignation();
    return this.employeeService.list().filter((emp: Employee) => {
      const matchesTerm =
        !term ||
        emp.empCode.toLowerCase().includes(term) ||
        emp.name.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term) ||
        emp.designation.toLowerCase().includes(term);
      const matchesDept = !department || emp.department === department;
      const matchesDesignation = !designation || emp.designation === designation;
      return matchesTerm && matchesDept && matchesDesignation;
    });
  });

  // Selected employees for bulk mode
  readonly selectedEmployees = computed(() =>
    this.employeeService.list().filter((emp: Employee) => this.bulkSelectedEmpCodes().includes(emp.empCode))
  );

  // Bulk employee rows with calculated revised salary per employee
  readonly bulkEmployeeRows = computed((): BulkEmployeeRow[] => {
    const increment = Number(this.bulkIncrementAmount());
    return this.filteredEmployees().map((emp: Employee) => ({
      employee: emp,
      revisedSalary: emp.currentCtc + increment
    }));
  });

  readonly totalSelected = computed(() => this.bulkSelectedEmpCodes().length);

  readonly bulkAverageCurrentSalary = computed((): number => {
    const selected = this.selectedEmployees();
    return selected.length
      ? Math.round(selected.reduce((sum: number, emp: Employee) => sum + emp.currentCtc, 0) / selected.length)
      : 0;
  });

  readonly bulkAverageRevisedSalary = computed((): number => {
    const increment = Number(this.bulkIncrementAmount());
    const selected = this.selectedEmployees();
    if (!selected.length || Number.isNaN(increment)) {
      return 0;
    }
    return Math.round(
      selected.reduce((sum: number, emp: Employee) => sum + emp.currentCtc + increment, 0) / selected.length
    );
  });

  getBulkIncrementAmount(): number {
    const value = Number(this.bulkIncrementAmount());
    return Number.isFinite(value) ? value : 0;
  }

  // Calculate revised salary for a specific employee
  calculateRevisedSalary(currentSalary: number): number {
    const increment = Number(this.bulkIncrementAmount());
    return currentSalary + increment;
  }

  isSelected(emp: Employee): boolean {
    return this.bulkSelectedEmpCodes().includes(emp.empCode);
  }

  toggleEmployeeSelection(emp: Employee, event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const checked = target?.checked ?? false;
    this.bulkSelectedEmpCodes.update((selected) => {
      const set = new Set(selected);
      if (checked) {
        set.add(emp.empCode);
      } else {
        set.delete(emp.empCode);
      }
      return Array.from(set);
    });
  }

  toggleSelectAll(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const checked = target?.checked ?? false;
    if (checked) {
      this.bulkSelectedEmpCodes.set(this.filteredEmployees().map((emp: Employee) => emp.empCode));
    } else {
      this.bulkSelectedEmpCodes.set([]);
    }
  }

  incrementDepartmentOptions(): string[] {
    return this.employeeService.departments();
  }

  incrementDesignationOptions(): string[] {
    return this.employeeService.designations();
  }

  // Single mode computed values
  readonly totalCurrent = computed(() => this.lines().reduce((s: number, l: SalaryLine) => s + l.current, 0));
  readonly totalRevised = computed(() =>
    this.lines().reduce((s: number, l: SalaryLine) => {
      const n = Number(l.revised);
      return s + (isNaN(n) ? 0 : n);
    }, 0)
  );
  readonly totalChangePct = computed((): number =>
    this.totalCurrent() ? Math.round(((this.totalRevised() - this.totalCurrent()) / this.totalCurrent()) * 1000) / 10 : 0
  );
  readonly netMonthly = computed((): number => Math.round(this.totalRevised() * 0.91)); // approx after standard deductions
  readonly annualCtc = computed((): number => this.totalRevised() * 12);

  save() {
    this.saved.set(false);
    this.saveError.set('');

    if (this.incrementType() === 'single') {
      if (!this.employee()) {
        this.saveError.set('Select an employee before saving.');
        return;
      }
      this.saved.set(true);
      return;
    }

    // Bulk mode validations
    const selected = this.selectedEmployees();
    if (!selected.length) {
      this.saveError.set('Please select at least one employee for bulk increment.');
      return;
    }

    const incrementAmount = Number(this.bulkIncrementAmount());
    if (Number.isNaN(incrementAmount) || incrementAmount <= 0) {
      this.saveError.set('Increment Amount must be greater than zero.');
      return;
    }

    const invalidSalary = selected.find((emp: Employee) => emp.currentCtc <= 0);
    if (invalidSalary) {
      this.saveError.set(`Employee ${invalidSalary.empCode} has invalid current salary and cannot be mapped.`);
      return;
    }

    const duplicateCodes = selected.filter((emp: Employee) =>
      this.incrementRecords().some(
        (record: IncrementRecord) => record.empCode === emp.empCode && record.increDate === this.effectiveDate()
      )
    );
    if (duplicateCodes.length) {
      this.saveError.set(
        `Increment already exists for ${duplicateCodes.length} selected employee(s) on ${this.effectiveDate()}.`
      );
      return;
    }

    const newRecords: IncrementRecord[] = selected.map((emp: Employee) => ({
      empCode: emp.empCode,
      name: emp.name,
      increDate: this.effectiveDate(),
      basic: emp.currentCtc,
      ta: 0,
      ca: 0,
      otherAl: 0,
      hra: 0,
      fMedi: 0,
      vAllo: 0,
      total: emp.currentCtc + incrementAmount,
      remarks: this.bulkRemarks() || undefined
    }));

    this.incrementRecords.update((records) => [...records, ...newRecords]);
    this.saved.set(true);
    this.bulkSelectedEmpCodes.set([]);
    return;
  }

  reset() {
    if (this.incrementType() === 'single' && this.employee()) {
      this.onEmployeeSelected(this.employee());
    }
    if (this.incrementType() === 'bulk') {
      this.bulkSelectedEmpCodes.set([]);
      this.bulkIncrementAmount.set('0');
      this.bulkIncrementPercent.set('');
      this.bulkRemarks.set('');
      this.bulkSearch.set('');
      this.bulkDepartment.set('');
      this.bulkDesignation.set('');
      this.saved.set(false);
      this.saveError.set('');
    }
    if (this.incrementType() === 'excel') {
      this.resetExcelUpload();
    }
  }

  // Excel Upload Methods

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.excelError.set('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    this.excelFile.set(file);
    this.excelError.set('');
    this.excelSuccess.set(false);
  }

  async uploadAndPreview(): Promise<void> {
    const file = this.excelFile();
    if (!file) {
      this.excelError.set('Please select a file first');
      return;
    }

    try {
      this.excelError.set('');
      // Parse the Excel file
      const uploadRows = await this.excelService.parseExcelFile(file);
      
      if (uploadRows.length === 0) {
        this.excelError.set('No data found in the Excel file. Please ensure the file has data rows.');
        return;
      }

      // Get employee data for validation
      const employees = this.employeeService.list().map(emp => ({
        empCode: emp.empCode,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        currentCtc: emp.currentCtc,
        status: emp.status
      }));

      // Get existing increment records for duplicate check
      const existingIncrements = this.incrementRecords().map(rec => ({
        empCode: rec.empCode,
        increDate: rec.increDate
      }));

      // Validate rows
      const previewRows = this.excelService.validateRows(
        uploadRows,
        employees,
        existingIncrements,
        this.effectiveDate()
      );

      this.previewRows.set(previewRows);
      this.excelUploaded.set(true);
      this.excelSuccess.set(false);

      const summary = this.excelService.getSummary(previewRows);
      if (summary.invalid > 0) {
        this.excelError.set(`${summary.invalid} record(s) have validation errors. Please review the preview.`);
      }
    } catch (error) {
      this.excelError.set('Error processing file: ' + (error as Error).message);
    }
  }

  downloadTemplate(): void {
    this.excelService.downloadTemplate();
  }

  downloadErrorReport(): void {
    const invalidRows = this.previewRows().filter(row => row.status === 'invalid');
    if (invalidRows.length === 0) {
      this.excelError.set('No error records to download');
      return;
    }
    this.excelService.downloadErrorReport(this.previewRows());
  }

  resetExcelUpload(): void {
    this.excelFile.set(null);
    this.previewRows.set([]);
    this.excelUploaded.set(false);
    this.excelError.set('');
    this.excelSuccess.set(false);
  }

  saveBulkExcelIncrement(): void {
    const previewRows = this.previewRows();
    const validRows = previewRows.filter(row => row.status === 'valid');

    if (validRows.length === 0) {
      this.saveError.set('No valid records to save. Please fix the errors in the preview.');
      return;
    }

    // Create increment records for valid employees
    const newRecords: IncrementRecord[] = validRows.map(row => ({
      empCode: row.employeeCode,
      name: row.employeeName,
      increDate: row.effectiveDate,
      basic: row.currentSalary,
      ta: 0,
      ca: 0,
      otherAl: 0,
      hra: 0,
      fMedi: 0,
      vAllo: 0,
      total: row.revisedSalary,
      remarks: row.remarks || undefined
    }));

    this.incrementRecords.update((records) => [...records, ...newRecords]);
    this.saved.set(true);
    this.excelSuccess.set(true);
    this.excelError.set('');
    
    // Reset the upload state but keep the preview for reference
    this.excelFile.set(null);
  }

  getExcelSummary() {
    return this.excelService.getSummary(this.previewRows());
  }
}
