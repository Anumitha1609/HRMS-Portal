import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="field picker">
      <label *ngIf="label">{{ label }}<span class="required" *ngIf="isRequired"> *</span></label>
      <input
        type="text"
        [ngModel]="query()"
        (ngModelChange)="onQueryChange($event)"
        (focus)="isOpen.set(true)"
        (blur)="onBlur()"
        [placeholder]="placeholder || 'Search employee by name or code'"
      />
      <ul class="results" *ngIf="isOpen() && results().length">
        <li *ngFor="let emp of results()" (mousedown)="pick(emp)">
          <strong>{{ emp.name }}</strong>
          <span>{{ emp.empCode }} &middot; {{ emp.department }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      .picker {
        position: relative;
        min-width: 220px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      label {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-muted, #475569);
      }
      .required {
        color: var(--color-danger, #dc2626);
      }
      input {
        width: 100%;
        height: 36px;
        padding: 8px 10px;
        border: 1px solid var(--color-border-strong, #d1d5db);
        border-radius: 8px;
        font-size: 13px;
        background: var(--color-surface, #fff);
        color: var(--color-text, #0f172a);
      }
      input:focus {
        outline: none;
        border-color: var(--color-primary, #2563eb);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }
      .results {
        position: absolute;
        z-index: 20;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 8px;
        margin-top: 4px;
        max-height: 220px;
        overflow-y: auto;
        list-style: none;
        padding: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      .results li {
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .results li:hover {
        background: var(--color-bg, #f8fafc);
      }
      .results li strong {
        font-size: 13px;
      }
      .results li span {
        font-size: 11px;
        color: var(--color-text-faint, #94a3b8);
      }
    `
  ]
})
export class EmployeePickerComponent {
  @Input() label = '';
  @Input() required: string | boolean = false;
  @Input() placeholder = '';
  @Output() selected = new EventEmitter<Employee | null>();

  private employeeService = inject(EmployeeService);

  readonly query = signal('');
  readonly isOpen = signal(false);

  get isRequired(): boolean {
    return this.required === true || this.required === 'true';
  }

  readonly results = computed(() => {
    const term = this.query().trim().toLowerCase();
    if (!term) return [];
    return this.employeeService
      .list()
      .filter((e) => e.name.toLowerCase().includes(term) || e.empCode.toLowerCase().includes(term))
      .slice(0, 8);
  });

  onQueryChange(value: string): void {
    this.query.set(value);
    this.isOpen.set(true);
    if (!value) this.selected.emit(null);
  }

  pick(emp: Employee): void {
    this.query.set(`${emp.name} (${emp.empCode})`);
    this.isOpen.set(false);
    this.selected.emit(emp);
  }

  onBlur(): void {
    // small delay so the (mousedown) on a result can register before we close the list
    setTimeout(() => this.isOpen.set(false), 150);
  }
}
