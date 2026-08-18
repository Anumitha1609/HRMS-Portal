import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api';
import {
  AssignmentHistoryEntry,
  CardRecord,
  Employee,
  EmployeeRow,
  ForgotCardRecord,
  RecordStatus,
  ToastMessage,
} from './forgot-card.models';
import { CURRENT_HR_USER, MOCK_EMPLOYEES, PAGE_SIZE } from './forgot-card.constants';

// ─── Date helpers ───────────────────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function computeStatus(validUntil: string): 'Active' | 'Expired' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(validUntil);
  exp.setHours(0, 0, 0, 0);
  return exp >= today ? 'Active' : 'Expired';
}

/**
 * - No record                          -> Active
 * - Record mapped, validUntil lapsed   -> Expired
 * - Record mapped, within validity     -> Temporary Assigned
 */
function deriveStatus(record?: CardRecord): RecordStatus {
  if (!record) return 'Active';
  if (record.validUntil && computeStatus(record.validUntil) === 'Expired') return 'Expired';
  return 'Temporary Assigned';
}

@Component({
  selector: 'app-forgot-card',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './forgot-card.html',
  styleUrl: './forgot-card.scss',
})
export class ForgotCard implements OnInit, OnDestroy {
  readonly PAGE_SIZE = PAGE_SIZE;
  readonly today = this.getToday();

  // ── Directory data ─────────────────────────────────────────────────────
  employees: Employee[] = MOCK_EMPLOYEES;

  // ── Filter / pagination / selection ────────────────────────────────────
  search = '';
  departmentFilter = '';
  statusFilter = '';
  page = 1;
  selectedCode: string | null = null;

  // ── Card records & history ─────────────────────────────────────────────
  cardRecords: Record<string, CardRecord> = {};
  history: AssignmentHistoryEntry[] = [];

  // ── Panel / form state ──────────────────────────────────────────────────
  mode: 'forgot' | 'returned' | null = null;
  tempForm: FormGroup;
  mapped = false;
  saving = false;
  globalError = '';
  showConfirm = false;

  // ── Toasts (lightweight replacement for the React "sonner" toasts) ─────
  toasts: ToastMessage[] = [];
  private toastSeq = 0;
  private toastTimers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.tempForm = this.fb.group({
      temporaryCardNumber: ['', [Validators.required]],
      assignedDate: [this.today, [Validators.required]],
      validUntil: [addDays(this.today, 3), [Validators.required]],
      remarks: [''],
    });

