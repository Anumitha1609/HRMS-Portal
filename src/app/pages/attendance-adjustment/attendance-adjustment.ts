import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

const PAGE_SIZE = 10;

// ----- Types (mirrors AttendanceAdjustmentRecord from the original React types) -----

export interface AttendanceAdjustmentRecord {
  id: string;
  employeeCode: string;
  employeeName: string;
  tLDays: number;
  alopDays: number;
  adjDays: number;
  employeeType?: 'NEW' | 'EXISTING';
  photo?: string | null;
  location?: string | null;
  department?: string | null;
  division?: string | null;
  dateOfJoining?: string | null;
}

interface EditForm {
  tLDays: number;
  alopDays: number;
  adjDays: number;
}

interface LeaveMetrics {
  eligible: number;
  used: number;
  remaining: number;
}

interface EligibleLeave {
  value: number;
  label: string;
}

interface AttendanceAdjustmentFetchResult {
  records: AttendanceAdjustmentRecord[];
}

/**
 * Placeholder API call - frontend only.
 * Returns demo data so the UI is fully browsable without a backend.
 * Wire this up to the real endpoint (e.g. via HttpClient) without changing
 * the calling contract used by handleFetch() below.
 */
async function fetchAttendanceAdjustmentRecords(month: string): Promise<AttendanceAdjustmentFetchResult> {
  // TODO: replace with a real API call, e.g.:
  // return firstValueFrom(this.http.get<AttendanceAdjustmentFetchResult>(`/api/attendance-adjustment?month=${month}`));
  await new Promise(resolve => setTimeout(resolve, 400));

  const mockRecords: AttendanceAdjustmentRecord[] = [
    {
      id: '1',
      employeeCode: 'EMP001',
      employeeName: 'Arun Kumar',
      tLDays: 1.5,
      alopDays: 0.5,
      adjDays: 1,
      employeeType: 'EXISTING',
      location: 'Head Office',
      department: 'Operations',
      division: 'Attendance',
      dateOfJoining: '2021-03-10',
    },
    {
      id: '2',
      employeeCode: 'EMP002',
      employeeName: 'Priya Sharma',
      tLDays: 0.5,
      alopDays: 0,
      adjDays: 0,
      employeeType: 'EXISTING',
      location: 'Head Office',
      department: 'Operations',
      division: 'Attendance',
      dateOfJoining: '2022-01-15',
    },
    {
      id: '3',
      employeeCode: 'EMP003',
      employeeName: 'Rajan Nair',
      tLDays: 0.5,
      alopDays: 0.5,
      adjDays: 0,
      employeeType: 'EXISTING',
      location: 'Branch Office',
      department: 'Finance',
      division: 'Payroll',
      dateOfJoining: '2020-07-22',
    },
    {
      id: '4',
      employeeCode: 'EMP004',
      employeeName: 'Meena Devi',
      tLDays: 1.5,
      alopDays: 0,
      adjDays: 0,
      employeeType: 'NEW',
      location: 'Head Office',
      department: 'Human Resources',
      division: 'Recruitment',
      dateOfJoining: '2026-02-01',
    },
    {
      id: '5',
      employeeCode: 'EMP005',
      employeeName: 'Suresh Babu',
      tLDays: 0.5,
      alopDays: 0.5,
      adjDays: 1,
      employeeType: 'EXISTING',
      location: 'Branch Office',
      department: 'IT',
      division: 'Support',
      dateOfJoining: '2019-11-05',
    },
  ];

  // Demo data is month-agnostic here; hook up real filtering once the
  // backend endpoint above is wired in.
  return { records: mockRecords };
}

@Component({
  selector: 'app-attendance-adjustment',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './attendance-adjustment.html',
  styleUrls: ['./attendance-adjustment.scss'],
})
export class AttendanceAdjustment {
  constructor(private readonly cdr: ChangeDetectorRef) {}

  // ----- State (mirrors the React useState hooks) -----
  month = '';
  records: AttendanceAdjustmentRecord[] = [];
  selectedRecord: AttendanceAdjustmentRecord | null = null;
  search = '';
  loading = false;
  error = '';
  infoMessage = '';
  fieldError = '';
  page = 1;
  isEditing = false;
  editForm: EditForm = { tLDays: 0, alopDays: 0, adjDays: 0 };

  // ----- Derived values (mirrors the React useMemo values) -----

  get filteredRecords(): AttendanceAdjustmentRecord[] {
    const normalizedSearch = this.search.trim().toLowerCase();
    if (!normalizedSearch) return this.records;
    return this.records.filter(
      record =>
        record.employeeCode.toLowerCase().includes(normalizedSearch) ||
        record.employeeName.toLowerCase().includes(normalizedSearch)
    );
  }

