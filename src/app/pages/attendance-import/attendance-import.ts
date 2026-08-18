import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { AttendanceRepositoryService } from '../../services/attendance-repository';
import { AttendanceResultRow, AttendanceRowStatus, ImportSummary } from '../../models';
import { MOCK_ATTENDANCE_DATABASE, MockAttendanceDatabaseRecord } from '../../constants';
type ImportType = 'daily' | 'monthly' | 'weekly' | 'yearly';
type ResultsView = 'staging' | 'application';

interface ImportFormErrors {
  date?: string;
  month?: string;
  year?: string;
  weekStart?: string;
  weekEnd?: string;
  file?: string;
}

interface SortConfig {
  key: keyof AttendanceResultRow;
  direction: 'asc' | 'desc';
}

interface ImportIntoApplicationDbResult {
  imported: AttendanceResultRow[];
  skipped: number;
}

interface KpiItem {
  value: number;
  label: string;
  icon: string;
  iconClass: string;
}

/** Builds the duplicate-detection key for a record: Employee Code + Date + In Time. */
const getRecordKey = (r: AttendanceResultRow): string => `${r.employeeCode}__${r.date}__${r.inTime}`;

@Component({
  selector: 'app-attendance-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-import.html',
  styleUrl: './attendance-import.scss'
})
export class AttendanceImport {
  // ── Period selectors ──
  importType: ImportType = 'monthly';
  attendanceDate = '';
  month = '05';
  year = new Date().getFullYear().toString();
  weekStart = '';
  weekEnd = '';

  // ── File state ──
  selectedFile: File | null = null;
  isDragOver = false;

  // ── Status / results ──
  loading = false;
  errors: ImportFormErrors = {};
  globalError = '';
  summary: ImportSummary | null = null;
  parsedRows: AttendanceResultRow[] = [];

  // ── Table controls ──
  searchTerm = '';
  sortConfig: SortConfig = { key: 'employeeCode', direction: 'asc' };
  statusFilter = 'All';
  deptFilter = 'All';
  errorsOnly = false;
  warningsOnly = false;
  currentPage = 1;
  pageSize = 10;

  // ── Date <-> Excel validation ──
  excelDates: string[] = [];
  dateValidationError = '';

  // ── Database fetch ──
  selectedDatabase = 'All';

  // ── Application Database (mock, append-only, dedup by Employee Code + Date + In Time) ──
  applicationAttendanceData: AttendanceResultRow[] = [];
  dbImportMessage = '';
  resultsView: ResultsView = 'staging';

  today = new Date().toISOString().split('T')[0];

