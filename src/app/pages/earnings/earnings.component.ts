import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { SearchService } from '../../services/search.service';
import { LucideAngularModule } from 'lucide-angular';
import { EMPLOYEE_LIST, LOCATIONS } from '../../data/employee-data';
import { FormsModule } from '@angular/forms';

interface EarningRecord {
  id: number | string;
  empCode: string;
  empName: string;
  mode: 'Earnings' | 'Deduction';
  group: string;
  amount: number;
  location: string;
  month: string;
  remarks?: string;
  hasRecord?: boolean;
}

const PAGE_SIZE = 5;

const GROUPS = {
  Earnings: ['Basic Pay', 'HRA', 'Conveyance', 'Special Allowance', 'Overtime', 'Bonus'],
  Deduction: ['Emergency Fund', 'Professional Tax', 'T.D.S', 'Tamil Nadu Labour Welfare Fund', 'Salary Advance', 'Canteen', 'Insurance', 'Other Deductions'],
};

const ARR_CATEGORIES = ['ARREARS', 'Bonus Adjustment', 'LOP Reversal', 'Omission Recovery'];

const INITIAL_RECORDS: EarningRecord[] = [
  { id: 1,  empCode: 'EMP001', empName: 'John David',    mode: 'Earnings',  group: 'Basic Pay',         amount: 28000, location: 'Domestic',    month: 'Jun-2026' },
  { id: 2,  empCode: 'EMP002', empName: 'Priya Sharma',  mode: 'Earnings',  group: 'Basic Pay',         amount: 26000, location: 'Domestic',    month: 'Jun-2026' },
  { id: 3,  empCode: 'EMP001', empName: 'John David',    mode: 'Earnings',  group: 'HRA',                amount: 8000,  location: 'Domestic',    month: 'Jun-2026' },
  { id: 4,  empCode: 'EMP003', empName: 'Ravi Kumar',    mode: 'Earnings',  group: 'HRA',                amount: 7000,  location: 'Acer Project',  month: 'Jun-2026' },
  { id: 5,  empCode: 'EMP004', empName: 'Karthik R',     mode: 'Earnings',  group: 'HRA',                amount: 7500,  location: 'Acer Project',  month: 'Jun-2026' },
  { id: 6,  empCode: 'EMP002', empName: 'Priya Sharma',  mode: 'Earnings',  group: 'Conveyance',         amount: 1600,  location: 'Domestic',    month: 'Jun-2026' },
  { id: 7,  empCode: 'EMP005', empName: 'Anjali Menon',  mode: 'Earnings',  group: 'Conveyance',         amount: 1600,  location: 'Domestic', month: 'Jun-2026' },
  { id: 8,  empCode: 'EMP006', empName: 'Anitha S',      mode: 'Earnings',  group: 'Special Allowance',  amount: 3200,  location: 'Domestic',    month: 'Jun-2026' },
  { id: 9,  empCode: 'EMP007', empName: 'Mohammed Ali',  mode: 'Earnings',  group: 'Special Allowance',  amount: 3000,  location: 'Acer Project',  month: 'Jun-2026' },
  { id: 10, empCode: 'EMP008', empName: 'Divya Prakash', mode: 'Earnings',  group: 'Overtime',           amount: 1200,  location: 'Acer Project',  month: 'Jun-2026' },
  { id: 11, empCode: 'EMP009', empName: 'Suresh Babu',   mode: 'Earnings',  group: 'Bonus',               amount: 5000,  location: 'Domestic', month: 'Jun-2026' },
  { id: 12, empCode: 'EMP010', empName: 'Meena Iyer',    mode: 'Earnings',  group: 'Bonus',               amount: 4500,  location: 'Domestic',    month: 'Jun-2026' },
];

