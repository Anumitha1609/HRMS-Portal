import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface BloodGroup {
  id?: number;
  name: string;
  description: string;
  status: string;
  created_at?: string;
}

export interface Designation {
  id?: number;
  code: string;
  name: string;
  department: string;
  grade: string;
  gender_preference: string;
  status: string;
}

export interface PayComponent {
  id?: number;
  type: 'Earning' | 'Deduction';
  code: string;
  name: string;
  classification: string;
  calculation: string;
  is_statutory: boolean;
  taxable_status: string;
  status: string;
}

export interface EmployeeEmailConfig {
  id?: number;
  emp_code: string;
  employee_name: string;
  email_address: string;
  status: 'Active' | 'Inactive';
  date_configured: string;
  last_used: string;
}

export interface SmtpConfig {
  smtp_host: string;
  port: number;
  email: string;
  username: string;
  password: string;
  use_ssl: boolean;
  use_tls: boolean;
}

const BLOOD_GROUP_STORAGE_KEY = 'work_eaze_blood_groups';
const DESIGNATION_STORAGE_KEY = 'work_eaze_designations';
const EMAIL_CONFIG_STORAGE_KEY = 'work_eaze_email_configs';
const SMTP_CONFIG_STORAGE_KEY = 'work_eaze_smtp_config';

const DEFAULT_BLOOD_GROUPS: BloodGroup[] = [
  { id: 1, name: 'A+', description: 'A Positive', status: 'Active', created_at: '2024-01-10' },
  { id: 2, name: 'A-', description: 'A Negative', status: 'Active', created_at: '2024-01-10' },
  { id: 3, name: 'B+', description: 'B Positive', status: 'Active', created_at: '2024-01-10' },
  { id: 4, name: 'B-', description: 'B Negative', status: 'Active', created_at: '2024-01-10' },
  { id: 5, name: 'O+', description: 'O Positive', status: 'Active', created_at: '2024-01-10' },
  { id: 6, name: 'O-', description: 'O Negative', status: 'Active', created_at: '2024-01-10' },
  { id: 7, name: 'AB+', description: 'AB Positive', status: 'Active', created_at: '2024-01-10' },
  { id: 8, name: 'AB-', description: 'AB Negative', status: 'Active', created_at: '2024-01-10' }
];

const DEFAULT_DESIGNATIONS: Designation[] = [
  { id: 1, code: 'DES-001', name: 'Software Engineer', department: 'Engineering', grade: 'Grade B', gender_preference: 'Others', status: 'Active' },
  { id: 2, code: 'DES-002', name: 'Senior Software Engineer', department: 'Engineering', grade: 'Grade A', gender_preference: 'Others', status: 'Active' },
  { id: 3, code: 'DES-003', name: 'HR Executive', department: 'Human Resources', grade: 'Grade B', gender_preference: 'Others', status: 'Active' },
  { id: 4, code: 'DES-004', name: 'Finance Manager', department: 'Finance', grade: 'Grade A', gender_preference: 'Others', status: 'Active' }
];

const DEFAULT_EMAIL_CONFIGS: EmployeeEmailConfig[] = [
  { id: 1, emp_code: 'EMP001', employee_name: 'Ananya Raghavan', email_address: 'ananya.raghavan@easedesign.com', status: 'Active', date_configured: 'Jan-2026', last_used: '2 days ago' },
  { id: 2, emp_code: 'EMP002', employee_name: 'Karthik Subramaniam', email_address: 'karthik.subramaniam@easedesign.com', status: 'Active', date_configured: 'Feb-2026', last_used: '5 hours ago' },
  { id: 3, emp_code: 'EMP003', employee_name: 'Priya Desikan', email_address: 'priya.desikan@easedesign.com', status: 'Inactive', date_configured: 'Mar-2026', last_used: '3 weeks ago' },
  { id: 4, emp_code: 'EMP004', employee_name: 'Rahul Menon', email_address: 'rahul.menon@easedesign.com', status: 'Active', date_configured: 'Apr-2026', last_used: 'Yesterday' },
  { id: 5, emp_code: 'EMP005', employee_name: 'Sneha Balakrishnan', email_address: 'sneha.balakrishnan@easedesign.com', status: 'Active', date_configured: 'May-2026', last_used: 'Just now' }
];

const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  smtp_host: 'smtp.office365.com',
  port: 587,
  email: 'notifications@hatrix-hr.com',
  username: 'hatrix_admin_svc',
  password: 'password123',
  use_ssl: false,
  use_tls: true
};

const PAY_COMPONENT_STORAGE_KEY = 'work_eaze_pay_components';

