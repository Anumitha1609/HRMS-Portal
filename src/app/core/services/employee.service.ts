import { Injectable } from '@angular/core';
import { EMPLOYEE_MASTER } from '../../data/employee-data';
import { Employee } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly employees: Employee[] = EMPLOYEE_MASTER.map((e) => ({
    empCode: e.empCode,
    name: e.empName,
    department: e.department,
    designation: e.designation,
    location: e.location,
    dateOfJoining: e.doj,
    currentCtc: Math.round(
      (e.earnings.basic + e.earnings.hra + e.earnings.conveyance + e.earnings.otherAllowance) * 12
    ),
    status: 'Active'
  }));

  list(): Employee[] {
    return this.employees;
  }

  findByCode(empCode: string): Employee | undefined {
    return this.employees.find((e) => e.empCode === empCode);
  }

  /** Free-text search across employee code, name, and department. */
  search(term: string): Employee[] {
    const q = term.trim().toLowerCase();
    if (!q) return this.employees;
    return this.employees.filter(
      (e) =>
        e.empCode.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    );
  }

  departments(): string[] {
    return Array.from(new Set(this.employees.map((e) => e.department))).sort();
  }

  designations(): string[] {
    return Array.from(new Set(this.employees.map((e) => e.designation))).sort();
  }
}
