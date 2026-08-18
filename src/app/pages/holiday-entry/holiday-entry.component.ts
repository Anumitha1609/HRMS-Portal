import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { LucideAngularModule } from 'lucide-angular';
import * as XLSX from 'xlsx';

type PayStatus = 'Pay' | 'No Pay';

interface Holiday {
  id: number;
  date: string;        // ISO yyyy-MM-dd (used by <input type="date">)
  reason: string;
  bank: boolean;
  postal: boolean;
  ourHoliday: boolean;
  national: boolean;
  location: string;
  payStatus: PayStatus;
}

const PAGE_SIZE = 10;

const INIT_HOLIDAYS: Holiday[] = [
  { id: 1,  date: '2026-01-01', reason: 'English New Year',      bank: true,  postal: true,  ourHoliday: true,  national: false, location: 'Office', payStatus: 'Pay' },
  { id: 2,  date: '2026-01-15', reason: 'Pongal',                 bank: true,  postal: true,  ourHoliday: true,  national: false, location: 'Office', payStatus: 'Pay' },
  { id: 3,  date: '2026-01-16', reason: 'Pongal',                 bank: true,  postal: true,  ourHoliday: true,  national: false, location: 'Office', payStatus: 'Pay' },
  { id: 4,  date: '2026-01-26', reason: 'Republic Day',           bank: true,  postal: true,  ourHoliday: true,  national: true,  location: 'Office', payStatus: 'Pay' },
  { id: 5,  date: '2026-04-03', reason: 'Good Friday',            bank: true,  postal: true,  ourHoliday: true,  national: false, location: 'Office', payStatus: 'Pay' },
  { id: 6,  date: '2026-04-14', reason: 'Tamil New Year',         bank: true,  postal: true,  ourHoliday: true,  national: false, location: 'Office', payStatus: 'Pay' },
  { id: 7,  date: '2026-05-01', reason: 'May Day',                bank: true,  postal: true,  ourHoliday: true,  national: true,  location: 'Office', payStatus: 'Pay' },
  { id: 8,  date: '2026-08-15', reason: 'Independence Day',       bank: true,  postal: true,  ourHoliday: true,  national: true,  location: 'Office', payStatus: 'Pay' },
  { id: 9,  date: '2026-09-14', reason: 'Vinayakar Chathurthi',   bank: true,  postal: true,  ourHoliday: true,  national: false, location: 'Office', payStatus: 'Pay' },
  { id: 10, date: '2026-10-02', reason: 'Gandhi Jayanthi',        bank: true,  postal: true,  ourHoliday: true,  national: true,  location: 'Office', payStatus: 'Pay' },
  { id: 11, date: '2026-10-19', reason: 'Ayudha Pooja',           bank: true,  postal: true,  ourHoliday: true,  national: false, location: 'Office', payStatus: 'Pay' },
  { id: 12, date: '2026-11-08', reason: 'Deepavali',              bank: true,  postal: true,  ourHoliday: true,  national: false, location: 'Office', payStatus: 'Pay' },
  { id: 13, date: '2026-11-09', reason: 'Deepavali (Comp. off)',  bank: true,  postal: true,  ourHoliday: true,  national: false, location: 'Office', payStatus: 'Pay' },
];