const DEFAULT_PAY_COMPONENTS: PayComponent[] = [
  { id: 1, type: 'Earning', code: 'EARN-001', name: 'Basic Pay', classification: 'Fixed', calculation: 'Monthly Flat', is_statutory: false, taxable_status: 'Yes', status: 'Active' },
  { id: 2, type: 'Earning', code: 'EARN-002', name: 'House Rent Allowance', classification: 'Fixed', calculation: '40% of Basic', is_statutory: false, taxable_status: 'Yes', status: 'Active' },
  { id: 3, type: 'Earning', code: 'EARN-003', name: 'Conveyance Allowance', classification: 'Variable', calculation: 'Monthly Flat', is_statutory: false, taxable_status: 'No', status: 'Active' },
  { id: 4, type: 'Deduction', code: 'DED-001', name: 'Provident Fund', classification: 'Statutory', calculation: '12% of Basic', is_statutory: true, taxable_status: 'No', status: 'Active' },
  { id: 5, type: 'Deduction', code: 'DED-002', name: 'Professional Tax', classification: 'Statutory', calculation: 'Monthly Flat', is_statutory: true, taxable_status: 'No', status: 'Active' },
  { id: 6, type: 'Deduction', code: 'DED-003', name: 'Income Tax (TDS)', classification: 'Statutory', calculation: 'Slab Based', is_statutory: true, taxable_status: 'No', status: 'Active' }
];

@Injectable({
  providedIn: 'root'
})
export class HrmService {
  bloodGroups = signal<BloodGroup[]>([]);
  designations = signal<Designation[]>([]);
  payComponents = signal<PayComponent[]>([]);
  employeeEmailConfigs = signal<EmployeeEmailConfig[]>([]);
  smtpConfig = signal<SmtpConfig>(DEFAULT_SMTP_CONFIG);

  constructor() {
    this.bloodGroups.set(this.loadFromStorage<BloodGroup>(BLOOD_GROUP_STORAGE_KEY, DEFAULT_BLOOD_GROUPS));
    this.designations.set(this.loadFromStorage<Designation>(DESIGNATION_STORAGE_KEY, DEFAULT_DESIGNATIONS));
    this.payComponents.set(this.loadFromStorage<PayComponent>(PAY_COMPONENT_STORAGE_KEY, DEFAULT_PAY_COMPONENTS));
    this.employeeEmailConfigs.set(this.loadFromStorage<EmployeeEmailConfig>(EMAIL_CONFIG_STORAGE_KEY, DEFAULT_EMAIL_CONFIGS));
    this.smtpConfig.set(this.loadSingleFromStorage<SmtpConfig>(SMTP_CONFIG_STORAGE_KEY, DEFAULT_SMTP_CONFIG));
  }

