import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { LucideAngularModule } from 'lucide-angular';
import * as XLSX from 'xlsx';

type Category = 'Earnings' | 'Deduction' | 'Employer Contribution';

interface SalaryHead {
  id: number;
  code: string;
  description: string;
  printTitle: string;
  category: Category;
  sortOrder: number;
  calculated: boolean;
  lopApplicable: boolean;
  includeInPayroll: boolean;
  active: boolean;
}

const PAGE_SIZE = 10;

const INIT_HEADS: SalaryHead[] = [
  { id: 1,  code: 'BASIC',    description: 'Basic Salary',        printTitle: 'Basic Salary',    category: 'Earnings',              sortOrder: 1,  calculated: false, lopApplicable: true,  includeInPayroll: true, active: true },
  { id: 2,  code: 'HRA',      description: 'House Rent Allowance', printTitle: 'HRA',              category: 'Earnings',              sortOrder: 2,  calculated: false, lopApplicable: true,  includeInPayroll: true, active: true },
  { id: 3,  code: 'DA',       description: 'Dearness Allowance',  printTitle: 'DA',               category: 'Earnings',              sortOrder: 3,  calculated: false, lopApplicable: true,  includeInPayroll: true, active: true },
  { id: 4,  code: 'CONV',     description: 'Conveyance Allowance', printTitle: 'Conveyance',       category: 'Earnings',              sortOrder: 4,  calculated: false, lopApplicable: true,  includeInPayroll: true, active: true },
  { id: 5,  code: 'SPALLOW',  description: 'Special Allowance',   printTitle: 'Special Allowance', category: 'Earnings',              sortOrder: 5,  calculated: false, lopApplicable: true,  includeInPayroll: true, active: true },
  { id: 6,  code: 'PF_EMP',   description: 'PF Employee',         printTitle: 'PF (Employee)',     category: 'Deduction',             sortOrder: 6,  calculated: true,  lopApplicable: false, includeInPayroll: true, active: true },
  { id: 7,  code: 'ESI_EMP',  description: 'ESI Employee',        printTitle: 'ESI (Employee)',    category: 'Deduction',             sortOrder: 7,  calculated: true,  lopApplicable: false, includeInPayroll: true, active: true },
  { id: 8,  code: 'PTAX',     description: 'Professional Tax',    printTitle: 'Professional Tax',  category: 'Deduction',             sortOrder: 8,  calculated: false, lopApplicable: false, includeInPayroll: true, active: true },
  { id: 9,  code: 'ITAX',     description: 'Income Tax',          printTitle: 'Income Tax',        category: 'Deduction',             sortOrder: 9,  calculated: true,  lopApplicable: false, includeInPayroll: true, active: true },
  { id: 10, code: 'PF_ER',    description: 'PF Employer',         printTitle: 'PF (Employer)',     category: 'Employer Contribution', sortOrder: 10, calculated: true,  lopApplicable: false, includeInPayroll: true, active: true },
  { id: 11, code: 'ESI_ER',   description: 'ESI Employer',        printTitle: 'ESI (Employer)',    category: 'Employer Contribution', sortOrder: 11, calculated: true,  lopApplicable: false, includeInPayroll: true, active: true },
  { id: 12, code: 'MEDALLOW', description: 'Medical Allowance',   printTitle: 'Medical Allowance', category: 'Earnings',              sortOrder: 12, calculated: false, lopApplicable: true,  includeInPayroll: true, active: true },
  { id: 13, code: 'LTA',      description: 'Leave Travel Allowance', printTitle: 'LTA',            category: 'Earnings',              sortOrder: 13, calculated: false, lopApplicable: false, includeInPayroll: true, active: true },
  { id: 14, code: 'BONUS',    description: 'Statutory Bonus',     printTitle: 'Bonus',             category: 'Earnings',              sortOrder: 14, calculated: true,  lopApplicable: false, includeInPayroll: true, active: true },
  { id: 15, code: 'ADVDED',   description: 'Advance Deduction',   printTitle: 'Advance Recovery',  category: 'Deduction',             sortOrder: 15, calculated: false, lopApplicable: false, includeInPayroll: true, active: true },
  { id: 16, code: 'LOPDED',   description: 'Loss of Pay Deduction', printTitle: 'LOP',             category: 'Deduction',             sortOrder: 16, calculated: true,  lopApplicable: true,  includeInPayroll: true, active: true },
  { id: 17, code: 'GRATUITY', description: 'Gratuity Contribution', printTitle: 'Gratuity',        category: 'Employer Contribution', sortOrder: 17, calculated: true,  lopApplicable: false, includeInPayroll: false, active: false },
  { id: 18, code: 'LWF_EMP',  description: 'Labour Welfare Fund (Employee)', printTitle: 'LWF (Employee)', category: 'Deduction',      sortOrder: 18, calculated: true,  lopApplicable: false, includeInPayroll: true, active: true },
  { id: 19, code: 'LWF_ER',   description: 'Labour Welfare Fund (Employer)', printTitle: 'LWF (Employer)', category: 'Employer Contribution', sortOrder: 19, calculated: true, lopApplicable: false, includeInPayroll: true, active: true },
  { id: 20, code: 'NPS_ER',   description: 'NPS Employer Contribution', printTitle: 'NPS (Employer)', category: 'Employer Contribution', sortOrder: 20, calculated: true,  lopApplicable: false, includeInPayroll: false, active: false },
];

const EMPTY_HEAD: Omit<SalaryHead, 'id'> = {
  code: '', description: '', printTitle: '', category: 'Earnings', sortOrder: 1,
  calculated: false, lopApplicable: false, includeInPayroll: false, active: false
};

