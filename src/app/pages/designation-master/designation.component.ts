import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HrmService, Designation } from '../../core/services/hrm';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-designation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.scss']
})
export class DesignationComponent implements OnInit {
  public hrmService = inject(HrmService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  searchQuery = signal('');
  departmentFilter = signal('All');
  showModal = signal(false);
  editingId = signal<number | null>(null);
  isLoading = signal(true);
  designations = computed(() => this.hrmService.designations());

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      department: ['', Validators.required],
      grade: ['Grade B', Validators.required],
      gender_preference: ['Others', Validators.required],
      status: ['Active', Validators.required]
    });
  }

  ngOnInit() {
    this.loadDesignations();
  }

  loadDesignations() {
    this.isLoading.set(true);
    this.hrmService.fetchDesignations();
    this.isLoading.set(false);
  }

  filteredDesignations = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const dept = this.departmentFilter();
    let list = this.hrmService.designations();

    if (dept !== 'All') {
      list = list.filter(d => d.department === dept);
    }

    if (!query) return list;

    return list.filter(d =>
      d.code.toLowerCase().includes(query) ||
      d.name.toLowerCase().includes(query) ||
      d.department.toLowerCase().includes(query)
    );
  });

  departments = computed(() => {
    const depts = new Set(this.hrmService.designations().map(d => d.department));
    return ['All', ...Array.from(depts)];
  });

  onOpenAddModal() {
    this.editingId.set(null);
    const count = this.hrmService.designations().length + 1;
    this.form.reset({
      code: `DES-00${count}`,
      name: '',
      department: '',
      grade: 'Grade B',
      gender_preference: 'Others',
      status: 'Active'
    });
    this.showModal.set(true);
  }

  onOpenEditModal(d: Designation) {
    this.editingId.set(d.id !== undefined ? d.id : null);
    this.form.setValue({
      code: d.code,
      name: d.name,
      department: d.department,
      grade: d.grade || 'Grade B',
      gender_preference: d.gender_preference || 'Others',
      status: d.status || 'Active'
    });
    this.showModal.set(true);
  }

  onCloseModal() {
    this.showModal.set(false);
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.showModal.set(false);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const editId = this.editingId();

    if (editId !== null) {
      this.hrmService.updateDesignation(editId, val).subscribe({
        next: () => {
          this.toastService.success(`Designation ${val.code} updated successfully!`);
          this.showModal.set(false);
        },
        error: () => {
          this.toastService.error('Failed to update designation.');
        }
      });
    } else {
      this.hrmService.addDesignation(val).subscribe({
        next: () => {
          this.toastService.success(`Designation ${val.code} created successfully!`);
          this.showModal.set(false);
        },
        error: () => {
          this.toastService.error('Failed to create designation.');
        }
      });
    }
  }

  onDelete(id: number, code: string) {
    if (confirm(`Are you sure you want to delete designation ${code}?`)) {
      this.hrmService.deleteDesignation(id).subscribe({
        next: () => {
          this.toastService.success(`Designation ${code} has been deleted.`);
        },
        error: () => {
          this.toastService.error('Failed to delete designation.');
        }
      });
    }
  }

  exportCSV() {
    this.toastService.success('Exporting designations ledger as CSV...');
  }

  getStatusClass(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'active') return 'status-active';
    if (s === 'inactive') return 'status-inactive';
    return 'status-default';
  }
}