  private loadSingleFromStorage<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore malformed storage and fall back to defaults
    }
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  private loadFromStorage<T>(key: string, fallback: T[]): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore malformed storage and fall back to defaults
    }
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  private persist(key: string, value: unknown[]) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private nextId(list: { id?: number }[]): number {
    return list.reduce((max, item) => Math.max(max, item.id ?? 0), 0) + 1;
  }

  // ---------- Blood Group ----------

  fetchBloodGroups(): void {
    this.bloodGroups.set(this.loadFromStorage<BloodGroup>(BLOOD_GROUP_STORAGE_KEY, DEFAULT_BLOOD_GROUPS));
  }

  addBloodGroup(data: Omit<BloodGroup, 'id'>): Observable<BloodGroup> {
    const list = this.bloodGroups();
    const newItem: BloodGroup = { ...data, id: this.nextId(list) };
    const updated = [...list, newItem];
    this.bloodGroups.set(updated);
    this.persist(BLOOD_GROUP_STORAGE_KEY, updated);
    return of(newItem).pipe(delay(150));
  }

  updateBloodGroup(id: number, data: Partial<BloodGroup>): Observable<BloodGroup> {
    const list = this.bloodGroups();
    const index = list.findIndex(b => b.id === id);
    if (index === -1) return throwError(() => new Error('Blood group not found'));

    const updatedItem = { ...list[index], ...data, id };
    const updated = [...list];
    updated[index] = updatedItem;
    this.bloodGroups.set(updated);
    this.persist(BLOOD_GROUP_STORAGE_KEY, updated);
    return of(updatedItem).pipe(delay(150));
  }

  deleteBloodGroup(id: number): Observable<boolean> {
    const updated = this.bloodGroups().filter(b => b.id !== id);
    this.bloodGroups.set(updated);
    this.persist(BLOOD_GROUP_STORAGE_KEY, updated);
    return of(true).pipe(delay(150));
  }

  // ---------- Designation ----------

  fetchDesignations(): void {
    this.designations.set(this.loadFromStorage<Designation>(DESIGNATION_STORAGE_KEY, DEFAULT_DESIGNATIONS));
  }

  addDesignation(data: Omit<Designation, 'id'>): Observable<Designation> {
    const list = this.designations();
    const newItem: Designation = { ...data, id: this.nextId(list) };
    const updated = [...list, newItem];
    this.designations.set(updated);
    this.persist(DESIGNATION_STORAGE_KEY, updated);
    return of(newItem).pipe(delay(150));
  }

  updateDesignation(id: number, data: Partial<Designation>): Observable<Designation> {
    const list = this.designations();
    const index = list.findIndex(d => d.id === id);
    if (index === -1) return throwError(() => new Error('Designation not found'));

    const updatedItem = { ...list[index], ...data, id };
    const updated = [...list];
    updated[index] = updatedItem;
    this.designations.set(updated);
    this.persist(DESIGNATION_STORAGE_KEY, updated);
    return of(updatedItem).pipe(delay(150));
  }

  deleteDesignation(id: number): Observable<boolean> {
    const updated = this.designations().filter(d => d.id !== id);
    this.designations.set(updated);
    this.persist(DESIGNATION_STORAGE_KEY, updated);
    return of(true).pipe(delay(150));
  }

  // ---------- Pay Component (Earnings & Deductions) ----------

  fetchPayComponents(): void {
    this.payComponents.set(this.loadFromStorage<PayComponent>(PAY_COMPONENT_STORAGE_KEY, DEFAULT_PAY_COMPONENTS));
  }

  addPayComponent(data: Omit<PayComponent, 'id'>): Observable<PayComponent> {
    const list = this.payComponents();
    const newItem: PayComponent = { ...data, id: this.nextId(list) };
    const updated = [...list, newItem];
    this.payComponents.set(updated);
    this.persist(PAY_COMPONENT_STORAGE_KEY, updated);
    return of(newItem).pipe(delay(150));
  }

  updatePayComponent(id: number, data: Partial<PayComponent>): Observable<PayComponent> {
    const list = this.payComponents();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return throwError(() => new Error('Pay component not found'));

    const updatedItem = { ...list[index], ...data, id };
    const updated = [...list];
    updated[index] = updatedItem;
    this.payComponents.set(updated);
    this.persist(PAY_COMPONENT_STORAGE_KEY, updated);
    return of(updatedItem).pipe(delay(150));
  }

  deletePayComponent(id: number): Observable<boolean> {
    const updated = this.payComponents().filter(p => p.id !== id);
    this.payComponents.set(updated);
    this.persist(PAY_COMPONENT_STORAGE_KEY, updated);
    return of(true).pipe(delay(150));
  }

  // ---------- Employee Email Configuration ----------

  fetchEmployeeEmailConfigs(): void {
    this.employeeEmailConfigs.set(this.loadFromStorage<EmployeeEmailConfig>(EMAIL_CONFIG_STORAGE_KEY, DEFAULT_EMAIL_CONFIGS));
  }

  addEmployeeEmailConfig(data: Omit<EmployeeEmailConfig, 'id'>): Observable<EmployeeEmailConfig> {
    const list = this.employeeEmailConfigs();
    const newItem: EmployeeEmailConfig = { ...data, id: this.nextId(list) };
    const updated = [...list, newItem];
    this.employeeEmailConfigs.set(updated);
    this.persist(EMAIL_CONFIG_STORAGE_KEY, updated);
    return of(newItem).pipe(delay(150));
  }

  updateEmployeeEmailConfig(id: number, data: Partial<EmployeeEmailConfig>): Observable<EmployeeEmailConfig> {
    const list = this.employeeEmailConfigs();
    const index = list.findIndex(e => e.id === id);
    if (index === -1) return throwError(() => new Error('Email configuration not found'));

    const updatedItem = { ...list[index], ...data, id };
    const updated = [...list];
    updated[index] = updatedItem;
    this.employeeEmailConfigs.set(updated);
    this.persist(EMAIL_CONFIG_STORAGE_KEY, updated);
    return of(updatedItem).pipe(delay(150));
  }

  deleteEmployeeEmailConfig(id: number): Observable<boolean> {
    const updated = this.employeeEmailConfigs().filter(e => e.id !== id);
    this.employeeEmailConfigs.set(updated);
    this.persist(EMAIL_CONFIG_STORAGE_KEY, updated);
    return of(true).pipe(delay(150));
  }

  importEmployeeEmailConfigs(rows: Omit<EmployeeEmailConfig, 'id'>[]): Observable<EmployeeEmailConfig[]> {
    const list = this.employeeEmailConfigs();
    let runningId = this.nextId(list);
    const newItems: EmployeeEmailConfig[] = rows.map(row => ({ ...row, id: runningId++ }));
    const updated = [...list, ...newItems];
    this.employeeEmailConfigs.set(updated);
    this.persist(EMAIL_CONFIG_STORAGE_KEY, updated);
    return of(updated).pipe(delay(300));
  }

  // ---------- Global SMTP / Outgoing Mail Server ----------

  getSmtpConfig(): Observable<SmtpConfig> {
    return of(this.smtpConfig()).pipe(delay(100));
  }

  updateSmtpConfig(data: SmtpConfig): Observable<SmtpConfig> {
    this.smtpConfig.set(data);
    localStorage.setItem(SMTP_CONFIG_STORAGE_KEY, JSON.stringify(data));
    return of(data).pipe(delay(250));
  }

  testSmtpConnection(recipient: string): Observable<{ message: string }> {
    return of({ message: `Handshake succeeded. A test email was relayed to ${recipient}.` }).pipe(delay(700));
  }
}
