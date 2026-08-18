import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { SearchService } from '../../services/search.service';
import { LucideAngularModule } from 'lucide-angular';
import { EMPLOYEE_LIST, LOCATIONS } from '../../data/employee-data';
import { FormsModule } from '@angular/forms';

interface DeductionRecord {
  id: number | string;
  empCode: string;
  empName: string;
  group: string;
  amount: number;
  location: string;
  month: string;
  remarks?: string;
  hasRecord?: boolean;
}

const PAGE_SIZE = 5;

const DEDUCTION_GROUPS = [
  'Emergency Fund', 'Professional Tax', 'T.D.S',
  'Tamil Nadu Labour Welfare Fund', 'Salary Advance',
  'Canteen', 'Insurance', 'Other Deductions',
];

const ARREAR_CATEGORIES = ['ARREARS', 'Bonus Adjustment', 'LOP Reversal', 'Omission Recovery'];

const INITIAL_GROUP_RECORDS: DeductionRecord[] = [
  { id: 1,  empCode: 'EMP001', empName: 'John David',    group: 'Professional Tax',    amount: 200,  location: 'Domestic',    month: 'Jun-2026' },
  { id: 2,  empCode: 'EMP002', empName: 'Priya Sharma',  group: 'Professional Tax',    amount: 200,  location: 'Domestic',    month: 'Jun-2026' },
  { id: 3,  empCode: 'EMP003', empName: 'Ravi Kumar',    group: 'T.D.S',               amount: 1500, location: 'Acer Project',  month: 'Jun-2026' },
  { id: 4,  empCode: 'EMP004', empName: 'Karthik R',    group: 'Insurance',           amount: 2500, location: 'Acer Project',  month: 'Jun-2026' },
  { id: 5,  empCode: 'EMP005', empName: 'Anjali Menon',  group: 'Insurance',           amount: 1500, location: 'Domestic', month: 'Jun-2026' },
  { id: 6,  empCode: 'EMP006', empName: 'Anitha S',      group: 'Salary Advance',      amount: 3000, location: 'Domestic',    month: 'Jun-2026' },
  { id: 7,  empCode: 'EMP007', empName: 'Mohammed Ali',  group: 'Canteen',             amount: 450,  location: 'Acer Project',  month: 'Jun-2026' },
  { id: 8,  empCode: 'EMP008', empName: 'Divya Prakash', group: 'Emergency Fund',      amount: 100,  location: 'Acer Project',  month: 'Jun-2026' },
  { id: 9,  empCode: 'EMP009', empName: 'Saravanan T',   group: 'Tamil Nadu Labour Welfare Fund', amount: 20,  location: 'Domestic',     month: 'Jun-2026' },
  { id: 10, empCode: 'EMP010', empName: 'Divya R',       group: 'Tamil Nadu Labour Welfare Fund', amount: 20,  location: 'Domestic',     month: 'Jun-2026' },
  { id: 11, empCode: 'EMP013', empName: 'Sneha Reddy',   group: 'Other Deductions',    amount: 350, location: 'Acer Project',  month: 'Jun-2026' },
];

const INITIAL_ARREAR_RECORDS: DeductionRecord[] = [
  { id: 1,  group: 'ARREARS',           empCode: 'EMP003', empName: 'Ravi Kumar',   amount: -1500, location: 'Acer Project', month: 'Jun-2026', remarks: 'Excess pay recovery arrears.' },
  { id: 2,  group: 'ARREARS',           empCode: 'EMP001', empName: 'John David',   amount: -750,  location: 'Domestic',   month: 'May-2026', remarks: 'Tax slab adjustment arrears.' },
  { id: 3,  group: 'Bonus Adjustment',  empCode: 'EMP002', empName: 'Priya Sharma', amount: -2000, location: 'Domestic',   month: 'Jun-2026', remarks: 'Bonus over-payment recovery.' },
  { id: 4,  group: 'LOP Reversal',      empCode: 'EMP011', empName: 'Suresh Babu',  amount: -900,  location: 'Domestic',   month: 'Jun-2026', remarks: 'LOP days reversed after approval.' },
  { id: 5,  group: 'Omission Recovery', empCode: 'EMP012', empName: 'Vignesh Kumar',amount: -600,  location: 'Domestic',   month: 'Jun-2026', remarks: 'Missed deduction recovered this cycle.' },
];

function formatMonth(val: string): string {
  if (!val) return '';
  return new Date(val + '-01').toLocaleString('en-GB', { month: 'short', year: 'numeric' }).replace(' ', '-');
}

@Component({
  selector: 'app-deduction',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './deduction.component.html',
  styleUrls: ['./deduction.component.scss']
})
export class DeductionComponent implements OnInit {
  activeTab = 'Deduction Group';
  PAGE_SIZE = PAGE_SIZE;

  // TAB 1 state
  group = '';
  month = '2026-06';
  empCode = '';
  empName = '';
  location = '';
  amount = '';
  records = [...INITIAL_GROUP_RECORDS];
  editId: number | string | null = null;
  errors: Record<string, string | boolean> = {};
  showAll = false;
  page = 1;
  filterEmpCode = '';

