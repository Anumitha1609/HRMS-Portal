import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService, MasterRecord, SubCategoryRecord } from '../../services/master.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  private fb = inject(FormBuilder);
  masterService = inject(MasterService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);

  // States
  records = signal<MasterRecord[]>([]);
  selectedRecord = signal<MasterRecord | null>(null);
  isEditingCategory = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  // Category Form
  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  // Subcategory Input States
  newSubCategoryName = signal<string>('');
  editingSubCategoryId = signal<string | null>(null);
  editingSubCategoryName = signal<string>('');

  ngOnInit() {
    this.loadRecords();
    this.categoryForm.disable();
  }

  loadRecords() {
    this.isLoading.set(true);
    this.masterService.getMasters('category').subscribe({
      next: (data) => {
        this.records.set(data);
        const currentSelected = this.selectedRecord();
        if (currentSelected) {
          const updated = data.find(c => c.id === currentSelected.id);
          if (updated) this.selectedRecord.set(updated);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.error('Failed to load categories: ' + (err.error?.error || err.message));
        this.isLoading.set(false);
      }
    });
  }

  selectRecord(record: MasterRecord) {
    if (this.isEditingCategory()) {
      if (!confirm('You have unsaved Category changes. Discard and proceed?')) {
        return;
      }
    }
    this.selectedRecord.set(record);
    this.categoryForm.patchValue({ name: record.name });
    this.isEditingCategory.set(false);
    this.categoryForm.disable();
    this.cancelSubCategoryEdit();
  }

  editRecord(record: MasterRecord) {
    if (this.isEditingCategory()) {
      if (!confirm('You have unsaved Category changes. Discard and proceed?')) {
        return;
      }
    }
    this.selectedRecord.set(record);
    this.categoryForm.patchValue({ name: record.name });
    this.isEditingCategory.set(true);
    this.categoryForm.enable();
    this.cancelSubCategoryEdit();
  }

  onNewCategory() {
    this.selectedRecord.set(null);
    this.categoryForm.reset();
    this.isEditingCategory.set(true);
    this.categoryForm.enable();
  }

  onEditCategory() {
    if (!this.selectedRecord()) return;
    this.isEditingCategory.set(true);
    this.categoryForm.enable();
  }

  onCancelCategory() {
    this.isEditingCategory.set(false);
    this.categoryForm.disable();
    const selected = this.selectedRecord();
    if (selected) {
      this.categoryForm.patchValue({ name: selected.name });
    } else {
      this.categoryForm.reset();
    }
  }

  onSaveCategory() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const { name } = this.categoryForm.value;
    const selected = this.selectedRecord();

    if (selected) {
      this.masterService.updateMaster('category', selected.id, name).subscribe({
        next: (updated) => {
          this.toastService.success('Category updated successfully!');
          this.loadRecords();
          this.isEditingCategory.set(false);
          this.categoryForm.disable();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to update category');
        }
      });
    } else {
      this.masterService.createMaster('category', name).subscribe({
        next: (created) => {
          this.toastService.success('Category created successfully!');
          this.loadRecords();
          this.selectedRecord.set(created);
          this.isEditingCategory.set(false);
          this.categoryForm.disable();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to create category');
        }
      });
    }
  }

  onDeleteCategory(record: MasterRecord) {
    const hasEmployees = !!record.employeeCount && record.employeeCount > 0;
    const confirmMessage = hasEmployees
      ? `Warning: "${record.name}" still has ${record.employeeCount} employee(s) assigned to it. Deleting it will leave those employee records pointing at a missing category. Are you sure you want to continue?`
      : `Are you sure you want to soft-delete the Category "${record.name}"?`;

    if (confirm(confirmMessage)) {
      this.masterService.deleteMaster('category', record.id).subscribe({
        next: () => {
          this.toastService.success('Category deleted successfully!');
          this.selectedRecord.set(null);
          this.categoryForm.reset();
          this.isEditingCategory.set(false);
          this.categoryForm.disable();
          this.loadRecords();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to delete category');
        }
      });
    }
  }

  // --- Sub-Category Management ---
  onSubCategoryInput(event: Event) {
    this.newSubCategoryName.set((event.target as HTMLInputElement).value);
  }

  handleAddSubCategory() {
    const name = this.newSubCategoryName().trim();
    const category = this.selectedRecord();
    
    if (!name || !category) return;

    this.masterService.addSubCategory(category.id, name).subscribe({
      next: () => {
        this.toastService.success('Sub-category added!');
        this.newSubCategoryName.set('');
        this.loadRecords();
      },
      error: (err) => {
        this.toastService.error(err.error?.error || 'Failed to add sub-category');
      }
    });
  }

  startSubCategoryEdit(subCat: SubCategoryRecord) {
    this.editingSubCategoryId.set(subCat.id);
    this.editingSubCategoryName.set(subCat.name);
  }

  onSubCategoryEditInput(event: Event) {
    this.editingSubCategoryName.set((event.target as HTMLInputElement).value);
  }

  saveSubCategoryEdit(subCat: SubCategoryRecord) {
    const newName = this.editingSubCategoryName().trim();
    const category = this.selectedRecord();

    if (!newName || !category) return;

    this.masterService.updateSubCategory(category.id, subCat.id, newName).subscribe({
      next: () => {
        this.toastService.success('Sub-category updated!');
        this.cancelSubCategoryEdit();
        this.loadRecords();
      },
      error: (err) => {
        this.toastService.error(err.error?.error || 'Failed to update sub-category');
      }
    });
  }

  cancelSubCategoryEdit() {
    this.editingSubCategoryId.set(null);
    this.editingSubCategoryName.set('');
  }

  deleteSubCategory(subCat: SubCategoryRecord) {
    const category = this.selectedRecord();
    if (!category) return;

    if (confirm(`Are you sure you want to remove sub-category "${subCat.name}"?`)) {
      this.masterService.deleteSubCategory(category.id, subCat.id).subscribe({
        next: () => {
          this.toastService.success('Sub-category removed!');
          this.loadRecords();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to remove sub-category');
        }
      });
    }
  }
}
