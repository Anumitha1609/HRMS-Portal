import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeePickerComponent } from '../../shared/components/employee-picker/employee-picker.component';
import { Employee } from '../../core/models/employee.model';

interface ModLine {
  component: string;
  current: number;
  newAmount: number | null;
}

function seedLines(monthly: number): ModLine[] {
  const r = (n: number) => Math.round(n);
  return [
    { component: 'Basic Pay', current: r(monthly * 0.5), newAmount: null },
    { component: 'HRA', current: r(monthly * 0.25), newAmount: null },
    { component: 'Special Allowance', current: r(monthly * 0.15), newAmount: null },
    { component: 'Conveyance Allowance', current: r(monthly * 0.04), newAmount: null },
    { component: 'Medical Allowance', current: r(monthly * 0.03), newAmount: null },
    { component: 'Other Allowance', current: r(monthly * 0.03), newAmount: null }
  ];
}

@Component({
  selector: 'app-increment-modification',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeePickerComponent],
  templateUrl: './increment-modification.component.html',
  styleUrl: './increment-modification.component.scss'
})
export class IncrementModificationComponent {
  readonly employee = signal<Employee | null>(null);
  readonly effectiveFrom = signal('2026-06-01');
  readonly lines = signal<ModLine[]>([]);
  readonly saved = signal(false);

  onEmployeeSelected(emp: Employee | null) {
    this.employee.set(emp);
    this.saved.set(false);
    this.lines.set(emp ? seedLines(Math.round(emp.currentCtc / 12)) : []);
  }

  setNewAmount(line: ModLine, value: string) {
    const num = value === '' ? null : Number(value);
    // Update by returning a new array but keep a stable track key in template
    this.lines.update((lines) => lines.map((l) => (l.component === line.component ? { ...l, newAmount: num } : l)));
  }

  trackByComponent(_index: number, item: ModLine) {
    return item.component;
  }
  isValid(line: ModLine): boolean {
    return line.newAmount !== null && !isNaN(line.newAmount) && line.newAmount >= 0;
  }

  readonly allValid = computed(() => this.lines().every((l) => l.newAmount === null || this.isValid(l)));
  readonly totalCurrent = computed(() => this.lines().reduce((s, l) => s + l.current, 0));
  readonly totalNew = computed(() =>
    this.lines().reduce((s, l) => s + (l.newAmount !== null && this.isValid(l) ? l.newAmount : l.current), 0)
  );
  readonly changePct = computed(() =>
    this.totalCurrent() ? Math.round(((this.totalNew() - this.totalCurrent()) / this.totalCurrent()) * 1000) / 10 : 0
  );
  readonly hasAnyEdit = computed(() => this.lines().some((l) => l.newAmount !== null));

  save() {
    if (this.allValid() && this.hasAnyEdit()) this.saved.set(true);
  }

  reset() {
    this.lines.update((lines) => lines.map((l) => ({ ...l, newAmount: null })));
    this.saved.set(false);
  }

  initials(name: string): string {
    return name
      .split(/[\s.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }
}
