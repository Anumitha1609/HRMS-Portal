import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ============================================================================
   TYPES
============================================================================ */

type Gender = 'Male' | 'Female' | null;

type LeaveTypeName =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Earned Leave'
  | 'Compensatory Off'
  | 'Maternity Leave'
  | 'Paternity Leave';

type CompOffStatus = 'Available' | 'Reserved' | 'Used' | 'Expiring' | 'Expired';
type RequestStatus = 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';
type HistoryTab = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'All';
type DotType = 'earned' | 'used' | 'expiring' | 'expired';

interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  gender: Gender;
  initials: string;
}

interface CompOffCredit {
  id: string;
  workedDate: string;
  earnedOn: string;
  validUntil: string;
  used: boolean;
  reserved?: boolean;
  usedDate?: string;
  reason: string;
}

interface LeaveBalanceEntry {
  type: LeaveTypeName;
  total: number;
  used: number;
}

interface LeaveHistoryRecord {
  requestId: string;
  leaveType: LeaveTypeName;
  fromDate: string;
  toDate: string;
  days: number;
  status: RequestStatus;
  appliedDate: string;
  reason: string;
  reservedCreditIds?: string[];
}

interface CalendarEvent {
  date: string;
  dot: DotType;
  credit: CompOffCredit;
}

interface FormState {
  leaveType: LeaveTypeName | '';
  fromDate: string;
  toDate: string;
  reason: string;
  attachment: File | null;
}

/* ============================================================================
   FIXED "TODAY" REFERENCE
============================================================================ */

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

/* ============================================================================
   MOCK DATA
============================================================================ */

const CURRENT_EMPLOYEE: Employee = {
  id: 'EMP-10432',
  name: 'Aarthi Krishnan',
  designation: 'Senior Software Engineer',
  department: 'Engineering · Platform Team',
  gender: 'Female',
  initials: 'AK',
};

const LEAVE_TYPES_BY_GENDER: Record<'Male' | 'Female', LeaveTypeName[]> = {
  Female: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Compensatory Off', 'Maternity Leave'],
  Male: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Compensatory Off', 'Paternity Leave'],
};

const LEAVE_BALANCES: Record<'Male' | 'Female', LeaveBalanceEntry[]> = {
  Female: [
    { type: 'Casual Leave', total: 12, used: 4 },
    { type: 'Sick Leave', total: 7, used: 2 },
    { type: 'Earned Leave', total: 15, used: 3 },
    { type: 'Maternity Leave', total: 182, used: 0 },
  ],
  Male: [
    { type: 'Casual Leave', total: 12, used: 4 },
    { type: 'Sick Leave', total: 7, used: 2 },
    { type: 'Earned Leave', total: 15, used: 3 },
    { type: 'Paternity Leave', total: 15, used: 0 },
  ],
};

const INITIAL_COMP_OFF_CREDITS: CompOffCredit[] = [
  { id: 'CO-2026-014', workedDate: '2026-06-14', earnedOn: '2026-06-14', validUntil: '2026-09-13', used: false, reason: 'Worked on Sunday — production release support' },
  { id: 'CO-2026-024', workedDate: '2026-06-24', earnedOn: '2026-06-24', validUntil: '2026-09-23', used: false, reason: 'Worked on Wednesday — critical deployment' },
  { id: 'CO-2026-011', workedDate: '2026-04-09', earnedOn: '2026-04-09', validUntil: '2026-07-09', used: false, reason: 'Worked on Company Holiday — Tamil New Year' },
  { id: 'CO-2026-009', workedDate: '2026-03-08', earnedOn: '2026-03-08', validUntil: '2026-06-07', used: false, reason: 'Worked on Sunday — client go-live' },
  { id: 'CO-2026-002', workedDate: '2026-01-04', earnedOn: '2026-01-04', validUntil: '2026-04-03', used: true, usedDate: '2026-02-20', reason: 'Worked on Sunday — year-end inventory' },
];