    // Keep "Valid Until" auto-advancing 3 days from "Assigned Date", and
    // clear the "mapped" flag whenever the card number changes — mirrors
    // the React onChange handlers.
    this.tempForm.get('assignedDate')!.valueChanges.subscribe((newDate: string) => {
      if (newDate) {
        this.tempForm.get('validUntil')!.setValue(addDays(newDate, 3), { emitEvent: false });
      }
    });
    this.tempForm.get('temporaryCardNumber')!.valueChanges.subscribe(() => {
      this.mapped = false;
    });
  }

  ngOnInit(): void {
    // In a real app, fetch employees from a service here instead of MOCK_EMPLOYEES.
  }

  ngOnDestroy(): void {
    this.toastTimers.forEach(t => clearTimeout(t));
  }

  // ── Date helpers exposed to template ────────────────────────────────────
  formatDisplayDate = formatDisplayDate;
  computeStatus = computeStatus;

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ── Derived rows ─────────────────────────────────────────────────────────
  get rows(): EmployeeRow[] {
    return this.employees.map(employee => {
      const record = this.cardRecords[employee.employeeCode];
      return { employee, record, status: deriveStatus(record) };
    });
  }

  get departmentOptions(): string[] {
    const set = new Set<string>();
    this.employees.forEach(emp => {
      if (emp.department) set.add(emp.department);
    });
    return Array.from(set).sort();
  }

  get filteredRows(): EmployeeRow[] {
    const q = this.search.trim().toLowerCase();
    return this.rows.filter(r => {
      const matchesSearch =
        !q ||
        r.employee.employeeName.toLowerCase().includes(q) ||
        r.employee.employeeCode.toLowerCase().includes(q);
      const matchesDept = !this.departmentFilter || r.employee.department === this.departmentFilter;
      const matchesStatus = !this.statusFilter || r.status === this.statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.PAGE_SIZE));
  }

  get pagedRows(): EmployeeRow[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filteredRows.slice(start, start + this.PAGE_SIZE);
  }

  get selectedRow(): EmployeeRow | null {
    if (!this.selectedCode) return null;
    return this.rows.find(r => r.employee.employeeCode === this.selectedCode) || null;
  }

  get employeeHistory(): AssignmentHistoryEntry[] {
    const row = this.selectedRow;
    if (!row) return [];
    return this.history
      .filter(h => h.employeeCode === row.employee.employeeCode)
      .slice(-5)
      .reverse();
  }

  get detailsOpen(): boolean {
    return !!this.selectedRow;
  }

  get isAlreadyTemporaryAssigned(): boolean {
    return this.selectedRow?.status === 'Temporary Assigned';
  }

  get validUntilStatus(): 'Active' | 'Expired' | null {
    const v = this.tempForm.get('validUntil')!.value;
    return v ? computeStatus(v) : null;
  }

  // ── Row / filter interaction ────────────────────────────────────────────
  handleRowClick(employeeCode: string): void {
    if (this.selectedCode === employeeCode) {
      this.selectedCode = null;
      this.mode = null;
      this.globalError = '';
    } else {
      this.selectedCode = employeeCode;
      this.mode = null;
      this.globalError = '';
    }
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.page = 1;
  }

  onDepartmentFilterChange(value: string): void {
    this.departmentFilter = value;
    this.page = 1;
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter = value;
    this.page = 1;
  }

  goToPage(delta: number): void {
    this.page = Math.min(this.totalPages, Math.max(1, this.page + delta));
  }

  // ── Reset temp card form (keeps selected employee) ──────────────────────
  handleResetForm(): void {
    this.tempForm.reset({
      temporaryCardNumber: '',
      assignedDate: this.today,
      validUntil: addDays(this.today, 3),
      remarks: '',
    });
    this.mapped = false;
    this.globalError = '';
  }

  // ── Reset Selection (clears everything back to initial state) ───────────
  handleResetSelection(): void {
    this.selectedCode = null;
    this.mode = null;
    this.search = '';
    this.departmentFilter = '';
    this.statusFilter = '';
    this.page = 1;
    this.handleResetForm();
  }

  // ── Forgot Card ──────────────────────────────────────────────────────────
  handleForgotCardClick(): void {
    if (!this.selectedRow) return;
    this.mode = 'forgot';
    this.tempForm.reset({
      temporaryCardNumber: '',
      assignedDate: this.today,
      validUntil: addDays(this.today, 3),
      remarks: '',
    });
    this.mapped = false;
    this.globalError = '';
  }

  private findConflictingAssignment(cardNumber: string, excludeEmployeeCode: string): CardRecord | undefined {
    return Object.values(this.cardRecords).find(
      r =>
        r.employeeCode !== excludeEmployeeCode &&
        r.temporaryCardNumber.trim().toLowerCase() === cardNumber.trim().toLowerCase() &&
        deriveStatus(r) === 'Temporary Assigned'
    );
  }

  handleMapTemporaryCard(): void {
    const row = this.selectedRow;
    if (!row) return;
    if (this.isAlreadyTemporaryAssigned) {
      this.pushToast('error', 'This employee already has an active temporary card. Please process a return first.');
      return;
    }
    const cardNumber = (this.tempForm.get('temporaryCardNumber')!.value || '').trim();
    if (!cardNumber) {
      this.pushToast('error', 'Please enter a Temporary Card Number before mapping.');
      return;
    }
    const conflict = this.findConflictingAssignment(cardNumber, row.employee.employeeCode);
    if (conflict) {
      this.pushToast('error', `Card ${cardNumber} is already assigned to another employee.`);
      return;
    }
    this.mapped = true;
    this.pushToast('success', `Card ${cardNumber} mapped successfully.`);
  }

  async handleSaveTemporaryCard(): Promise<void> {
    const row = this.selectedRow;
    if (!row) return;
    const { employee } = row;

    this.tempForm.markAllAsTouched();

    const value = this.tempForm.value;
    if (this.tempForm.get('temporaryCardNumber')!.invalid) return;
    if (this.tempForm.get('assignedDate')!.invalid) return;
    if (this.tempForm.get('validUntil')!.invalid) return;
    if (value.assignedDate && value.validUntil && value.validUntil < value.assignedDate) {
      this.tempForm.get('validUntil')!.setErrors({ beforeAssignedDate: true });
      return;
    }

    if (this.isAlreadyTemporaryAssigned) {
      this.globalError =
        'This employee already has an active temporary card. Please process a return before assigning a new one.';
      return;
    }

    const cardNumber = (value.temporaryCardNumber as string).trim();
    const conflict = this.findConflictingAssignment(cardNumber, employee.employeeCode);
    if (conflict) {
      this.globalError = `Card ${cardNumber} is already assigned to another employee.`;
      return;
    }

    this.saving = true;
    this.globalError = '';

    const payload: ForgotCardRecord = {
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      originalCardNumber: employee.originalCardNumber || '',
      temporaryCardNumber: cardNumber,
      date: value.assignedDate,
      employeePhoto: employee.photo,
    };

    try {
      await this.apiService.saveForgotCard(payload);

      this.cardRecords = {
        ...this.cardRecords,
        [employee.employeeCode]: {
          employeeCode: employee.employeeCode,
          originalCardNumber: employee.originalCardNumber || '',
          temporaryCardNumber: cardNumber,
          assignedDate: value.assignedDate,
          validUntil: value.validUntil,
          remarks: (value.remarks || '').trim(),
          status: 'Temporary Assigned',
        },
      };

      this.history = [
        ...this.history,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          employeeCode: employee.employeeCode,
          employeeName: employee.employeeName,
          originalCardNumber: employee.originalCardNumber || '',
          temporaryCardNumber: cardNumber,
          assignedDate: value.assignedDate,
          returnedDate: null,
          hrUser: CURRENT_HR_USER,
          remarks: (value.remarks || '').trim(),
        },
      ];

      this.pushToast('success', `Temporary card assigned successfully to ${employee.employeeName}.`);
      this.mode = null;
      this.mapped = false;
    } catch (error: any) {
      this.globalError = error?.message || 'Unable to save temporary card assignment. Please try again.';
    } finally {
      this.saving = false;
    }
  }

  // ── Employee Returned Card ──────────────────────────────────────────────
  handleReturnedCardClick(): void {
    if (!this.selectedRow || this.selectedRow.status !== 'Temporary Assigned') return;
    this.mode = 'returned';
    this.globalError = '';
  }

  handleRevertConfirmed(): void {
    const row = this.selectedRow;
    if (!row || !row.record) return;
    const { employee, record } = row;

    const next = { ...this.cardRecords };
    delete next[employee.employeeCode];
    this.cardRecords = next;

    this.history = this.history.map(h =>
      h.employeeCode === employee.employeeCode &&
      h.temporaryCardNumber === record.temporaryCardNumber &&
      h.returnedDate === null
        ? { ...h, returnedDate: this.today }
        : h
    );

    this.pushToast('success', `${employee.employeeName} has been reverted to the original card.`);
    this.showConfirm = false;
    this.mode = null;
  }

  // ── Toasts ───────────────────────────────────────────────────────────────
  private pushToast(type: 'success' | 'error', text: string): void {
    const id = ++this.toastSeq;
    this.toasts = [...this.toasts, { id, type, text }];
    const timer = setTimeout(() => this.dismissToast(id), 3200);
    this.toastTimers.set(id, timer);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    const timer = this.toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.toastTimers.delete(id);
    }
  }

  // ── Template helpers ────────────────────────────────────────────────────
  statusClass(status: string): string {
    return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  }

  trackByEmployeeCode(_index: number, row: EmployeeRow): string {
    return row.employee.employeeCode;
  }

  trackByHistoryId(_index: number, h: AssignmentHistoryEntry): string {
    return h.id;
  }
}