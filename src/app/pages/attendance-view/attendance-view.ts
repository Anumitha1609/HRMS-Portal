import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AttendanceRecord, AttendanceSummaryCount, AttendanceType, AttendanceResultRow } from '../../models';
import { AttendanceRepositoryService } from '../../services/attendance-repository';

/** Snapshot of the filter fields at the moment Fetch was clicked. */
interface FilterSnapshot {
  periodType: 'date' | 'week' | 'month' | 'year';
  attendanceDate: string;
  weekStart: string;
  weekEnd: string;
  month: string;
  year: string;
}

@Component({
  selector: 'app-attendance-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-view.html',
  styleUrl: './attendance-view.scss'
})
export class AttendanceView implements OnInit, OnDestroy {
  periodType: 'date' | 'week' | 'month' | 'year' = 'date';
  attendanceDate = new Date().toISOString().slice(0, 10);
  weekStart = '';
  weekEnd = '';
  month = String(new Date().getMonth() + 1).padStart(2, '0');
  year = String(new Date().getFullYear());

  search = '';
  activeTab: AttendanceType = 'Attendance';
  tabs: AttendanceType[] = ['Pre Attendance', 'Attendance', 'Unpunch', 'Deputation', 'Partial Present'];

  fetchedRecords: AttendanceRecord[] = [];
  summary: AttendanceSummaryCount | null = null;
  loading = false;
  error = '';
  infoMessage = '';
  fieldError = '';

  yearOptions: string[] = [];
  monthOptions = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  // Fallback/demo data source, only used when the repository has no
  // imported records yet (e.g. before any import has ever been run).
  // Real data now comes from AttendanceRepositoryService (see below).
  private readonly dummyRecords: AttendanceRecord[] = this.generateDummyRecords();

  /** Filters used the last time Fetch actually ran successfully, so we
   *  can silently re-run the same query when new import data arrives. */
  private lastFilterSnapshot: FilterSnapshot | null = null;

  private importSubscription?: Subscription;