const MOCK_HISTORY: LeaveHistoryRecord[] = [
  { requestId: 'LV-2025-0041', leaveType: 'Casual Leave', fromDate: '2025-06-10', toDate: '2025-06-10', days: 1, status: 'Approved', appliedDate: '2025-06-08', reason: 'Personal errand' },
  { requestId: 'LV-2025-0038', leaveType: 'Sick Leave', fromDate: '2025-05-22', toDate: '2025-05-22', days: 1, status: 'Approved', appliedDate: '2025-05-22', reason: 'Fever and cold' },
  { requestId: 'LV-2025-0031', leaveType: 'Earned Leave', fromDate: '2025-04-14', toDate: '2025-04-17', days: 4, status: 'Approved', appliedDate: '2025-04-10', reason: 'Family vacation' },
  { requestId: 'LV-2025-0027', leaveType: 'Casual Leave', fromDate: '2025-03-05', toDate: '2025-03-05', days: 1, status: 'Rejected', appliedDate: '2025-03-04', reason: 'Vehicle registration' },
  { requestId: 'LV-2025-0019', leaveType: 'Compensatory Off', fromDate: '2025-02-18', toDate: '2025-02-18', days: 1, status: 'Approved', appliedDate: '2025-02-17', reason: 'Comp off for weekend deployment' },
  { requestId: 'LR-2026-0058', leaveType: 'Sick Leave', fromDate: '2026-02-27', toDate: '2026-02-27', days: 1, status: 'Pending', appliedDate: '2026-02-26', reason: 'Dental procedure' },
  { requestId: 'LR-2026-0052', leaveType: 'Earned Leave', fromDate: '2026-01-19', toDate: '2026-01-20', days: 2, status: 'Cancelled', appliedDate: '2026-01-15', reason: 'Travel plan changed' },
];

/* ============================================================================
   LOOKUP TABLES
============================================================================ */

const LEAVE_TYPE_SHORT: Record<LeaveTypeName, string> = {
  'Casual Leave': 'CL',
  'Sick Leave': 'SL',
  'Earned Leave': 'EL',
  'Compensatory Off': 'CO',
  'Maternity Leave': 'ML',
  'Paternity Leave': 'PL',
};

const LEAVE_TYPE_COLOR_CLASS: Record<LeaveTypeName, string> = {
  'Casual Leave': 'type-blue',
  'Sick Leave': 'type-green',
  'Earned Leave': 'type-purple',
  'Maternity Leave': 'type-pink',
  'Paternity Leave': 'type-orange',
  'Compensatory Off': 'type-violet',
};

const STATUS_BADGE_CLASS: Record<CompOffStatus, string> = {
  Available: 'chip-green',
  Reserved: 'chip-violet',
  Used: 'chip-blue',
  Expiring: 'chip-yellow',
  Expired: 'chip-red',
};

const REQUEST_STATUS_CLASS: Record<RequestStatus, string> = {
  Approved: 'chip-green',
  Pending: 'chip-yellow',
  Rejected: 'chip-red',
  Cancelled: 'chip-gray',
};

const DOT_LABEL: Record<DotType, string> = {
  earned: 'Comp Off Earned',
  used: 'Comp Off Used',
  expiring: 'Expiring Soon',
  expired: 'Expired',
};

const HISTORY_TABS: HistoryTab[] = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'All'];
const DOT_TYPES: DotType[] = ['earned', 'used', 'expiring', 'expired'];
const PAGE_SIZE = 5;

/* ============================================================================
   HELPERS (module-level, mirror the React implementation 1:1)
============================================================================ */

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysBetweenInclusive(fromIso: string, toIso: string): number {
  const from = new Date(fromIso + 'T00:00:00');
  const to = new Date(toIso + 'T00:00:00');
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
}

function getDateRange(fromIso: string, toIso: string): string[] {
  const from = new Date(fromIso + 'T00:00:00');
  const to = new Date((toIso || fromIso) + 'T00:00:00');
  const dates: string[] = [];
  for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    dates.push(toISO(d));
  }
  return dates;
}

function diffDaysFromToday(iso: string): number {
  const d = new Date(iso + 'T00:00:00');
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000);
}

function daysRemaining(validUntil: string): number {
  return Math.max(0, diffDaysFromToday(validUntil));
}