  get pagedRecords(): AttendanceAdjustmentRecord[] {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.filteredRecords.slice(start, start + PAGE_SIZE);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRecords.length / PAGE_SIZE));
  }

  get startEntry(): number {
    return this.filteredRecords.length === 0 ? 0 : (this.page - 1) * PAGE_SIZE + 1;
  }

  get endEntry(): number {
    return Math.min(this.page * PAGE_SIZE, this.filteredRecords.length);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const cur = this.page;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur, '…', total];
  }

  get isUnchanged(): boolean {
    return (
      !!this.selectedRecord &&
      this.editForm.tLDays === this.selectedRecord.tLDays &&
      this.editForm.alopDays === this.selectedRecord.alopDays &&
      this.editForm.adjDays === this.selectedRecord.adjDays
    );
  }

  // Summary cards only show once records have been fetched AND an employee row is selected
  get showSummaryCards(): boolean {
    return this.records.length > 0 && !!this.selectedRecord;
  }

  get summaryMetrics(): LeaveMetrics | null {
    return this.selectedRecord ? this.getLeaveMetrics(this.selectedRecord) : null;
  }

  // ----- Business logic (unchanged from the React component) -----

  // Calculate eligibility based on employee type
  getEligibleLeave(record: AttendanceAdjustmentRecord): EligibleLeave {
    const type = record.employeeType || 'EXISTING';
    if (type === 'NEW') {
      return { value: 1, label: '1 Leave / 6 Months' };
    }
    return { value: 2, label: '2 Leaves / Month' };
  }

  // Calculate used and remaining leave
  getLeaveMetrics(record: AttendanceAdjustmentRecord): LeaveMetrics {
    const eligible = this.getEligibleLeave(record).value;
    const used = Math.abs(record.alopDays) + Math.abs(record.tLDays);
    const remaining = Math.max(0, eligible - used);
    return { eligible, used, remaining };
  }

  validate(): boolean {
    this.fieldError = '';
    this.error = '';
    if (!this.month) {
      this.fieldError = 'Attendance Month is mandatory.';
      return false;
    }
    return true;
  }

  async handleFetch(): Promise<void> {
    if (!this.validate()) return;
    this.loading = true;
    this.infoMessage = '';
    this.error = '';
    // Clear any stale/previous dataset immediately, so a prior month's
    // records/selection can never linger behind the new fetch.
    this.records = [];
    this.selectedRecord = null;
    this.search = '';
    this.page = 1;
    this.isEditing = false;
    // Flush now so the "clearing" is visible immediately, not just once the
    // fetch resolves.
    this.cdr.detectChanges();

    try {
      const result = await fetchAttendanceAdjustmentRecords(this.month);
      // Replace the datasource wholesale rather than mutating in place.
      this.records = result.records;
      this.infoMessage = result.records.length === 0 ? 'No records found.' : '';
    } catch (err: any) {
      this.error = err?.message || 'Unable to retrieve attendance adjustment data.';
    } finally {
      // Always stop the loading indicator on every exit path (success,
      // error, or empty result) so the button/spinner never gets stuck.
      this.loading = false;
      // Force the view to repaint the instant the fetch settles, instead of
      // waiting for the next unrelated click or tab switch to trigger CD.
      this.cdr.detectChanges();
    }
  }

  handleReset(): void {
    this.month = '';
    this.records = [];
    this.selectedRecord = null;
    this.search = '';
    this.error = '';
    this.infoMessage = '';
    this.fieldError = '';
    this.page = 1;
    this.isEditing = false;
    this.cdr.detectChanges();
  }

  handleRowClick(record: AttendanceAdjustmentRecord): void {
    this.selectedRecord = record;
    this.isEditing = false;
    this.editForm = {
      tLDays: record.tLDays,
      alopDays: record.alopDays,
      adjDays: record.adjDays,
    };
    this.cdr.detectChanges();
  }

  handleEdit(): void {
    this.isEditing = true;
    this.cdr.detectChanges();
  }

  handleCancel(): void {
    this.isEditing = false;
    if (this.selectedRecord) {
      this.editForm = {
        tLDays: this.selectedRecord.tLDays,
        alopDays: this.selectedRecord.alopDays,
        adjDays: this.selectedRecord.adjDays,
      };
    }
    this.cdr.detectChanges();
  }

  async handleSave(): Promise<void> {
    if (!this.selectedRecord) return;
    try {
      // Mock save - in real implementation, call API
      const updatedRecord = { ...this.selectedRecord, ...this.editForm };
      const previousId = this.selectedRecord.id;
      this.selectedRecord = updatedRecord;
      // Replace the array wholesale (via .map()) rather than mutating an
      // existing record or array in place, so the table's data reference
      // actually changes and Angular has something new to diff against.
      this.records = this.records.map(r => (r.id === previousId ? updatedRecord : r));
      this.isEditing = false;
      // Show success message (you can use a toast library here)
      alert('Attendance Adjustment Updated Successfully');
    } catch (err: any) {
      alert('Error saving adjustment: ' + err.message);
    } finally {
      // Flush immediately so the table row, summary cards, and details
      // panel all reflect the save the instant it completes.
      this.cdr.detectChanges();
    }
  }

  // ----- Template event helpers (two-way binding glue) -----

  onMonthChange(value: string): void {
    this.month = value;
    this.fieldError = '';
    this.cdr.detectChanges();
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.page = 1;
    this.cdr.detectChanges();
  }

  goToPrevPage(): void {
    this.page = Math.max(1, this.page - 1);
    this.cdr.detectChanges();
  }

  goToNextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
    this.cdr.detectChanges();
  }

  setPage(p: number | string): void {
    if (typeof p !== 'number') return;
    this.page = p;
    this.cdr.detectChanges();
  }

  onTLDaysChange(value: number): void {
    this.editForm = { ...this.editForm, tLDays: value || 0 };
  }

  onAlopDaysChange(value: number): void {
    this.editForm = { ...this.editForm, alopDays: value || 0 };
  }

  onAdjDaysChange(value: number): void {
    this.editForm = { ...this.editForm, adjDays: value || 0 };
  }

  trackByRecordId(index: number, record: AttendanceAdjustmentRecord): string {
    return record.id;
  }
}