const ARR_INITIAL_RECORDS: EarningRecord[] = [
  { id: 1,  mode: 'Earnings',  group: 'ARREARS',          empCode: 'EMP001', empName: 'John David',   amount: 5000,  location: 'Domestic',   month: 'Jun-2026', remarks: 'Increment arrears for Apr-May salary.' },
  { id: 2,  mode: 'Earnings',  group: 'ARREARS',          empCode: 'EMP003', empName: 'Ravi Kumar',   amount: 3200,  location: 'Acer Project', month: 'Jun-2026', remarks: 'Pay revision arrears for May.' },
  { id: 3,  mode: 'Earnings',  group: 'Bonus Adjustment', empCode: 'EMP002', empName: 'Priya Sharma', amount: 8000,  location: 'Domestic',   month: 'Jun-2026', remarks: 'Performance bonus top-up.' },
  { id: 4,  mode: 'Earnings',  group: 'Bonus Adjustment', empCode: 'EMP004', empName: 'Karthik R', amount: 4500,  location: 'Acer Project', month: 'May-2026', remarks: 'Festival bonus correction.' },
  { id: 5,  mode: 'Earnings',  group: 'LOP Reversal',     empCode: 'EMP001', empName: 'John David',   amount: 1800,  location: 'Domestic',   month: 'Jun-2026', remarks: 'LOP reversed after approved leave regularization.' },
  { id: 6,  mode: 'Earnings',  group: 'LOP Reversal',     empCode: 'EMP003', empName: 'Ravi Kumar',   amount: 950,   location: 'Acer Project', month: 'May-2026', remarks: 'Half-day LOP reversed on manager approval.' },
  { id: 7,  mode: 'Earnings',  group: 'Omission Recovery',empCode: 'EMP002', empName: 'Priya Sharma', amount: 1200,  location: 'Domestic',   month: 'Jun-2026', remarks: 'Missed allowance from previous cycle.' },
  { id: 8,  mode: 'Earnings',  group: 'Omission Recovery',empCode: 'EMP004', empName: 'Karthik R', amount: 2100,  location: 'Acer Project', month: 'Apr-2026', remarks: 'Shift allowance omitted in March payroll.' },
];

function formatMonth(val: string): string {
  if (!val) return '';
  return new Date(val + '-01').toLocaleString('en-GB', { month: 'short', year: 'numeric' }).replace(' ', '-');
}

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './earnings.component.html',
  styleUrls: ['./earnings.component.scss']
})
export class EarningsComponent implements OnInit {
  activeTab = 'Earning Group';
  mode: 'Earnings' = 'Earnings';
  PAGE_SIZE = PAGE_SIZE;

  // TAB 1 state
  group = '';
  month = '2026-06';
  empCode = '';
  empName = '';
  location = '';
  amount = '';
  records = [...INITIAL_RECORDS];
  editId: number | string | null = null;
  errors: Record<string, string | boolean> = {};
  showAllEmployees = false;
  page = 1;

  // TAB 2 state
  arrCategory = 'ARREARS';
  arrMonth = '2026-06';
  arrEmpCode = '';
  arrEmpName = '';
  arrLocation = '';
  arrAmount = '';
  arrRemarks = '';
  arrRecords = [...ARR_INITIAL_RECORDS];
  arrEditId: number | string | null = null;
  arrErrors: Record<string, string | boolean> = {};
  arrShowAllEmployees = false;
  arrPage = 1;

  GROUPS = GROUPS;
  ARR_CATEGORIES = ARR_CATEGORIES;
  LOCATIONS = LOCATIONS;

  constructor(private toastService: ToastService, public searchService: SearchService) {}

  ngOnInit() {}

  lookupEmployee(code: string, type: 'group' | 'arrears') {
    const upper = code.toUpperCase();
    const emp = EMPLOYEE_LIST.find(e => e.code === upper);
    if (type === 'group') {
      this.empCode = upper;
      this.empName = emp ? emp.name : '';
      this.location = emp ? emp.location : '';
    } else {
      this.arrEmpCode = upper;
      this.arrEmpName = emp ? emp.name : '';
      this.arrLocation = emp ? emp.location : '';
    }
  }

  // TAB 1 Actions & Getters
  get groupRecords(): EarningRecord[] {
    return this.records.filter(r => r.mode === this.mode && (!this.group ? false : r.group === this.group));
  }