function getCreditStatus(c: CompOffCredit): CompOffStatus {
  if (c.used) return 'Used';
  if (c.reserved) return 'Reserved';
  const diff = diffDaysFromToday(c.validUntil);
  if (diff < 0) return 'Expired';
  if (diff <= 14) return 'Expiring';
  return 'Available';
}

function sortByFIFO(credits: CompOffCredit[]): CompOffCredit[] {
  return [...credits].sort((a, b) => a.validUntil.localeCompare(b.validUntil));
}

function getActiveCredits(credits: CompOffCredit[]): CompOffCredit[] {
  return sortByFIFO(credits.filter(c => !c.used && !c.reserved && diffDaysFromToday(c.validUntil) >= 0));
}

function getEligibleCredits(credits: CompOffCredit[], leaveStartDate: string): CompOffCredit[] {
  return sortByFIFO(
    credits.filter(c =>
      !c.used && !c.reserved && diffDaysFromToday(c.validUntil) >= 0 && c.validUntil >= leaveStartDate,
    ),
  );
}

function getIneligibleActiveCredits(credits: CompOffCredit[], leaveStartDate: string): CompOffCredit[] {
  return sortByFIFO(
    credits.filter(c =>
      !c.used && !c.reserved && diffDaysFromToday(c.validUntil) >= 0 && c.validUntil < leaveStartDate,
    ),
  );
}

