import { Component, Input, Output, EventEmitter, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeProgressService } from '../../services/employee-progress.service';

@Component({
  selector: 'app-step-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stepper-header-container">
      <div class="stepper-title-row">
        <h3>Employee Creation Progress</h3>
        <span class="step-indicator">Step {{ progressService.currentStep() }} of 9</span>
      </div>
      
      <!-- Stepper Steps Grid Wrapper with Scroll Buttons -->
      <div class="stepper-steps-outer-wrapper" style="position: relative; display: flex; align-items: center; width: 100%; padding: 0 24px;">
        <button type="button" class="stepper-scroll-btn left" (click)="scrollSteps('left')" aria-label="Scroll left">
          <span class="material-icons">chevron_left</span>
        </button>

        <div class="stepper-steps-wrapper" #stepsWrapper style="flex-grow: 1; overflow-x: auto; scroll-behavior: smooth; display: flex; align-items: center; gap: 12px; padding: 4px 0;">
          <div 
            *ngFor="let step of steps; let i = index" 
            class="stepper-step" 
            [class.active]="progressService.currentStep() === i + 1"
            [class.completed]="isStepCompleted(i + 1)"
            [class.editable-blue]="isStepEditableBlue(i + 1)"
            [class.disabled]="!isNavigationAllowed(i + 1)"
            (click)="onStepClick(i + 1)"
          >
            <div class="step-icon-circle">
              <span *ngIf="isStepCompleted(i + 1)" class="material-icons check-icon">check</span>
              <span *ngIf="!isStepCompleted(i + 1)">{{ i + 1 }}</span>
            </div>
            <div class="step-details">
              <span class="step-title">{{ step.title }}</span>
            </div>
            <div *ngIf="i < steps.length - 1" class="step-connector"></div>
          </div>
        </div>

        <button type="button" class="stepper-scroll-btn right" (click)="scrollSteps('right')" aria-label="Scroll right">
          <span class="material-icons">chevron_right</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .stepper-header-container {
      margin-bottom: 12px;
      background: #ffffff;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .stepper-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }
      .step-indicator {
        font-size: 13px;
        font-weight: 600;
        color: #2563EB;
        background: rgba(37, 99, 235, 0.08);
        padding: 4px 10px;
        border-radius: 20px;
      }
    }
    .stepper-steps-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
      
      &::-webkit-scrollbar {
        height: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }
    .stepper-step {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
      
      @media (max-width: 768px) {
        width: 100%;
      }
      
      &.active {
        .step-icon-circle {
          background: #2563EB;
          color: #ffffff;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
        }
        .step-title {
          color: #2563EB;
          font-weight: 700;
        }
      }
      
      &.completed {
        .step-icon-circle {
          background: #10B981;
          color: #ffffff;
          border-color: #10B981;
        }
        .step-title {
          color: #10B981;
        }
      }

      &.editable-blue {
        .step-icon-circle {
          background: rgba(37, 99, 235, 0.08);
          color: #2563EB;
          border-color: #2563EB;
        }
        .step-title {
          color: #2563EB;
          font-weight: 600;
        }
      }
      
      &.disabled {
        cursor: not-allowed;
        opacity: 0.5;
        .step-icon-circle {
          background: #f1f5f9;
          color: #94a3b8;
          border-color: #cbd5e1;
        }
        .step-title {
          color: #94a3b8;
        }
      }
    }
    .step-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      background: #ffffff;
      color: #64748b;
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      .check-icon {
        font-size: 18px;
      }
    }
    .step-details {
      white-space: nowrap;
      .step-title {
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
      }
    }
    .step-connector {
      flex: 1;
      height: 2px;
      background: #e2e8f0;
      margin-left: 8px;
      
      @media (max-width: 768px) {
        display: none;
      }
    }
    .stepper-scroll-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      color: #64748b;
      transition: all 0.2s;
      
      &:hover {
        background: #f8fafc;
        color: #2563eb;
        border-color: #2563eb;
        transform: translateY(-50%) scale(1.1);
      }
      
      &.left {
        left: 0;
      }
      
      &.right {
        right: 0;
      }
      
      span.material-icons {
        font-size: 18px;
      }
    }
  `]
})
export class StepHeaderComponent {
  progressService = inject(EmployeeProgressService);
  @ViewChild('stepsWrapper') stepsWrapper!: ElementRef;

  scrollSteps(direction: 'left' | 'right') {
    if (this.stepsWrapper) {
      const container = this.stepsWrapper.nativeElement;
      const scrollAmount = 180;
      if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  }

  steps = [
    { title: 'Primary Details' },
    { title: 'Classification' },
    { title: 'Bank Details' },
    { title: 'Family Details' },
    { title: 'Nominee Details' },
    { title: 'Scale & Scale Details' },
    { title: 'General Info' },
    { title: 'Attachments' },
    { title: 'Review & Save' }
  ];

  @Input() isEditMode: boolean = false;
  @Output() stepSelected = new EventEmitter<number>();

  isStepCompleted(step: number): boolean {
    if (this.isEditMode) {
      return this.progressService.modifiedSteps()[step];
    }
    return this.progressService.completedSteps()[step];
  }

  isStepEditableBlue(step: number): boolean {
    return this.isEditMode && 
           this.progressService.currentStep() !== step && 
           !this.isStepCompleted(step);
  }

  isNavigationAllowed(step: number): boolean {
    if (this.isEditMode) return true;
    if (step <= this.progressService.currentStep()) return true;
    return this.progressService.completedSteps()[step - 1];
  }

  onStepClick(step: number) {
    if (this.isNavigationAllowed(step)) {
      this.stepSelected.emit(step);
    }
  }
}