  get displayRows(): EarningRecord[] {
    if (!this.group) return [];
    if (!this.showAllEmployees) {
      return this.groupRecords
        .filter(r => !this.empCode || r.empCode === this.empCode)
        .filter(r => !this.location || r.location === this.location)
        .map(r => ({ ...r, hasRecord: true }))
        .filter(r => this.searchService.matches(r));
    }

    return EMPLOYEE_LIST
      .filter(e => !this.empCode || e.code === this.empCode)
      .filter(e => !this.location || e.location === this.location)
      .map(e => {
        const rec = this.groupRecords.find(r => r.empCode === e.code);
        return rec
          ? { ...rec, hasRecord: true }
          : {
              id: `empty-${e.code}`,
              empCode: e.code,
              empName: e.name,
              mode: this.mode,
              group: this.group,
              amount: 0,
              location: e.location,
              month: formatMonth(this.month),
              hasRecord: false
            };
      })
      .filter(r => this.searchService.matches(r));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayRows.length / PAGE_SIZE));
  }

  get currentPage(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pageRows(): EarningRecord[] {
    const start = (this.currentPage - 1) * PAGE_SIZE;
    return this.displayRows.slice(start, start + PAGE_SIZE);
  }

  get startEntry(): number {
    return this.displayRows.length === 0 ? 0 : (this.currentPage - 1) * PAGE_SIZE + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * PAGE_SIZE, this.displayRows.length);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur, '…', total];
  }

  validateGroup(): boolean {
    const e: Record<string, string | boolean> = {};
    if (!this.group) e['group'] = 'Please select a Group.';
    if (!this.empCode || !EMPLOYEE_LIST.some(emp => emp.code === this.empCode)) e['empCode'] = 'Employee not found.';
    if (!this.amount || parseFloat(this.amount) < 0) e['amount'] = 'Amount must be zero or greater.';
    this.errors = e;
    if (Object.keys(e).length) {
      this.toastService.addToast(Object.values(e)[0] as string, 'error');
      return false;
    }
    return true;
  }

  handleGroupFind() {
    if (!this.group) {
      this.toastService.addToast('Please select a Group.', 'error');
      this.errors = { group: true };
      return;
    }
    const found = this.records.filter(r => r.mode === this.mode && r.group === this.group && (!this.empCode || r.empCode === this.empCode));
    this.toastService.addToast(found.length ? `${found.length} record(s) loaded.` : 'No records found for given criteria.', found.length ? 'success' : 'warning');
  }

  handleGroupSave() {
    if (!this.validateGroup()) return;
    const rec: EarningRecord = {
      id: this.editId ?? Date.now(),
      empCode: this.empCode,
      empName: this.empName,
      mode: this.mode,
      group: this.group,
      amount: parseFloat(this.amount),
      location: this.location,
      month: formatMonth(this.month)
    };
    if (this.editId) {
      this.records = this.records.map(r => r.id === this.editId ? rec : r);
      this.toastService.addToast('Record updated successfully.', 'success');
      this.editId = null;
    } else {
      this.records = [...this.records, rec];
      this.toastService.addToast('Record saved successfully.', 'success');
    }
    this.handleGroupCancel();
  }

  handleGroupEdit(rec: EarningRecord) {
    this.group = rec.group;
    this.empCode = rec.empCode;
    this.empName = rec.empName;
    this.location = rec.location;
    this.amount = String(rec.amount ?? '');
    this.editId = rec.id;
    this.errors = {};
  }

  handleGroupDelete(id: number | string) {
    this.records = this.records.filter(r => r.id !== id);
    this.toastService.addToast('Record deleted.', 'error');
  }

  handleGroupCancel() {
    this.group = ''; this.empCode = ''; this.empName = ''; this.location = '';
    this.amount = ''; this.errors = {}; this.editId = null;
  }

  // TAB 2 Actions & Getters
  get categoryRecords(): EarningRecord[] {
    return this.arrRecords.filter(r => r.mode === this.mode && r.group === this.arrCategory);
  }

  get arrDisplayRows(): EarningRecord[] {
    if (!this.arrShowAllEmployees) {
      return this.categoryRecords
        .filter(r => !this.arrEmpCode || r.empCode === this.arrEmpCode)
        .filter(r => !this.arrLocation || r.location === this.arrLocation)
        .map(r => ({ ...r, hasRecord: true }))
        .filter(r => this.searchService.matches(r));
    }

    return EMPLOYEE_LIST
      .filter(e => !this.arrEmpCode || e.code === this.arrEmpCode)
      .filter(e => !this.arrLocation || e.location === this.arrLocation)
      .map(e => {
        const rec = this.categoryRecords.find(r => r.empCode === e.code);
        return rec
          ? { ...rec, hasRecord: true }
          : {
              id: `empty-${e.code}`,
              empCode: e.code,
              empName: e.name,
              mode: this.mode,
              group: this.arrCategory,
              amount: 0,
              location: e.location,
              month: formatMonth(this.arrMonth),
              remarks: 'No record',
              hasRecord: false
            };
      })
      .filter(r => this.searchService.matches(r));
  }

  get arrTotalPages(): number {
    return Math.max(1, Math.ceil(this.arrDisplayRows.length / PAGE_SIZE));
  }

  get arrCurrentPage(): number {
    return Math.min(this.arrPage, this.arrTotalPages);
  }

  get arrPageRows(): EarningRecord[] {
    const start = (this.arrCurrentPage - 1) * PAGE_SIZE;
    return this.arrDisplayRows.slice(start, start + PAGE_SIZE);
  }

  get arrStartEntry(): number {
    return this.arrDisplayRows.length === 0 ? 0 : (this.arrCurrentPage - 1) * PAGE_SIZE + 1;
  }

  get arrEndEntry(): number {
    return Math.min(this.arrCurrentPage * PAGE_SIZE, this.arrDisplayRows.length);
  }

  get arrPageNumbers(): (number | string)[] {
    const total = this.arrTotalPages;
    const cur = this.arrCurrentPage;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur, '…', total];
  }

  validateArr(): boolean {
    const e: Record<string, string | boolean> = {};
    if (!this.arrEmpCode || !EMPLOYEE_LIST.some(emp => emp.code === this.arrEmpCode)) e['empCode'] = 'Please select an employee.';
    if (!this.arrAmount || parseFloat(this.arrAmount) === 0) e['amount'] = 'Amount is mandatory.';
    if (!this.arrRemarks.trim()) e['remarks'] = 'Remarks are required.';
    this.arrErrors = e;
    if (Object.keys(e).length) {
      this.toastService.addToast(Object.values(e)[0] as string, 'error');
      return false;
    }
    return true;
  }

  handleArrFind() {
    if (!this.arrEmpCode) {
      this.toastService.addToast('Please select an employee.', 'error');
      this.arrErrors = { empCode: true };
      return;
    }
    const found = this.arrRecords.filter(r => r.mode === this.mode && r.group === this.arrCategory && r.empCode === this.arrEmpCode);
    this.toastService.addToast(found.length ? `${found.length} record(s) loaded.` : 'No records found for given criteria.', found.length ? 'success' : 'warning');
  }

  handleArrSave() {
    if (!this.validateArr()) return;
    const rec: EarningRecord = {
      id: this.arrEditId ?? Date.now(),
      mode: this.mode,
      group: this.arrCategory,
      empCode: this.arrEmpCode,
      empName: this.arrEmpName,
      amount: Math.abs(parseFloat(this.arrAmount)),
      location: this.arrLocation,
      month: formatMonth(this.arrMonth),
      remarks: this.arrRemarks.trim()
    };
    if (this.arrEditId) {
      this.arrRecords = this.arrRecords.map(r => r.id === this.arrEditId ? rec : r);
      this.toastService.addToast('Record updated successfully.', 'success');
      this.arrEditId = null;
    } else {
      this.arrRecords = [...this.arrRecords, rec];
      this.toastService.addToast('Arrear entry saved successfully.', 'success');
    }
    this.handleArrCancel();
  }

  handleArrEdit(rec: EarningRecord) {
    this.arrCategory = rec.group;
    this.arrEmpCode = rec.empCode;
    this.arrEmpName = rec.empName;
    this.arrLocation = rec.location;
    this.arrAmount = String(Math.abs(rec.amount));
    this.arrRemarks = rec.remarks || '';
    this.arrEditId = rec.id;
    this.arrErrors = {};
  }

  handleArrDelete(id: number | string) {
    this.arrRecords = this.arrRecords.filter(r => r.id !== id);
    this.toastService.addToast('Record deleted.', 'error');
  }

  handleArrCancel() {
    this.arrEmpCode = ''; this.arrEmpName = ''; this.arrLocation = '';
    this.arrAmount = ''; this.arrRemarks = ''; this.arrErrors = {}; this.arrEditId = null;
  }

  // Helper page methods
  setPage(p: number | string) {
    if (typeof p === 'number') this.page = p;
  }
  prevPage() {
    this.page = Math.max(1, this.page - 1);
  }
  nextPage() {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  goBack() {
    window.history.back();
  }
}
