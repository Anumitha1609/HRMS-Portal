import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

export interface ShiftBreak {
  id: string;
  begin: string; // HH:mm:ss
  end: string; // HH:mm:ss
  type: string;
}

export interface ShiftEntryRow {
  id: number;
  code: string;
  name: string;
  begin: string; // HH:mm:ss
  end: string; // HH:mm:ss
  breaks: ShiftBreak[];
  groupId: number | null; // linked Shift Group (Shift Type)
}

export interface ShiftGroupRow {
  id: number;
  code: string;
  name: string;
  status: 'Active' | 'Inactive';
  shiftIds: number[];
}

type Tab = 'entry' | 'group';
type Period = 'AM' | 'PM';

const PAGE_SIZE = 6;

const SHIFT_NAME_OPTIONS = ['Morning Shift', 'General Shift', 'Evening Shift', 'Night Shift'];

interface ShiftTimePreset {
  label: string;
  beginHour: number;
  beginMinute: number;
  beginPeriod: Period;
  endHour: number;
  endMinute: number;
  endPeriod: Period;
}

const SHIFT_TIME_PRESETS: ShiftTimePreset[] = [
  { label: 'Morning (06:00 AM - 02:00 PM)', beginHour: 6, beginMinute: 0, beginPeriod: 'AM', endHour: 2, endMinute: 0, endPeriod: 'PM' },
  { label: 'General (09:00 AM - 05:00 PM)', beginHour: 9, beginMinute: 0, beginPeriod: 'AM', endHour: 5, endMinute: 0, endPeriod: 'PM' },
  { label: 'Evening (02:00 PM - 10:00 PM)', beginHour: 2, beginMinute: 0, beginPeriod: 'PM', endHour: 10, endMinute: 0, endPeriod: 'PM' },
  { label: 'Night (10:00 PM - 06:00 AM)', beginHour: 10, beginMinute: 0, beginPeriod: 'PM', endHour: 6, endMinute: 0, endPeriod: 'AM' }
];

interface ShiftFormModel {
  code: string;
  namePreset: string; // one of SHIFT_NAME_OPTIONS or 'Other'
  customName: string;
  shiftType: string; // selected Shift Group id (as string), sourced from Shift Group Master
  timePreset: string; // preset label or 'Custom'
  beginHour: number;
  beginMinute: number;
  beginPeriod: Period;
  endHour: number;
  endMinute: number;
  endPeriod: Period;
  breaks: ShiftBreak[];
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55
const PERIOD_OPTIONS: Period[] = ['AM', 'PM'];

function blankShiftForm(): ShiftFormModel {
  return {
    code: '',
    namePreset: '',
    customName: '',
    shiftType: '',
    timePreset: '',
    beginHour: 9,
    beginMinute: 0,
    beginPeriod: 'AM',
    endHour: 5,
    endMinute: 0,
    endPeriod: 'PM',
    breaks: []
  };
}

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.scss']
})
export class ShiftsComponent {
  private toastService = inject(ToastService);

  readonly shiftNameOptions = SHIFT_NAME_OPTIONS;
  readonly shiftTimePresets = SHIFT_TIME_PRESETS;
  readonly hourOptions = HOUR_OPTIONS;
  readonly minuteOptions = MINUTE_OPTIONS;
  readonly periodOptions = PERIOD_OPTIONS;

  /** Position a clock-face mark (1 of 12 slots) around the dial, offset so it centers on the point. */
  private markPosition(index: number): { x: number; y: number } {
    const angle = (index * 30 - 90) * (Math.PI / 180);
    const radius = 85;
    const center = 110;
    const markHalfSize = 17;
    return {
      x: center + radius * Math.cos(angle) - markHalfSize,
      y: center + radius * Math.sin(angle) - markHalfSize
    };
  }

  /** Plain 12-hour dial marks (1-12), no inner 24-hour ring. */
  readonly clockHourMarks = HOUR_OPTIONS.map((h) => {
    const pos = this.markPosition(h % 12);
    return { value: h, label: String(h), x: pos.x, y: pos.y };
  });

  /** Minute dial marks in 5-minute steps (00, 05, ... 55), no seconds. */
  readonly clockMinuteMarks = MINUTE_OPTIONS.map((m) => {
    const pos = this.markPosition(m / 5);
    return { value: m, label: m < 10 ? '0' + m : String(m), x: pos.x, y: pos.y };
  });

