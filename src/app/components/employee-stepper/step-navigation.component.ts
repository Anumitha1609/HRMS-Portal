import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeProgressService } from '../../services/employee-progress.service';

@Component({
  selector: 'app-step-navigation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step-navigation-bar card glass-panel">
      <div class="nav-left">
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="onCancel()"
        >
          <span class="material-icons">close</span> Cancel
        </button>
      </div>
      
      <div class="nav-right">
        <button 
          *ngIf="progressService.currentStep() > 1"
          type="button" 
          class="btn btn-secondary" 
          (click)="onBack()"
        >
          <span class="material-icons">arrow_back</span> Back
        </button>
        
        <button 
          type="button" 
          class="btn btn-secondary" 
          (click)="onSaveDraft()"
        >
          <span class="material-icons">save</span> Save Draft
        </button>

        <button 
          *ngIf="progressService.currentStep() < 9"
          type="button" 
          class="btn btn-primary" 
          [disabled]="!isCurrentStepValid"
          (click)="onNext()"
        >
          Next <span class="material-icons">arrow_forward</span>
        </button>

        <button 
          *ngIf="progressService.currentStep() === 9"
          type="button" 
          class="btn btn-primary" 
          [disabled]="!isCurrentStepValid"
          (click)="onSaveEmployee()"
        >
          <span class="material-icons">check_circle</span> Save Employee
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-navigation-bar {
      position: sticky;
      top: 12px;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      margin-bottom: 12px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .nav-left, .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  `]
})
export class StepNavigationComponent {
  progressService = inject(EmployeeProgressService);

  @Input() isCurrentStepValid = false;

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() saveDraft = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() saveEmployee = new EventEmitter<void>();

  onBack() { this.back.emit(); }
  onNext() { this.next.emit(); }
  onSaveDraft() { this.saveDraft.emit(); }
  onCancel() { this.cancel.emit(); }
  onSaveEmployee() { this.saveEmployee.emit(); }
}