function buildCalendarEvents(credits: CompOffCredit[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  credits.forEach(c => {
    const status = getCreditStatus(c);
    events.push({ date: c.earnedOn, dot: 'earned', credit: c });
    if (status === 'Used' && c.usedDate) {
      events.push({ date: c.usedDate, dot: 'used', credit: c });
    } else if (status === 'Expiring') {
      events.push({ date: c.validUntil, dot: 'expiring', credit: c });
    } else if (status === 'Expired') {
      events.push({ date: c.validUntil, dot: 'expired', credit: c });
    }
  });
  return events;
}

/* ============================================================================
   COMPONENT
============================================================================ */

@Component({
  selector: 'app-leave-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-request.html',
  styleUrl: './leave-request.scss',
})
export class LeaveRequest implements OnDestroy {
  /* ---- static-ish data ---- */
  employee = CURRENT_EMPLOYEE;
  today = TODAY;
  historyTabs = HISTORY_TABS;
  weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  dotTypes = DOT_TYPES;
  pageSize = PAGE_SIZE;
  compOffMin = toISO(TODAY);

  /* ---- app state ---- */
  history: LeaveHistoryRecord[] = [...MOCK_HISTORY];
  credits: CompOffCredit[] = [...INITIAL_COMP_OFF_CREDITS];
  prefillType: LeaveTypeName | null = null;
  selectedLeaveType: LeaveTypeName | '' = '';
  showLeaveForm = false;

  /* ---- history table state ---- */
  historyTab: HistoryTab = 'Pending';
  page = 1;
  showAll = false;

  /* ---- form state ---- */
  form: FormState = { leaveType: '', fromDate: '', toDate: '', reason: '', attachment: null };
  errors: Record<string, string> = {};
  submitting = false;
  success: string | null = null;
  lastSubmitted: { leaveType: LeaveTypeName; fromDate: string; toDate: string; days: number } | null = null;
  compOffDetailsOpen = true;

  /* ---- calendar state ---- */
  calCursor = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  activeEvent: CalendarEvent | null = null;

  /* ---- template helper fns ---- */
  fmtDate = fmtDate;
  daysRemaining = daysRemaining;
  getCreditStatus = getCreditStatus;

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showLeaveForm) this.exitForm();
  }

  /* ---------------------------------------------------------------------
     DERIVED GETTERS
  --------------------------------------------------------------------- */

  get genderMissing(): boolean {
    return !this.employee.gender;
  }

  get eligibleTypes(): LeaveTypeName[] {
    return this.employee.gender ? LEAVE_TYPES_BY_GENDER[this.employee.gender] : [];
  }

  get baseBalances(): LeaveBalanceEntry[] {
    return this.employee.gender ? LEAVE_BALANCES[this.employee.gender] : [];
  }

  get activeCredits(): CompOffCredit[] {
    return getActiveCredits(this.credits);
  }

  get sortedCredits(): CompOffCredit[] {
    return sortByFIFO(this.credits);
  }

  get firstActiveCredit(): CompOffCredit | null {
    return this.activeCredits[0] ?? null;
  }

  get balanceMap(): Record<string, number> {
    const map: Record<string, number> = {};
    this.baseBalances.forEach(b => { map[b.type] = b.total - b.used; });
    map['Compensatory Off'] = this.activeCredits.length;
    return map;
  }

  get dashboardItems(): { type: LeaveTypeName; total: number; used: number; remaining: number }[] {
    const eligibleSet = new Set(this.eligibleTypes);
    const totalCredits = INITIAL_COMP_OFF_CREDITS.filter(c => getCreditStatus(c) !== 'Expired').length;
    const usedCredits = INITIAL_COMP_OFF_CREDITS.filter(c => c.used).length;
    const items = [
      ...this.baseBalances.map(b => ({ type: b.type, total: b.total, used: b.used, remaining: b.total - b.used })),
      { type: 'Compensatory Off' as LeaveTypeName, total: totalCredits, used: usedCredits, remaining: this.activeCredits.length },
    ];
    return items.filter(i => eligibleSet.has(i.type));
  }

  get isCompOff(): boolean {
    return this.form.leaveType === 'Compensatory Off';
  }

  get days(): number | null {
    return this.form.fromDate && this.form.toDate ? daysBetweenInclusive(this.form.fromDate, this.form.toDate) : null;
  }

  get eligibleForDate(): CompOffCredit[] {
    return this.form.fromDate ? getEligibleCredits(this.credits, this.form.fromDate) : this.activeCredits;
  }

  get ineligibleForDate(): CompOffCredit[] {
    return this.form.fromDate ? getIneligibleActiveCredits(this.credits, this.form.fromDate) : [];
  }

  get allocationLeaveDates(): string[] {
    return this.form.toDate ? getDateRange(this.form.fromDate, this.form.toDate) : [this.form.fromDate];
  }

  get allocations(): { date: string; credit: CompOffCredit | null }[] {
    const eligible = this.eligibleForDate;
    return this.allocationLeaveDates.map((date, idx) => ({ date, credit: eligible[idx] ?? null }));
  }

  get allocationRemaining(): number {
    return Math.max(0, this.allocationLeaveDates.length - this.eligibleForDate.length);
  }

  get highlightCompOff(): boolean {
    return this.selectedLeaveType === 'Compensatory Off';
  }

  /* ---- history table derived ---- */

  get filteredHistory(): LeaveHistoryRecord[] {
    return this.historyTab === 'All' ? this.history : this.history.filter(r => r.status === this.historyTab);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredHistory.length / this.pageSize));
  }

  get pageSafe(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pageRecords(): LeaveHistoryRecord[] {
    const f = this.filteredHistory;
    return this.showAll ? f : f.slice((this.pageSafe - 1) * this.pageSize, this.pageSafe * this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  countFor(tab: HistoryTab): number {
    return tab === 'All' ? this.history.length : this.history.filter(r => r.status === tab).length;
  }

  /* ---- calendar derived ---- */

  get calYear(): number {
    return this.calCursor.getFullYear();
  }

  get calMonth(): number {
    return this.calCursor.getMonth();
  }

  get calMonthLabel(): string {
    return this.calCursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  get calCells(): (number | null)[] {
    const firstDow = new Date(this.calYear, this.calMonth, 1).getDay();
    const daysInMonth = new Date(this.calYear, this.calMonth + 1, 0).getDate();
    return [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  }

  get calEvents(): CalendarEvent[] {
    return buildCalendarEvents(this.credits);
  }

  eventsForDay(day: number): CalendarEvent[] {
    if (!this.highlightCompOff) return [];
    const iso = toISO(new Date(this.calYear, this.calMonth, day));
    return this.calEvents.filter(e => e.date === iso);
  }

  isToday(day: number): boolean {
    return this.calYear === TODAY.getFullYear() && this.calMonth === TODAY.getMonth() && day === TODAY.getDate();
  }

  prevMonth(): void {
    this.calCursor = new Date(this.calYear, this.calMonth - 1, 1);
    this.activeEvent = null;
  }

  nextMonth(): void {
    this.calCursor = new Date(this.calYear, this.calMonth + 1, 1);
    this.activeEvent = null;
  }

  onDayClick(day: number): void {
    const evs = this.eventsForDay(day);
    if (evs.length > 0) this.activeEvent = evs[0];
  }

  closeTooltip(): void {
    this.activeEvent = null;
  }

  /* ---------------------------------------------------------------------
     LOOKUP HELPERS FOR TEMPLATE
  --------------------------------------------------------------------- */

  leaveTypeShort(t: LeaveTypeName): string { return LEAVE_TYPE_SHORT[t]; }
  typeColorClass(t: LeaveTypeName): string { return LEAVE_TYPE_COLOR_CLASS[t]; }
  statusBadgeClass(s: CompOffStatus): string { return STATUS_BADGE_CLASS[s]; }
  requestStatusClass(s: RequestStatus): string { return REQUEST_STATUS_CLASS[s]; }
  statusLabel(s: CompOffStatus): string { return s === 'Expiring' ? 'Expiring Soon' : s; }
  dotLabel(d: DotType): string { return DOT_LABEL[d]; }
  dotColorClass(d: DotType): string { return 'dot-' + d; }
  minVal(a: number, b: number): number { return Math.min(a, b); }

  compOffCardStatus(): CompOffStatus {
    const fc = this.firstActiveCredit;
    return fc ? getCreditStatus(fc) : 'Expired';
  }

  compOffCardStatusClass(): string {
    const s = this.compOffCardStatus();
    if (s === 'Available') return 'chip-green';
    if (s === 'Expiring') return 'chip-yellow';
    return 'chip-red';
  }

  /* ---------------------------------------------------------------------
     HISTORY TABLE ACTIONS
  --------------------------------------------------------------------- */

  setHistoryTab(tab: HistoryTab): void {
    this.historyTab = tab;
    this.page = 1;
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  goToPage(n: number): void {
    this.page = n;
  }

  /* ---------------------------------------------------------------------
     MODAL / FORM ACTIONS
  --------------------------------------------------------------------- */

  openAddNewLeave(): void {
    this.prefillType = null;
    this.selectedLeaveType = '';
    this.resetFormFields();
    this.compOffDetailsOpen = true;
    this.showLeaveForm = true;
    this.lockScroll();
  }

  applyCompOff(): void {
    this.prefillType = 'Compensatory Off';
    this.selectedLeaveType = 'Compensatory Off';
    this.resetFormFields();
    this.form.leaveType = 'Compensatory Off';
    this.compOffDetailsOpen = true;
    this.showLeaveForm = true;
    this.lockScroll();
  }

  exitForm(): void {
    this.showLeaveForm = false;
    this.prefillType = null;
    this.unlockScroll();
  }

  onBackdropClick(): void {
    this.exitForm();
  }

  setLeaveType(v: string): void {
    this.form.leaveType = v as LeaveTypeName | '';
    this.errors = cxErrors(this.errors, 'leaveType');
    this.selectedLeaveType = this.form.leaveType;
  }

  setFromDate(v: string): void {
    this.form.fromDate = v;
    this.errors = cxErrors(this.errors, 'fromDate');
  }

  setToDate(v: string): void {
    this.form.toDate = v;
    this.errors = cxErrors(this.errors, 'toDate');
  }

  setReason(v: string): void {
    this.form.reason = v;
    this.errors = cxErrors(this.errors, 'reason');
  }

  onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.form.attachment = input.files && input.files.length ? input.files[0] : null;
    this.errors = cxErrors(this.errors, 'attachment');
  }

  private validate(): boolean {
    const errs: Record<string, string> = {};
    if (!this.form.leaveType) errs['leaveType'] = 'Please select a leave type.';
    if (!this.form.fromDate) errs['fromDate'] = 'From date is required.';
    if (!this.form.toDate) errs['toDate'] = 'To date is required.';
    if (this.form.fromDate && this.form.toDate && this.form.toDate < this.form.fromDate) {
      errs['toDate'] = 'To date cannot be earlier than from date.';
    }
    if (!this.form.reason.trim() || this.form.reason.trim().length < 8) {
      errs['reason'] = 'Please enter a reason (minimum 8 characters).';
    }
    if (this.isCompOff && this.form.fromDate) {
      if (this.form.fromDate < this.compOffMin) {
        errs['fromDate'] = `Comp Off Leave cannot start before ${fmtDate(this.compOffMin)}.`;
      } else if (this.eligibleForDate.length === 0) {
        errs['leaveType'] = 'No eligible Compensatory Off balance for the selected dates.';
      } else {
        const needed = this.days ?? 1;
        if (this.eligibleForDate.length < needed) {
          errs['toDate'] =
            `Only ${this.eligibleForDate.length} valid Comp Off day${this.eligibleForDate.length !== 1 ? 's' : ''} ` +
            `${this.eligibleForDate.length !== 1 ? 'are' : 'is'} available for the selected leave period. ` +
            `Please shorten the leave duration or use another leave type for the remaining ` +
            `${needed - this.eligibleForDate.length} day${needed - this.eligibleForDate.length !== 1 ? 's' : ''}.`;
        }
      }
    } else if (this.form.leaveType && !this.isCompOff && this.days !== null) {
      const available = this.balanceMap[this.form.leaveType] ?? 0;
      if (this.days > available) {
        errs['leaveType'] = `Insufficient balance. Available: ${available} day${available !== 1 ? 's' : ''}, requested: ${this.days}.`;
      }
    }
    if (this.days !== null && this.days > 2 && !this.form.attachment) {
      errs['attachment'] = 'Attachment recommended for leave longer than 2 days.';
    }
    this.errors = errs;
    return Object.keys(errs).filter(k => k !== 'attachment').length === 0;
  }

  onSubmit(): void {
    if (!this.validate()) return;
    this.submitting = true;

    const creditsToReserve = this.isCompOff
      ? this.eligibleForDate.slice(0, this.days ?? 1).map(c => c.id)
      : [];

    setTimeout(() => {
      const rec: LeaveHistoryRecord = {
        requestId: `LR-2026-${Math.floor(1000 + Math.random() * 8999)}`,
        leaveType: this.form.leaveType as LeaveTypeName,
        fromDate: this.form.fromDate,
        toDate: this.form.toDate,
        days: this.days ?? 1,
        status: 'Pending',
        appliedDate: toISO(TODAY),
        reason: this.form.reason,
        reservedCreditIds: creditsToReserve,
      };
      this.handleSubmitted(rec, creditsToReserve);
      this.success = rec.requestId;
      this.lastSubmitted = { leaveType: rec.leaveType, fromDate: rec.fromDate, toDate: rec.toDate, days: rec.days };
      this.submitting = false;
      this.resetFormFields();
    }, 600);
  }

  private handleSubmitted(rec: LeaveHistoryRecord, reservedCreditIds: string[]): void {
    this.history = [rec, ...this.history];
    if (reservedCreditIds.length > 0) {
      this.credits = this.credits.map(c =>
        reservedCreditIds.includes(c.id) ? { ...c, reserved: true } : c,
      );
    }
    this.historyTab = 'Pending';
    this.page = 1;
    setTimeout(() => {
      this.showLeaveForm = false;
      this.prefillType = null;
      this.unlockScroll();
    }, 1400);
  }

  private resetFormFields(): void {
    this.form = { leaveType: '', fromDate: '', toDate: '', reason: '', attachment: null };
    this.errors = {};
  }

  resetClicked(): void {
    this.resetFormFields();
    this.success = null;
    this.lastSubmitted = null;
  }

  cancelClicked(): void {
    this.resetFormFields();
    this.success = null;
    this.lastSubmitted = null;
    this.exitForm();
  }

  private lockScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
  }
}

function cxErrors(errors: Record<string, string>, key: string): Record<string, string> {
  const next = { ...errors };
  next[key] = '';
  return next;
}