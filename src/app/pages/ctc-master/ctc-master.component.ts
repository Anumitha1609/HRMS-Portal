import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService } from '../../services/master.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

export interface CtcMasterRecord {
  id: string;
  ctcName: string;
  packageCode?: string;
  annualCTC: number;
  description?: string;
  status: string;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  updatedAt?: string;
  employeeCount?: number;
}

@Component({
  selector: 'app-ctc-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ctc-master.component.html',
  styleUrls: ['./ctc-master.component.scss']
})
export class CtcMasterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private masterService = inject(MasterService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Lists & Load State Signals
  records = signal<CtcMasterRecord[]>([]);
  isLoading = signal<boolean>(true);

  // Search Filter Variables
  filterName = '';
  filterMinAmount: number | '' = '';
  filterMaxAmount: number | '' = '';
  filterStatus = 'All';

  // Sorting
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Pagination Signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalPages = signal<number>(1);
  totalRecords = signal<number>(0);

  // Drawer & Form States
  isDrawerOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  selectedRecord = signal<CtcMasterRecord | null>(null);
  ctcForm!: FormGroup;

  totalMonthlyCTC = signal<number>(0);
  totalAnnualCTC = signal<number>(0);

  get components() { return this.ctcForm.get('components') as FormArray; }

  ngOnInit() {
    this.initForm();
    this.loadRecords();
  }

  private initForm() {
    this.ctcForm = this.fb.group({
      ctcName: ['', [Validators.required, Validators.pattern('.*\\S.*')]], // trim validator helper
      packageCode: ['', [Validators.pattern('^[a-zA-Z0-9_-]*$')]],
      annualCTC: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.maxLength(500)]],
      status: ['ACTIVE', [Validators.required]],
      components: this.fb.array([])
    });

    this.ctcForm.valueChanges.subscribe(() => {
      this.recalculateComponents();
    });
  }

  recalculateComponents() {
    const annualCTC = this.ctcForm.get('annualCTC')?.value || 0;
    const monthlyCTC = annualCTC / 12;
    const comps = this.components.controls;
    
    let basicMonthly = 0;
    
    // 1. Process Fixed Amount and Percentage of CTC
    comps.forEach(c => {
      const head = c.get('salaryHead')?.value || '';
      const type = c.get('calculationType')?.value;
      const value = parseFloat(c.get('value')?.value || '0');
      
      let monthly = 0;
      if (type === 'Fixed Amount') {
        monthly = value;
        c.get('formula')?.setValue(`Fixed: ₹${value}`, { emitEvent: false });
      } else if (type === 'Percentage of CTC') {
        monthly = monthlyCTC * (value / 100);
        c.get('formula')?.setValue(`CTC * ${value}%`, { emitEvent: false });
      }
      
      if (head.toLowerCase() === 'basic') {
        basicMonthly = monthly;
      }
      
      c.get('monthlyAmount')?.setValue(monthly, { emitEvent: false });
      c.get('annualAmount')?.setValue(monthly * 12, { emitEvent: false });
    });
    
    // 2. Process Percentage of Basic
    comps.forEach(c => {
      const type = c.get('calculationType')?.value;
      const value = parseFloat(c.get('value')?.value || '0');
      
      if (type === 'Percentage of Basic') {
        const monthly = basicMonthly * (value / 100);
        c.get('formula')?.setValue(`Basic * ${value}%`, { emitEvent: false });
        c.get('monthlyAmount')?.setValue(monthly, { emitEvent: false });
        c.get('annualAmount')?.setValue(monthly * 12, { emitEvent: false });
      }
    });
    
    // 3. Process Remaining Balance
    let allocatedMonthly = 0;
    comps.forEach(c => {
      if (c.get('calculationType')?.value !== 'Remaining Balance') {
        allocatedMonthly += parseFloat(c.get('monthlyAmount')?.value || '0');
      }
    });
    
    const remainingMonthly = Math.max(0, monthlyCTC - allocatedMonthly);
    comps.forEach(c => {
      if (c.get('calculationType')?.value === 'Remaining Balance') {
        c.get('formula')?.setValue('CTC - Sum(Others)', { emitEvent: false });
        c.get('monthlyAmount')?.setValue(remainingMonthly, { emitEvent: false });
        c.get('annualAmount')?.setValue(remainingMonthly * 12, { emitEvent: false });
      }
    });
    
    // Sum total
    let totalMonthly = 0;
    let totalAnnual = 0;
    comps.forEach(c => {
      totalMonthly += parseFloat(c.get('monthlyAmount')?.value || '0');
      totalAnnual += parseFloat(c.get('annualAmount')?.value || '0');
    });
    
    this.totalMonthlyCTC.set(totalMonthly);
    this.totalAnnualCTC.set(totalAnnual);
  }

  addComponent() {
    this.components.push(this.fb.group({
      salaryHead: ['', Validators.required],
      calculationType: ['Percentage of CTC', Validators.required],
      value: [0, [Validators.required, Validators.min(0)]],
      formula: [''],
      monthlyAmount: [{ value: 0, disabled: true }],
      annualAmount: [{ value: 0, disabled: true }]
    }));
    this.recalculateComponents();
  }

  removeComponent(index: number) {
    this.components.removeAt(index);
    this.recalculateComponents();
  }

  loadRecords() {
    this.isLoading.set(true);
    const filters = {
      name: this.filterName,
      minAmount: this.filterMinAmount,
      maxAmount: this.filterMaxAmount,
      status: this.filterStatus,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      page: this.currentPage(),
      limit: this.pageSize()
    };

    this.masterService.getCtcs(filters).subscribe({
      next: (res) => {
        this.records.set(res.data);
        this.totalRecords.set(res.pagination.total);
        this.totalPages.set(res.pagination.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to load CTC records: ' + (err.error?.error || err.message));
        this.isLoading.set(false);
      }
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadRecords();
  }

  onReset() {
    this.filterName = '';
    this.filterMinAmount = '';
    this.filterMaxAmount = '';
    this.filterStatus = 'All';
    this.currentPage.set(1);
    this.loadRecords();
  }

  toggleSort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.currentPage.set(1);
    this.loadRecords();
  }

  // Pagination Handlers
  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadRecords();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadRecords();
    }
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize.set(parseInt(select.value) || 10);
    this.currentPage.set(1);
    this.loadRecords();
  }

  getShowingText(): string {
    const total = this.totalRecords();
    const size = this.pageSize();
    const page = this.currentPage();
    
    if (total === 0) return 'Showing 0-0 of 0 CTCs';
    
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return `Showing ${start} to ${end} of ${total} CTCs`;
  }

  // Drawer / Form Actions
  onNew() {
    if (!this.authService.isExecutive()) return;
    this.selectedRecord.set(null);
    this.isEditMode.set(true);
    this.ctcForm.reset({ status: 'ACTIVE' });
    this.components.clear();
    const defaults = [
      { salaryHead: 'Basic', calculationType: 'Percentage of CTC', value: 50, formula: 'CTC * 50.00%', monthlyAmount: 0, annualAmount: 0 },
      { salaryHead: 'HRA', calculationType: 'Percentage of Basic', value: 40, formula: 'Basic * 40.00%', monthlyAmount: 0, annualAmount: 0 },
      { salaryHead: 'CA', calculationType: 'Fixed Amount', value: 1600, formula: 'Fixed: ₹1600', monthlyAmount: 0, annualAmount: 0 },
      { salaryHead: 'Others', calculationType: 'Remaining Balance', value: 0, formula: 'CTC - Sum(Others)', monthlyAmount: 0, annualAmount: 0 }
    ];
    defaults.forEach(d => {
      this.components.push(this.fb.group({
        salaryHead: [d.salaryHead, Validators.required],
        calculationType: [d.calculationType, Validators.required],
        value: [d.value, [Validators.required, Validators.min(0)]],
        formula: [d.formula],
        monthlyAmount: [{ value: d.monthlyAmount, disabled: true }],
        annualAmount: [{ value: d.annualAmount, disabled: true }]
      }));
    });
    this.ctcForm.enable();
    this.isDrawerOpen.set(true);
    this.recalculateComponents();
  }

  onEdit(record: any) {
    if (!this.authService.isExecutive()) return;
    this.selectedRecord.set(record);
    this.isEditMode.set(true);
    this.ctcForm.patchValue({
      ctcName: record.ctcName,
      packageCode: record.packageCode || '',
      annualCTC: record.annualCTC,
      description: record.description || '',
      status: record.status
    });
    this.components.clear();
    const comps = record.components || [];
    comps.forEach((c: any) => {
      this.components.push(this.fb.group({
        salaryHead: [c.salaryHead, Validators.required],
        calculationType: [c.calculationType, Validators.required],
        value: [c.value || 0, [Validators.required, Validators.min(0)]],
        formula: [c.formula || ''],
        monthlyAmount: [{ value: c.monthlyAmount || 0, disabled: true }],
        annualAmount: [{ value: c.annualAmount || 0, disabled: true }]
      }));
    });
    this.ctcForm.enable();
    this.isDrawerOpen.set(true);
    this.recalculateComponents();
  }

  onView(record: any) {
    this.selectedRecord.set(record);
    this.isEditMode.set(false);
    this.ctcForm.patchValue({
      ctcName: record.ctcName,
      packageCode: record.packageCode || '',
      annualCTC: record.annualCTC,
      description: record.description || '',
      status: record.status
    });
    this.components.clear();
    const comps = record.components || [];
    comps.forEach((c: any) => {
      this.components.push(this.fb.group({
        salaryHead: [c.salaryHead, Validators.required],
        calculationType: [c.calculationType, Validators.required],
        value: [c.value || 0, [Validators.required, Validators.min(0)]],
        formula: [c.formula || ''],
        monthlyAmount: [{ value: c.monthlyAmount || 0, disabled: true }],
        annualAmount: [{ value: c.annualAmount || 0, disabled: true }]
      }));
    });
    this.ctcForm.disable();
    this.isDrawerOpen.set(true);
    this.recalculateComponents();
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.selectedRecord.set(null);
    this.components.clear();
    this.ctcForm.reset();
  }

  onSave() {
    if (this.ctcForm.invalid) {
      this.ctcForm.markAllAsTouched();
      return;
    }

    const rawVal = this.ctcForm.getRawValue();
    const { ctcName, packageCode, annualCTC, description, status, components } = rawVal;
    
    let computedAnnualTotal = 0;
    components.forEach((c: any) => {
      computedAnnualTotal += parseFloat(c.annualAmount || 0);
    });
    
    if (Math.abs(computedAnnualTotal - parseFloat(annualCTC)) > 1.0) {
      this.toastService.error(`Component breakup total (₹${computedAnnualTotal.toFixed(2)}) must match Annual CTC (₹${annualCTC})`);
      return;
    }

    const data = {
      ctcName: ctcName.trim(),
      packageCode: packageCode ? packageCode.trim() : '',
      annualCTC: parseFloat(annualCTC.toString()),
      description: description ? description.trim() : '',
      status,
      components
    };

    const selected = this.selectedRecord();
    if (selected) {
      this.masterService.updateCtc(selected.id, data).subscribe({
        next: () => {
          this.toastService.success('CTC updated successfully.');
          this.loadRecords();
          this.closeDrawer();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to update CTC');
        }
      });
    } else {
      this.masterService.createCtc(data).subscribe({
        next: () => {
          this.toastService.success('CTC created successfully.');
          this.loadRecords();
          this.closeDrawer();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to create CTC');
        }
      });
    }
  }

  showValidationError(field: string): boolean {
    const control = this.ctcForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  trackById(index: number, item: CtcMasterRecord): string {
    return item.id;
  }
}
