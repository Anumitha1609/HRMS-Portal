import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HrmService, PayComponent } from '../../core/services/hrm';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollComponent implements OnInit {
  protected readonly Math = Math;
  public hrmService = inject(HrmService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  activeTab = signal<'earnings' | 'deductions'>('earnings');
  searchQuery = signal('');
  showModal = signal(false);
  editingComponentId = signal<number | null>(null);

  // Pagination State
  pageSize = signal(5);
  currentPage = signal(1);

  // Delete Confirmation Modal State
  showDeleteModal = signal(false);
  componentToDeleteId = signal<number | null>(null);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      type: ['Earning', Validators.required],
      code: ['', Validators.required],
      name: ['', Validators.required],
      classification: ['Fixed', Validators.required],
      calculation: ['', Validators.required],
      is_statutory: [false],
      taxable_status: ['Yes', Validators.required],
      status: ['Active', Validators.required]
    });
  }

  ngOnInit() {
    this.hrmService.fetchPayComponents();
  }

  earningsList = computed(() => {
    return this.hrmService.payComponents().filter(c => c.type === 'Earning');
  });

  deductionsList = computed(() => {
    return this.hrmService.payComponents().filter(c => c.type === 'Deduction');
  });

  filteredPayComponents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.activeTab() === 'earnings' ? 'Earning' : 'Deduction';
    const list = this.hrmService.payComponents().filter(p => p.type === type);

    if (!query) return list;

    return list.filter(p =>
      p.code.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.classification.toLowerCase().includes(query)
    );
  });

  // Paginated List
  totalPages = computed(() => {
    return Math.ceil(this.filteredPayComponents().length / this.pageSize()) || 1;
  });

  paginatedPayComponents = computed(() => {
    const list = this.filteredPayComponents();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  onSwitchTab(tab: 'earnings' | 'deductions') {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  onPrevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  onNextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  onOpenAddModal() {
    this.editingComponentId.set(null);
    const isE = this.activeTab() === 'earnings';
    const count = this.hrmService.payComponents().length + 1;
    this.form.reset({
      type: isE ? 'Earning' : 'Deduction',
      code: isE ? `EARN-00${count}` : `DED-00${count}`,
      name: '',
      classification: isE ? 'Fixed' : 'Statutory',
      calculation: isE ? 'Monthly Flat' : 'Percentage (12%)',
      is_statutory: !isE,
      taxable_status: 'Yes',
      status: 'Active'
    });
    this.showModal.set(true);
  }

  onCloseModal() {
    this.showModal.set(false);
    this.editingComponentId.set(null);
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.showModal.set(false);
    }
  }

  onEdit(c: PayComponent) {
    this.editingComponentId.set(c.id || null);
    this.form.patchValue({
      type: c.type,
      code: c.code,
      name: c.name,
      classification: c.classification,
      calculation: c.calculation,
      is_statutory: c.is_statutory,
      taxable_status: c.taxable_status,
      status: c.status || 'Active'
    });
    this.showModal.set(true);
  }

  onSubmit() {
    if (this.form.invalid) return;

    const val = this.form.value;
    val.type = this.activeTab() === 'earnings' ? 'Earning' : 'Deduction';
    val.is_statutory = val.classification === 'Statutory';

    if (this.editingComponentId()) {
      const id = this.editingComponentId()!;
      this.hrmService.updatePayComponent(id, val).subscribe({
        next: () => {
          this.toastService.success(`Pay Component ${val.code} successfully updated!`);
          this.showModal.set(false);
          this.editingComponentId.set(null);
        },
        error: () => {
          this.toastService.error('Failed to update pay component.');
        }
      });
    } else {
      this.hrmService.addPayComponent(val).subscribe({
        next: () => {
          this.toastService.success(`Pay Component ${val.code} successfully saved!`);
          this.showModal.set(false);
        },
        error: () => {
          this.toastService.error('Failed to save pay component.');
        }
      });
    }
  }

  onDelete(id: number) {
    this.componentToDeleteId.set(id);
    this.showDeleteModal.set(true);
  }

  onCloseDeleteModal() {
    this.showDeleteModal.set(false);
    this.componentToDeleteId.set(null);
  }

  onDeleteBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onCloseDeleteModal();
    }
  }

  confirmDelete() {
    const id = this.componentToDeleteId();
    if (id) {
      this.hrmService.deletePayComponent(id).subscribe({
        next: () => {
          this.toastService.success('Payroll component deleted successfully.');
          this.showDeleteModal.set(false);
          this.componentToDeleteId.set(null);

          // Re-adjust page index if the page becomes empty after deletion
          const totalItems = this.filteredPayComponents().length;
          const maxPage = Math.ceil(totalItems / this.pageSize()) || 1;
          if (this.currentPage() > maxPage) {
            this.currentPage.set(maxPage);
          }
        },
        error: () => {
          this.toastService.error('Failed to delete payroll component.');
          this.showDeleteModal.set(false);
          this.componentToDeleteId.set(null);
        }
      });
    }
  }

  triggerUpdateRules() {
    this.toastService.success('Tax compliance rules applied successfully.');
  }

  triggerExportReport() {
    this.toastService.show('Exporting ledger data components...', 'info');
  }
}
