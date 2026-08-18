import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService, MasterRecord } from '../../services/master.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-functional-unit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './functional-unit.component.html',
  styleUrls: ['../location/location.component.scss']
})
export class FunctionalUnitComponent implements OnInit {
  private fb = inject(FormBuilder);
  masterService = inject(MasterService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);

  records = signal<MasterRecord[]>([]);
  filteredRecords = signal<MasterRecord[]>([]);
  selectedRecord = signal<MasterRecord | null>(null);
  isEditing = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  
  searchQuery = signal<string>('');

  functionalUnitForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    this.loadRecords();
    this.functionalUnitForm.disable();
  }

  loadRecords() {
    this.isLoading.set(true);
    this.masterService.getMasters('functionalunit').subscribe({
      next: (data) => {
        this.records.set(data);
        this.filterRecords();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to load functional units: ' + (err.error?.error || err.message));
        this.isLoading.set(false);
      }
    });
  }

  filterRecords() {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredRecords.set(this.records());
    } else {
      this.filteredRecords.set(
        this.records().filter(r => r.name.toLowerCase().includes(query))
      );
    }
  }

  onSearchChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.filterRecords();
  }

  selectRecord(record: MasterRecord) {
    if (this.isEditing()) {
      if (!confirm('You have unsaved changes. Discard and proceed?')) {
        return;
      }
    }
    this.selectedRecord.set(record);
    this.functionalUnitForm.patchValue({ name: record.name });
    this.isEditing.set(false);
    this.functionalUnitForm.disable();
  }

  editRecord(record: MasterRecord) {
    if (this.isEditing()) {
      if (!confirm('You have unsaved changes. Discard and proceed?')) {
        return;
      }
    }
    this.selectedRecord.set(record);
    this.functionalUnitForm.patchValue({ name: record.name });
    this.isEditing.set(true);
    this.functionalUnitForm.enable();
  }

  onNew() {
    this.selectedRecord.set(null);
    this.functionalUnitForm.reset();
    this.isEditing.set(true);
    this.functionalUnitForm.enable();
  }

  onEdit() {
    if (!this.selectedRecord()) return;
    this.isEditing.set(true);
    this.functionalUnitForm.enable();
  }

  onCancel() {
    this.isEditing.set(false);
    this.functionalUnitForm.disable();
    const selected = this.selectedRecord();
    if (selected) {
      this.functionalUnitForm.patchValue({ name: selected.name });
    } else {
      this.functionalUnitForm.reset();
    }
  }

  onSave() {
    if (this.functionalUnitForm.invalid) {
      this.functionalUnitForm.markAllAsTouched();
      return;
    }

    const { name } = this.functionalUnitForm.value;
    const selected = this.selectedRecord();

    if (selected) {
      this.masterService.updateMaster('functionalunit', selected.id, name).subscribe({
        next: (updated) => {
          this.toastService.success('Functional Unit updated successfully!');
          this.loadRecords();
          this.selectedRecord.set(updated);
          this.isEditing.set(false);
          this.functionalUnitForm.disable();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to update functional unit');
        }
      });
    } else {
      this.masterService.createMaster('functionalunit', name).subscribe({
        next: (created) => {
          this.toastService.success('Functional Unit created successfully!');
          this.loadRecords();
          this.selectedRecord.set(created);
          this.isEditing.set(false);
          this.functionalUnitForm.disable();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to create functional unit');
        }
      });
    }
  }

  onDelete(record: MasterRecord) {
    const hasEmployees = !!record.employeeCount && record.employeeCount > 0;
    const confirmMessage = hasEmployees
      ? `Warning: "${record.name}" still has ${record.employeeCount} employee(s) assigned to it. Deleting it will leave those employee records pointing at a missing functional unit. Are you sure you want to continue?`
      : `Are you sure you want to soft-delete the functional unit "${record.name}"?`;

    if (confirm(confirmMessage)) {
      this.masterService.deleteMaster('functionalunit', record.id).subscribe({
        next: () => {
          this.toastService.success('Functional Unit deleted successfully!');
          this.selectedRecord.set(null);
          this.functionalUnitForm.reset();
          this.isEditing.set(false);
          this.functionalUnitForm.disable();
          this.loadRecords();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to delete functional unit');
        }
      });
    }
  }
}
