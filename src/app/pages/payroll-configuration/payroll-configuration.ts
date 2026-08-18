import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

type SectionKey = 'companyInfo' | 'esiConfig' | 'pfConfig' | 'payrollProcessing' | 'statutory';

/**
 * Payroll Configuration (Masters)
 *
 * Reactive-forms driven settings page. No backend/API integration —
 * the form is pre-populated with mock/default values and "Save
 * Configuration" simply validates + logs the value locally, following
 * the same "local dummy data, no network call" approach used in
 * Attendance View.
 */
@Component({
  selector: 'app-payroll-configuration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payroll-configuration.html',
  styleUrl: './payroll-configuration.scss'
})
export class PayrollConfiguration {
  payrollForm: FormGroup;

  saved = false;
  error = '';

  // The form loads read-only. Clicking "Edit" unlocks it; "Save
  // Configuration" re-locks it once the save succeeds.
  isEditMode = false;

  // Every section is an independently collapsible panel. Company Info,
  // ESI Configuration and PF Configuration start expanded; Payroll &
  // Statutory Details starts collapsed.
  sectionsOpen: Record<SectionKey, boolean> = {
    companyInfo: true,
    esiConfig: true,
    pfConfig: true,
    payrollProcessing: true,
    statutory: false
  };

  // Legacy-style "Month/Year" picker options (matches the mock data's
  // fixed placeholder year of 1900 until a real value is set).
  monthYearOptions: string[] = [
    'Jan/1900', 'Feb/1900', 'Mar/1900', 'Apr/1900', 'May/1900', 'Jun/1900',
    'Jul/1900', 'Aug/1900', 'Sep/1900', 'Oct/1900', 'Nov/1900', 'Dec/1900'
  ];

  irregularCategoryOptions = ['None', 'Category A', 'Category B', 'Category C'];

  constructor(private fb: FormBuilder) {
    this.payrollForm = this.fb.group({
      // Company Information — top-level fields
      companyName: ['EASY DESIGN SYSTEMS PVT. LTD.,', Validators.required],
      division: ['Main'],

      // PF Office Address
      pfInfo: this.fb.group({
        addressLine1: ['THE REGIONAL P.F. COMMISSIONER', Validators.required],
        addressLine2: ['OFFICE OF THE REGIONAL P.F.COMMISSIONER', Validators.required],
        city: ['DR. BALASUNDARAM ROAD', Validators.required],
        district: ['COIMBATORE-641018', Validators.required],
        pfCode: ['TN/CB/73726', Validators.required]
      }),

      // ESI Office Address
      esiInfo: this.fb.group({
        addressLine1: ['THE MANAGER', Validators.required],
        addressLine2: ['E.S.I BRANCH OFFICE', Validators.required],
        city: ['V.K ROAD, PEELAMEDU', Validators.required],
        district: ['COIMBATORE-641004', Validators.required],
        esiCode: ['56-107428-108', Validators.required]
      }),

      // ESI Configuration
      esiConfig: this.fb.group({
        ceilingAmount: [21000, Validators.required],
        employerPercent: [3.25, Validators.required],
        employeePercent: [0.75, Validators.required],
        effectiveFrom: ['2026-04-01', Validators.required]
      }),

      // PF Configuration
      // Matches the legacy payroll screen: total Employee Contribution (%)
      // alongside the Employer Contribution split into its EPF and
      // FPF/EPS components (which together make up the employer side).
      pfConfig: this.fb.group({
        ceilingAmount: [15000, Validators.required],
        employeeContributionPercent: [12, Validators.required],
        employerEpfPercent: [8.33, Validators.required],
        employerFpfPercent: [3.67, Validators.required],
        effectiveFrom: ['2026-06-10', Validators.required]
      }),

      // Payroll Processing
      payrollProcessing: this.fb.group({
        lastProcessedMonth: ['Jan/1900'],
        currentMonth: ['Jan/1900'],
        workDays: [26],
        sundays: [4],
        nfhDays: [0]
      }),

      // Payroll & Statutory Details (single collapsed panel)
      payrollStatutory: this.fb.group({
        // Statutory months
        lwfRemittedMonth: ['Jan/1900'],
        bonusPaidMonth: ['Oct/1900'],
        profTaxRemittedMonth: ['Mar/1900'],
        summerAllowanceMonth: ['Mar/1900'],
        leaveSalaryPaidMonth: ['Mar/1900'],
        educationAllowanceMonth: ['Jan/1900'],
        irregularCategory: [''],

        // Payroll amounts / policy details
        paySlipMessage: [''],
        superAnnuationPercent: [15.0],
        bonusPercent: [20.0],
        exgratiaPercent: [5.0],
        groupInsurancePercent: [25.0],
        edliPercent: [0.0],
        goodWillPercent: [0.0],
        incomeLimitM: [0.0],
        incomeLimitF: [0.0],
        gratuityPercent: [4.0],
        gratuityPolicyNo: [''],
        edliPolicyNo: ['0'],
        supAnnPolNo: ['']
      })
    });

    // Read-only until "Edit" is clicked.
    this.payrollForm.disable();
  }

  toggleSection(section: SectionKey): void {
    this.sectionsOpen[section] = !this.sectionsOpen[section];
  }

  onEdit(): void {
    this.error = '';
    this.saved = false;
    this.isEditMode = true;
    this.payrollForm.enable();
  }

  onSave(): void {
    if (!this.isEditMode) {
      return;
    }

    this.error = '';
    this.saved = false;

    if (this.payrollForm.invalid) {
      this.payrollForm.markAllAsTouched();
      this.error = 'Please fill all mandatory fields before saving.';
      return;
    }

    // No backend integration — configuration is only logged locally.
    // getRawValue() is used (rather than .value) since a disabled
    // FormGroup's .value would otherwise omit its controls.
    console.log('Payroll configuration (mock save):', this.payrollForm.getRawValue());
    this.saved = true;

    // Lock the form again after a successful save.
    this.isEditMode = false;
    this.payrollForm.disable();
  }

  /** Accepts either a top-level control name or a dot path like 'pfInfo.city'. */
  isInvalid(path: string): boolean {
    const control = this.payrollForm.get(path);
    return !!control && control.invalid && control.touched;
  }
}