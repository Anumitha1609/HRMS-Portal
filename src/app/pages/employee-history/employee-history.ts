import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ----- Types -----

interface EmployeeDirectoryEntry {
  employeeCode: string;
  employeeName: string;
  location: string;
  subLocation: string;
  category: string;
  subCategory: string;
  division: string;
  functionalUnit: string;
  department: string;
  designation: string;
  status: string;
  salaryType: string;
  modeOfPay: string;
  bankAccNo: string;
  bank: string;
  dateOfJoining: string;
}

interface EmployeeSnapshot {
  location: string;
  subLocation: string;
  category: string;
  subCategory: string;
  division: string;
  functionalUnit: string;
  department: string;
  designation: string;
  status: string;
  salaryType: string;
  modeOfPay: string;
  bankAccNo: string;
  bank: string;
}

interface EmployeeHistoryRow extends EmployeeSnapshot {
  employeeCode: string;
  employeeName: string;
  effectiveFrom: string;
  remarks: string;
}

interface SnapshotField {
  key: keyof EmployeeSnapshot;
  label: string;
  type: 'input' | 'select';
  options?: string[];
}

const EMPTY_SNAPSHOT: EmployeeSnapshot = {
  location: '',
  subLocation: '',
  category: '',
  subCategory: '',
  division: '',
  functionalUnit: '',
  department: '',
  designation: '',
  status: '',
  salaryType: '',
  modeOfPay: '',
  bankAccNo: '',
  bank: '',
};

// ----- Placeholder directory / seed data (frontend only) -----
// Wire this up to the real employee + history endpoints without changing
// the calling contract used by search()/save() below.

const EMPLOYEE_DIRECTORY: EmployeeDirectoryEntry[] = [
  { employeeCode: 'EMP001', employeeName: 'Arun Kumar', location: 'Head Office', subLocation: 'Acer Projects', category: 'Employee', subCategory: 'Staff', division: 'APM', functionalUnit: 'Acer Projects', department: 'IT', designation: 'Software Engineer', status: 'Permanent', salaryType: 'Monthly', modeOfPay: 'BANK', bankAccNo: '0091002349', bank: 'Axis Bank', dateOfJoining: '2021-03-10' },
  { employeeCode: 'EMP002', employeeName: 'Priya Sharma', location: 'Head Office', subLocation: 'Corporate', category: 'Employee', subCategory: 'Staff', division: 'HR', functionalUnit: 'People Ops', department: 'HR', designation: 'HR Executive', status: 'Permanent', salaryType: 'Monthly', modeOfPay: 'BANK', bankAccNo: '0091002350', bank: 'HDFC Bank', dateOfJoining: '2020-07-01' },
  { employeeCode: 'EMP003', employeeName: 'Rajan Nair', location: 'Branch Office', subLocation: 'Finance Wing', category: 'Employee', subCategory: 'Staff', division: 'Finance', functionalUnit: 'Accounts', department: 'Finance', designation: 'Accountant', status: 'Permanent', salaryType: 'Monthly', modeOfPay: 'BANK', bankAccNo: '0091002351', bank: 'ICICI Bank', dateOfJoining: '2019-11-15' },
  { employeeCode: 'EMP004', employeeName: 'Meena Devi', location: 'Branch Office', subLocation: 'Operations Wing', category: 'Employee', subCategory: 'Staff', division: 'Operations', functionalUnit: 'Field Ops', department: 'Operations', designation: 'Team Lead', status: 'Permanent', salaryType: 'Monthly', modeOfPay: 'BANK', bankAccNo: '0091002352', bank: 'Axis Bank', dateOfJoining: '2018-05-20' },
  { employeeCode: 'EMP005', employeeName: 'Suresh Babu', location: 'Head Office', subLocation: 'Acer Projects', category: 'Employee', subCategory: 'Staff', division: 'APM', functionalUnit: 'Acer Projects', department: 'IT', designation: 'Senior Developer', status: 'Permanent', salaryType: 'Monthly', modeOfPay: 'BANK', bankAccNo: '0091002353', bank: 'HDFC Bank', dateOfJoining: '2017-09-05' },
];