  // ---------- Tab state ----------
  activeTab = signal<Tab>('entry');

  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  // ================= SHIFT ENTRY =================
  shifts = signal<ShiftEntryRow[]>([
    {
      id: 1,
      code: 'SFT-001',
      name: 'Morning',
      begin: '06:00:00',
      end: '14:00:00',
      breaks: [
        { id: 'b1', begin: '08:00:00', end: '08:15:00', type: 'Tea Break' },
        { id: 'b2', begin: '10:00:00', end: '11:00:00', type: 'Lunch Break' }
      ],
      groupId: 1
    },
    {
      id: 2,
      code: 'SFT-002',
      name: 'General',
      begin: '09:00:00',
      end: '17:00:00',
      breaks: [
        { id: 'b3', begin: '11:00:00', end: '11:15:00', type: 'Tea Break' },
        { id: 'b4', begin: '13:00:00', end: '14:00:00', type: 'Lunch Break' }
      ],
      groupId: 1
    },
    {
      id: 3,
      code: 'SFT-003',
      name: 'Evening',
      begin: '14:00:00',
      end: '22:00:00',
      breaks: [
        { id: 'b5', begin: '16:00:00', end: '16:15:00', type: 'Tea Break' },
        { id: 'b6', begin: '18:00:00', end: '19:00:00', type: 'Dinner Break' }
      ],
      groupId: 2
    },
    {
      id: 4,
      code: 'SFT-004',
      name: 'Night',
      begin: '22:00:00',
      end: '06:00:00',
      breaks: [
        { id: 'b7', begin: '00:00:00', end: '00:15:00', type: 'Tea Break' },
        { id: 'b8', begin: '02:00:00', end: '03:00:00', type: 'Dinner Break' }
      ],
      groupId: 2
    }
  ]);

  entrySearch = signal('');
  entryPage = signal(1);
  expandedShiftId = signal<number | null>(null);

  filteredShifts = computed(() => {
    const q = this.entrySearch().toLowerCase().trim();
    const list = this.shifts();
    if (!q) return list;
    return list.filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  });

  entryTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredShifts().length / PAGE_SIZE)));

  pagedShifts = computed(() => {
    const page = this.entryPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredShifts().slice(start, start + PAGE_SIZE);
  });

  entryStart = computed(() => (this.filteredShifts().length === 0 ? 0 : (this.entryPage() - 1) * PAGE_SIZE + 1));
  entryEnd = computed(() => Math.min(this.entryPage() * PAGE_SIZE, this.filteredShifts().length));

  entryPrevPage() {
    if (this.entryPage() > 1) this.entryPage.update((p) => p - 1);
  }
  entryNextPage() {
    if (this.entryPage() < this.entryTotalPages()) this.entryPage.update((p) => p + 1);
  }

  toggleExpand(id: number) {
    this.expandedShiftId.update((cur) => (cur === id ? null : id));
  }

  // -- duration helpers --
  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /** Convert a 24-hour "HH:mm:ss" string to a friendly 12-hour "hh:mm AM/PM" label. */
  formatTime12(time: string): string {
    const [hStr, mStr] = time.split(':');
    let h = Number(hStr) || 0;
    const m = Number(mStr) || 0;
    const period: Period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  spanMinutes(begin: string, end: string): number {
    let diff = this.toMinutes(end) - this.toMinutes(begin);
    if (diff <= 0) diff += 24 * 60;
    return diff;
  }

  breakMinutes(b: ShiftBreak): number {
    let diff = this.toMinutes(b.end) - this.toMinutes(b.begin);
    if (diff < 0) diff += 24 * 60;
    return diff;
  }

  totalBreakMinutes(row: ShiftEntryRow): number {
    return row.breaks.reduce((sum, b) => sum + this.breakMinutes(b), 0);
  }

  totalWorkMinutes(row: ShiftEntryRow): number {
    return Math.max(0, this.spanMinutes(row.begin, row.end) - this.totalBreakMinutes(row));
  }

  formatDuration(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) return `${h} hr ${m} min`;
    if (h > 0) return `${h} hr`;
    return `${m} min`;
  }

  formatBreakHours(b: ShiftBreak): string {
    const mins = this.breakMinutes(b);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} hr ${m} min`;
    if (h > 0) return h === 1 ? '1 hour' : `${h} hours`;
    return `${m} min`;
  }

  workDurationLabel(row: ShiftEntryRow): string {
    return this.formatDuration(this.totalWorkMinutes(row));
  }

  breakDurationLabel(row: ShiftEntryRow): string {
    return this.formatDuration(this.totalBreakMinutes(row));
  }

  // -- Add / Edit shift modal --
  showShiftModal = signal(false);
  editingShiftId = signal<number | null>(null);
  shiftForm = signal<ShiftFormModel>(blankShiftForm());

  /** Convert 12-hour hour/minute/period into a 24-hour "HH:mm:00" string. */
  private to24Hour(hour: number, minute: number, period: Period): string {
    let h = hour % 12;
    if (period === 'PM') h += 12;
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  }

  /** Convert a 24-hour "HH:mm:ss" string into 12-hour hour/minute/period parts. */
  private from24Hour(time: string): { hour: number; minute: number; period: Period } {
    const [hStr, mStr] = (time || '00:00:00').split(':');
    let h = Number(hStr) || 0;
    const minute = Number(mStr) || 0;
    const period: Period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { hour: h, minute, period };
  }

  openAddShift() {
    this.editingShiftId.set(null);
    const nextNum = this.shifts().length + 1;
    this.shiftForm.set({
      ...blankShiftForm(),
      code: `SFT-${String(nextNum).padStart(3, '0')}`
    });
    this.showShiftModal.set(true);
  }

  openEditShift(row: ShiftEntryRow) {
    this.editingShiftId.set(row.id);
    const begin = this.from24Hour(row.begin);
    const end = this.from24Hour(row.end);

    // Detect if the saved name matches a known preset, else fall back to "Other".
    const namePreset = this.shiftNameOptions.includes(row.name) ? row.name : 'Other';

    // Detect if the saved begin/end matches a known time preset, else "Custom".
    const matchedPreset = this.shiftTimePresets.find(
      (p) =>
        p.beginHour === begin.hour &&
        p.beginMinute === begin.minute &&
        p.beginPeriod === begin.period &&
        p.endHour === end.hour &&
        p.endMinute === end.minute &&
        p.endPeriod === end.period
    );

    this.shiftForm.set({
      code: row.code,
      namePreset,
      customName: namePreset === 'Other' ? row.name : '',
      shiftType: row.groupId !== null && row.groupId !== undefined ? String(row.groupId) : '',
      timePreset: matchedPreset ? matchedPreset.label : 'Custom',
      beginHour: begin.hour,
      beginMinute: begin.minute,
      beginPeriod: begin.period,
      endHour: end.hour,
      endMinute: end.minute,
      endPeriod: end.period,
      breaks: row.breaks.map((b) => ({ ...b }))
    });
    this.showShiftModal.set(true);
  }

  closeShiftModal() {
    this.showShiftModal.set(false);
  }

  // -- Custom analog clock popover for break begin/end (12-hour, no seconds) --
  activeBreakClock = signal<{ breakId: string; field: 'begin' | 'end' } | null>(null);
  clockStep = signal<'hour' | 'minute'>('hour');
  clockDraftHour = signal(12);
  clockDraftMinute = signal(0);
  clockDraftPeriod = signal<Period>('AM');

  breakTimeLabel(time: string): string {
    return time ? this.formatTime12(time) : 'Select time';
  }

  openBreakClock(b: ShiftBreak, field: 'begin' | 'end', event: Event) {
    event.stopPropagation();
    const time = field === 'begin' ? b.begin : b.end;
    const parsed = this.from24Hour(time);
    this.clockDraftHour.set(parsed.hour);
    this.clockDraftMinute.set(parsed.minute);
    this.clockDraftPeriod.set(parsed.period);
    this.clockStep.set('hour');
    this.activeBreakClock.set({ breakId: b.id, field });
  }

  selectClockHour(h: number) {
    this.clockDraftHour.set(h);
    this.clockStep.set('minute');
  }

  selectClockMinute(m: number) {
    this.clockDraftMinute.set(m);
    this.commitBreakClock();
  }

  setClockPeriod(p: Period) {
    this.clockDraftPeriod.set(p);
  }

  private commitBreakClock() {
    const target = this.activeBreakClock();
    if (!target) return;
    const time = this.to24Hour(this.clockDraftHour(), this.clockDraftMinute(), this.clockDraftPeriod());
    this.updateBreakField(target.breakId, target.field, time);
    this.activeBreakClock.set(null);
  }

  closeBreakClock() {
    this.activeBreakClock.set(null);
  }

  addBreakRow() {
    this.shiftForm.update((f) => ({
      ...f,
      breaks: [...f.breaks, { id: 'b' + Date.now(), begin: '', end: '', type: 'Tea Break' }]
    }));
  }

  removeBreakRow(id: string) {
    this.shiftForm.update((f) => ({ ...f, breaks: f.breaks.filter((b) => b.id !== id) }));
  }

  updateBreakField(id: string, field: 'begin' | 'end' | 'type', value: string) {
    this.shiftForm.update((f) => ({
      ...f,
      breaks: f.breaks.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    }));
  }

  updateFormField(field: 'code' | 'customName', value: string) {
    this.shiftForm.update((f) => ({ ...f, [field]: value }));
  }

  onNamePresetChange(value: string) {
    this.shiftForm.update((f) => ({ ...f, namePreset: value, customName: value === 'Other' ? f.customName : '' }));
  }

  onShiftTypeChange(value: string) {
    this.shiftForm.update((f) => ({ ...f, shiftType: value }));
  }

  isShiftTypeSelected(groupId: number): boolean {
    return this.shiftForm().shiftType === String(groupId);
  }

  onTimePresetChange(value: string) {
    this.shiftForm.update((f) => {
      if (value === 'Custom') return { ...f, timePreset: value };
      const preset = this.shiftTimePresets.find((p) => p.label === value);
      if (!preset) return { ...f, timePreset: value };
      return {
        ...f,
        timePreset: value,
        beginHour: preset.beginHour,
        beginMinute: preset.beginMinute,
        beginPeriod: preset.beginPeriod,
        endHour: preset.endHour,
        endMinute: preset.endMinute,
        endPeriod: preset.endPeriod
      };
    });
  }

  updateBeginPart(part: 'hour' | 'minute' | 'period', value: string) {
    this.shiftForm.update((f) => ({
      ...f,
      timePreset: 'Custom',
      beginHour: part === 'hour' ? Number(value) : f.beginHour,
      beginMinute: part === 'minute' ? Number(value) : f.beginMinute,
      beginPeriod: part === 'period' ? (value as Period) : f.beginPeriod
    }));
  }

  updateEndPart(part: 'hour' | 'minute' | 'period', value: string) {
    this.shiftForm.update((f) => ({
      ...f,
      timePreset: 'Custom',
      endHour: part === 'hour' ? Number(value) : f.endHour,
      endMinute: part === 'minute' ? Number(value) : f.endMinute,
      endPeriod: part === 'period' ? (value as Period) : f.endPeriod
    }));
  }

  /** Gross duration between the form's begin/end selections, ignoring breaks. */
  totalShiftHoursLabel = computed(() => {
    const f = this.shiftForm();
    const beginTime = this.to24Hour(f.beginHour, f.beginMinute, f.beginPeriod);
    const endTime = this.to24Hour(f.endHour, f.endMinute, f.endPeriod);
    return this.formatDuration(this.spanMinutes(beginTime, endTime));
  });

  saveShift() {
    const f = this.shiftForm();
    const resolvedName = f.namePreset === 'Other' ? f.customName.trim() : f.namePreset;

    if (!f.code.trim() || !resolvedName) {
      this.toastService.error('Please fill in shift code and select a shift name.');
      return;
    }

    const begin = this.to24Hour(f.beginHour, f.beginMinute, f.beginPeriod);
    const end = this.to24Hour(f.endHour, f.endMinute, f.endPeriod);
    const groupId = f.shiftType ? Number(f.shiftType) : null;

    const editId = this.editingShiftId();
    if (editId !== null) {
      this.shifts.update((list) =>
        list.map((s) => (s.id === editId ? { ...s, code: f.code, name: resolvedName, begin, end, breaks: f.breaks, groupId } : s))
      );
      this.toastService.success(`Shift ${f.code} updated successfully.`);
    } else {
      const nextId = Math.max(0, ...this.shifts().map((s) => s.id)) + 1;
      this.shifts.update((list) => [
        ...list,
        { id: nextId, code: f.code, name: resolvedName, begin, end, breaks: f.breaks, groupId }
      ]);
      this.toastService.success(`Shift ${f.code} created successfully.`);
    }
    this.showShiftModal.set(false);
  }

  deleteShift(row: ShiftEntryRow) {
    if (!confirm(`Are you sure you want to delete shift ${row.code} - ${row.name}?`)) return;
    this.shifts.update((list) => list.filter((s) => s.id !== row.id));
    this.shiftGroups.update((groups) => groups.map((g) => ({ ...g, shiftIds: g.shiftIds.filter((id) => id !== row.id) })));
    this.toastService.success(`Shift ${row.code} has been deleted.`);
  }

  exportShifts() {
    this.toastService.success('Exporting shift entries as CSV...');
  }

  // ================= SHIFT GROUP =================
  shiftGroups = signal<ShiftGroupRow[]>([
    { id: 1, code: 'SG-ENG', name: 'Engineering Operations', status: 'Active', shiftIds: [1, 2] },
    { id: 2, code: 'SG-OPS', name: 'Logistics & Security Operations', status: 'Active', shiftIds: [1, 3, 4] }
  ]);

  groupSearch = signal('');
  groupPage = signal(1);
  expandedGroupId = signal<number | null>(null);

  filteredGroups = computed(() => {
    const q = this.groupSearch().toLowerCase().trim();
    const list = this.shiftGroups();
    if (!q) return list;
    return list.filter((g) => g.code.toLowerCase().includes(q) || g.name.toLowerCase().includes(q));
  });

  groupTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredGroups().length / PAGE_SIZE)));

  pagedGroups = computed(() => {
    const page = this.groupPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredGroups().slice(start, start + PAGE_SIZE);
  });

  groupStart = computed(() => (this.filteredGroups().length === 0 ? 0 : (this.groupPage() - 1) * PAGE_SIZE + 1));
  groupEnd = computed(() => Math.min(this.groupPage() * PAGE_SIZE, this.filteredGroups().length));

  groupPrevPage() {
    if (this.groupPage() > 1) this.groupPage.update((p) => p - 1);
  }
  groupNextPage() {
    if (this.groupPage() < this.groupTotalPages()) this.groupPage.update((p) => p + 1);
  }

  totalGroupsCount = computed(() => this.shiftGroups().length);
  activeGroupsCount = computed(() => this.shiftGroups().filter((g) => g.status === 'Active').length);

  toggleExpandGroup(id: number) {
    this.expandedGroupId.update((cur) => (cur === id ? null : id));
  }

  shiftsForGroup(group: ShiftGroupRow): ShiftEntryRow[] {
    const all = this.shifts();
    return group.shiftIds.map((id) => all.find((s) => s.id === id)).filter((s): s is ShiftEntryRow => !!s);
  }

  // -- Add / Edit group modal --
  showGroupModal = signal(false);
  editingGroupId = signal<number | null>(null);
  groupForm = signal<{ code: string; name: string; status: 'Active' | 'Inactive'; shiftIds: number[] }>({
    code: '',
    name: '',
    status: 'Active',
    shiftIds: []
  });

  openAddGroup() {
    this.editingGroupId.set(null);
    this.groupForm.set({ code: '', name: '', status: 'Active', shiftIds: [] });
    this.showGroupModal.set(true);
  }

  openEditGroup(row: ShiftGroupRow) {
    this.editingGroupId.set(row.id);
    this.groupForm.set({ code: row.code, name: row.name, status: row.status, shiftIds: [...row.shiftIds] });
    this.showGroupModal.set(true);
  }

  closeGroupModal() {
    this.showGroupModal.set(false);
  }

  updateGroupField(field: 'code' | 'name' | 'status', value: string) {
    this.groupForm.update((f) => ({ ...f, [field]: value }));
  }

  isShiftChecked(id: number): boolean {
    return this.groupForm().shiftIds.includes(id);
  }

  toggleGroupShift(id: number) {
    this.groupForm.update((f) => {
      const has = f.shiftIds.includes(id);
      return { ...f, shiftIds: has ? f.shiftIds.filter((s) => s !== id) : [...f.shiftIds, id] };
    });
  }

  saveGroup() {
    const f = this.groupForm();
    if (!f.code.trim() || !f.name.trim() || f.shiftIds.length === 0) {
      this.toastService.error('Please fill in group code, name and select at least one shift.');
      return;
    }
    const editId = this.editingGroupId();
    if (editId !== null) {
      this.shiftGroups.update((list) =>
        list.map((g) => (g.id === editId ? { ...g, code: f.code, name: f.name, status: f.status, shiftIds: f.shiftIds } : g))
      );
      this.toastService.success(`Group ${f.code} updated successfully.`);
    } else {
      const nextId = Math.max(0, ...this.shiftGroups().map((g) => g.id)) + 1;
      this.shiftGroups.update((list) => [
        ...list,
        { id: nextId, code: f.code, name: f.name, status: f.status, shiftIds: f.shiftIds }
      ]);
      this.toastService.success(`Group ${f.code} created successfully.`);
    }
    this.showGroupModal.set(false);
  }

  deleteGroup(row: ShiftGroupRow) {
    if (!confirm(`Are you sure you want to delete group ${row.code} - ${row.name}?`)) return;
    this.shiftGroups.update((list) => list.filter((g) => g.id !== row.id));
    this.toastService.success(`Group ${row.code} has been deleted.`);
  }

  downloadGroupReport() {
    this.toastService.success('Downloading shift group report...');
  }

  groupNameById(groupId: number | null): string {
    if (groupId === null || groupId === undefined) return '—';
    return this.shiftGroups().find((g) => g.id === groupId)?.name ?? '—';
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() === 'active' ? 'status-active' : 'status-inactive';
  }
}