  // TAB 2 state
  arrCategory = 'ARREARS';
  arrMonth = '2026-06';
  arrEmpCode = '';
  arrEmpName = '';
  arrLocation = '';
  arrAmount = '';
  arrRemarks = '';
  arrRecords = [...INITIAL_ARREAR_RECORDS];
  arrEditId: number | string | null = null;
  arrErrors: Record<string, string | boolean> = {};
  arrShowAll = false;
  arrPage = 1;
  arrFilterEmpCode = '';

  DEDUCTION_GROUPS = DEDUCTION_GROUPS;
  ARREAR_CATEGORIES = ARREAR_CATEGORIES;
  LOCATIONS = LOCATIONS;

  constructor(private toastService: ToastService, public searchService: SearchService) {}

  ngOnInit() {}

  handleEmpCodeChange(val: string, type: 'group' | 'arrears') {
    const upper = val.toUpperCase();
    const emp = EMPLOYEE_LIST.find(e => e.code === upper);
    if (type === 'group') {
      this.empCode = upper;
      this.filterEmpCode = upper;
      this.empName = emp ? emp.name : '';
      this.location = emp ? emp.location : '';
    } else {
      this.arrEmpCode = upper;
      this.arrFilterEmpCode = upper;
      this.arrEmpName = emp ? emp.name : '';
      this.arrLocation = emp ? emp.location : '';
    }
  }

  // TAB 1 Getters & Actions
  get groupRecords(): DeductionRecord[] {
    return this.records.filter(r => !this.group ? false : r.group === this.group);
  }

  get displayRows(): DeductionRecord[] {
    if (!this.group) return [];
    if (!this.showAll) {
      return this.groupRecords
        .filter(r => !this.filterEmpCode || r.empCode === this.filterEmpCode)
        .filter(r => !this.location || r.location === this.location)
        .map(r => ({ ...r, hasRecord: true }))
        .filter(r => this.searchService.matches(r));
    }

    return EMPLOYEE_LIST
      .filter(e => !this.filterEmpCode || e.code === this.filterEmpCode)
      .filter(e => !this.location || e.location === this.location)
      .map(e => {
        const rec = this.groupRecords.find(r => r.empCode === e.code);
        return rec
          ? { ...rec, hasRecord: true }
          : {
              id: `empty-${e.code}`,
              empCode: e.code,
              empName: e.name,
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

  get pageRows(): DeductionRecord[] {
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
    const found = this.records.filter(r => r.group === this.group && (!this.filterEmpCode || r.empCode === this.filterEmpCode));
    this.toastService.addToast(found.length ? `${found.length} record(s) loaded.` : 'No records found for given criteria.', found.length ? 'success' : 'warning');
  }

  handleGroupSave() {
    if (!this.validateGroup()) return;
    const rec: DeductionRecord = {
      id: this.editId ?? Date.now(),
      empCode: this.empCode,
      empName: this.empName,
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

  handleGroupEdit(rec: DeductionRecord) {
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
    this.amount = ''; this.errors = {}; this.editId = null; this.filterEmpCode = '';
  }

  // TAB 2 Getters & Actions
  get categoryRecords(): DeductionRecord[] {
    return this.arrRecords.filter(r => r.group === this.arrCategory);
  }

  get arrDisplayRows(): DeductionRecord[] {
    if (!this.arrShowAll) {
      return this.categoryRecords
        .filter(r => !this.arrFilterEmpCode || r.empCode === this.arrFilterEmpCode)
        .filter(r => !this.arrLocation || r.location === this.arrLocation)
        .map(r => ({ ...r, hasRecord: true }))
        .filter(r => this.searchService.matches(r));
    }

    return EMPLOYEE_LIST
      .filter(e => !this.arrFilterEmpCode || e.code === this.arrFilterEmpCode)
      .filter(e => !this.arrLocation || e.location === this.arrLocation)
      .map(e => {
        const rec = this.categoryRecords.find(r => r.empCode === e.code);
        return rec
          ? { ...rec, hasRecord: true }
          : {
              id: `empty-${e.code}`,
              empCode: e.code,
              empName: e.name,
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

  get arrPageRows(): DeductionRecord[] {
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
    if (!this.arrFilterEmpCode) {
      this.toastService.addToast('Please select an employee.', 'error');
      this.arrErrors = { empCode: true };
      return;
    }
    const found = this.arrRecords.filter(r => r.group === this.arrCategory && r.empCode === this.arrFilterEmpCode);
    this.toastService.addToast(found.length ? `${found.length} record(s) loaded.` : 'No records found for given criteria.', found.length ? 'success' : 'warning');
  }

  handleArrSave() {
    if (!this.validateArr()) return;
    const rec: DeductionRecord = {
      id: this.arrEditId ?? Date.now(),
      group: this.arrCategory,
      empCode: this.arrEmpCode,
      empName: this.arrEmpName,
      amount: -Math.abs(parseFloat(this.arrAmount)),
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

  handleArrEdit(rec: DeductionRecord) {
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
    this.arrAmount = ''; this.arrRemarks = ''; this.arrErrors = {}; this.arrEditId = null; this.arrFilterEmpCode = '';
  }

  goBack() {
    window.history.back();
  }
}