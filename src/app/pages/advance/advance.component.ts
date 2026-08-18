import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { SearchService } from '../../services/search.service';
import { LucideAngularModule } from 'lucide-angular';
import { EMPLOYEES_MAP } from '../../data/employee-data';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

interface AdvanceRecord {
  id: number;
  empCode: string;
  empName: string;
  date: string;
  purpose: string;
  amount: number;
  monthlyDue: number;
  startMonth: string;
  installments: number;
  status: 'Pending' | 'Approved' | 'Closed' | 'Rejected';
}

interface SCRecord {
  id: number;
  type: string;
  empCode: string;
  empName: string;
  date: string;
  location: string;
  balance: number;
  isClosed: boolean;
  remarks: string;
}

const PURPOSE_CODES = [
  { code: 'MED', label: 'MED - Medical Emergency' },
  { code: 'MAR', label: 'MAR - Marriage Expenses' },
  { code: 'EDU', label: 'EDU - Education' },
  { code: 'HOU', label: 'HOU - House Repair' },
  { code: 'PER', label: 'PER - Personal' },
];

const PURPOSE_LABELS = Object.fromEntries(PURPOSE_CODES.map(p => [p.code, p.label]));

const ADVANCE_TYPES = [
  { code: 'ADVANCE', label: 'ADVANCE' },
  { code: 'MED', label: 'MED (Medical Emergency)' },
  { code: 'MAR', label: 'MAR (Marriage Expenses)' },
  { code: 'EDU', label: 'EDU (Education Loan)' },
  { code: 'PER', label: 'PER (Personal Advance)' },
];

const STATUS_OPTIONS = ['Pending', 'Approved', 'Closed', 'Rejected'];

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PAGE_SIZE = 5;
const MAX_ADVANCE = 500000;
const MIN_ADVANCE = 1000;

const INITIAL_HISTORY: AdvanceRecord[] = [
  { id: 123, empCode: 'EMP001', empName: 'Pramod Kumar O',      date: '2026-06-22', purpose: 'MED', amount: 50000,  monthlyDue: 16666.67, startMonth: '2026-07', installments: 3,  status: 'Approved' },
  { id: 122, empCode: 'EMP004', empName: 'Karthik R',           date: '2026-06-18', purpose: 'HOU', amount: 6500,   monthlyDue: 2166.67,  startMonth: '2026-07', installments: 3,  status: 'Pending'  },
  { id: 121, empCode: 'EMP006', empName: 'Lakshmi Narayan S P', date: '2026-06-15', purpose: 'EDU', amount: 310000, monthlyDue: 20000,    startMonth: '2026-06', installments: 16, status: 'Approved' },
  { id: 120, empCode: 'EMP007', empName: 'Pravin M',            date: '2026-06-12', purpose: 'PER', amount: 60000,  monthlyDue: 10000,    startMonth: '2026-06', installments: 6,  status: 'Approved' },
  { id: 119, empCode: 'EMP008', empName: 'Ponnaj K',            date: '2026-06-10', purpose: 'MED', amount: 1000,   monthlyDue: 100,      startMonth: '2026-06', installments: 10, status: 'Closed'   },
];

const INITIAL_SC_RECORDS: SCRecord[] = [
  { id: 1,  type: 'ADVANCE', empCode: 'EMP001', empName: 'John David',          date: '2026-04-01', location: 'Domestic',     balance: 15000,  isClosed: false, remarks: '' },
  { id: 2,  type: 'ADVANCE', empCode: 'EMP002', empName: 'Priya Sharma',        date: '2026-05-05', location: 'Domestic',     balance: 10000,  isClosed: false, remarks: '' },
  { id: 6,  type: 'MED',     empCode: 'EMP008', empName: 'Ponnaj K',            date: '2026-06-10', location: 'Domestic',     balance: 9000,   isClosed: false, remarks: '' },
  { id: 10, type: 'EDU',     empCode: 'EMP006', empName: 'Lakshmi Narayan S P', date: '2026-06-15', location: 'Acer Project', balance: 290000, isClosed: false, remarks: '' },
];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function nextMonthValue() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

