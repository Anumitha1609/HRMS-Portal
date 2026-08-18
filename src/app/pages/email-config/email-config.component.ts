import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { HrmService, EmployeeEmailConfig } from '../../core/services/hrm';
import { ToastService } from '../../services/toast.service';

export type { EmployeeEmailConfig };

@Component({
  selector: 'app-email-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './email-config.component.html',
  styleUrl: './email-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailConfigComponent implements OnInit {
  public hrmService = inject(HrmService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  // Toggle for the "Add / Edit SMTP Configuration" modal
  showSmtpConfig = signal(false);

  smtpForm: FormGroup;
  showPassword = signal(false);
  passwordValue = signal('password123');

  // Toggles for security
  useSsl = signal(false);
  useTls = signal(true);

  // Table Filters & File Import Signals
  searchQuery = signal('');
  activeOnly = signal(false);
  selectedImportType = signal('');
  selectedMonth = signal('');
  selectedYear = signal('');
  years = Array.from({ length: 2040 - 1989 + 1 }, (_, i) => (2040 - i).toString());
  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');

  // SMTP test modal state
  showTestModal = signal(false);
  testEmailRecipient = new FormControl('notifications@hatrix-hr.com', [Validators.required, Validators.email]);
  testEmailStatusMessage = signal('');
  testEmailSuccess = signal<boolean | null>(null);

  // Employee email configurations (backed by HrmService signal)
  employeeEmailConfigs = computed(() => this.hrmService.employeeEmailConfigs());

  // Pagination (client-side, matches other master screens)
  currentPage = signal(1);
  pageSize = 8;

  constructor() {
    this.smtpForm = this.fb.group({
      smtp_host: ['smtp.office365.com', Validators.required],
      port: [587, Validators.required],
      email: ['notifications@hatrix-hr.com', [Validators.required, Validators.email]],
      username: ['hatrix_admin_svc', Validators.required],
      password: ['password123', Validators.required]
    });

    // Sync form password changes to passwordValue signal
    this.smtpForm.get('password')?.valueChanges.subscribe(val => {
      this.passwordValue.set(val || '');
    });
  }

  ngOnInit() {
    this.loadConfigs();
    this.loadSmtpConfig();
  }

  loadConfigs() {
    this.hrmService.fetchEmployeeEmailConfigs();
  }

  loadSmtpConfig() {
    this.hrmService.getSmtpConfig().subscribe(config => {
      this.smtpForm.patchValue(config);
      this.useSsl.set(config.use_ssl || false);
      this.useTls.set(config.use_tls ?? true);
    });
  }

  toggleShowPassword() {
    this.showPassword.update(val => !val);
  }

  onPasswordInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.passwordValue.set(val);
  }

  // Interactive Password Strength Evaluation
  passwordStrength = computed(() => {
    const password = this.passwordValue();
    if (!password) {
      return { score: 0, label: 'None', barColor: '#E8EEF7', textClass: '#94A3B8', bgClass: 'rgba(148, 163, 184, 0.08)' };
    }

    const reqs = this.passwordRequirements();
    const score = reqs.filter(r => r.met).length;

    let label = 'Very Weak';
    let barColor = '#EF4444';
    let textClass = '#EF4444';
    let bgClass = 'rgba(239, 68, 68, 0.08)';
    let percent = 25;

    if (score === 0) {
      label = 'Very Weak'; barColor = '#EF4444'; textClass = '#EF4444'; bgClass = 'rgba(239, 68, 68, 0.08)'; percent = 10;
    } else if (score === 1) {
      label = 'Weak'; barColor = '#F97316'; textClass = '#F97316'; bgClass = 'rgba(249, 115, 22, 0.08)'; percent = 35;
    } else if (score === 2) {
      label = 'Medium'; barColor = '#F59E0B'; textClass = '#D97706'; bgClass = 'rgba(245, 158, 11, 0.08)'; percent = 55;
    } else if (score === 3) {
      label = 'Strong'; barColor = '#10B981'; textClass = '#10B981'; bgClass = 'rgba(16, 185, 129, 0.08)'; percent = 80;
    } else if (score === 4) {
      label = 'Very Strong'; barColor = '#15803D'; textClass = '#15803D'; bgClass = 'rgba(21, 128, 61, 0.08)'; percent = 100;
    }

    return { score: percent, label, barColor, textClass, bgClass };
  });

  // Password Requirements Checklist
  passwordRequirements = computed(() => {
    const val = this.passwordValue();
    return [
      { id: 'length', label: 'Min 8 chars', met: val.length >= 8 },
      { id: 'case', label: 'Upper & Lowercase', met: /[A-Z]/.test(val) && /[a-z]/.test(val) },
      { id: 'number', label: 'Number (0-9)', met: /[0-9]/.test(val) },
      { id: 'special', label: 'Special symbol', met: /[^A-Za-z0-9]/.test(val) }
    ];
  });

  filteredEmployeeEmails = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const active = this.activeOnly();
    let list = this.employeeEmailConfigs();

    if (active) {
      list = list.filter(e => e.status === 'Active');
    }

    if (query) {
      list = list.filter(e =>
        e.emp_code.toLowerCase().includes(query) ||
        e.employee_name.toLowerCase().includes(query) ||
        e.email_address.toLowerCase().includes(query)
      );
    }

    return list;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredEmployeeEmails().length / this.pageSize)));

  pagedEmployeeEmails = computed(() => {
    const list = this.filteredEmployeeEmails();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  pageStart = computed(() => this.filteredEmployeeEmails().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1);
  pageEnd = computed(() => Math.min(this.currentPage() * this.pageSize, this.filteredEmployeeEmails().length));

  goPrevPage() {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  goNextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  onSaveSmtp() {
    if (this.smtpForm.invalid) return;
    const config = {
      ...this.smtpForm.value,
      use_ssl: this.useSsl(),
      use_tls: this.useTls()
    };
    this.hrmService.updateSmtpConfig(config).subscribe(() => {
      this.toastService.success('Global Outgoing Mail Server configuration updated successfully.');
      this.showSmtpConfig.set(false);
    });
  }

  onOpenTestModal() {
    this.testEmailStatusMessage.set('Ready to test SMTP connection...');
    this.testEmailSuccess.set(null);
    this.showTestModal.set(true);
  }

  onCloseTestModal() {
    this.showTestModal.set(false);
  }

  onTriggerTestEmail() {
    if (this.testEmailRecipient.invalid) return;

    this.testEmailStatusMessage.set('Routing test email to SMTP gateway relay...');
    this.testEmailSuccess.set(null);

    this.hrmService.testSmtpConnection(this.testEmailRecipient.value!).subscribe({
      next: (res) => {
        this.testEmailStatusMessage.set(res.message || 'Test email sent successfully!');
        this.testEmailSuccess.set(true);
        this.toastService.success(`Test email successfully sent to ${this.testEmailRecipient.value!}`);
      },
      error: () => {
        this.testEmailStatusMessage.set('Relay error: Host handshake timed out or credentials invalid.');
        this.testEmailSuccess.set(false);
        this.toastService.error('Test email relay failed.');
      }
    });
  }

  // File Upload Handlers
  triggerFileInput() {
    const fileInput = document.getElementById('excel-import-input-table') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);
      this.selectedFileName.set(file.name);
      this.toastService.show(`Selected file: ${file.name}`, 'info');
    }
  }

  clearSelectedFile() {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    const fileInput = document.getElementById('excel-import-input-table') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onResetFilters() {
    this.searchQuery.set('');
    this.activeOnly.set(false);
    this.selectedImportType.set('');
    this.selectedMonth.set('');
    this.selectedYear.set('');
    this.currentPage.set(1);
    this.clearSelectedFile();
    this.toastService.show('Filters and file selection reset.', 'info');
  }

  downloadTemplate() {
    const csvHeader = 'Emp Code,Employee Name,Email Address,SMTP Status,Date Configured,Last Used\n';
    const csvRows = [
      'EMP010,Alex Morgan,alex.morgan@easedesign.com,Active,Jul-2026,Just now',
      'EMP011,Sarah Connor,sarah.connor@easedesign.com,Active,Jul-2026,Just now'
    ].join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Employee_Email_Configuration_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success('Employee Email Configuration template downloaded.');
  }

  onImportFile() {
    const file = this.selectedFile();
    if (!file) {
      this.triggerFileInput();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json && json.length > 0) {
          const newConfigs: Omit<EmployeeEmailConfig, 'id'>[] = json.map((row, idx) => {
            const empCode = row['Emp Code'] || row['emp_code'] || `EMP0${10 + idx}`;
            const name = row['Employee Name'] || row['employee_name'] || row['Name'] || 'Imported User';
            const email = row['Email Address'] || row['email_address'] || row['Email'] || `${name.toLowerCase().replace(/\s+/g, '.')}@easedesign.com`;
            const statusRaw = row['SMTP Status'] || row['status'] || 'Active';
            const status = (statusRaw.toString().toLowerCase() === 'inactive') ? 'Inactive' : 'Active';
            const dateConf = row['Date Configured'] || row['date_configured'] || `${this.selectedMonth().substring(0, 3)}-${this.selectedYear()}`;
            const lastUsed = row['Last Used'] || row['last_used'] || 'Just now';

            return {
              emp_code: empCode,
              employee_name: name,
              email_address: email,
              status: status as 'Active' | 'Inactive',
              date_configured: dateConf,
              last_used: lastUsed
            };
          });

          this.hrmService.importEmployeeEmailConfigs(newConfigs).subscribe(() => {
            this.toastService.success(`Successfully imported ${newConfigs.length} employee email configurations!`);
            this.clearSelectedFile();
          });
        } else {
          this.toastService.error('The uploaded file contains no rows or data.');
        }
      } catch (err) {
        console.error('File parsing error:', err);
        this.toastService.error('Could not parse the selected file. Please ensure it is a valid Excel or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  onDeleteEmployee(id: number, code: string) {
    if (confirm(`Are you sure you want to delete email configuration for ${code}?`)) {
      this.hrmService.deleteEmployeeEmailConfig(id).subscribe(() => {
        this.toastService.success(`Email configuration for ${code} deleted.`);
      });
    }
  }

  onShowCreateConfig() {
    this.showSmtpConfig.set(true);
  }

  onExit() {
    this.showSmtpConfig.set(false);
  }
}