@Component({
  selector: 'app-salary-heads',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './salary-heads.component.html',
  styleUrls: ['./salary-heads.component.scss']
})
export class SalaryHeadsComponent implements OnInit {
  @ViewChild('gridSearchInput') gridSearchInput?: ElementRef<HTMLInputElement>;

  heads: SalaryHead[] = [...INIT_HEADS];
  categories: Category[] = ['Earnings', 'Deduction', 'Employer Contribution'];

  form: Omit<SalaryHead, 'id'> & { id: number | null } = { id: null, ...EMPTY_HEAD };
  editMode = false;
  selectedId: number | null = null;

  searchTerm = '';
  page = 1;

  constructor(private toastService: ToastService) {}

  ngOnInit() {}

  get filteredHeads(): SalaryHead[] {
    const term = this.searchTerm.trim().toLowerCase();
    const list = !term
      ? this.heads
      : this.heads.filter(h =>
          h.code.toLowerCase().includes(term) ||
          h.description.toLowerCase().includes(term) ||
          h.printTitle.toLowerCase().includes(term) ||
          h.category.toLowerCase().includes(term)
        );
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredHeads.length / PAGE_SIZE));
  }

  get currentPage(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pageRows(): SalaryHead[] {
    const start = (this.currentPage - 1) * PAGE_SIZE;
    return this.filteredHeads.slice(start, start + PAGE_SIZE);
  }

  get startEntry(): number {
    return this.filteredHeads.length === 0 ? 0 : (this.currentPage - 1) * PAGE_SIZE + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * PAGE_SIZE, this.filteredHeads.length);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur, '…', total];
  }

  onSearchChange(val: string) {
    this.searchTerm = val;
    this.page = 1;
  }

  focusGridSearch() {
    this.gridSearchInput?.nativeElement.focus();
  }

  selectRow(h: SalaryHead) {
    if (this.editMode) return;
    this.selectedId = h.id;
    this.form = { ...h };
  }

  onNew() {
    this.selectedId = null;
    this.form = { id: null, ...EMPTY_HEAD, sortOrder: this.heads.length + 1 };
    this.editMode = true;
  }

  onEdit() {
    if (this.selectedId === null) {
      this.toastService.addToast('Select a salary head from the list to edit.', 'warning');
      return;
    }
    this.editMode = true;
  }

  editRow(h: SalaryHead) {
    this.selectedId = h.id;
    this.form = { ...h };
    this.editMode = true;
  }

  deleteRow(h: SalaryHead) {
    this.selectedId = h.id;
    this.onDelete();
  }

  onDelete() {
    if (this.selectedId === null) {
      this.toastService.addToast('Select a salary head from the list to delete.', 'warning');
      return;
    }
    const head = this.heads.find(h => h.id === this.selectedId);
    this.heads = this.heads.filter(h => h.id !== this.selectedId);
    this.toastService.addToast(`Salary head "${head?.code}" deleted.`, 'error');
    this.selectedId = null;
    this.form = { id: null, ...EMPTY_HEAD };
  }

  onSave() {
    if (!this.form.code || !this.form.description || !this.form.printTitle || !this.form.category || !this.form.sortOrder) {
      this.toastService.addToast('Please fill all required fields.', 'error');
      return;
    }
    const codeExists = this.heads.some(h => h.code.toLowerCase() === this.form.code.toLowerCase() && h.id !== this.form.id);
    if (codeExists) {
      this.toastService.addToast('Salary Head Code already exists.', 'error');
      return;
    }

    if (this.form.id === null) {
      const newId = this.heads.length > 0 ? Math.max(...this.heads.map(h => h.id)) + 1 : 1;
      const newHead: SalaryHead = { ...(this.form as Omit<SalaryHead, 'id'>), id: newId };
      this.heads = [...this.heads, newHead];
      this.selectedId = newId;
      this.toastService.addToast(`Salary head "${newHead.code}" added.`, 'success');
    } else {
      this.heads = this.heads.map(h => h.id === this.form.id ? { ...(this.form as SalaryHead) } : h);
      this.toastService.addToast(`Salary head "${this.form.code}" updated.`, 'success');
    }
    this.editMode = false;
  }

  onCancel() {
    if (this.selectedId !== null) {
      const original = this.heads.find(h => h.id === this.selectedId);
      this.form = original ? { ...original } : { id: null, ...EMPTY_HEAD };
    } else {
      this.form = { id: null, ...EMPTY_HEAD };
    }
    this.editMode = false;
  }

  onRefresh() {
    this.heads = [...INIT_HEADS];
    this.searchTerm = '';
    this.page = 1;
    this.selectedId = null;
    this.editMode = false;
    this.form = { id: null, ...EMPTY_HEAD };
    this.toastService.addToast('Salary heads list refreshed.', 'success');
  }

  onPrint() {
    window.print();
  }

  onExport() {
    const sheetData = this.filteredHeads.map((h, i) => ({
      '#': i + 1,
      'Salary Head Code': h.code,
      'Description': h.description,
      'Print Title': h.printTitle,
      'Category / Details': h.category,
      'Sort Order': h.sortOrder,
      'Calculated': h.calculated ? 'Yes' : 'No',
      'LOP Applicable': h.lopApplicable ? 'Yes' : 'No',
      'Include in Payroll Calculation': h.includeInPayroll ? 'Yes' : 'No',
      'Active': h.active ? 'Active' : 'Inactive'
    }));
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Salary Heads');
    XLSX.writeFile(workbook, 'Salary_Heads.xlsx');
    this.toastService.addToast('Salary heads exported.', 'success');
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
}