const EMPTY_HOLIDAY: Omit<Holiday, 'id'> = {
  date: '', reason: '', bank: false, postal: false, ourHoliday: true, national: false,
  location: 'Office', payStatus: 'Pay'
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface BulkHoliday {
  uid: number;
  date: string;
  reason: string;
  bank: boolean;
  postal: boolean;
  ourHoliday: boolean;
  national: boolean;
}

interface CalendarCell {
  iso: string;
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
}

const EMPTY_BULK_ROW: Omit<BulkHoliday, 'uid'> = {
  date: '', reason: '', bank: false, postal: false, ourHoliday: false, national: false
};

@Component({
  selector: 'app-holiday-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './holiday-entry.component.html',
  styleUrls: ['./holiday-entry.component.scss']
})
export class HolidayEntryComponent implements OnInit {
  @ViewChild('gridSearchInput') gridSearchInput?: ElementRef<HTMLInputElement>;

  holidays: Holiday[] = [...INIT_HOLIDAYS];
  locations: string[] = ['Office', 'Factory', 'Branch'];
  payStatuses: PayStatus[] = ['Pay', 'No Pay'];

  form: Omit<Holiday, 'id'> & { id: number | null } = { id: null, ...EMPTY_HOLIDAY };
  editMode = false;
  selectedId: number | null = null;

  searchTerm = '';
  page = 1;

  selectedYear: number = 2026;
  selectedLocation = 'Office';

  // ---- Add for a Year (bulk entry) ----
  bulkModalOpen = false;
  bulkActiveTab: 'calendar' | 'row' = 'calendar';
  bulkYear = this.selectedYear;
  bulkDrafts: BulkHoliday[] = [];
  private bulkUidCounter = 1;

  // Calendar-wise entry state
  bulkCalMonth = 0; // 0-indexed
  bulkCalViewMode: 'month' | 'list' = 'month';

  // Date quick-entry popup
  bulkPopupOpen = false;
  bulkPopupIsEdit = false;
  bulkPopupForm: Omit<BulkHoliday, 'uid'> = { ...EMPTY_BULK_ROW };

  // Row-wise entry state (blank trailing row)
  bulkNewRow: Omit<BulkHoliday, 'uid'> = { ...EMPTY_BULK_ROW };

  constructor(private toastService: ToastService) {}

  ngOnInit() {}

  get years(): number[] {
    const fromData = this.holidays.map(h => new Date(h.date).getFullYear());
    const set = new Set<number>([...fromData, this.selectedYear, new Date().getFullYear()]);
    return Array.from(set).sort((a, b) => a - b);
  }

  dayOf(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return DAY_NAMES[d.getDay()];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}-${m}-${y}`;
  }

  get filteredHolidays(): Holiday[] {
    const term = this.searchTerm.trim().toLowerCase();
    let list = this.holidays.filter(h => new Date(h.date).getFullYear() === this.selectedYear);
    if (this.selectedLocation) {
      list = list.filter(h => h.location === this.selectedLocation);
    }
    if (term) {
      list = list.filter(h =>
        h.reason.toLowerCase().includes(term) ||
        this.dayOf(h.date).toLowerCase().includes(term) ||
        this.formatDate(h.date).toLowerCase().includes(term) ||
        h.location.toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => a.date.localeCompare(b.date));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredHolidays.length / PAGE_SIZE));
  }

  get currentPage(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pageRows(): Holiday[] {
    const start = (this.currentPage - 1) * PAGE_SIZE;
    return this.filteredHolidays.slice(start, start + PAGE_SIZE);
  }

  get startEntry(): number {
    return this.filteredHolidays.length === 0 ? 0 : (this.currentPage - 1) * PAGE_SIZE + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * PAGE_SIZE, this.filteredHolidays.length);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur, '…', total];
  }

  onYearChange(val: string | number) {
    this.selectedYear = Number(val);
    this.page = 1;
  }

  onLocationChange(val: string) {
    this.selectedLocation = val;
    this.page = 1;
  }

  onSearchChange(val: string) {
    this.searchTerm = val;
    this.page = 1;
  }

  focusGridSearch() {
    this.gridSearchInput?.nativeElement.focus();
  }

  onNew() {
    this.selectedId = null;
    this.form = { id: null, ...EMPTY_HOLIDAY, location: this.selectedLocation || 'Office' };
    this.editMode = true;
  }

  editRow(h: Holiday) {
    this.selectedId = h.id;
    this.form = { ...h };
    this.editMode = true;
  }

  deleteRow(h: Holiday) {
    this.selectedId = h.id;
    this.onDelete();
  }

  onDelete() {
    if (this.selectedId === null) {
      this.toastService.addToast('Select a holiday from the list to delete.', 'warning');
      return;
    }
    const holiday = this.holidays.find(h => h.id === this.selectedId);
    this.holidays = this.holidays.filter(h => h.id !== this.selectedId);
    this.toastService.addToast(`Holiday "${holiday?.reason}" deleted.`, 'error');
    this.selectedId = null;
    this.form = { id: null, ...EMPTY_HOLIDAY };
  }

  onSave() {
    if (!this.form.date || !this.form.reason || !this.form.location || !this.form.payStatus) {
      this.toastService.addToast('Please fill all required fields.', 'error');
      return;
    }
    const dupExists = this.holidays.some(h => h.date === this.form.date && h.location === this.form.location && h.id !== this.form.id);
    if (dupExists) {
      this.toastService.addToast('A holiday already exists for this date and location.', 'error');
      return;
    }

    if (this.form.id === null) {
      const newId = this.holidays.length > 0 ? Math.max(...this.holidays.map(h => h.id)) + 1 : 1;
      const newHoliday: Holiday = { ...(this.form as Omit<Holiday, 'id'>), id: newId };
      this.holidays = [...this.holidays, newHoliday];
      this.selectedId = newId;
      this.toastService.addToast(`Holiday "${newHoliday.reason}" added.`, 'success');
    } else {
      this.holidays = this.holidays.map(h => h.id === this.form.id ? { ...(this.form as Holiday) } : h);
      this.toastService.addToast(`Holiday "${this.form.reason}" updated.`, 'success');
    }
    this.editMode = false;
  }

  onCancel() {
    if (this.selectedId !== null) {
      const original = this.holidays.find(h => h.id === this.selectedId);
      this.form = original ? { ...original } : { id: null, ...EMPTY_HOLIDAY };
    } else {
      this.form = { id: null, ...EMPTY_HOLIDAY };
    }
    this.editMode = false;
  }

  onResetFilters() {
    this.searchTerm = '';
    this.selectedLocation = 'Office';
    this.page = 1;
    this.toastService.addToast('Filters reset.', 'success');
  }

  onExport() {
    const sheetData = this.filteredHolidays.map((h, i) => ({
      '#': i + 1,
      'Date': this.formatDate(h.date),
      'Day': this.dayOf(h.date),
      'Reason': h.reason,
      'Bank': h.bank ? 'Yes' : 'No',
      'Postal': h.postal ? 'Yes' : 'No',
      'Our Holiday': h.ourHoliday ? 'Yes' : 'No',
      'National': h.national ? 'Yes' : 'No',
      'Location': h.location,
      'Pay Status': h.payStatus
    }));
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Holiday Entry');
    XLSX.writeFile(workbook, `Holiday_Entry_${this.selectedYear}.xlsx`);
    this.toastService.addToast('Holiday list exported.', 'success');
  }

  setPage(p: number | string) {
    if (typeof p === 'number') this.page = p;
  }

  prevPage() {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage() {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  // ============================================================
  // Add for a Year — bulk holiday entry (Calendar-wise & Row-wise)
  // ============================================================

  openBulkModal() {
    this.bulkYear = this.selectedYear;
    this.loadBulkDraftsForYear();
    this.bulkActiveTab = 'calendar';
    const today = new Date();
    this.bulkCalMonth = this.bulkYear === today.getFullYear() ? today.getMonth() : 0;
    this.bulkCalViewMode = 'month';
    this.resetNewRow();
    this.bulkModalOpen = true;
  }

  closeBulkModal() {
    this.bulkModalOpen = false;
    this.bulkPopupOpen = false;
  }

  private loadBulkDraftsForYear() {
    this.bulkDrafts = this.holidays
      .filter(h => new Date(h.date).getFullYear() === this.bulkYear)
      .map(h => ({
        uid: this.bulkUidCounter++,
        date: h.date,
        reason: h.reason,
        bank: h.bank,
        postal: h.postal,
        ourHoliday: h.ourHoliday,
        national: h.national
      }));
  }

  setBulkTab(tab: 'calendar' | 'row') {
    this.bulkActiveTab = tab;
  }

  onBulkYearChange(val: string | number) {
    this.bulkYear = Number(val);
    this.loadBulkDraftsForYear();
    const today = new Date();
    this.bulkCalMonth = this.bulkYear === today.getFullYear() ? today.getMonth() : 0;
  }

  get bulkYears(): number[] {
    const cur = new Date().getFullYear();
    const set = new Set<number>([this.bulkYear, cur, cur + 1, cur + 2]);
    return Array.from(set).sort((a, b) => a - b);
  }

  get bulkSortedDrafts(): BulkHoliday[] {
    return [...this.bulkDrafts].sort((a, b) => a.date.localeCompare(b.date));
  }

  get bulkMonthLabel(): string {
    return `${MONTH_NAMES[this.bulkCalMonth]} ${this.bulkYear}`;
  }

  get bulkCalendarCells(): CalendarCell[] {
    const y = this.bulkYear, m = this.bulkCalMonth;
    const firstOfMonth = new Date(y, m, 1);
    const startOffset = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cells: CalendarCell[] = [];

    for (let i = 0; i < startOffset; i++) {
      const dayNum = daysInPrevMonth - startOffset + 1 + i;
      const d = new Date(y, m - 1, dayNum);
      cells.push({ iso: this.toIso(d), dayNum, inMonth: false, isToday: false });
    }
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(y, m, dayNum);
      const iso = this.toIso(d);
      cells.push({ iso, dayNum, inMonth: true, isToday: iso === todayIso });
    }
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const toAdd = 7 - remainder;
      for (let dayNum = 1; dayNum <= toAdd; dayNum++) {
        const d = new Date(y, m + 1, dayNum);
        cells.push({ iso: this.toIso(d), dayNum, inMonth: false, isToday: false });
      }
    }
    return cells;
  }

  get bulkCalendarWeeks(): CalendarCell[][] {
    const cells = this.bulkCalendarCells;
    const weeks: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  private toIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  prevMonth() {
    if (this.bulkCalMonth === 0) { this.bulkCalMonth = 11; this.bulkYear--; }
    else { this.bulkCalMonth--; }
  }

  nextMonth() {
    if (this.bulkCalMonth === 11) { this.bulkCalMonth = 0; this.bulkYear++; }
    else { this.bulkCalMonth++; }
  }

  goToday() {
    const t = new Date();
    this.bulkYear = t.getFullYear();
    this.bulkCalMonth = t.getMonth();
  }

  setBulkCalViewMode(mode: 'month' | 'list') {
    this.bulkCalViewMode = mode;
  }

  getBulkDraft(iso: string): BulkHoliday | undefined {
    return this.bulkDrafts.find(d => d.date === iso);
  }

  openDatePopup(cell: CalendarCell) {
    const existing = this.getBulkDraft(cell.iso);
    this.bulkPopupIsEdit = !!existing;
    this.bulkPopupForm = existing
      ? { date: existing.date, reason: existing.reason, bank: existing.bank, postal: existing.postal, ourHoliday: existing.ourHoliday, national: existing.national }
      : { date: cell.iso, reason: '', bank: false, postal: false, ourHoliday: false, national: false };
    this.bulkPopupOpen = true;
  }

  closeDatePopup() {
    this.bulkPopupOpen = false;
  }

  saveDatePopup() {
    if (!this.bulkPopupForm.reason.trim()) {
      this.toastService.addToast('Please enter a reason for the holiday.', 'error');
      return;
    }
    const idx = this.bulkDrafts.findIndex(d => d.date === this.bulkPopupForm.date);
    if (idx > -1) {
      this.bulkDrafts[idx] = { ...this.bulkDrafts[idx], ...this.bulkPopupForm };
    } else {
      this.bulkDrafts.push({ uid: this.bulkUidCounter++, ...this.bulkPopupForm });
    }
    this.bulkDrafts = [...this.bulkDrafts];
    this.closeDatePopup();
  }

  removeDatePopupEntry() {
    this.bulkDrafts = this.bulkDrafts.filter(d => d.date !== this.bulkPopupForm.date);
    this.closeDatePopup();
  }

  bulkDayOf(iso: string): string {
    return this.dayOf(iso);
  }

  bulkFormatDate(iso: string): string {
    return this.formatDate(iso);
  }

  // ---- Row-wise entry ----

  resetNewRow() {
    this.bulkNewRow = { ...EMPTY_BULK_ROW };
  }

  addBulkRow() {
    if (!this.bulkNewRow.date || !this.bulkNewRow.reason.trim()) {
      this.toastService.addToast('Enter a date and reason to add a row.', 'error');
      return;
    }
    const dup = this.bulkDrafts.some(d => d.date === this.bulkNewRow.date);
    if (dup) {
      this.toastService.addToast('A holiday already exists for this date.', 'error');
      return;
    }
    this.bulkDrafts = [...this.bulkDrafts, { uid: this.bulkUidCounter++, ...this.bulkNewRow }];
    this.resetNewRow();
  }

  removeBulkRow(uid: number) {
    this.bulkDrafts = this.bulkDrafts.filter(d => d.uid !== uid);
  }

  onBulkRowDateChange(row: BulkHoliday) {
    row.date = row.date; // day is derived via bulkDayOf() in the template
  }

  // ---- Save / Cancel for the whole bulk modal ----

  saveBulkHolidays() {
    if (this.bulkDrafts.length === 0) {
      this.toastService.addToast('Add at least one holiday before saving.', 'warning');
      return;
    }
    const loc = this.selectedLocation || 'Office';
    const retained = this.holidays.filter(h => !(new Date(h.date).getFullYear() === this.bulkYear && h.location === loc));
    let nextId = this.holidays.length > 0 ? Math.max(...this.holidays.map(h => h.id)) + 1 : 1;
    const added: Holiday[] = this.bulkSortedDrafts.map(d => ({
      id: nextId++,
      date: d.date,
      reason: d.reason,
      bank: d.bank,
      postal: d.postal,
      ourHoliday: d.ourHoliday,
      national: d.national,
      location: loc,
      payStatus: 'Pay'
    }));
    this.holidays = [...retained, ...added];
    this.selectedYear = this.bulkYear;
    this.page = 1;
    this.toastService.addToast(`${added.length} holiday(s) saved for ${this.bulkYear}.`, 'success');
    this.closeBulkModal();
  }
}