function formatMonth(v: string): string {
  if (!v) return '';
  const [y, m] = v.split('-');
  const n = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${n[parseInt(m, 10) - 1]}, ${y}`;
}

@Component({
  selector: 'app-advance',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './advance.component.html',
  styleUrls: ['./advance.component.scss']
})
export class AdvanceComponent implements OnInit {
  activeTab = 0;
  TABS = ['Advance Entry', 'Short Close'];
  PURPOSE_CODES = PURPOSE_CODES;
  PURPOSE_LABELS = PURPOSE_LABELS;
  ADVANCE_TYPES = ADVANCE_TYPES;
  STATUS_OPTIONS = STATUS_OPTIONS;
  MIN_ADVANCE = MIN_ADVANCE;
  MAX_ADVANCE = MAX_ADVANCE;
  PAGE_SIZE = PAGE_SIZE;
  String = String; // Make String accessible in template

  // TAB 1 Entry State
  @ViewChild('fileInput') fileInputRef!: ElementRef;
  empCode = '';
  empName = '';
  advanceDate = todayISO();
  purpose = 'MED';
  advanceAmount = '';
  monthlyDue = '';
  startMonth = nextMonthValue();
  approved = false;
  approvalDate = '';
  remarks = '';
  file: File | null = null;
  errors: Record<string, string> = {};
  history = [...INITIAL_HISTORY];
  searchTerm = '';
  page = 1;
  showForm = false;
  editingId: number | null = null;

  // Filter panel state
  showFilterPanel = false;
  filterStatus = '';
  filterPurpose = '';
  filterDateFrom = '';
  filterDateTo = '';

  // TAB 2 Short Close State
  advanceType = 'ADVANCE';
  scRows = [...INITIAL_SC_RECORDS];
  rowErrors: Record<number, boolean> = {};
  scPage = 1;
  committedClosed = new Set<number>(INITIAL_SC_RECORDS.filter(r => r.isClosed).map(r => r.id));

  constructor(private toastService: ToastService, public searchService: SearchService) {}

  ngOnInit() {}

  handleEmpCodeChange(val: string) {
    const u = val.toUpperCase();
    this.empCode = u;
    this.empName = EMPLOYEES_MAP[u] ?? '';
  }

  handleLookup() {
    if (!this.empCode) {
      this.toastService.addToast('Enter an Employee Code.', 'error');
      return;
    }
    if (!EMPLOYEES_MAP[this.empCode]) {
      this.toastService.addToast('No employee found.', 'error');
      this.empName = '';
      return;
    }
    this.empName = EMPLOYEES_MAP[this.empCode];
  }

  get installments(): number | string {
    const a = parseFloat(this.advanceAmount);
    const d = parseFloat(this.monthlyDue);
    if (!a || !d || d <= 0) return '';
    return Math.ceil(a / d);
  }

  toggleApproved(checked: boolean) {
    this.approved = checked;
    this.approvalDate = checked ? todayISO() : '';
  }

  handleFileSelect(event: any) {
    const f = event.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      this.toastService.addToast('Unsupported file format.', 'error');
      event.target.value = '';
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      this.toastService.addToast('File exceeds 5MB limit.', 'error');
      event.target.value = '';
      return;
    }
    this.file = f;
  }

  removeFile() {
    this.file = null;
    if (this.fileInputRef && this.fileInputRef.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  validate(): boolean {
    const e: Record<string, string> = {};
    if (!this.empCode || !EMPLOYEES_MAP[this.empCode]) e['empCode'] = 'Please select an employee.';
    const adv = parseFloat(this.advanceAmount);
    if (!this.advanceAmount || adv <= 0) {
      e['advanceAmount'] = 'Advance Amount must be greater than zero.';
    } else if (adv < MIN_ADVANCE) {
      e['advanceAmount'] = `Min ₹${MIN_ADVANCE.toLocaleString('en-IN')}.`;
    } else if (adv > MAX_ADVANCE) {
      e['advanceAmount'] = `Max ₹${MAX_ADVANCE.toLocaleString('en-IN')}.`;
    }
    if (!this.monthlyDue || parseFloat(this.monthlyDue) <= 0) {
      e['monthlyDue'] = 'Monthly Due must be greater than zero.';
    }
    if (this.monthlyDue && this.advanceAmount && parseFloat(this.monthlyDue) > parseFloat(this.advanceAmount)) {
      e['monthlyDue'] = 'Monthly Due cannot exceed Advance Amount.';
    }
    this.errors = e;
    if (Object.keys(e).length) {
      this.toastService.addToast(Object.values(e)[0], 'error');
      return false;
    }
    return true;
  }

  handleSave() {
    if (!this.validate()) return;
    const installmentsNum = typeof this.installments === 'number' ? this.installments : 1;
    if (this.editingId) {
      this.history = this.history.map(r => r.id === this.editingId
        ? {
            ...r,
            empCode: this.empCode,
            empName: this.empName,
            date: this.advanceDate,
            purpose: this.purpose,
            amount: parseFloat(this.advanceAmount),
            monthlyDue: parseFloat(this.monthlyDue),
            startMonth: this.startMonth,
            installments: installmentsNum,
            status: this.approved ? 'Approved' : 'Pending'
          }
        : r
      );
      this.toastService.addToast('Advance record updated.', 'success');
    } else {
      const rec: AdvanceRecord = {
        id: (this.history[0]?.id ?? 100) + 1,
        empCode: this.empCode,
        empName: this.empName,
        date: this.advanceDate,
        purpose: this.purpose,
        amount: parseFloat(this.advanceAmount),
        monthlyDue: parseFloat(this.monthlyDue),
        startMonth: this.startMonth,
        installments: installmentsNum,
        status: this.approved ? 'Approved' : 'Pending'
      };
      this.history = [rec, ...this.history];
      this.page = 1;
      this.toastService.addToast(this.approved ? 'Advance saved and recovery schedule generated.' : 'Advance saved. Awaiting approval.', 'success');
    }
    this.handleCancel();
  }

  handleCancel() {
    this.empCode = '';
    this.empName = '';
    this.advanceDate = todayISO();
    this.purpose = 'MED';
    this.advanceAmount = '';
    this.monthlyDue = '';
    this.startMonth = nextMonthValue();
    this.approved = false;
    this.approvalDate = '';
    this.remarks = '';
    this.removeFile();
    this.errors = {};
    this.editingId = null;
    this.showForm = false;
  }

  handleAddNew() {
    this.handleCancel();
    this.showForm = true;
  }

  get filteredHistory(): AdvanceRecord[] {
    const t = this.searchTerm.trim().toLowerCase();
    let rows = !t ? this.history : this.history.filter(r =>
      r.empCode.toLowerCase().includes(t) ||
      r.empName.toLowerCase().includes(t) ||
      PURPOSE_LABELS[r.purpose].toLowerCase().includes(t) ||
      r.status.toLowerCase().includes(t)
    );
    if (this.filterStatus) {
      rows = rows.filter(r => r.status === this.filterStatus);
    }
    if (this.filterPurpose) {
      rows = rows.filter(r => r.purpose === this.filterPurpose);
    }
    if (this.filterDateFrom) {
      rows = rows.filter(r => r.date >= this.filterDateFrom);
    }
    if (this.filterDateTo) {
      rows = rows.filter(r => r.date <= this.filterDateTo);
    }
    return rows.filter(r => this.searchService.matches(r));
  }

  get activeFilterCount(): number {
    return [this.filterStatus, this.filterPurpose, this.filterDateFrom, this.filterDateTo]
      .filter(v => !!v).length;
  }

  toggleFilterPanel() {
    this.showFilterPanel = !this.showFilterPanel;
  }

  applyFilters() {
    this.page = 1;
    this.showFilterPanel = false;
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterPurpose = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.page = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredHistory.length / PAGE_SIZE));
  }

  get currentPage(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pageRows(): AdvanceRecord[] {
    const start = (this.currentPage - 1) * PAGE_SIZE;
    return this.filteredHistory.slice(start, start + PAGE_SIZE);
  }

  get startEntry(): number {
    return this.filteredHistory.length === 0 ? 0 : (this.currentPage - 1) * PAGE_SIZE + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * PAGE_SIZE, this.filteredHistory.length);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur, '…', total];
  }

  handleEdit(r: AdvanceRecord) {
    this.empCode = r.empCode;
    this.empName = r.empName;
    this.advanceDate = r.date;
    this.purpose = r.purpose;
    this.advanceAmount = String(r.amount);
    this.monthlyDue = String(r.monthlyDue);
    this.startMonth = r.startMonth;
    this.approved = r.status === 'Approved';
    this.editingId = r.id;
    this.showForm = true;
    this.toastService.addToast(`Loaded ADV${String(r.id).padStart(6, '0')} for editing.`, 'success');
  }

  handleDelete(id: number) {
    this.history = this.history.filter(x => x.id !== id);
    this.toastService.addToast('Deleted.', 'success');
  }

  // --- TAB 2 Getters & Actions ---
  get visibleSCRows(): SCRecord[] {
    return this.scRows
      .filter(r => r.type === this.advanceType)
      .filter(r => this.searchService.matches(r));
  }

  get scTotalPages(): number {
    return Math.max(1, Math.ceil(this.visibleSCRows.length / PAGE_SIZE));
  }

  get scCurrentPage(): number {
    return Math.min(this.scPage, this.scTotalPages);
  }

  get scPageRows(): SCRecord[] {
    const start = (this.scCurrentPage - 1) * PAGE_SIZE;
    return this.visibleSCRows.slice(start, start + PAGE_SIZE);
  }

  get scStartEntry(): number {
    return this.visibleSCRows.length === 0 ? 0 : (this.scCurrentPage - 1) * PAGE_SIZE + 1;
  }

  get scEndEntry(): number {
    return Math.min(this.scCurrentPage * PAGE_SIZE, this.visibleSCRows.length);
  }

  get scPageNumbers(): (number | string)[] {
    const total = this.scTotalPages;
    const cur = this.scCurrentPage;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur, '…', total];
  }

  trackBySCRowId(index: number, row: SCRecord): number {
    return row.id;
  }

  updateSCRow(id: number, patch: Partial<SCRecord>) {
    this.scRows = this.scRows.map(r => r.id === id ? { ...r, ...patch } : r);
  }

  handleToggleClose(id: number, checked: boolean) {
    if (this.committedClosed.has(id) && !checked) {
      this.toastService.addToast('Advance is already closed.', 'error');
      return;
    }
    this.updateSCRow(id, { isClosed: checked });
    if (!checked) {
      this.rowErrors[id] = false;
    }
  }

  handleSCSave() {
    const toClose = this.visibleSCRows.filter(r => r.isClosed && !this.committedClosed.has(r.id));
    if (!toClose.length) {
      this.toastService.addToast('Please select an advance record.', 'error');
      return;
    }
    const missing = toClose.filter(r => !r.remarks.trim());
    if (missing.length) {
      this.rowErrors = Object.fromEntries(missing.map(r => [r.id, true]));
      this.toastService.addToast('Remarks are mandatory.', 'error');
      return;
    }
    this.committedClosed = new Set([...Array.from(this.committedClosed), ...toClose.map(r => r.id)]);
    this.toastService.addToast(`${toClose.length} advance(s) closed. Future deductions stopped.`, 'success');
    this.rowErrors = {};
  }

  handleSCCancel() {
    this.scRows = [...INITIAL_SC_RECORDS];
    this.rowErrors = {};
  }

  // Formatting helpers
  fmtCur(n: number): string {
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDateStr(iso: string) {
    return formatDate(iso);
  }

  formatMonthStr(v: string) {
    return formatMonth(v);
  }

  statusCls(s: string): string {
    return ({ Approved: 'approved', Pending: 'pending', Rejected: 'rejected', Closed: 'closed' })[s] || 'pending';
  }

  triggerExport() {
    if (!this.filteredHistory.length) {
      this.toastService.addToast('No records to export.', 'error');
      return;
    }
    const sheetData = this.filteredHistory.map(r => ({
      'Adv No.': 'ADV' + String(r.id).padStart(6, '0'),
      'Employee Code': r.empCode,
      'Employee Name': r.empName,
      'Advance Date': this.formatDateStr(r.date),
      'Purpose': PURPOSE_LABELS[r.purpose],
      'Advance Amount (₹)': r.amount,
      'Monthly Due (₹)': r.monthlyDue,
      'Start Month': this.formatMonthStr(r.startMonth),
      'Installments': r.installments,
      'Status': r.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Advance History');
    XLSX.writeFile(workbook, 'Advance_History.xlsx');
    this.toastService.addToast('Advance history exported.', 'success');
  }

  goBack() {
    window.history.back();
  }
}