const HISTORY_SEED: Record<string, EmployeeHistoryRow[]> = {
  EMP001: [
    { employeeCode: 'EMP001', employeeName: 'Arun Kumar', effectiveFrom: '2026-06-01', location: 'Head Office', subLocation: 'Acer Projects', category: 'Employee', subCategory: 'Director', division: 'APM', functionalUnit: 'Acer Projects', department: 'IT', designation: 'Lead Engineer', status: 'Permanent', salaryType: 'Monthly', modeOfPay: 'BANK', bankAccNo: '0091002349', bank: 'Axis Bank', remarks: 'Promotion' },
    { employeeCode: 'EMP001', employeeName: 'Arun Kumar', effectiveFrom: '2023-01-01', location: 'Head Office', subLocation: 'Acer Projects', category: 'Employee', subCategory: 'Staff', division: 'APM', functionalUnit: 'Acer Projects', department: 'IT', designation: 'Senior Engineer', status: 'Permanent', salaryType: 'Monthly', modeOfPay: 'BANK', bankAccNo: '0091002349', bank: 'Axis Bank', remarks: 'Designation change' },
  ],
};

const SNAPSHOT_FIELDS: SnapshotField[] = [
  { key: 'location', label: 'Location', type: 'select', options: ['Head Office', 'Branch Office'] },
  { key: 'subLocation', label: 'SubLocation', type: 'select', options: ['Acer Projects', 'Corporate', 'Finance Wing', 'Operations Wing'] },
  { key: 'category', label: 'Category', type: 'select', options: ['Employee', 'Consultant', 'Others'] },
  { key: 'subCategory', label: 'SubCategory', type: 'select', options: ['Staff', 'Director', 'Manager'] },
  { key: 'division', label: 'Division', type: 'select', options: ['APM', 'HR', 'Finance', 'Operations'] },
  { key: 'functionalUnit', label: 'FunctionalUnit', type: 'select', options: ['Acer Projects', 'People Ops', 'Accounts', 'Field Ops'] },
  { key: 'department', label: 'Department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations'] },
  { key: 'designation', label: 'Designation', type: 'input' },
  { key: 'status', label: 'Status', type: 'select', options: ['Permanent', 'Probation', 'Contract'] },
  { key: 'salaryType', label: 'SalaryType', type: 'select', options: ['Monthly', 'Daily'] },
  { key: 'modeOfPay', label: 'Mode Of Pay', type: 'select', options: ['CASH', 'BANK'] },
  { key: 'bankAccNo', label: 'BankAccNo', type: 'input' },
  { key: 'bank', label: 'Bank', type: 'select', options: ['Axis Bank', 'HDFC Bank', 'ICICI Bank'] },
];

function cloneSnapshot(source: EmployeeSnapshot): EmployeeSnapshot {
  return { ...source };
}

function snapshotFromEmployee(employee: EmployeeDirectoryEntry): EmployeeSnapshot {
  return {
    location: employee.location,
    subLocation: employee.subLocation,
    category: employee.category,
    subCategory: employee.subCategory,
    division: employee.division,
    functionalUnit: employee.functionalUnit,
    department: employee.department,
    designation: employee.designation,
    status: employee.status,
    salaryType: employee.salaryType,
    modeOfPay: employee.modeOfPay,
    bankAccNo: employee.bankAccNo,
    bank: employee.bank,
  };
}

function snapshotFromRow(row: EmployeeHistoryRow): EmployeeSnapshot {
  const { employeeCode, employeeName, effectiveFrom, remarks, ...snapshot } = row;
  return snapshot;
}

@Component({
  selector: 'app-employee-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-history.html',
  styleUrls: ['./employee-history.scss'],
})
export class EmployeeHistory {
  constructor(private readonly cdr: ChangeDetectorRef) {}

  // ----- State -----
  readonly directory = EMPLOYEE_DIRECTORY;
  readonly fields = SNAPSHOT_FIELDS;
  historyStore: Record<string, EmployeeHistoryRow[]> = { ...HISTORY_SEED };

  employeeCode = '';
  employeeName = '';
  effectiveDate = this.today();
  newEmployeeMode = false;
  searched = false;
  editing = false;
  savedMessage = '';
  errorMessage = '';

  fromSnapshot: EmployeeSnapshot = cloneSnapshot(EMPTY_SNAPSHOT);
  toSnapshot: EmployeeSnapshot = cloneSnapshot(EMPTY_SNAPSHOT);
  remarks = '';

  rows: EmployeeHistoryRow[] = [];

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private findEmployee(code: string): EmployeeDirectoryEntry | undefined {
    return this.directory.find(e => e.employeeCode.toLowerCase() === code.trim().toLowerCase());
  }

  // ----- Employee code / name input handlers -----

  onEmployeeCodeChange(value: string): void {
    this.employeeCode = value;
    this.savedMessage = '';
    const employee = this.findEmployee(value);
    if (employee && !this.newEmployeeMode) {
      this.employeeName = employee.employeeName;
    }
  }

