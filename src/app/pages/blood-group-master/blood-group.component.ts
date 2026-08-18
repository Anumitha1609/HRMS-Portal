import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HrmService, BloodGroup } from '../../core/services/hrm';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-blood-group',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './blood-group.component.html',
  styleUrls: ['./blood-group.component.scss']
})
export class BloodGroupComponent implements OnInit {
  public hrmService = inject(HrmService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  searchQuery = signal('');
  showModal = signal(false);
  editingId = signal<number | null>(null);
  isLoading = signal(true);
  bloodGroups = computed(() => this.hrmService.bloodGroups());

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      status: ['Active', Validators.required],
      created_at: [new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

  ngOnInit() {
    this.loadBloodGroups();
  }

  loadBloodGroups() {
    this.isLoading.set(true);
    this.hrmService.fetchBloodGroups();
    this.isLoading.set(false);
  }

  filteredBloodGroups = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.hrmService.bloodGroups();

    if (!query) return list;

    return list.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.description.toLowerCase().includes(query)
    );
  });

  activeBloodGroupsCount = computed(() => {
    return this.hrmService.bloodGroups().filter(b => b.status === 'Active').length;
  });

  coveragePercentage = computed(() => {
    const total = this.hrmService.bloodGroups().length;
    if (total === 0) return 0;
    const active = this.activeBloodGroupsCount();
    return Math.round((active / total) * 100);
  });

  onOpenAddModal() {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      description: '',
      status: 'Active',
      created_at: new Date().toISOString().substring(0, 10)
    });
    this.showModal.set(true);
  }

  onOpenEditModal(b: BloodGroup) {
    this.editingId.set(b.id !== undefined ? b.id : null);
    this.form.setValue({
      name: b.name,
      description: b.description || '',
      status: b.status || 'Active',
      created_at: b.created_at ? new Date(b.created_at).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10)
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
      this.hrmService.updateBloodGroup(editId, val).subscribe({
        next: () => {
          this.toastService.success(`Blood Group ${val.name} successfully updated!`);
          this.showModal.set(false);
        },
        error: () => {
          this.toastService.error('Failed to update blood group.');
        }
      });
    } else {
      this.hrmService.addBloodGroup(val).subscribe({
        next: () => {
          this.toastService.success(`Blood Group ${val.name} successfully created!`);
          this.showModal.set(false);
        },
        error: () => {
          this.toastService.error('Failed to create blood group.');
        }
      });
    }
  }

  onDelete(id: number, name: string) {
    if (confirm(`Are you sure you want to delete blood group ${name}?`)) {
      this.hrmService.deleteBloodGroup(id).subscribe({
        next: () => {
          this.toastService.success(`Blood group ${name} has been removed.`);
        },
        error: () => {
          this.toastService.error('Failed to remove blood group.');
        }
      });
    }
  }

  triggerExportAlert() {
    this.toastService.show('Exporting clinical blood database...', 'info');
  }

  getStatusClass(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'active') return 'status-active';
    if (s === 'inactive') return 'status-inactive';
    return 'status-default';
  }

  padCount(count: number): string {
    return count < 10 ? '0' + count : '' + count;
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toISOString().substring(0, 10);
    } catch {
      return dateStr;
    }
  }
}
