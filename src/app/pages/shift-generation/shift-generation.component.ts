import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeePickerComponent } from '../../shared/components/employee-picker/employee-picker.component';
import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../core/models/employee.model';

type ShiftCode = 'MS' | 'ES' | 'NS' | 'WO';
type AssignedShiftCode = ShiftCode | '';

const SHIFT_DETAILS: Record<Exclude<ShiftCode, 'WO'>, { label: string; start: string; end: string; hours: string }> = {
  MS: { label: 'Morning Shift', start: '06:00 AM', end: '02:00 PM', hours: '8h 0m' },
  ES: { label: 'Evening Shift', start: '02:00 PM', end: '10:00 PM', hours: '8h 0m' },
  NS: { label: 'Night Shift', start: '10:00 PM', end: '06:00 AM', hours: '8h 0m' }
};

@Component({
  selector: 'app-shift-generation',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeePickerComponent],
  templateUrl: './shift-generation.component.html',
  styleUrl: './shift-generation.component.scss'
})
export class ShiftGenerationComponent {
  readonly dateFrom = signal('2026-06-22');
  readonly dateTo = signal('2026-06-28');
  readonly department = signal('All Departments');
  readonly shiftTemplate = signal('General Shift Plan');
  readonly generated = signal(false);
  readonly selectedEmployee = signal<Employee | null>(null);
  readonly bulkMode = signal(false);
  readonly selectedEmployees = signal<Employee[]>([]);
  readonly showFilters = signal(false);
  readonly savedMessage = signal('');
  readonly generationMode = signal<'manual' | 'automatic'>('manual');
  // assignedShifts: per-employee arrays (employees x days)
  readonly assignedShifts = signal<AssignedShiftCode[][]>([]);
  readonly query = signal('');

  readonly filteredEmployees = computed(() => this.employeeService.search(this.query()).slice(0, 50));

  isEmployeeSelected(empCode: string): boolean {
    return this.selectedEmployees().some((e) => e.empCode === empCode);
  }

  readonly departments: string[];
  readonly shiftDetails = SHIFT_DETAILS;
  readonly shiftOptions: { code: ShiftCode; label: string }[] = [
    { code: 'MS', label: 'Morning Shift' },
    { code: 'ES', label: 'Evening Shift' },
    { code: 'NS', label: 'Night Shift' },
    { code: 'WO', label: 'Weekly Off' }
  ];

  constructor(public employeeService: EmployeeService) {
    this.departments = ['All Departments', ...employeeService.departments()];
  }

  readonly employees = computed(() => {
    return this.bulkMode() ? this.selectedEmployees() : this.selectedEmployee() ? [this.selectedEmployee() as Employee] : [];
  });

  readonly days = computed(() => {
    const from = new Date(this.dateFrom());
    const to = new Date(this.dateTo());
    const result: Date[] = [];
    const cursor = new Date(from);
    while (cursor <= to && result.length < 7) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  });

  formatDay(d: Date): string {
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  onEmployeeSelected(employee: Employee | null) {
    this.selectedEmployee.set(employee);
    this.generated.set(false);
    this.assignedShifts.set([]);
    this.savedMessage.set('');
  }

  generate() {
    const emps = this.employees();
    if (!emps || emps.length === 0) return;
    const dayCount = this.days().length;
    if (this.generationMode() === 'manual') {
      const blank: AssignedShiftCode[] = Array.from({ length: dayCount }, () => '' as AssignedShiftCode);
      this.assignedShifts.set(emps.map(() => [...blank]));
      this.generated.set(true);
      this.savedMessage.set('');
      return;
    }

    // Automatic generation
    const auto = this.autoGenerate(emps, dayCount);
    this.assignedShifts.set(auto);
    this.generated.set(true);
    this.savedMessage.set('Automatically generated schedule. Review before saving.');
  }

  autoGenerate(emps: Employee[], dayCount: number): AssignedShiftCode[][] {
    // Simple fair rotational generator:
    // - Rotate MS/ES/NS across employees and days to balance load.
    // - Assign WO (weekly off) on every 7th day (index 6) to each employee.
    const base: ShiftCode[] = ['MS', 'ES', 'NS'];
    const result: AssignedShiftCode[][] = emps.map((e, i) => Array.from({ length: dayCount }, (_v, d) => '' as AssignedShiftCode));

    for (let ei = 0; ei < emps.length; ei++) {
      for (let d = 0; d < dayCount; d++) {
        // weekly off assignment
        if (d % 7 === 6) {
          result[ei][d] = 'WO';
          continue;
        }
        // base rotation. Start offset by employee index to spread shifts fairly
        const idx = (ei + d) % base.length;
        result[ei][d] = base[idx];
      }
    }

    // Validation pass: ensure no employee has same shift for more than 3 consecutive days
    for (let ei = 0; ei < emps.length; ei++) {
      let run = 1;
      for (let d = 1; d < dayCount; d++) {
        if (result[ei][d] === result[ei][d - 1] && result[ei][d] !== 'WO') {
          run++;
          if (run > 3) {
            // break the run by rotating this day for the employee
            const currentShift = result[ei][d];
            if (currentShift) {
              const nextIdx = (base.indexOf(currentShift as ShiftCode) + 1) % base.length;
              result[ei][d] = base[nextIdx];
              run = 1; // reset run
            }
          }
        } else {
          run = 1;
        }
      }
    }

    return result;
  }

  clearSchedule() {
    this.generated.set(false);
    this.assignedShifts.set([]);
    this.savedMessage.set('');
  }

  toggleFilters() {
    this.showFilters.update((visible) => !visible);
  }

  updateShift() {
    const emps = this.employees();
    if (!emps || emps.length === 0 || !this.generated()) return;
    const per = this.assignedShifts();
    for (let i = 0; i < per.length; i++) {
      if (per[i].some((s) => !s)) {
        this.savedMessage.set('Please assign a shift for every day for all selected employees before updating.');
        return;
      }
    }
    this.savedMessage.set(
      emps.length === 1 ? `Shift schedule updated for ${emps[0].name}.` : `Shift schedules updated for ${emps.length} employees.`
    );
  }

  shiftAt(empIndex: number, dayIndex: number): AssignedShiftCode {
    return this.assignedShifts()[empIndex]?.[dayIndex] ?? '';
  }

  assignShift(empIndex: number, dayIndex: number, shiftCode: AssignedShiftCode) {
    this.assignedShifts.update((shifts) => {
      const next = shifts.map((arr) => [...arr]);
      next[empIndex][dayIndex] = shiftCode;
      return next;
    });
    this.savedMessage.set('');
  }

  toggleBulkMode() {
    this.bulkMode.update((b) => !b);
    // clear previous selections when toggling
    this.selectedEmployees.set([]);
    this.selectedEmployee.set(null);
    this.generated.set(false);
    this.assignedShifts.set([]);
  }

  toggleSelectEmployee(emp: Employee) {
    const exists = this.selectedEmployees().find((e) => e.empCode === emp.empCode);
    if (exists) {
      this.selectedEmployees.update((es) => es.filter((e) => e.empCode !== emp.empCode));
    } else {
      this.selectedEmployees.update((es) => [...es, emp]);
    }
  }
}