  onEmployeeNameChange(value: string): void {
    this.employeeName = value;
    this.savedMessage = '';
    if (!this.newEmployeeMode) {
      const employee = this.directory.find(e => e.employeeName.toLowerCase() === value.trim().toLowerCase());
      if (employee) this.employeeCode = employee.employeeCode;
    }
  }

  // ----- Toolbar actions -----

  search(): void {
    const code = this.employeeCode.trim();
    if (!code) {
      this.errorMessage = 'Enter an Employee ID to search.';
      return;
    }
    this.errorMessage = '';
    const employee = this.findEmployee(code);
    if (employee) {
      this.employeeName = employee.employeeName;
    }
    const history = this.historyStore[code.toUpperCase()] ?? [];
    this.rows =
      history.length > 0
        ? history
        : employee
          ? [
              {
                ...snapshotFromEmployee(employee),
                employeeCode: employee.employeeCode,
                employeeName: employee.employeeName,
                effectiveFrom: employee.dateOfJoining,
                remarks: 'Initial Appointment',
              },
            ]
          : [];
    const latest = this.rows[0];
    const snapshot = latest ? snapshotFromRow(latest) : employee ? snapshotFromEmployee(employee) : cloneSnapshot(EMPTY_SNAPSHOT);
    this.fromSnapshot = snapshot;
    this.toSnapshot = cloneSnapshot(snapshot);
    this.remarks = '';
    this.newEmployeeMode = false;
    this.editing = false;
    this.searched = true;
    this.savedMessage = '';
    this.cdr.detectChanges();
  }

  newChange(): void {
    this.employeeCode = '';
    this.employeeName = '';
    this.newEmployeeMode = true;
    this.fromSnapshot = cloneSnapshot(EMPTY_SNAPSHOT);
    this.toSnapshot = cloneSnapshot(EMPTY_SNAPSHOT);
    this.remarks = '';
    this.effectiveDate = this.today();
    this.editing = true;
    this.searched = false;
    this.rows = [];
    this.errorMessage = '';
    this.savedMessage = '';
  }

  editChange(): void {
    const code = this.employeeCode.trim();
    if (!code) {
      this.errorMessage = 'Search for an employee before editing.';
      return;
    }
    this.errorMessage = '';
    const latest = this.rows[0];
    const employee = this.findEmployee(code);
    this.toSnapshot = latest ? snapshotFromRow(latest) : employee ? snapshotFromEmployee(employee) : cloneSnapshot(this.toSnapshot);
    this.editing = true;
    this.searched = true;
    this.savedMessage = '';
  }

  deleteLatest(): void {
    const code = this.employeeCode.trim().toUpperCase();
    if (!code || !this.rows.length) return;
    const next = { ...this.historyStore };
    next[code] = (next[code] ?? []).slice(1);
    this.historyStore = next;
    this.rows = next[code];
    this.savedMessage = 'Latest employee history entry deleted.';
  }

  save(): void {
    if (!this.editing) return;
    const code = this.employeeCode.trim();
    const name = this.employeeName.trim();
    if (!code || !name) {
      this.errorMessage = 'Employee ID and Employee Name are mandatory.';
      return;
    }
    this.errorMessage = '';

    const entrySource = this.newEmployeeMode ? this.fromSnapshot : this.toSnapshot;
    const entry: EmployeeHistoryRow = {
      ...entrySource,
      employeeCode: code,
      employeeName: name,
      effectiveFrom: this.effectiveDate,
      remarks: this.remarks.trim() || (this.newEmployeeMode ? 'New employee details added' : 'Employee details changed'),
    };

    const key = code.toUpperCase();
    const next = { ...this.historyStore };
    next[key] = [entry, ...(next[key] ?? [])];
    this.historyStore = next;
    this.rows = next[key];
    this.fromSnapshot = snapshotFromRow(entry);
    this.newEmployeeMode = false;
    this.editing = false;
    this.searched = true;
    this.savedMessage = `Employee history saved for ${name}.`;
  }

  print(): void {
    window.print();
  }

  updateSnapshot(panel: 'from' | 'to', key: keyof EmployeeSnapshot, value: string): void {
    if (panel === 'from') {
      this.fromSnapshot = { ...this.fromSnapshot, [key]: value };
    } else {
      this.toSnapshot = { ...this.toSnapshot, [key]: value };
    }
  }

  optionsFor(field: SnapshotField): string[] {
    return field.options ?? [];
  }

  get showEditor(): boolean {
    return this.searched || this.newEmployeeMode || this.editing;
  }
}