  monthOptions = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];
  yearOptions: string[] = [];
  pageSizeOptions = [10, 25, 50, 100];

  resultColumns: { key: keyof AttendanceResultRow; label: string }[] = [
    { key: 'employeeCode', label: 'Emp. Code' },
    { key: 'employeeName', label: 'Employee Name' },
    { key: 'date', label: 'Date' },
    { key: 'inTime', label: 'In Time' },
    { key: 'outTime', label: 'Out Time' },
    { key: 'workHours', label: 'Work Hrs' },
    { key: 'status', label: 'Status' },
  ];

  private readonly monthNamesFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private attendanceRepository: AttendanceRepositoryService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.yearOptions.push((currentYear - i).toString());
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // Derived state
  // ══════════════════════════════════════════════════════════════════

  get displayedRows(): AttendanceResultRow[] {
    return this.resultsView === 'application' ? this.applicationAttendanceData : this.parsedRows;
  }

  get displayedSummary(): ImportSummary | null {
    return this.resultsView === 'application' ? this.buildSummaryForRows(this.applicationAttendanceData) : this.summary;
  }

  get validEmployees(): number {
    return this.displayedRows.filter(r => r.status === 'Success').length;
  }

  get invalidEmployees(): number {
    return this.displayedRows.filter(r => r.status === 'Error').length;
  }

  get warningsCount(): number {
    return this.displayedRows.filter(r => r.status === 'Warning').length;
  }

  get partialRecords(): number {
    return this.displayedRows.filter(r => r.status === 'Partial').length;
  }

  get missingPunches(): number {
    return this.displayedRows.filter(r => !r.inTime || !r.outTime).length;
  }

  get filteredResults(): AttendanceResultRow[] {
    const term = this.searchTerm.toLowerCase();
    const rows = this.displayedRows.filter(r => {
      const matchSearch =
        r.employeeCode.toLowerCase().includes(term) ||
        r.employeeName.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term) ||
        r.remarks.toLowerCase().includes(term);
      const matchStatus = this.statusFilter === 'All' || r.status === this.statusFilter;
      const matchErrors = !this.errorsOnly || r.status === 'Error';
      const matchWarnings = !this.warningsOnly || r.status === 'Warning';
      return matchSearch && matchStatus && matchErrors && matchWarnings;
    });

    const dir = this.sortConfig.direction === 'asc' ? 1 : -1;
    const key = this.sortConfig.key;
    return [...rows].sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredResults.length / this.pageSize));
  }

  get paginatedResults(): AttendanceResultRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredResults.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const count = Math.min(5, this.totalPages);
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  get showingFrom(): number {
    return this.filteredResults.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredResults.length);
  }

  get kpiItems(): KpiItem[] {
    const s = this.displayedSummary;
    if (!s) return [];
    return [
      { value: s.totalRecords, label: 'Total Records', icon: 'users', iconClass: 'kpi-blue' },
      { value: s.successRecords, label: 'Successful', icon: 'check', iconClass: 'kpi-green' },
      { value: s.failedRecords, label: 'Failed', icon: 'x', iconClass: 'kpi-red' },
      { value: this.partialRecords, label: 'Partial', icon: 'clock', iconClass: 'kpi-violet' },
      { value: this.validEmployees, label: 'Valid Employees', icon: 'check', iconClass: 'kpi-green' },
      { value: this.invalidEmployees, label: 'Invalid Employees', icon: 'x', iconClass: 'kpi-red' },
      { value: this.missingPunches, label: 'Missing Punches', icon: 'clock', iconClass: 'kpi-orange' },
      { value: this.warningsCount, label: 'Warnings', icon: 'alert-triangle', iconClass: 'kpi-yellow' },
    ];
  }

  // ══════════════════════════════════════════════════════════════════
  // Date helpers
  // ══════════════════════════════════════════════════════════════════

  private normalizeDate(value: string): string | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatDMY(isoDate: string): string {
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }

  private formatMonthYear(m: number, y: number): string {
    return `${this.monthNamesFull[m - 1]} ${y}`;
  }

  // ══════════════════════════════════════════════════════════════════
  // File handling
  // ══════════════════════════════════════════════════════════════════

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFileSelect(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFileSelect(file);
  }

  private handleFileSelect(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext || '')) {
      this.errors = { ...this.errors, file: 'Only .xlsx and .xls files are supported.' };
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.errors = { ...this.errors, file: 'File size exceeds 10 MB limit.' };
      return;
    }
    this.selectedFile = file;
    this.errors = { ...this.errors, file: '' };
    this.extractFileDates(file).then(dates => {
      this.excelDates = dates;
      this.runDateValidation();
      this.cdr.detectChanges();
    });
  }

  clearFile(fileInput?: HTMLInputElement): void {
    this.selectedFile = null;
    this.excelDates = [];
    this.dateValidationError = '';
    this.errors = { ...this.errors, file: '' };
    if (fileInput) fileInput.value = '';
  }

  /** Lightweight read of just the date column, used only for period/file validation. */
  private extractFileDates(file: File): Promise<string[]> {
    return new Promise(resolve => {
      const reader = new FileReader();
      // FileReader callbacks can, depending on the browser/zone.js setup, fire
      // outside Angular's zone. Wrapping the callback body in zone.run()
      // guarantees that resolve() — and anything chained off this promise —
      // runs inside the zone, so the resulting state changes are picked up by
      // change detection immediately instead of waiting for the next
      // unrelated UI interaction to trigger a check.
      reader.onload = e => {
        this.zone.run(() => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: 'array', cellDates: true });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
            const dates = raw
              .map(r => {
                const found = Object.keys(r).find(key =>
                  ['date', 'attendance date', 'attendance_date'].includes(key.trim().toLowerCase())
                );
                return found ? this.normalizeDate(String(r[found]).trim()) : null;
              })
              .filter((d): d is string => !!d);
            resolve(dates);
          } catch {
            resolve([]);
          }
        });
      };
      reader.onerror = () => this.zone.run(() => resolve([]));
      reader.readAsArrayBuffer(file);
    });
  }

  /** Parses the uploaded Excel/CSV file into result rows, validating each record. */
  private parseExcelFile(file: File): Promise<AttendanceResultRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      // As in extractFileDates(), force this callback (and therefore the
      // promise resolution and everything awaiting it in handleImport) to run
      // inside Angular's zone so the UI updates the instant parsing finishes.
      reader.onload = e => this.zone.run(() => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });

          const rows: AttendanceResultRow[] = raw.map(r => {
            const get = (keys: string[]): string => {
              for (const k of keys) {
                const found = Object.keys(r).find(key => key.trim().toLowerCase() === k.toLowerCase());
                if (found && String(r[found]).trim()) return String(r[found]).trim();
              }
              return '';
            };

            const employeeCode = get(['Employee Code', 'Emp Code', 'EmpCode', 'employee_code']);
            const employeeName = get(['Employee Name', 'Emp Name', 'Name', 'employee_name']);
            const date = get(['Date', 'Attendance Date', 'attendance_date']);
            const inTime = get(['In Time', 'InTime', 'in_time', 'Punch In']);
            const outTime = get(['Out Time', 'OutTime', 'out_time', 'Punch Out']);
            const attendanceStatus = get(['Attendance Status', 'Status', 'Attendance Type', 'attendance_status']);
            const remarks = get(['Remarks', 'Remark', 'remarks']);

            const validationErrors: string[] = [];
            if (!employeeCode) validationErrors.push('Missing Employee Code');
            if (!date) validationErrors.push('Missing Date');
            if (!inTime) validationErrors.push('Missing In Time');
            if (!outTime) validationErrors.push('Missing Out Time');
            if (inTime && outTime && inTime >= outTime) validationErrors.push('In Time must be before Out Time');

            let workHours = '';
            if (inTime && outTime) {
              const toMins = (t: string): number => {
                const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
                if (!m) return NaN;
                let h = parseInt(m[1], 10);
                const min = parseInt(m[2], 10);
                const ampm = (m[3] || '').toUpperCase();
                if (ampm === 'PM' && h !== 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return h * 60 + min;
              };
              const diff = toMins(outTime) - toMins(inTime);
              if (!isNaN(diff) && diff > 0) workHours = (diff / 60).toFixed(2);
            }

            let status: AttendanceRowStatus = 'Success';
            let finalRemarks = remarks;

            if (validationErrors.length > 0) {
              const missingIn = !inTime;
              const missingOut = !outTime;
              if (missingIn || missingOut) {
                status = 'Partial';
                finalRemarks = finalRemarks || 'No Punches Found';
              } else {
                status = 'Error';
                finalRemarks = validationErrors.join('; ');
              }
            } else if (
              attendanceStatus.toLowerCase().includes('late') ||
              attendanceStatus.toLowerCase().includes('half')
            ) {
              status = 'Warning';
              finalRemarks = finalRemarks || attendanceStatus;
            }

            return { employeeCode, employeeName, date, inTime, outTime, workHours, status, remarks: finalRemarks };
          });

          resolve(rows);
        } catch {
          reject(new Error('Failed to parse Excel file. Please check the format.'));
        }
      });
      reader.onerror = () => this.zone.run(() => reject(new Error('Failed to read file.')));
      reader.readAsArrayBuffer(file);
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // Period <-> file date validation
  // ══════════════════════════════════════════════════════════════════

  /** Called whenever the period selectors or the uploaded file change. */
  runDateValidation(): void {
    if (!this.selectedFile) { this.dateValidationError = ''; return; }

    if (this.excelDates.length === 0) {
      this.dateValidationError = 'The uploaded Excel file does not contain any attendance records. Please upload a valid attendance Excel file.';
      return;
    }

    const sortedExcel = [...this.excelDates].sort();
    const excelMin = sortedExcel[0];
    const excelMax = sortedExcel[sortedExcel.length - 1];

    if (this.importType === 'daily') {
      if (!this.attendanceDate) { this.dateValidationError = ''; return; }
      if (!this.excelDates.includes(this.attendanceDate)) {
        this.dateValidationError = `No attendance records were found for the selected date (${this.formatDMY(this.attendanceDate)}). The uploaded Excel file contains attendance only from ${this.formatDMY(excelMin)} to ${this.formatDMY(excelMax)}.`;
        return;
      }
      this.dateValidationError = '';
      return;
    }

    if (this.importType === 'weekly') {
      if (!this.weekStart || !this.weekEnd) { this.dateValidationError = ''; return; }
      const start = new Date(this.weekStart);
      const end = new Date(this.weekEnd);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) { this.dateValidationError = ''; return; }

      const excelSet = new Set(this.excelDates);
      let allPresent = true;
      let anyPresent = false;
      const cursor = new Date(start);
      while (cursor <= end) {
        const iso = this.normalizeDate(cursor.toISOString());
        if (iso && excelSet.has(iso)) anyPresent = true; else allPresent = false;
        cursor.setDate(cursor.getDate() + 1);
      }

      if (!anyPresent) {
        this.dateValidationError = `No attendance records were found for the selected week (${this.formatDMY(this.weekStart)} – ${this.formatDMY(this.weekEnd)}).`;
        return;
      }
      if (!allPresent) {
        this.dateValidationError = `The uploaded Excel file does not contain attendance records for the entire selected week (${this.formatDMY(this.weekStart)} – ${this.formatDMY(this.weekEnd)}). The uploaded Excel file contains attendance only from ${this.formatDMY(excelMin)} to ${this.formatDMY(excelMax)}.`;
        return;
      }
      this.dateValidationError = '';
      return;
    }

    if (this.importType === 'monthly') {
      if (!this.month || !this.year) { this.dateValidationError = ''; return; }
      const selMonth = parseInt(this.month, 10);
      const selYear = parseInt(this.year, 10);
      const hasMonth = this.excelDates.some(d => {
        const [y, m] = d.split('-').map(Number);
        return y === selYear && m === selMonth;
      });
      if (!hasMonth) {
        const excelMinDate = new Date(excelMin);
        const excelMaxDate = new Date(excelMax);
        const minLabel = this.formatMonthYear(excelMinDate.getMonth() + 1, excelMinDate.getFullYear());
        const maxLabel = this.formatMonthYear(excelMaxDate.getMonth() + 1, excelMaxDate.getFullYear());
        const rangeLabel = minLabel === maxLabel ? minLabel : `${minLabel} to ${maxLabel}`;
        this.dateValidationError = `No attendance records were found for ${this.formatMonthYear(selMonth, selYear)}. The uploaded Excel file contains attendance only for ${rangeLabel}.`;
        return;
      }
      this.dateValidationError = '';
      return;
    }

    if (this.importType === 'yearly') {
      if (!this.year) { this.dateValidationError = ''; return; }
      const selYear = parseInt(this.year, 10);
      const hasYear = this.excelDates.some(d => parseInt(d.split('-')[0], 10) === selYear);
      if (!hasYear) {
        const excelMinYear = parseInt(excelMin.split('-')[0], 10);
        const excelMaxYear = parseInt(excelMax.split('-')[0], 10);
        const rangeLabel = excelMinYear === excelMaxYear ? String(excelMinYear) : `${excelMinYear} to ${excelMaxYear}`;
        this.dateValidationError = `No attendance records were found for the selected year (${selYear}). The uploaded Excel file contains attendance data only for ${rangeLabel}.`;
        return;
      }
      this.dateValidationError = '';
      return;
    }
  }

  onPeriodChange(): void {
    this.runDateValidation();
  }

  // ══════════════════════════════════════════════════════════════════
  // Validation
  // ══════════════════════════════════════════════════════════════════

  private validate(): boolean {
    const errs: ImportFormErrors = {};
    if (this.importType === 'daily' && !this.attendanceDate) errs.date = 'Attendance Date is required.';
    if (this.importType === 'daily' && this.attendanceDate && this.dateValidationError) errs.date = this.dateValidationError;
    if (this.importType === 'monthly' && !this.month) errs.month = 'Month is required.';
    if (this.importType === 'monthly' && !this.year) errs.year = 'Year is required.';
    if (this.importType === 'monthly' && this.month && this.year && this.dateValidationError) {
      errs.month = this.dateValidationError; errs.year = this.dateValidationError;
    }
    if (this.importType === 'weekly' && !this.weekStart) errs.weekStart = 'Week Start Date is required.';
    if (this.importType === 'weekly' && !this.weekEnd) errs.weekEnd = 'Week End Date is required.';
    if (this.importType === 'weekly' && this.weekStart && this.weekEnd && this.dateValidationError) {
      errs.weekStart = this.dateValidationError; errs.weekEnd = this.dateValidationError;
    }
    if (this.importType === 'yearly' && !this.year) errs.year = 'Year is required.';
    if (this.importType === 'yearly' && this.year && this.dateValidationError) errs.year = this.dateValidationError;
    if (!this.selectedFile) errs.file = 'Please select an attendance file.';
    this.errors = errs;
    return Object.keys(errs).length === 0;
  }

  /** Narrows rows down to only the ones that fall within the selected period. */
  private filterRowsByPeriod(rows: AttendanceResultRow[]): AttendanceResultRow[] {
    // NOTE: when a required period field is blank we return an empty result
    // rather than the full dataset — showing every record when nothing is
    // selected is exactly the "stale data" leak we need to avoid. Callers
    // that require the field (handleImport via validate(), handleFetchDatabase
    // via isPeriodSelected()) already guard against reaching this state.
    if (this.importType === 'daily') {
      if (!this.attendanceDate) return [];
      return rows.filter(r => this.normalizeDate(r.date) === this.attendanceDate);
    }
    if (this.importType === 'weekly') {
      if (!this.weekStart || !this.weekEnd) return [];
      return rows.filter(r => {
        const iso = this.normalizeDate(r.date);
        return !!iso && iso >= this.weekStart && iso <= this.weekEnd;
      });
    }
    if (this.importType === 'monthly') {
      if (!this.month || !this.year) return [];
      return rows.filter(r => {
        const iso = this.normalizeDate(r.date);
        if (!iso) return false;
        const [y, m] = iso.split('-');
        return y === this.year && m === this.month;
      });
    }
    if (this.importType === 'yearly') {
      if (!this.year) return [];
      return rows.filter(r => {
        const iso = this.normalizeDate(r.date);
        return !!iso && iso.split('-')[0] === this.year;
      });
    }
    return rows;
  }

  private buildSummaryForRows(rows: AttendanceResultRow[]): ImportSummary {
    const errorRows = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.status === 'Error' || r.status === 'Partial')
      .map(({ r, i }) => ({
        row: i + 2,
        employeeCode: r.employeeCode,
        employeeName: r.employeeName,
        attendanceDate: r.date,
        inTime: r.inTime,
        outTime: r.outTime,
        workHours: r.workHours,
        attendanceType: '',
        message: r.remarks,
      }));

    return {
      totalRecords: rows.length,
      successRecords: rows.filter(r => r.status === 'Success').length,
      failedRecords: rows.filter(r => r.status === 'Error').length,
      errors: errorRows,
    };
  }

  /** Appends `incoming` into `existing`, skipping duplicates by Employee Code + Date + In Time. */
  private importRecordsIntoDb(existing: AttendanceResultRow[], incoming: AttendanceResultRow[]): ImportIntoApplicationDbResult {
    const existingKeys = new Set(existing.map(getRecordKey));
    const imported: AttendanceResultRow[] = [];
    let skipped = 0;

    for (const record of incoming) {
      const key = getRecordKey(record);
      if (existingKeys.has(key)) { skipped += 1; continue; }
      existingKeys.add(key);
      imported.push(record);
    }

    return { imported, skipped };
  }

  // ══════════════════════════════════════════════════════════════════
  // Actions
  // ══════════════════════════════════════════════════════════════════

  async handleImport(): Promise<void> {
    if (!this.validate()) return;
    this.globalError = '';
    this.summary = null;
    this.parsedRows = [];
    this.currentPage = 1;
    this.loading = true;
    this.cdr.detectChanges();

    // Clear any leftover table filters from a previous session so the freshly
    // imported preview is never hidden behind a stale search/status filter.
    this.searchTerm = '';
    this.statusFilter = 'All';
    this.errorsOnly = false;
    this.warningsOnly = false;

    try {
      const parsedAll = await this.parseExcelFile(this.selectedFile!);
      const rows = this.filterRowsByPeriod(parsedAll);

      // Bind the "Fetched Preview" table to this import's rows and make sure
      // that tab is the one showing, regardless of whatever view was active before.
      this.parsedRows = rows;
      this.resultsView = 'staging';
      this.summary = this.buildSummaryForRows(rows);

      const { imported, skipped } = this.importRecordsIntoDb(this.applicationAttendanceData, rows);
      this.applicationAttendanceData = [...this.applicationAttendanceData, ...imported];
      const parts = [`Imported ${imported.length} new record(s) into the Application Database.`];
      if (skipped > 0) parts.push(`Skipped ${skipped} duplicate(s).`);
      this.dbImportMessage = parts.join(' ');

      try {
        this.attendanceRepository.setImportedAttendance(rows);
      } catch {
        // Persisting to the shared repository should never leave the UI stuck
        // in a loading state, so a failure here is surfaced but not rethrown.
        this.globalError = 'Import succeeded, but the shared attendance repository could not be updated.';
      }
    } catch (err: any) {
      this.globalError = err?.message || 'Import failed. Please check the file format.';
    } finally {
      // Always stop the loading state — on success, on a caught error above,
      // and on any failure — so the button never stays stuck spinning.
      this.loading = false;

      // Force Angular to flush this component's view right now. The FileReader
      // work above is now guaranteed to run inside the zone (see
      // parseExcelFile), but we still call detectChanges() defensively so the
      // loader, KPI cards, and preview table repaint the instant the import
      // finishes instead of waiting for the next unrelated click/tab switch to
      // trigger a change-detection pass.
      this.cdr.detectChanges();
    }
  }

  /** True when the fields required by the current import type are all filled in. */
  private isPeriodSelected(): boolean {
    switch (this.importType) {
      case 'daily': return !!this.attendanceDate;
      case 'weekly': return !!this.weekStart && !!this.weekEnd;
      case 'monthly': return !!this.month && !!this.year;
      case 'yearly': return !!this.year;
      default: return false;
    }
  }

  handleFetchDatabase(): void {
    this.globalError = '';
    this.errors = { ...this.errors, file: '' };
    this.currentPage = 1;
    this.resultsView = 'staging';
    this.dbImportMessage = '';

    // Never leave a previous fetch/import's rows, summary, or filters on screen
    // while we determine what (if anything) the current selection returns.
    this.parsedRows = [];
    this.summary = null;
    this.searchTerm = '';
    this.statusFilter = 'All';
    this.errorsOnly = false;
    this.warningsOnly = false;

    if (!this.isPeriodSelected()) {
      this.globalError = 'Please select the required Date / Month / Year (or Week range) before fetching.';
      return;
    }

    const source: MockAttendanceDatabaseRecord[] =
      this.selectedDatabase === 'All'
        ? MOCK_ATTENDANCE_DATABASE
        : MOCK_ATTENDANCE_DATABASE.filter(r => r.database === this.selectedDatabase);

    const rows = this.filterRowsByPeriod(source);

    if (rows.length === 0) {
      this.globalError = 'No records found.';
      return;
    }

    this.parsedRows = rows;
    this.summary = this.buildSummaryForRows(rows);
  }

  handleImportIntoApplicationDb(): void {
    if (this.parsedRows.length === 0) {
      this.dbImportMessage = 'Fetch records first, then click Import to save them into the Application Database.';
      return;
    }

    const { imported, skipped } = this.importRecordsIntoDb(this.applicationAttendanceData, this.parsedRows);
    this.applicationAttendanceData = [...this.applicationAttendanceData, ...imported];

    const parts = [`Imported ${imported.length} new record(s) into the Application Database.`];
    if (skipped > 0) parts.push(`Skipped ${skipped} duplicate(s).`);
    this.dbImportMessage = parts.join(' ');

    this.resultsView = 'application';
    this.currentPage = 1;

    this.attendanceRepository.setImportedAttendance(this.parsedRows);
  }

  setResultsView(view: ResultsView): void {
    this.resultsView = view;
    this.currentPage = 1;
  }

  handleSort(key: keyof AttendanceResultRow): void {
    this.sortConfig = this.sortConfig.key === key
      ? { key, direction: this.sortConfig.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' };
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
  }

  onErrorsOnlyChange(checked: boolean): void {
    this.errorsOnly = checked;
    if (checked) this.warningsOnly = false;
    this.currentPage = 1;
  }

  onWarningsOnlyChange(checked: boolean): void {
    this.warningsOnly = checked;
    if (checked) this.errorsOnly = false;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(this.totalPages, Math.max(1, page));
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  downloadTemplate(): void {
    const headers = ['Employee Code', 'Employee Name', 'Date', 'In Time', 'Out Time', 'Attendance Type'];
    const sampleRow = ['EMP001', 'John Doe', '2025-06-01', '09:00', '18:00', 'Present'];
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, 'Attendance_Import_Template.xlsx');
  }

  downloadErrorReport(): void {
    const s = this.displayedSummary;
    if (!s) return;
    const headers = ['Row', 'Employee Code', 'Employee Name', 'Date', 'In Time', 'Out Time', 'Work Hours', 'Attendance Type', 'Error Message'];
    const rows = s.errors.map(e => [e.row, e.employeeCode, e.employeeName, e.attendanceDate, e.inTime, e.outTime, e.workHours, e.attendanceType, e.errorMessage ?? e.message]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [6, 16, 22, 14, 10, 10, 12, 18, 50].map(wch => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Records');
    XLSX.writeFile(wb, 'Attendance_Import_Failed_Records.xlsx');
  }

  reset(fileInput?: HTMLInputElement): void {
    this.attendanceDate = '';
    this.month = '';
    this.year = new Date().getFullYear().toString();
    this.weekStart = '';
    this.weekEnd = '';
    this.selectedFile = null;
    this.summary = null;
    this.parsedRows = [];
    this.errors = {};
    this.globalError = '';
    this.statusFilter = 'All';
    this.deptFilter = 'All';
    this.errorsOnly = false;
    this.warningsOnly = false;
    this.currentPage = 1;
    this.searchTerm = '';
    this.excelDates = [];
    this.dateValidationError = '';
    this.selectedDatabase = 'All';
    this.resultsView = 'staging';
    this.dbImportMessage = '';
    this.isDragOver = false;
    // In case Reset is ever triggered mid-import, make sure the button/spinner
    // can't be left stuck in a loading state.
    this.loading = false;
    // Application Database data itself is intentionally preserved across Reset,
    // since it represents already-saved application data.

    // Clear the native <input type="file"> value too. Without this, selecting
    // the same file again (or sometimes any file, depending on the browser)
    // does not fire a 'change' event, so nothing appears to happen until the
    // page is refreshed.
    if (fileInput) fileInput.value = '';
  }
}