  constructor(
    private readonly attendanceRepository: AttendanceRepositoryService,
    private readonly cdRef: ChangeDetectorRef
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.yearOptions.push((currentYear - i).toString());
    }
  }

  ngOnInit(): void {
    // We don't auto-fetch on first load (the table still stays empty
    // until the user picks filters and clicks Fetch), but we DO listen
    // for imports that happen *while this view is open*. If the user has
    // already fetched a result set, a fresh import will silently
    // re-run that same query so the table updates without requiring
    // another manual click.
    this.importSubscription = this.attendanceRepository.importedAttendance$.subscribe(() => {
      if (this.lastFilterSnapshot) {
        this.runFetch(this.lastFilterSnapshot, { silent: true });
      }
    });
  }

  ngOnDestroy(): void {
    this.importSubscription?.unsubscribe();
  }

  get filteredRecords(): AttendanceRecord[] {
    let records = this.fetchedRecords.filter(r => r.attendanceType === this.activeTab);
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      records = records.filter(r =>
        r.employeeCode.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q)
      );
    }
    return records;
  }

  handleFetch(): void {
    this.fieldError = '';

    if (this.periodType === 'date' && !this.attendanceDate) {
      this.fieldError = 'Attendance Date is mandatory.';
      return;
    }
    if (this.periodType === 'week' && (!this.weekStart || !this.weekEnd)) {
      this.fieldError = 'Week Start and Week End are mandatory.';
      return;
    }
    if (this.periodType === 'month' && (!this.month || !this.year)) {
      this.fieldError = 'Month and Year are mandatory.';
      return;
    }
    if (this.periodType === 'year' && !this.year) {
      this.fieldError = 'Year is mandatory.';
      return;
    }

    const filterSnapshot: FilterSnapshot = {
      periodType: this.periodType,
      attendanceDate: this.attendanceDate,
      weekStart: this.weekStart,
      weekEnd: this.weekEnd,
      month: this.month,
      year: this.year
    };

    // Remember these filters so that if a NEW import lands while the user
    // is still looking at this page, we can silently re-run the same
    // query (see ngOnInit's subscription) instead of showing stale data.
    this.lastFilterSnapshot = filterSnapshot;

    this.runFetch(filterSnapshot, { silent: false });
  }

  /**
   * Does the actual work of loading + filtering + rendering records.
   * Shared by the manual "Fetch" button click and by the automatic
   * refresh that fires when new data is imported while this view is open.
   *
   * `silent: true` means "an import happened in the background" — in that
   * case we don't touch `loading` (no spinner flicker) and we don't
   * overwrite an in-progress fieldError, but we DO still clear any stale
   * dataset before loading the fresh one.
   */
  private runFetch(filters: FilterSnapshot, opts: { silent: boolean }): void {
    if (!opts.silent) {
      this.loading = true;
    }
    this.error = '';
    this.infoMessage = '';

    // Clear any stale/cached dataset before pulling a fresh one, so a
    // previous result set can never linger behind new data.
    this.fetchedRecords = [];
    this.summary = null;

    try {
      const records = this.getRecordsForFilter(filters);

      // Update the table datasource immediately after fetching.
      this.fetchedRecords = records;
      this.summary = this.buildSummary(records);

      if (this.fetchedRecords.length === 0) {
        this.infoMessage = 'No attendance records found for the selected period.';
      } else {
        this.infoMessage = opts.silent
          ? `Refreshed — ${this.fetchedRecords.length} attendance records now shown.`
          : `Fetched ${this.fetchedRecords.length} attendance records.`;
      }
    } catch (err: any) {
      this.error = err?.message || 'Unable to retrieve attendance records. Please try again.';
    } finally {
      if (!opts.silent) {
        this.loading = false;
      }
      // Force change detection in case this ran from an RxJS subscription
      // callback (e.g. the import refresh) that Angular's zone didn't
      // already pick up, or if this component is ever switched to
      // OnPush in the future.
      this.cdRef.markForCheck();
    }
  }

  handleReset() {
    this.periodType = 'date';
    this.attendanceDate = new Date().toISOString().slice(0, 10);
    this.weekStart = '';
    this.weekEnd = '';
    this.month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.year = String(new Date().getFullYear());
    this.activeTab = 'Attendance';
    this.fetchedRecords = [];
    this.summary = null;
    this.error = '';
    this.infoMessage = '';
    this.fieldError = '';
    this.search = '';
    this.lastFilterSnapshot = null;
  }

  calculateTotalHours(inTime?: string, outTime?: string): string {
    if (!inTime || !outTime) return '-';
    try {
      const [inHours, inMinutes] = inTime.split(':').map(Number);
      const [outHours, outMinutes] = outTime.split(':').map(Number);

      const inTotalMinutes = inHours * 60 + inMinutes;
      const outTotalMinutes = outHours * 60 + outMinutes;

      let diffMinutes = outTotalMinutes - inTotalMinutes;
      if (diffMinutes < 0) diffMinutes += 24 * 60;

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } catch {
      return '-';
    }
  }

  /**
   * Picks the correct datasource and filters it by the currently selected
   * period type.
   *
   * THE ACTUAL FIX: this used to always read from a fixed, hardcoded
   * `dummyRecords` array and never looked at AttendanceRepositoryService
   * at all — so nothing you imported could ever show up here, no matter
   * what the DB contained. Now we always pull a FRESH snapshot from the
   * repository (never a cached local copy) so newly imported rows are
   * picked up immediately. The dummy data is kept only as a fallback for
   * when nothing has been imported yet (e.g. first-run/demo purposes) —
   * remove that fallback entirely once you no longer need canned data.
   */
  private getRecordsForFilter(filters: FilterSnapshot): AttendanceRecord[] {
    const importedRows = this.attendanceRepository.getImportedAttendance();
    const source: AttendanceRecord[] = importedRows.length > 0
      ? importedRows
          .map(row => this.mapResultRowToRecord(row))
          .filter((r): r is AttendanceRecord => r !== null)
      : this.dummyRecords;

    return source.filter(record => this.matchesPeriod(record, filters));
  }

  /**
   * Maps an imported AttendanceResultRow (as produced by Attendance Import
   * and stored in AttendanceRepositoryService) into the AttendanceRecord
   * shape this view's table renders.
   *
   * IMPORTANT: AttendanceResultRow has NO attendanceType field — it only
   * carries an import-validation `status` ('Success' | 'Error' | 'Warning'
   * | 'Partial'), which describes whether the ROW PARSED CLEANLY, not
   * what kind of attendance day it was. The mapping below is a judgment
   * call translating one into the other:
   *   - 'Success' -> 'Attendance'      (clean in/out punch, treated as present)
   *   - 'Warning'  -> 'Partial Present' (import flagged late/half-day)
   *   - 'Partial'  -> 'Unpunch'         (missing an in or out punch)
   *   - 'Error'    -> excluded entirely (the row failed validation on
   *                    import, e.g. bad time format / missing employee
   *                    code, so it isn't a real attendance fact to show)
   * Adjust this switch if your business rules categorize differently.
   */
  private mapResultRowToRecord(row: AttendanceResultRow): AttendanceRecord | null {
    if (row.status === 'Error') {
      return null;
    }

    const isoDate = this.normalizeImportedDate(row.date);
    if (!isoDate) {
      return null;
    }

    const inTime = this.normalizeImportedTime(row.inTime);
    const outTime = this.normalizeImportedTime(row.outTime);

    let attendanceType: AttendanceType;
    switch (row.status) {
      case 'Warning':
        attendanceType = 'Partial Present';
        break;
      case 'Partial':
        attendanceType = 'Unpunch';
        break;
      case 'Success':
      default:
        attendanceType = 'Attendance';
    }

    return {
      id: `${row.employeeCode}-${row.date}-${row.inTime}`,
      date: isoDate,
      employeeCode: row.employeeCode,
      employeeName: row.employeeName,
      inTime,
      outTime,
      actualIn: inTime,
      actualOut: outTime,
      totalHours: row.workHours ? Number(row.workHours) : undefined,
      attendanceType,
      leaveHaving: false,
      status: undefined,
      remarks: row.remarks
    };
  }

  /**
   * Converts whatever raw date string came out of the Excel cell into
   * 'yyyy-MM-dd', the same format the <input type="date"> filters use.
   * Mirrors the normalizeDate() logic already used in attendance-import.ts
   * so both features agree on what a given cell value means.
   */
  private normalizeImportedDate(value: string): string | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** Converts a raw time string (e.g. "9:00 AM", "09:00") into 24-hour "HH:mm". */
  private normalizeImportedTime(value?: string): string | undefined {
    if (!value) return undefined;
    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return value; // fall back to the raw value rather than dropping it
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = (match[3] || '').toUpperCase();
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  private matchesPeriod(record: AttendanceRecord, filters: FilterSnapshot): boolean {
    const recordDate = new Date(record.date);

    switch (filters.periodType) {
      case 'date': {
        return record.date === filters.attendanceDate;
      }
      case 'week': {
        const start = new Date(filters.weekStart);
        const end = new Date(filters.weekEnd);
        return recordDate >= start && recordDate <= end;
      }
      case 'month': {
        const recordMonth = String(recordDate.getMonth() + 1).padStart(2, '0');
        const recordYear = String(recordDate.getFullYear());
        return recordMonth === filters.month && recordYear === filters.year;
      }
      case 'year': {
        const recordYear = String(recordDate.getFullYear());
        return recordYear === filters.year;
      }
      default:
        return false;
    }
  }

  /**
   * Builds the summary panel counts from the full set of records matched
   * for the selected period (not just the active tab), so the summary
   * always reflects the whole period regardless of which tab is open.
   */
  private buildSummary(records: AttendanceRecord[]): AttendanceSummaryCount {
    const uniqueEmployeeCodes = new Set(records.map(r => r.employeeCode));

    const countByType = (type: AttendanceType) =>
      records.filter(r => r.attendanceType === type).length;

    return {
      totalEmployees: uniqueEmployeeCodes.size,
      present: countByType('Attendance'),
      absent: countByType('Absent'),
      unpunch: countByType('Unpunch'),
      deputation: countByType('Deputation'),
      forgotCard: countByType('Forgot Card'),
      partialPresent: countByType('Partial Present'),
      wah: countByType('WAH'),
      onDuty: countByType('On Duty'),
      leave: countByType('Leave'),
      total: records.length
    };
  }

  /**
   * Builds a static, in-memory dataset used in place of a real backend.
   * Uses a FIXED, explicit list of dates (see testDates below) — not
   * relative to "today" — so the Date / Week / Month / Year filters have
   * the same, predictable data to test against every time. Every
   * AttendanceType (including the ones without a tab,
   * like Absent / WAH / On Duty / Leave / Forgot Card) is represented so
   * the summary panel has meaningful numbers.
   */
  private generateDummyRecords(): AttendanceRecord[] {
    const employees = [
      { code: 'EMP001', name: 'Aditi Sharma' },
      { code: 'EMP002', name: 'Rahul Verma' },
      { code: 'EMP003', name: 'Priya Nair' },
      { code: 'EMP004', name: 'Karthik Iyer' },
      { code: 'EMP005', name: 'Sneha Reddy' },
      { code: 'EMP006', name: 'Arjun Menon' },
      { code: 'EMP007', name: 'Divya Krishnan' },
      { code: 'EMP008', name: 'Vikram Singh' }
    ];

    const types: AttendanceType[] = [
      'Pre Attendance', 'Attendance', 'Unpunch', 'Deputation', 'Partial Present',
      'Absent', 'WAH', 'On Duty', 'Leave', 'Forgot Card'
    ];

    // FIXED, explicit list of dates the dummy data supports — NOT relative
    // to "today", so this list is exactly what you can test against, every
    // time, regardless of when the app is run. Covers 2026-05-05 through
    // 2026-07-03 (60 days).
    const testDates: string[] = [
      '2026-07-03', '2026-07-02', '2026-07-01', '2026-06-30', '2026-06-29',
      '2026-06-28', '2026-06-27', '2026-06-26', '2026-06-25', '2026-06-24',
      '2026-06-23', '2026-06-22', '2026-06-21', '2026-06-20', '2026-06-19',
      '2026-06-18', '2026-06-17', '2026-06-16', '2026-06-15', '2026-06-14',
      '2026-06-13', '2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09',
      '2026-06-08', '2026-06-07', '2026-06-06', '2026-06-05', '2026-06-04',
      '2026-06-03', '2026-06-02', '2026-06-01', '2026-05-31', '2026-05-30',
      '2026-05-29', '2026-05-28', '2026-05-27', '2026-05-26', '2026-05-25',
      '2026-05-24', '2026-05-23', '2026-05-22', '2026-05-21', '2026-05-20',
      '2026-05-19', '2026-05-18', '2026-05-17', '2026-05-16', '2026-05-15',
      '2026-05-14', '2026-05-13', '2026-05-12', '2026-05-11', '2026-05-10',
      '2026-05-09', '2026-05-08', '2026-05-07', '2026-05-06', '2026-05-05'
    ];

    const records: AttendanceRecord[] = [];
    let idCounter = 1;

    // Spread dummy records across the fixed dates above so every period
    // filter (date, week, month, year) has data to surface.
    testDates.forEach((dateStr, dayOffset) => {
      employees.forEach((employee, index) => {
        // Not every employee has a record every day, to make the data feel realistic.
        if ((dayOffset + index) % 3 === 0) {
          return;
        }

        const type = types[(dayOffset + index) % types.length];
        const isUnpunched = type === 'Unpunch';
        const inTime = isUnpunched ? undefined : '09:' + String(15 + (index % 4) * 5).padStart(2, '0');
        const outTime = isUnpunched ? undefined : '18:' + String((index % 5) * 7).padStart(2, '0');

        records.push({
          id: 'ATT' + String(idCounter++).padStart(5, '0'),
          date: dateStr,
          employeeCode: employee.code,
          employeeName: employee.name,
          inTime,
          outTime,
          actualIn: inTime,
          actualOut: outTime,
          totalHours: undefined,
          attendanceType: type,
          leaveHaving: type === 'Leave' || (dayOffset + index) % 7 === 0,
          status: isUnpunched ? undefined : 'Present',
          remarks: ''
        });
      });
    });

    return records;
  }
}