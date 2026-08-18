import { Injectable, inject, signal } from '@angular/core';
import { EmployeeService } from './employee.service';
import { ToastService } from './toast.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeeProgressService {
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);

  currentStep = signal<number>(1);
  draftId = signal<string | null>(null);
  employeeId = signal<string | null>(null);
  completedSteps = signal<boolean[]>(new Array(10).fill(false)); // steps 1 to 9 (index 1 to 9)
  modifiedSteps = signal<boolean[]>(new Array(10).fill(false));  // steps modified & saved in this session

  reset() {
    this.currentStep.set(1);
    this.draftId.set(null);
    this.employeeId.set(null);
    this.completedSteps.set(new Array(10).fill(false));
    this.modifiedSteps.set(new Array(10).fill(false));
  }

  async autoSaveDraft(formData: any) {
    const currentDraftId = this.draftId();
    const currentEmpId = this.employeeId();
    
    try {
      if (currentDraftId) {
        await firstValueFrom(this.employeeService.updateDraft(currentDraftId, formData));
        this.toastService.success('Draft saved successfully.');
      } else {
        const res = await firstValueFrom(this.employeeService.createDraft(formData, currentEmpId || undefined));
        this.draftId.set(res.id);
        this.toastService.success('Draft saved successfully.');
      }
    } catch (error) {
      console.error('Failed to auto-save draft:', error);
    }
  }

  markStepComplete(step: number, complete: boolean = true) {
    const current = [...this.completedSteps()];
    current[step] = complete;
    this.completedSteps.set(current);
  }

  markStepModified(step: number, modified: boolean = true) {
    const current = [...this.modifiedSteps()];
    current[step] = modified;
    this.modifiedSteps.set(current);
  }
}
