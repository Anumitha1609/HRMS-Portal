import { Component, OnInit, inject, signal, computed, effect, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService, EmployeeSearchResult } from '../../services/employee.service';
import { MasterService, MasterRecord, SubCategoryRecord } from '../../services/master.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { EmployeeProgressService } from '../../services/employee-progress.service';
import { EmployeeStepperComponent } from '../../components/employee-stepper/employee-stepper.component';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmployeeStepperComponent],
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss']
})
export class EmployeeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private masterService = inject(MasterService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);
  progressService = inject(EmployeeProgressService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  uploadedDocuments = signal<any[]>([]);
  uploadProgress = signal<{ [key: string]: number }>({});

  // Preview Modal state
  previewUrl: any = null;
  previewMimeType: string | null = null;
  previewFileName: string | null = null;
  previewModalOpen = false;
  zoomLevel = 1.0;

  // Search States
  searchCode = signal<string>('');
  searchName = signal<string>('');
  searchMobile = signal<string>('');
  searchEmail = signal<string>('');
  searchDepartmentId = signal<string>('');
  searchCategoryId = signal<string>('');
  searchResults = signal<EmployeeSearchResult[]>([]);
  paginationInfo = signal<any>(null);
  isSearching = signal<boolean>(false);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Form Mode & States
  selectedEmployee = signal<any | null>(null);
  isEditing = signal<boolean>(false);
  activeTab = signal<string>('general'); // general, org, bank, family, nominee, salaryScale, documents

  // Master Data Cache Signals
  locations = signal<MasterRecord[]>([]);
  subLocations = signal<MasterRecord[]>([]);
  departments = signal<MasterRecord[]>([]);
  functionalUnits = signal<MasterRecord[]>([]);
  divisions = signal<MasterRecord[]>([]);
  categories = signal<MasterRecord[]>([]);
  subCategoriesCache = signal<SubCategoryRecord[]>([]);
  activeEmployees = signal<any[]>([]); // for manager lookups
  ctcMasters = signal<any[]>([]);
  selectedCtcAnnualAmount = signal<number>(0);
  historyDetailModalOpen = signal<boolean>(false);
  selectedHistoryRecord = signal<any | null>(null);

  // Dynamic Subcategories filtered by chosen Category in form
  filteredSubCategories = signal<SubCategoryRecord[]>([]);

  // Main Form Group
  employeeForm!: FormGroup;

  // Inline Department Drawer States
  inlineDepartmentOpen = signal<boolean>(false);
  inlineDepartmentForm!: FormGroup;

  // Family & Nominee Drawer States
  familyDrawerOpen = signal<boolean>(false);
  familyDrawerMode = signal<'add' | 'edit'>('add');
  selectedFamilyIndex = signal<number | null>(null);
  familyForm!: FormGroup;

  nomineeDrawerOpen = signal<boolean>(false);
  nomineeDrawerMode = signal<'add' | 'edit'>('add');
  selectedNomineeIndex = signal<number | null>(null);
  nomineeForm!: FormGroup;

  // Live total nominee share percentage indicator
  totalNomineeShare = signal<number>(0);

  // Scale Totals Indicator
  scaleTotalSalary = signal<number>(0);

  // Salary Breakup Indicators (Monthly, Annual, CTC)
  monthlySalary = signal<number>(0);
  annualSalary = signal<number>(0);
  ctcSalary = signal<number>(0);

  constructor() {
    this.initForms();
    
    // Auto-update age if DOB changes in main form
    effect(() => {
      // Angular effect logic can register listeners if needed
    });
  }

  ngOnInit() {
    this.loadMasters();
    this.loadActiveEmployeesList();
    
    // Subscribe to query parameters for global search
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      if (q) {
        // If the query is a code (starts with EMP or is digits), search by code, else by name
        if (q.toUpperCase().startsWith('EMP') || /^\d+$/.test(q)) {
          this.searchCode.set(q);
          this.searchName.set('');
        } else {
          this.searchName.set(q);
          this.searchCode.set('');
        }
      } else {
        this.searchCode.set('');
        this.searchName.set('');
      }
      this.onSearch();
    });
  }

  private initForms() {
    this.employeeForm = this.fb.group({
      // Header Section Details
      employeeCode: [''], // Auto generated or manual
      employeeName: ['', Validators.required],
      photoUrl: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'],
      gender: ['MALE', Validators.required],
      dob: ['', Validators.required],
      age: [{ value: '', disabled: true }],
      maritalStatus: ['SINGLE', Validators.required],
      bloodGroup: [''],
      mobileCountryCode: ['+91', Validators.required],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{5} [0-9]{5}$')]],
      officialEmail: ['', [Validators.required, Validators.email]],
      personalEmail: ['', [Validators.required, Validators.email]],
      
      // Addresses
      currentAddress1: ['', Validators.required],
      currentAddress2: [''],
      currentCity: ['', Validators.required],
      currentState: ['', Validators.required],
      currentCountry: ['', Validators.required],
      currentPinCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],

      permanentAddress1: ['', Validators.required],
      permanentAddress2: [''],
      permanentCity: ['', Validators.required],
      permanentState: ['', Validators.required],
      permanentCountry: ['', Validators.required],
      permanentPinCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      sameAsPermanent: [false],

      // Employment
      joiningDate: ['', Validators.required],
      probationEndDate: [''],
      confirmationDate: [''],
      status: ['ACTIVE', Validators.required],
      dateOfRelieving: [''],

      // Statutory
      pan: ['', [Validators.required, Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      aadhaar: ['', [Validators.required, Validators.pattern('^[0-9]{4} [0-9]{4} [0-9]{4}$')]],
      pfNumber: [''],
      uanNumber: ['', Validators.pattern('^[0-9]{12}$')],
      accessCardNumber: ['', Validators.required],

      // Org Assignment
      functionalUnitId: ['', Validators.required],
      divisionId: ['', Validators.required],
      departmentId: ['', Validators.required],
      locationId: ['', Validators.required],
      subLocationId: ['', Validators.required],
      categoryId: ['', Validators.required],
      subCategoryId: ['', Validators.required],
      designation: ['', Validators.required],
      ctcId: [''],
      effectiveFrom: [''],
      revisionReason: [''],
      ctcRemarks: [''],
      assignmentMode: ['PACKAGE'],
      saveAsPackage: [false],
      newPackageName: [''],
      newPackageCode: [''],
      newPackageDescription: [''],

      // Reporting Manager
      reportingManagerId: ['', Validators.required],
      functionalManagerId: [''],
      skipLevelManagerId: [''],

      // Bank Details
      bankAccountHolder: [''],
      bankAccountNumber: ['', Validators.required],
      bankName: ['', Validators.required],
      bankBranch: ['', Validators.required],
      bankIfsc: ['', [Validators.required, Validators.pattern('^[A-Z]{4}0[A-Z0-9]{6}$')]],

      // Shift & Attendance
      shiftGroup: ['General Group', Validators.required],
      shiftName: ['General Shift', Validators.required],
      shiftFrom: ['09:00', Validators.required],
      shiftTo: ['18:00', Validators.required],
      shiftLateIn: [15],
      shiftEarlyOut: [15],

      // Education
      highestQualification: [''],
      fieldOfStudy: [''],
      university: [''],
      yearOfPassing: [''],

      // Skills & Previous Job
      experienceType: ['Fresher'],
      skills: [''],
      prevEmployer: [''],
      prevDesignation: [''],

      // Sub-grids stored as raw arrays in form value
      family: this.fb.array([]),
      nominees: this.fb.array([]),
      salaryHistory: this.fb.array([]),
      scaleHistory: this.fb.array([]),
      overrideFlag: [false],
      customComponents: this.fb.array([])
    });

    // Sub-forms for Drawer details
    this.familyForm = this.fb.group({
      relationship: ['FATHER', Validators.required],
      memberName: ['', Validators.required],
      dob: [''],
      occupation: [''],
      contactNumber: ['', Validators.pattern('^[0-9]{10}$')],
      isEmployeeOfOrg: [false]
    });

    this.nomineeForm = this.fb.group({
      nomineeName: ['', Validators.required],
      relationship: ['FATHER', Validators.required],
      gender: ['MALE', Validators.required],
      dob: [''],
      age: [{ value: '', disabled: true }],
      contactNumber: ['', Validators.pattern('^[0-9]{10}$')],
      address: [''],
      sharePercentage: [0, [Validators.required, Validators.min(1), Validators.max(100)]]
    });

    this.inlineDepartmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });

    // Form value change listeners
    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions() {
    // 1. Same as permanent address toggle
    this.employeeForm.get('sameAsPermanent')?.valueChanges.subscribe(checked => {
      if (checked) {
        const permAddr = {
          currentAddress1: this.employeeForm.get('permanentAddress1')?.value,
          currentAddress2: this.employeeForm.get('permanentAddress2')?.value,
          currentCity: this.employeeForm.get('permanentCity')?.value,
          currentState: this.employeeForm.get('permanentState')?.value,
          currentCountry: this.employeeForm.get('permanentCountry')?.value,
          currentPinCode: this.employeeForm.get('permanentPinCode')?.value,
        };
        this.employeeForm.patchValue(permAddr);
      }
    });

    // Sync permanent address fields to current address when toggle is active
    ['permanentAddress1', 'permanentAddress2', 'permanentCity', 'permanentState', 'permanentCountry', 'permanentPinCode'].forEach(field => {
      this.employeeForm.get(field)?.valueChanges.subscribe(val => {
        if (this.employeeForm.get('sameAsPermanent')?.value) {
          const target = field.replace('permanent', 'current');
          this.employeeForm.get(target)?.setValue(val, { emitEvent: false });
        }
      });
    });

    // 2. Auto-fill Account Holder Name from Employee Name
    this.employeeForm.get('employeeName')?.valueChanges.subscribe(name => {
      const holderCtrl = this.employeeForm.get('bankAccountHolder');
      if (holderCtrl && !holderCtrl.value) {
        holderCtrl.setValue(name, { emitEvent: false });
      }
    });

    // 3. Dynamic Category -> Subcategory options mapping
    this.employeeForm.get('categoryId')?.valueChanges.subscribe(catId => {
      const allSubs = this.subCategoriesCache();
      const filtered = allSubs.filter(s => s.categoryId === catId);
      this.filteredSubCategories.set(filtered);
      
      // Auto clear subcategory selection if it doesn't match new category options
      const currentSub = this.employeeForm.get('subCategoryId')?.value;
      if (currentSub && !filtered.find(f => f.id === currentSub)) {
        this.employeeForm.get('subCategoryId')?.setValue('');
      }
    });

    // 4. Calculate Age dynamically on DOB changes
    this.employeeForm.get('dob')?.valueChanges.subscribe(dobStr => {
      if (dobStr) {
        const dob = new Date(dobStr);
        const age = this.calculateAge(dob);
        this.employeeForm.get('age')?.setValue(age, { emitEvent: false });
      }
    });

    // 5. Calculate Nominee Age dynamically on Nominee DOB changes
    this.nomineeForm.get('dob')?.valueChanges.subscribe(dobStr => {
      if (dobStr) {
        const dob = new Date(dobStr);
        const age = this.calculateAge(dob);
        this.nomineeForm.get('age')?.setValue(age, { emitEvent: false });
      }
    });

    // 6. Auto-format Aadhaar with spaces (XXXX XXXX XXXX)
    this.employeeForm.get('aadhaar')?.valueChanges.subscribe(val => {
      if (val) {
        const digits = val.replace(/\D/g, '').substring(0, 12);
        let formatted = '';
        for (let i = 0; i < digits.length; i++) {
          if (i > 0 && i % 4 === 0) {
            formatted += ' ';
          }
          formatted += digits[i];
        }
        if (formatted !== val) {
          this.employeeForm.get('aadhaar')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    // 7. Auto-format Mobile Number based on country code
    this.employeeForm.get('mobileCountryCode')?.valueChanges.subscribe(code => {
      const mobileCtrl = this.employeeForm.get('mobileNumber');
      if (mobileCtrl) {
        const country = this.countryCodes.find(c => c.code === code);
        if (country) {
          mobileCtrl.setValidators([Validators.required, Validators.pattern(country.pattern)]);
          mobileCtrl.updateValueAndValidity();
          mobileCtrl.setValue(mobileCtrl.value);
        }
      }
    });

    this.employeeForm.get('mobileNumber')?.valueChanges.subscribe(val => {
      if (val) {
        const code = this.employeeForm.get('mobileCountryCode')?.value || '+91';
        const country = this.countryCodes.find(c => c.code === code);
        if (country) {
          const formatted = country.format(val);
          if (formatted !== val) {
            this.employeeForm.get('mobileNumber')?.setValue(formatted, { emitEvent: false });
          }
        }
      }
    });

    // 8. Auto-uppercase fields (PAN, IFSC, Employee Code, Access Card Number)
    const uppercaseFields = ['pan', 'bankIfsc', 'employeeCode', 'accessCardNumber'];
    uppercaseFields.forEach(field => {
      this.employeeForm.get(field)?.valueChanges.subscribe(val => {
        if (val && val !== val.toUpperCase()) {
          this.employeeForm.get(field)?.setValue(val.toUpperCase(), { emitEvent: false });
        }
      });
    });

    // 9. Conditional Validation for effectiveFrom based on ctcId and selected amount sync
    // Subscribe to assignmentMode changes
    this.employeeForm.get('assignmentMode')?.valueChanges.subscribe(mode => {
      this.customComponentsArray.clear();
      this.employeeForm.get('saveAsPackage')?.setValue(false, { emitEvent: false });
      this.employeeForm.get('newPackageName')?.setValue('', { emitEvent: false });
      this.employeeForm.get('newPackageCode')?.setValue('', { emitEvent: false });
      this.employeeForm.get('newPackageDescription')?.setValue('', { emitEvent: false });

      if (mode === 'PACKAGE') {
        this.employeeForm.get('ctcId')?.setValidators([Validators.required]);
        this.employeeForm.get('overrideFlag')?.setValue(false, { emitEvent: false });
        // Update CTC annual amount signal
        const ctcId = this.employeeForm.get('ctcId')?.value;
        const match = this.ctcMasters().find(c => c.id === ctcId);
        this.selectedCtcAnnualAmount.set(match ? match.annualCTC : 0);
        this.updateCustomSalaryControlsState();
      } else if (mode === 'CUSTOM_FROM_PACKAGE') {
        this.employeeForm.get('ctcId')?.setValidators([Validators.required]);
        this.employeeForm.get('overrideFlag')?.setValue(true, { emitEvent: false });
        
        // Force populate from reference package
        const ctcId = this.employeeForm.get('ctcId')?.value;
        if (ctcId) {
          const match = this.ctcMasters().find(c => c.id === ctcId);
          if (match) {
            let comps: any[] = [];
            if (match.components && match.components.length > 0) {
              comps = match.components;
            } else if (match.salaryComponents) {
              try {
                comps = typeof match.salaryComponents === 'string' ? JSON.parse(match.salaryComponents) : match.salaryComponents;
              } catch (e) {}
            }
            if (Array.isArray(comps)) {
              comps.forEach((c: any) => {
                this.customComponentsArray.push(this.fb.group({
                  salaryHead: [c.salaryHead, Validators.required],
                  calculationType: [c.calculationType, Validators.required],
                  value: [c.value || 0, [Validators.required, Validators.min(0)]],
                  formula: [c.formula || ''],
                  monthlyAmount: [c.monthlyAmount || 0],
                  annualAmount: [c.annualAmount || 0]
                }));
              });
            }
          }
        }
        // Update CTC annual amount signal
        const match = this.ctcMasters().find(c => c.id === ctcId);
        this.selectedCtcAnnualAmount.set(match ? match.annualCTC : 0);
        this.updateCustomSalaryControlsState();
        this.recalculateCustomComponents();
      } else if (mode === 'CUSTOM') {
        this.employeeForm.get('ctcId')?.clearValidators();
        this.employeeForm.get('ctcId')?.setValue('', { emitEvent: false });
        this.employeeForm.get('overrideFlag')?.setValue(true, { emitEvent: false });
        this.selectedCtcAnnualAmount.set(0);
        
        // Add a default Basic component for convenience
        this.customComponentsArray.push(this.fb.group({
          salaryHead: ['Basic', Validators.required],
          calculationType: ['Fixed Amount', Validators.required],
          value: [0, [Validators.required, Validators.min(0)]],
          formula: [''],
          monthlyAmount: [0],
          annualAmount: [0]
        }));
        this.updateCustomSalaryControlsState();
      }
      this.employeeForm.get('ctcId')?.updateValueAndValidity();
      this.employeeForm.get('effectiveFrom')?.updateValueAndValidity();
    });

    // Subscribe to saveAsPackage changes
    this.employeeForm.get('saveAsPackage')?.valueChanges.subscribe(save => {
      const nameCtrl = this.employeeForm.get('newPackageName');
      const codeCtrl = this.employeeForm.get('newPackageCode');
      if (save) {
        nameCtrl?.setValidators([Validators.required]);
        codeCtrl?.setValidators([Validators.required]);
      } else {
        nameCtrl?.clearValidators();
        codeCtrl?.clearValidators();
      }
      nameCtrl?.updateValueAndValidity();
      codeCtrl?.updateValueAndValidity();
    });

    // Subscribe to ctcId changes
    this.employeeForm.get('ctcId')?.valueChanges.subscribe(ctcId => {
      const mode = this.employeeForm.get('assignmentMode')?.value || 'PACKAGE';
      const effCtrl = this.employeeForm.get('effectiveFrom');
      
      if (ctcId && (mode === 'PACKAGE' || mode === 'CUSTOM_FROM_PACKAGE')) {
        effCtrl?.setValidators([Validators.required]);
        const match = this.ctcMasters().find(c => c.id === ctcId);
        this.selectedCtcAnnualAmount.set(match ? match.annualCTC : 0);
        
        const customCompsArr = this.customComponentsArray;
        customCompsArr.clear();
        let comps: any[] = [];
        if (match) {
          if (match.components && match.components.length > 0) {
            comps = match.components;
          } else if (match.salaryComponents) {
            try {
              comps = typeof match.salaryComponents === 'string' ? JSON.parse(match.salaryComponents) : match.salaryComponents;
            } catch (e) {}
          }
        }
        if (Array.isArray(comps)) {
          comps.forEach((c: any) => {
            customCompsArr.push(this.fb.group({
              salaryHead: [c.salaryHead, Validators.required],
              calculationType: [c.calculationType, Validators.required],
              value: [c.value || 0, [Validators.required, Validators.min(0)]],
              formula: [c.formula || ''],
              monthlyAmount: [c.monthlyAmount || 0],
              annualAmount: [c.annualAmount || 0]
            }));
          });
        }
        this.updateCustomSalaryControlsState();
        if (mode === 'CUSTOM_FROM_PACKAGE') {
          this.recalculateCustomComponents();
        }
      } else if (!ctcId && mode !== 'CUSTOM') {
        effCtrl?.clearValidators();
        this.selectedCtcAnnualAmount.set(0);
        this.customComponentsArray.clear();
      }
      effCtrl?.updateValueAndValidity();
    });

    this.employeeForm.get('customComponents')?.valueChanges.subscribe(() => {
      this.recalculateCustomComponents();
    });
  }

  // --- Sub-grid Getters ---
  get familyArray() { return this.employeeForm.get('family') as FormArray; }
  get nomineesArray() { return this.employeeForm.get('nominees') as FormArray; }
  get salaryArray() { return this.employeeForm.get('salaryHistory') as FormArray; }
  get scaleArray() { return this.employeeForm.get('scaleHistory') as FormArray; }
  get customComponentsArray() { return this.employeeForm.get('customComponents') as FormArray; }

  get customComponentsTotalAnnual(): number {
    const customCompsArr = this.customComponentsArray;
    if (!customCompsArr) return 0;
    return customCompsArr.controls.reduce((sum, ctrl) => sum + (parseFloat(ctrl.get('annualAmount')?.value) || 0), 0);
  }

  get activeCtcAnnualAmount(): number {
    if (this.employeeForm.get('overrideFlag')?.value) {
      return this.customComponentsTotalAnnual;
    }
    return this.selectedCtcAnnualAmount();
  }

  get currentCtcComponents(): any[] {
    if (this.employeeForm.get('overrideFlag')?.value) {
      return this.customComponentsArray.value;
    }
    const ctcId = this.employeeForm.get('ctcId')?.value;
    if (!ctcId) return [];
    const match = this.ctcMasters().find(c => c.id === ctcId);
    if (!match) return [];
    if (match.components && match.components.length > 0) {
      return match.components;
    }
    if (match.salaryComponents) {
      try {
        return typeof match.salaryComponents === 'string' ? JSON.parse(match.salaryComponents) : match.salaryComponents;
      } catch (e) {
        // Fallback below
      }
    }
    const annualCTC = match.annualCTC || 0;
    const monthlyCTC = annualCTC / 12;
    return [
      { salaryHead: 'Basic', calculationType: 'Percentage of CTC', value: 50, formula: 'CTC * 50%', monthlyAmount: monthlyCTC * 0.5, annualAmount: annualCTC * 0.5 },
      { salaryHead: 'HRA', calculationType: 'Percentage of Basic', value: 40, formula: 'Basic * 40%', monthlyAmount: monthlyCTC * 0.2, annualAmount: annualCTC * 0.2 },
      { salaryHead: 'CA', calculationType: 'Fixed Amount', value: 1600, formula: 'Fixed: ₹1600', monthlyAmount: 1600, annualAmount: 19200 },
      { salaryHead: 'Others', calculationType: 'Remaining Balance', value: 0, formula: 'CTC - Sum(Others)', monthlyAmount: Math.max(0, monthlyCTC - (monthlyCTC * 0.7 + 1600)), annualAmount: Math.max(0, annualCTC - (annualCTC * 0.7 + 19200)) }
    ];
  }

  private loadMasters() {
    this.masterService.getMasters('location').subscribe(data => this.locations.set(data));
    this.masterService.getMasters('sublocation').subscribe(data => this.subLocations.set(data));
    this.masterService.getMasters('department').subscribe(data => this.departments.set(data));
    this.masterService.getMasters('functionalunit').subscribe(data => this.functionalUnits.set(data));
    this.masterService.getMasters('division').subscribe(data => this.divisions.set(data));
    this.masterService.getMasters('category').subscribe(data => {
      this.categories.set(data);
      // categories contain subcategories in payload since we wrote Category controller to include them
      const subs: SubCategoryRecord[] = [];
      data.forEach((c: any) => {
        if (c.subCategories) {
          subs.push(...c.subCategories);
        }
      });
      this.subCategoriesCache.set(subs);
    });
    this.masterService.getCtcs({ status: 'ACTIVE', limit: 100 }).subscribe(res => {
      this.ctcMasters.set(res.data);
    });
  }

  private loadActiveEmployeesList() {
    this.employeeService.search({ limit: 100 }).subscribe(res => {
      this.activeEmployees.set(res.data.filter(e => e.status === 'ACTIVE'));
    });
  }

  onSearch(resetPage: boolean = true) {
    if (resetPage) {
      this.currentPage.set(1);
    }
    this.isSearching.set(true);
    this.employeeService.search({
      code: this.searchCode(),
      name: this.searchName(),
      mobile: this.searchMobile(),
      email: this.searchEmail(),
      departmentId: this.searchDepartmentId(),
      categoryId: this.searchCategoryId(),
      page: this.currentPage(),
      limit: this.pageSize()
    }).subscribe({
      next: (res) => {
        this.searchResults.set(res.data);
        this.paginationInfo.set(res.pagination);
        this.isSearching.set(false);
      },
      error: () => {
        this.toastService.error('Error searching employees');
        this.isSearching.set(false);
      }
    });
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.onSearch(false);
    }
  }

  nextPage() {
    if (this.currentPage() < (this.paginationInfo()?.totalPages || 1)) {
      this.currentPage.update(p => p + 1);
      this.onSearch(false);
    }
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const size = parseInt(select.value) || 10;
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.onSearch(false);
  }

  getShowingText(): string {
    const pag = this.paginationInfo();
    if (!pag || pag.total === 0) return 'SHOWING 0-0 OF 0 EMPLOYEES';
    const start = (pag.page - 1) * pag.limit + 1;
    const end = Math.min(pag.page * pag.limit, pag.total);
    return `SHOWING ${start}-${end} OF ${pag.total} EMPLOYEES`;
  }

  getCtcNameById(id: string): string {
    const match = this.ctcMasters().find(c => c.id === id);
    return match ? match.ctcName : 'N/A';
  }

  getCtcAnnualAmountById(id: string): number {
    const match = this.ctcMasters().find(c => c.id === id);
    return match ? match.annualCTC : 0;
  }

  openAddDepartmentModal() {
    this.inlineDepartmentForm.reset();
    this.inlineDepartmentOpen.set(true);
  }

  saveInlineDepartment() {
    if (this.inlineDepartmentForm.invalid) {
      this.inlineDepartmentForm.markAllAsTouched();
      return;
    }

    const name = this.inlineDepartmentForm.get('name')?.value;
    if (name && name.trim()) {
      this.masterService.createMaster('department', name.trim()).subscribe({
        next: (newDept) => {
          this.toastService.success('Department created successfully!');
          // Add to local departments list
          this.departments.update(list => [...list, newDept]);
          // Set selection in form
          this.employeeForm.get('departmentId')?.setValue(newDept.id);
          this.inlineDepartmentOpen.set(false);
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to create department');
        }
      });
    }
  }

  selectEmployee(empId: string, editMode: boolean = false) {
    if (this.isEditing()) {
      if (!confirm('You have unsaved changes. Discard and proceed?')) {
        return;
      }
    }
    this.isLoadingMastersAndEmployee(empId, editMode);
  }

  private isLoadingMastersAndEmployee(empId: string, editMode: boolean = false) {
    this.employeeService.getById(empId).subscribe({
      next: (emp) => {
        this.selectedEmployee.set(emp);
        
        // Load documents
        this.loadEmployeeDocuments(empId);

        // Populate Forms
        this.employeeForm.reset();
        
        let countryCode = '+91';
        let numberOnly = emp.mobileNumber || '';
        const match = this.countryCodes.find(c => numberOnly.startsWith(c.code));
        if (match) {
          countryCode = match.code;
          numberOnly = numberOnly.substring(match.code.length).trim();
        }

        // Format dates to YYYY-MM-DD
        const formatted = {
          ...emp,
          mobileCountryCode: countryCode,
          mobileNumber: numberOnly,
          experienceType: emp.experienceType || 'Fresher',
          dob: emp.dob ? emp.dob.substring(0, 10) : '',
          joiningDate: emp.joiningDate ? emp.joiningDate.substring(0, 10) : '',
          probationEndDate: emp.probationEndDate ? emp.probationEndDate.substring(0, 10) : '',
          confirmationDate: emp.confirmationDate ? emp.confirmationDate.substring(0, 10) : '',
          dateOfRelieving: emp.dateOfRelieving ? emp.dateOfRelieving.substring(0, 10) : '',
          effectiveFrom: emp.effectiveFrom ? emp.effectiveFrom.substring(0, 10) : '',
          revisionReason: emp.revisionReason || '',
          ctcRemarks: emp.ctcRemarks || '',
          skills: Array.isArray(emp.skills) ? emp.skills.join(', ') : emp.skills
        };

        this.employeeForm.patchValue(formatted);
        
        // Fill Sub-arrays
        this.familyArray.clear();
        if (emp.familyDetails) {
          emp.familyDetails.forEach((f: any) => {
            this.familyArray.push(this.fb.group({
              relationship: [f.relationship, Validators.required],
              memberName: [f.memberName, Validators.required],
              dob: [f.dob ? f.dob.substring(0, 10) : ''],
              occupation: [f.occupation],
              contactNumber: [f.contactNumber, Validators.pattern('^[0-9]{10}$')],
              isEmployeeOfOrg: [!!f.isEmployeeOfOrg]
            }));
          });
        }

        this.nomineesArray.clear();
        if (emp.nomineeDetails) {
          emp.nomineeDetails.forEach((n: any) => {
            this.nomineesArray.push(this.fb.group({
              nomineeName: [n.nomineeName, Validators.required],
              relationship: [n.relationship, Validators.required],
              gender: [n.gender, Validators.required],
              dob: [n.dob ? n.dob.substring(0, 10) : ''],
              age: [n.age],
              contactNumber: [n.contactNumber, Validators.pattern('^[0-9]{10}$')],
              address: [n.address],
              sharePercentage: [n.sharePercentage, [Validators.required, Validators.min(1), Validators.max(100)]]
            }));
          });
        }

        this.salaryArray.clear();
        if (emp.salaryBreakups) {
          emp.salaryBreakups.forEach((s: any) => {
            this.salaryArray.push(this.fb.group({
              salaryHead: [s.salaryHead, Validators.required],
              wef: [s.wef ? s.wef.substring(0, 10) : '', Validators.required],
              amount: [s.amount, [Validators.required, Validators.min(0)]]
            }));
          });
        }

        this.scaleArray.clear();
        if (emp.scaleDetails) {
          emp.scaleDetails.forEach((s: any) => {
            this.scaleArray.push(this.fb.group({
              wef: [s.wef ? s.wef.substring(0, 10) : '', Validators.required],
              basic: [s.basic, [Validators.required, Validators.min(0)]],
              ca: [s.ca, [Validators.required, Validators.min(0)]],
              hra: [s.hra, [Validators.required, Validators.min(0)]],
              others: [s.others, [Validators.required, Validators.min(0)]],
              totalSalary: [{ value: s.totalSalary, disabled: true }]
            }));
          });
        }

        // Load custom components FormArray
        const customCompsArr = this.customComponentsArray;
        customCompsArr.clear();
        
        if (emp.overrideFlag && emp.customSalaryComponents) {
          try {
            const comps = typeof emp.customSalaryComponents === 'string' ? JSON.parse(emp.customSalaryComponents) : emp.customSalaryComponents;
            if (Array.isArray(comps)) {
              comps.forEach((c: any) => {
                customCompsArr.push(this.fb.group({
                  salaryHead: [c.salaryHead, Validators.required],
                  calculationType: [c.calculationType, Validators.required],
                  value: [c.value || 0, [Validators.required, Validators.min(0)]],
                  formula: [c.formula || ''],
                  monthlyAmount: [c.monthlyAmount || 0],
                  annualAmount: [c.annualAmount || 0]
                }));
              });
            }
          } catch (e) {
            console.error('Failed to parse custom salary components', e);
          }
        } else if (emp.ctcId) {
          // Fallback: populate from package components if ctcId is assigned
          const match = this.ctcMasters().find(c => c.id === emp.ctcId);
          if (match) {
            let comps: any[] = [];
            if (match.components && match.components.length > 0) {
              comps = match.components;
            } else if (match.salaryComponents) {
              try {
                comps = typeof match.salaryComponents === 'string' ? JSON.parse(match.salaryComponents) : match.salaryComponents;
              } catch (e) {}
            }
            if (Array.isArray(comps)) {
              comps.forEach((c: any) => {
                customCompsArr.push(this.fb.group({
                  salaryHead: [c.salaryHead, Validators.required],
                  calculationType: [c.calculationType, Validators.required],
                  value: [c.value || 0, [Validators.required, Validators.min(0)]],
                  formula: [c.formula || ''],
                  monthlyAmount: [c.monthlyAmount || 0],
                  annualAmount: [c.annualAmount || 0]
                }));
              });
            }
          }
        }
        
        this.employeeForm.patchValue({
          overrideFlag: !!emp.overrideFlag
        }, { emitEvent: false });

        this.recalculateNomineeShares();
        this.recalculateSalaryBreakups();
        this.recalculateScaleTotals();
        this.recalculateCustomComponents();
        this.employeeForm.markAsPristine();

        if (editMode) {
          this.progressService.reset();
          this.progressService.employeeId.set(empId);
          this.isEditing.set(true);
          this.employeeForm.enable();
          this.employeeForm.get('age')?.disable();
          this.updateCustomSalaryControlsState();
        } else {
          this.isEditing.set(false);
          this.employeeForm.disable();
          this.updateCustomSalaryControlsState();
        }
      },
      error: () => this.toastService.error('Error fetching employee details')
    });
  }

  onNew() {
    this.progressService.reset();
    this.selectedEmployee.set(null);
    this.employeeForm.reset();
    this.familyArray.clear();
    this.nomineesArray.clear();
    this.salaryArray.clear();
    this.scaleArray.clear();

    // Default template fields
    this.employeeForm.patchValue({
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      gender: 'MALE',
      maritalStatus: 'SINGLE',
      status: 'ACTIVE',
      shiftGroup: 'General Group',
      shiftName: 'General Shift',
      shiftFrom: '09:00',
      shiftTo: '18:00',
      shiftLateIn: 15,
      shiftEarlyOut: 15
    });

    this.totalNomineeShare.set(0);
    this.scaleTotalSalary.set(0);
    this.monthlySalary.set(0);
    this.annualSalary.set(0);
    this.ctcSalary.set(0);

    this.isEditing.set(true);
    this.employeeForm.enable();
    this.employeeForm.get('age')?.disable(); // keep calculated field disabled
    this.customComponentsArray.clear();
    this.updateCustomSalaryControlsState();
    this.activeTab.set('general');
  }

  onEdit() {
    const emp = this.selectedEmployee();
    if (!emp) return;
    this.progressService.reset();
    this.progressService.employeeId.set(emp.id);
    this.isEditing.set(true);
    this.employeeForm.enable();
    this.employeeForm.get('age')?.disable();
    this.updateCustomSalaryControlsState();
  }

  onCancel() {
    this.isEditing.set(false);
    this.employeeForm.disable();
    this.updateCustomSalaryControlsState();
    const current = this.selectedEmployee();
    if (current) {
      this.isLoadingMastersAndEmployee(current.id);
    } else {
      this.employeeForm.reset();
      this.customComponentsArray.clear();
    }
    this.progressService.reset();
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.error('Photo size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        this.employeeForm.get('photoUrl')?.setValue(base64String);
        this.toastService.success('Photo uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  }

  onDeletePhoto(event: Event) {
    event.stopPropagation();
    this.employeeForm.get('photoUrl')?.setValue('');
    this.toastService.success('Photo removed');
  }

  onSave() {
    // Recalculate all totals from FormArrays (in case they were edited in the stepper)
    this.recalculateNomineeShares();
    this.recalculateSalaryBreakups();
    this.recalculateScaleTotals();

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.toastService.error('Please correct all validation errors across tabs before saving.');
      return;
    }

    const currentEmp = this.selectedEmployee();

    // The Review page MUST NOT resend the complete payload if there are NO unsaved changes.
    if (currentEmp && !this.employeeForm.dirty) {
      this.toastService.success('No changes detected. Employee details verified.');
      // Delete draft if it exists
      const draftId = this.progressService.draftId();
      if (draftId) {
        this.employeeService.deleteDraft(draftId).subscribe();
      }
      this.progressService.reset();
      this.isEditing.set(false);
      this.employeeForm.disable();
      this.loadActiveEmployeesList();
      this.onSearch();
      this.isLoadingMastersAndEmployee(currentEmp.id);
      return;
    }

    // Business validation 1: self-reporting manager
    const reportingId = this.employeeForm.get('reportingManagerId')?.value;
    if (currentEmp && reportingId === currentEmp.id) {
      this.toastService.error('An employee cannot report to themselves.');
      return;
    }

    // Business validation 2: Nominee Share sum = 100 (if nominees exist)
    const nominees = this.nomineesArray.value;
    if (nominees.length > 0 && Math.abs(this.totalNomineeShare() - 100) > 0.01) {
      this.toastService.error(`Nominee share total must equal exactly 100%. Current sum: ${this.totalNomineeShare()}%`);
      this.activeTab.set('nominee');
      return;
    }

    // Date validations: relieving >= joining
    const joinDateStr = this.employeeForm.get('joiningDate')?.value;
    const RelieveDateStr = this.employeeForm.get('dateOfRelieving')?.value;
    if (joinDateStr && RelieveDateStr) {
      const join = new Date(joinDateStr);
      const relieve = new Date(RelieveDateStr);
      if (relieve < join) {
        this.toastService.error('Date of relieving must be on or after date of joining.');
        return;
      }
    }

    // Business validation 3: Mandatory Documents
    const categoryId = this.employeeForm.get('categoryId')?.value;
    const categoryObj = this.categories().find(c => c.id === categoryId);
    const categoryName = categoryObj ? categoryObj.name.toLowerCase() : '';
    const isEmployee = categoryName.includes('employee');
    const isConsultant = categoryName.includes('consultant');
    const isIntern = categoryName.includes('intern') || categoryName.includes('apprentice');
    const expType = this.employeeForm.get('experienceType')?.value || 'Fresher';
    const isExperienced = expType === 'Experienced';

    const mandatoryTypes: string[] = [
      'AADHAAR', 'PAN', 'BANK_PASSBOOK', 'RESUME', 'OFFER_LETTER', 'TWELFTH_CERTIFICATE'
    ];
    if (!isIntern && (isEmployee || isConsultant)) {
      mandatoryTypes.push('UG_CERTIFICATE');
    }
    if (!isIntern && isExperienced) {
      mandatoryTypes.push('EXPERIENCE_CERTIFICATE', 'RELIEVING_LETTER');
    }

    const missingDocs = mandatoryTypes.filter(type => {
      return !this.uploadedDocuments().some(d => d.documentType === type);
    });

    if (missingDocs.length > 0) {
      const docNames: { [key: string]: string } = {
        AADHAAR: 'Aadhaar Card',
        PAN: 'PAN Card',
        BANK_PASSBOOK: 'Bank Passbook',
        RESUME: 'Resume',
        OFFER_LETTER: 'Offer Letter',
        TWELFTH_CERTIFICATE: '12th Marksheet / Diploma Certificate',
        UG_CERTIFICATE: 'UG Degree Certificate',
        EXPERIENCE_CERTIFICATE: 'Experience Certificate',
        RELIEVING_LETTER: 'Relieving Letter'
      };
      const names = missingDocs.map(t => docNames[t] || t).join(', ');
      this.toastService.error(`The following mandatory documents are missing: ${names}`);
      this.activeTab.set('documents'); // Navigate to Attachments tab
      return;
    }

    const rawVal = this.employeeForm.getRawValue();
    const combinedMobile = `${rawVal.mobileCountryCode} ${rawVal.mobileNumber}`.trim();

    // Recalculate salary override if active before submitting
    const override = rawVal.overrideFlag;
    const ctcId = rawVal.ctcId;
    if (ctcId && override) {
      this.recalculateCustomComponents();
    }

    const payload = {
      ...rawVal,
      mobileNumber: combinedMobile,
      draftId: this.progressService.draftId() || undefined,
      family: this.familyArray.value,
      nominees: this.nomineesArray.value,
      // Map to save scales and salary heads
      salaryHistory: this.salaryArray.value,
      scaleHistory: this.scaleArray.value,
      overrideFlag: !!rawVal.overrideFlag,
      customSalaryComponents: rawVal.overrideFlag ? JSON.stringify(rawVal.customComponents || []) : null
    };

    if (currentEmp) {
      // Update
      this.employeeService.update(currentEmp.id, payload).subscribe({
        next: (res) => {
          this.toastService.success('Employee updated successfully!');
          // Delete draft if it exists
          const draftId = this.progressService.draftId();
          if (draftId) {
            this.employeeService.deleteDraft(draftId).subscribe();
          }
          this.progressService.reset();
          
          this.isEditing.set(false);
          this.employeeForm.disable();
          this.loadActiveEmployeesList();
          this.onSearch();
          this.isLoadingMastersAndEmployee(res.id);
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to update employee details');
        }
      });
    } else {
      // Create
      this.employeeService.create(payload).subscribe({
        next: (res) => {
          this.toastService.success('Employee created successfully!');
          // Delete draft if it exists
          const draftId = this.progressService.draftId();
          if (draftId) {
            this.employeeService.deleteDraft(draftId).subscribe();
          }
          this.progressService.reset();

          this.isEditing.set(false);
          this.employeeForm.disable();
          this.loadActiveEmployeesList();
          this.onSearch();
          this.isLoadingMastersAndEmployee(res.id);
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to create employee');
        }
      });
    }
  }

  onPrint() {
    const emp = this.selectedEmployee();
    if (emp) {
      window.open(`/employee/${emp.id}/print`, '_blank');
    }
  }

  // --- Family Subgrid Functions ---
  openFamilyDrawer(mode: 'add' | 'edit', index: number | null = null) {
    this.familyDrawerMode.set(mode);
    this.selectedFamilyIndex.set(index);
    this.familyDrawerOpen.set(true);

    if (mode === 'edit' && index !== null) {
      const val = this.familyArray.at(index).value;
      this.familyForm.patchValue({
        ...val,
        dob: val.dob ? val.dob.substring(0, 10) : ''
      });
    } else {
      this.familyForm.reset({ relationship: 'FATHER', isEmployeeOfOrg: false });
    }
  }

  saveFamilyMember() {
    if (this.familyForm.invalid) {
      this.familyForm.markAllAsTouched();
      return;
    }

    const val = this.familyForm.value;
    const mode = this.familyDrawerMode();
    const index = this.selectedFamilyIndex();

    if (mode === 'edit' && index !== null) {
      this.familyArray.at(index).patchValue(val);
    } else {
      this.familyArray.push(this.fb.group({
        relationship: [val.relationship, Validators.required],
        memberName: [val.memberName, Validators.required],
        dob: [val.dob ? val.dob.substring(0, 10) : ''],
        occupation: [val.occupation],
        contactNumber: [val.contactNumber, Validators.pattern('^[0-9]{10}$')],
        isEmployeeOfOrg: [!!val.isEmployeeOfOrg]
      }));
    }
    this.familyDrawerOpen.set(false);
  }

  removeFamilyMember(index: number) {
    if (confirm('Are you sure you want to remove this family member record?')) {
      this.familyArray.removeAt(index);
    }
  }

  // --- Nominees Subgrid Functions ---
  openNomineeDrawer(mode: 'add' | 'edit', index: number | null = null) {
    this.nomineeDrawerMode.set(mode);
    this.selectedNomineeIndex.set(index);
    this.nomineeDrawerOpen.set(true);

    if (mode === 'edit' && index !== null) {
      const val = this.nomineesArray.at(index).value;
      this.nomineeForm.patchValue({
        ...val,
        dob: val.dob ? val.dob.substring(0, 10) : ''
      });
    } else {
      this.nomineeForm.reset({ relationship: 'FATHER', gender: 'MALE', sharePercentage: 0 });
    }
  }

  saveNominee() {
    if (this.nomineeForm.invalid) {
      this.nomineeForm.markAllAsTouched();
      return;
    }

    const val = this.nomineeForm.getRawValue();
    const mode = this.nomineeDrawerMode();
    const index = this.selectedNomineeIndex();

    if (mode === 'edit' && index !== null) {
      this.nomineesArray.at(index).patchValue(val);
    } else {
      this.nomineesArray.push(this.fb.group({
        nomineeName: [val.nomineeName, Validators.required],
        relationship: [val.relationship, Validators.required],
        gender: [val.gender, Validators.required],
        dob: [val.dob ? val.dob.substring(0, 10) : ''],
        age: [val.age],
        contactNumber: [val.contactNumber, Validators.pattern('^[0-9]{10}$')],
        address: [val.address],
        sharePercentage: [parseFloat(val.sharePercentage), [Validators.required, Validators.min(1), Validators.max(100)]]
      }));
    }
    this.recalculateNomineeShares();
    this.nomineeDrawerOpen.set(false);
  }

  removeNominee(index: number) {
    if (confirm('Are you sure you want to remove this nominee?')) {
      this.nomineesArray.removeAt(index);
      this.recalculateNomineeShares();
    }
  }

  recalculateNomineeShares() {
    const sum = this.nomineesArray.value.reduce((sum: number, n: any) => sum + parseFloat(n.sharePercentage || 0), 0);
    this.totalNomineeShare.set(sum);
  }

  // --- Salary & Scale Breakup Functions ---
  addSalaryHead() {
    this.salaryArray.push(this.fb.group({
      salaryHead: ['', Validators.required],
      wef: [new Date().toISOString().substring(0, 10), Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]]
    }));
    this.recalculateSalaryBreakups();
  }

  removeSalaryHead(index: number) {
    this.salaryArray.removeAt(index);
    this.recalculateSalaryBreakups();
  }

  recalculateSalaryBreakups() {
    // Summarize amounts of unique latest salary heads
    const heads = this.salaryArray.value;
    const latestHeads: { [key: string]: number } = {};
    
    // Group by Salary Head and keep the highest amount or simple sum for current active breakup
    heads.forEach((h: any) => {
      if (h.salaryHead) {
        latestHeads[h.salaryHead] = parseFloat(h.amount || 0);
      }
    });

    const sum = Object.values(latestHeads).reduce((total: number, amt: number) => total + amt, 0);
    this.monthlySalary.set(sum);
    this.annualSalary.set(sum * 12);
    this.ctcSalary.set(sum * 12 * 1.15); // Simulated employer contribution markup (15%) for CTC
  }

  addScaleHead() {
    this.scaleArray.push(this.fb.group({
      wef: [new Date().toISOString().substring(0, 10), Validators.required],
      basic: [0, [Validators.required, Validators.min(0)]],
      ca: [0, [Validators.required, Validators.min(0)]],
      hra: [0, [Validators.required, Validators.min(0)]],
      others: [0, [Validators.required, Validators.min(0)]],
      totalSalary: [{ value: 0, disabled: true }]
    }));
    this.recalculateScaleTotals();
  }

  removeScaleHead(index: number) {
    this.scaleArray.removeAt(index);
    this.recalculateScaleTotals();
  }

  recalculateScaleTotals() {
    let scaleSum = 0;
    
    for (let i = 0; i < this.scaleArray.length; i++) {
      const basic = parseFloat(this.scaleArray.at(i).get('basic')?.value || 0);
      const ca = parseFloat(this.scaleArray.at(i).get('ca')?.value || 0);
      const hra = parseFloat(this.scaleArray.at(i).get('hra')?.value || 0);
      const others = parseFloat(this.scaleArray.at(i).get('others')?.value || 0);
      
      const total = basic + ca + hra + others;
      this.scaleArray.at(i).get('totalSalary')?.setValue(total, { emitEvent: false });
      
      // Keep track of the latest scale total
      scaleSum = total;
    }
    
    this.scaleTotalSalary.set(scaleSum);
  }

  enableSalaryOverride() {
    this.employeeForm.get('overrideFlag')?.setValue(true);
    
    // If customComponents is empty, copy from the default package components
    const customCompsArr = this.customComponentsArray;
    if (customCompsArr.length === 0) {
      const ctcId = this.employeeForm.get('ctcId')?.value;
      if (ctcId) {
        const match = this.ctcMasters().find(c => c.id === ctcId);
        if (match) {
          let comps: any[] = [];
          if (match.components && match.components.length > 0) {
            comps = match.components;
          } else if (match.salaryComponents) {
            try {
              comps = typeof match.salaryComponents === 'string' ? JSON.parse(match.salaryComponents) : match.salaryComponents;
            } catch (e) {}
          }
          if (Array.isArray(comps)) {
            comps.forEach((c: any) => {
              customCompsArr.push(this.fb.group({
                salaryHead: [c.salaryHead, Validators.required],
                calculationType: [c.calculationType, Validators.required],
                value: [c.value || 0, [Validators.required, Validators.min(0)]],
                formula: [c.formula || ''],
                monthlyAmount: [c.monthlyAmount || 0],
                annualAmount: [c.annualAmount || 0]
              }));
            });
          }
        }
      }
    }
    
    this.updateCustomSalaryControlsState();
    this.recalculateCustomComponents();
    this.toastService.success('Custom salary override enabled. You can now modify individual component values.');
  }

  disableSalaryOverride() {
    if (confirm("Are you sure you want to reset this employee's salary to the default package values? All custom modifications will be lost.")) {
      this.employeeForm.get('overrideFlag')?.setValue(false);
      
      // Clear custom components and repopulate from package
      const customCompsArr = this.customComponentsArray;
      customCompsArr.clear();
      
      const ctcId = this.employeeForm.get('ctcId')?.value;
      if (ctcId) {
        const match = this.ctcMasters().find(c => c.id === ctcId);
        if (match) {
          let comps: any[] = [];
          if (match.components && match.components.length > 0) {
            comps = match.components;
          } else if (match.salaryComponents) {
            try {
              comps = typeof match.salaryComponents === 'string' ? JSON.parse(match.salaryComponents) : match.salaryComponents;
            } catch (e) {}
          }
          if (Array.isArray(comps)) {
            comps.forEach((c: any) => {
              customCompsArr.push(this.fb.group({
                salaryHead: [c.salaryHead, Validators.required],
                calculationType: [c.calculationType, Validators.required],
                value: [c.value || 0, [Validators.required, Validators.min(0)]],
                formula: [c.formula || ''],
                monthlyAmount: [c.monthlyAmount || 0],
                annualAmount: [c.annualAmount || 0]
              }));
            });
          }
        }
      }
      
      this.updateCustomSalaryControlsState();
      this.toastService.success('Salary reset to package defaults.');
    }
  }

  updateCustomSalaryControlsState() {
    const customCompsArr = this.customComponentsArray;
    if (!customCompsArr) return;
    if (this.isEditing() && this.employeeForm.get('overrideFlag')?.value) {
      customCompsArr.enable({ emitEvent: false });
      customCompsArr.controls.forEach(ctrl => {
        ctrl.get('monthlyAmount')?.disable({ emitEvent: false });
        ctrl.get('annualAmount')?.disable({ emitEvent: false });
        ctrl.get('formula')?.disable({ emitEvent: false });
      });
    } else {
      customCompsArr.disable({ emitEvent: false });
    }
  }

  recalculateCustomComponents() {
    const mode = this.employeeForm.get('assignmentMode')?.value || 'PACKAGE';
    const comps = this.customComponentsArray.controls;
    
    if (mode === 'PACKAGE' || mode === 'CUSTOM_FROM_PACKAGE') {
      const annualCTC = this.selectedCtcAnnualAmount() || 0;
      const monthlyCTC = annualCTC / 12;
      
      let basicMonthly = 0;
      
      // 1. Process Fixed Amount and Percentage of CTC
      comps.forEach(c => {
        const head = c.get('salaryHead')?.value || '';
        const type = c.get('calculationType')?.value;
        const value = parseFloat(c.get('value')?.value || '0');
        
        let monthly = 0;
        if (type === 'Fixed Amount') {
          monthly = value;
          c.get('formula')?.setValue(`Fixed: ₹${value}`, { emitEvent: false });
        } else if (type === 'Percentage of CTC') {
          monthly = monthlyCTC * (value / 100);
          c.get('formula')?.setValue(`CTC * ${value}%`, { emitEvent: false });
        }
        
        if (head.toLowerCase() === 'basic' || head.toLowerCase() === 'basic pay') {
          basicMonthly = monthly;
        }
        
        c.get('monthlyAmount')?.setValue(monthly, { emitEvent: false });
        c.get('annualAmount')?.setValue(monthly * 12, { emitEvent: false });
      });
      
      // 2. Process Percentage of Basic
      comps.forEach(c => {
        const type = c.get('calculationType')?.value;
        const value = parseFloat(c.get('value')?.value || '0');
        
        if (type === 'Percentage of Basic') {
          const monthly = basicMonthly * (value / 100);
          c.get('formula')?.setValue(`Basic * ${value}%`, { emitEvent: false });
          c.get('monthlyAmount')?.setValue(monthly, { emitEvent: false });
          c.get('annualAmount')?.setValue(monthly * 12, { emitEvent: false });
        }
      });
      
      // 3. Process Remaining Balance
      let allocatedMonthly = 0;
      comps.forEach(c => {
        if (c.get('calculationType')?.value !== 'Remaining Balance') {
          allocatedMonthly += parseFloat(c.get('monthlyAmount')?.value || '0');
        }
      });
      
      const remainingMonthly = Math.max(0, monthlyCTC - allocatedMonthly);
      comps.forEach(c => {
        if (c.get('calculationType')?.value === 'Remaining Balance') {
          c.get('formula')?.setValue('CTC - Sum(Others)', { emitEvent: false });
          c.get('monthlyAmount')?.setValue(remainingMonthly, { emitEvent: false });
          c.get('annualAmount')?.setValue(remainingMonthly * 12, { emitEvent: false });
        }
      });
    } else {
      // CUSTOM mode (no reference package CTC)
      let basicMonthly = 0;
      
      // 1. Process Fixed Amount
      comps.forEach(c => {
        const head = c.get('salaryHead')?.value || '';
        const type = c.get('calculationType')?.value;
        const value = parseFloat(c.get('value')?.value || '0');
        
        let monthly = 0;
        if (type === 'Fixed Amount') {
          monthly = value;
          c.get('formula')?.setValue(`Fixed: ₹${value}`, { emitEvent: false });
        } else if (type === 'Percentage of CTC' || type === 'Remaining Balance') {
          monthly = 0;
          c.get('formula')?.setValue('N/A in Custom Mode', { emitEvent: false });
        }
        
        if (head.toLowerCase() === 'basic' || head.toLowerCase() === 'basic pay') {
          basicMonthly = monthly;
        }
        
        c.get('monthlyAmount')?.setValue(monthly, { emitEvent: false });
        c.get('annualAmount')?.setValue(monthly * 12, { emitEvent: false });
      });
      
      // 2. Process Percentage of Basic
      comps.forEach(c => {
        const type = c.get('calculationType')?.value;
        const value = parseFloat(c.get('value')?.value || '0');
        
        if (type === 'Percentage of Basic') {
          const monthly = basicMonthly * (value / 100);
          c.get('formula')?.setValue(`Basic * ${value}%`, { emitEvent: false });
          c.get('monthlyAmount')?.setValue(monthly, { emitEvent: false });
          c.get('annualAmount')?.setValue(monthly * 12, { emitEvent: false });
        }
      });
      
      // Update selectedCtcAnnualAmount signal based on the sum of all components
      const totalAnnual = comps.reduce((sum, ctrl) => sum + (parseFloat(ctrl.get('annualAmount')?.value) || 0), 0);
      this.selectedCtcAnnualAmount.set(totalAnnual);
    }
  }

  addCustomSalaryHead() {
    this.customComponentsArray.push(this.fb.group({
      salaryHead: ['', Validators.required],
      calculationType: ['Fixed Amount', Validators.required],
      value: [0, [Validators.required, Validators.min(0)]],
      formula: [''],
      monthlyAmount: [0],
      annualAmount: [0]
    }));
    this.recalculateCustomComponents();
  }

  removeCustomSalaryHead(index: number) {
    this.customComponentsArray.removeAt(index);
    this.recalculateCustomComponents();
  }

  private lastActiveElement: HTMLElement | null = null;
  currentScrollTop = signal<number>(0);

  getScrollContainerTop(): number {
    const winScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (winScroll > 0) return winScroll;

    const selectors = ['.main-content', '.app-layout-content', '.layout-content', '.stepper-drawer-overlay', '.stepper-drawer', '.detail-view'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.scrollTop > 0) {
        return el.scrollTop;
      }
    }
    return 0;
  }

  viewHistoryRecord(rec: any) {
    this.lastActiveElement = document.activeElement as HTMLElement;
    this.selectedHistoryRecord.set(rec);
    this.currentScrollTop.set(this.getScrollContainerTop());
    this.historyDetailModalOpen.set(true);
    
    // Add scroll lock class
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');

    // Run change detection synchronously so the modal renders immediately in the DOM
    this.cdr.detectChanges();

    // Query modal container
    const modalContainer = document.getElementById('history-modal-container');
    if (modalContainer) {
      modalContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
      
      const firstFocusable = modalContainer.querySelector('button, [tabindex="0"]') as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        modalContainer.focus();
      }
    }
  }

  closeHistoryDetailModal() {
    this.historyDetailModalOpen.set(false);
    this.selectedHistoryRecord.set(null);
    
    // Remove scroll lock class
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    
    // Restore focus
    if (this.lastActiveElement) {
      this.lastActiveElement.focus();
    }
  }

  @HostListener('window:keydown.escape')
  handleEscapeKey() {
    if (this.historyDetailModalOpen()) {
      this.closeHistoryDetailModal();
    }
    if (this.previewModalOpen) {
      this.closePreviewModal();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      if (this.historyDetailModalOpen()) {
        this.trapFocus(event, 'history-modal-container');
      } else if (this.previewModalOpen) {
        this.trapFocus(event, 'preview-modal-container');
      }
    }
  }

  private trapFocus(event: KeyboardEvent, containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
    );
    
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  getHistoryComponents(rec: any): any[] {
    if (!rec || !rec.ctc) return [];
    try {
      return rec.ctc.salaryComponents ? JSON.parse(rec.ctc.salaryComponents) : [];
    } catch (e) {
      const annualCTC = rec.annualCTC || rec.ctc.annualCTC || 0;
      const monthlyCTC = annualCTC / 12;
      return [
        { salaryHead: 'Basic', calculationType: 'Percentage of CTC', value: 50, formula: 'CTC * 50%', monthlyAmount: monthlyCTC * 0.5, annualAmount: annualCTC * 0.5 },
        { salaryHead: 'HRA', calculationType: 'Percentage of Basic', value: 40, formula: 'Basic * 40%', monthlyAmount: monthlyCTC * 0.2, annualAmount: annualCTC * 0.2 },
        { salaryHead: 'CA', calculationType: 'Fixed Amount', value: 1600, formula: 'Fixed: ₹1600', monthlyAmount: 1600, annualAmount: 19200 },
        { salaryHead: 'Others', calculationType: 'Remaining Balance', value: 0, formula: 'CTC - Sum(Others)', monthlyAmount: Math.max(0, monthlyCTC - (monthlyCTC * 0.7 + 1600)), annualAmount: Math.max(0, annualCTC - (annualCTC * 0.7 + 19200)) }
      ];
    }
  }

  // Helper calculation functions
  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  // Tabs management
  selectTab(tab: string) {
    this.activeTab.set(tab);
  }

  // --- Document Management Methods ---
  loadEmployeeDocuments(id: string) {
    this.employeeService.getDocuments(id).subscribe({
      next: (docs) => {
        this.uploadedDocuments.set(docs);
      },
      error: (err) => {
        this.toastService.error('Failed to load documents: ' + (err.error?.error || err.message));
      }
    });
  }

  getRequiredDocuments() {
    const categoryId = this.employeeForm.get('categoryId')?.value;
    const categoryObj = this.categories().find(c => c.id === categoryId);
    const categoryName = categoryObj ? categoryObj.name.toLowerCase() : '';
    
    const isEmployee = categoryName.includes('employee');
    const isConsultant = categoryName.includes('consultant');
    const isIntern = categoryName.includes('intern') || categoryName.includes('apprentice');

    const expType = this.employeeForm.get('experienceType')?.value || 'Fresher';
    const isExperienced = expType === 'Experienced';

    // Base document list
    const docs = [
      { type: 'AADHAAR', name: 'Aadhaar Card', description: 'National Identity Card (Required)', isMandatory: true, isApplicable: true },
      { type: 'PAN', name: 'PAN Card', description: 'Income Tax Account Number Card (Required)', isMandatory: true, isApplicable: true },
      { type: 'BANK_PASSBOOK', name: 'Bank Passbook', description: 'Required for salary bank account verification', isMandatory: true, isApplicable: true },
      { type: 'RESUME', name: 'Resume', description: 'Latest Professional Resume (Required)', isMandatory: true, isApplicable: true },
      { type: 'OFFER_LETTER', name: 'Offer Letter', description: 'Signed offer letter (Required)', isMandatory: true, isApplicable: true },
      { type: 'TWELFTH_CERTIFICATE', name: '12th Marksheet / Diploma Certificate', description: 'Higher Secondary / Diploma Certificate (Required)', isMandatory: true, isApplicable: true },
      { 
        type: 'UG_CERTIFICATE', 
        name: 'UG Degree Certificate', 
        description: 'Undergraduate Degree Certificate (Required)', 
        isMandatory: isEmployee || isConsultant, 
        isApplicable: !isIntern 
      },
      { 
        type: 'PG_CERTIFICATE', 
        name: 'PG Degree Certificate', 
        description: 'Postgraduate Degree Certificate (Optional)', 
        isMandatory: false, 
        isApplicable: !isIntern 
      },
      { 
        type: 'PASSPORT', 
        name: 'Passport', 
        description: 'International Travel Document (Optional)', 
        isMandatory: false, 
        isApplicable: !isIntern 
      },
      { 
        type: 'EXPERIENCE_CERTIFICATE', 
        name: 'Experience Certificate', 
        description: 'Previous work experience certificate (Required)', 
        isMandatory: isExperienced, 
        isApplicable: !isIntern && isExperienced 
      },
      { 
        type: 'RELIEVING_LETTER', 
        name: 'Relieving Letter', 
        description: 'Previous employer relieving letter (Required)', 
        isMandatory: isExperienced, 
        isApplicable: !isIntern && isExperienced 
      }
    ];

    return docs.filter(d => d.isApplicable).map(d => {
      const uploaded = this.uploadedDocuments().find(doc => doc.documentType === d.type);
      return {
        ...d,
        uploadedFile: uploaded || null
      };
    });
  }

  onFileSelected(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error('File exceeds maximum size.');
        input.value = '';
        return;
      }

      const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExts.includes(fileExt)) {
        this.toastService.error('Unsupported file format.');
        input.value = '';
        return;
      }

      const id = this.selectedEmployee()?.id;
      if (!id) {
        this.toastService.error('Employee ID not found.');
        input.value = '';
        return;
      }

      console.log(`[Upload] Starting upload. Employee ID: ${id}, Doc Type: ${type}, File: ${file.name}, Size: ${file.size} bytes`);
      this.uploadProgress.update(p => ({ ...p, [type]: 0 }));

      this.employeeService.uploadDocument(id, type, file).subscribe({
        next: (evt: any) => {
          if (evt.type === HttpEventType.UploadProgress) {
            if (evt.total) {
              const percent = Math.round((100 * evt.loaded) / evt.total);
              this.uploadProgress.update(p => ({ ...p, [type]: percent }));
              console.log(`[Upload] Progress for ${type}: ${percent}%`);
            }
          } else if (evt.type === HttpEventType.Response) {
            console.log(`[Upload] Success! Server response:`, evt.body);
            this.toastService.success('Document uploaded successfully.');
            this.uploadProgress.update(p => {
              const copy = { ...p };
              delete copy[type];
              return copy;
            });
            this.loadEmployeeDocuments(id);
            input.value = '';
          }
        },
        error: (err) => {
          console.error('[Upload] Error uploading document:', err);
          this.toastService.error(err.error?.error || 'Unable to upload document.');
          this.uploadProgress.update(p => {
            const copy = { ...p };
            delete copy[type];
            return copy;
          });
          input.value = '';
        }
      });
    }
  }

  onDownloadDocument(doc: any) {
    const id = this.selectedEmployee()?.id;
    if (id && doc.id) {
      this.employeeService.downloadDocumentFile(id, doc.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.originalFileName;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.toastService.error('Failed to download document: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  onPreviewDocument(doc: any) {
    const id = this.selectedEmployee()?.id;
    if (id && doc.id) {
      this.employeeService.previewDocumentFile(id, doc.id).subscribe({
        next: (blob) => {
          if (this.previewUrl) {
            window.URL.revokeObjectURL(this.previewUrl);
          }
          const rawUrl = window.URL.createObjectURL(blob);
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
          this.previewMimeType = doc.mimeType;
          this.previewFileName = doc.originalFileName;
          this.zoomLevel = 1.0;
          
          this.lastActiveElement = document.activeElement as HTMLElement;
          this.currentScrollTop.set(this.getScrollContainerTop());
          this.previewModalOpen = true;
          
          document.body.classList.add('modal-open');
          document.documentElement.classList.add('modal-open');

          this.cdr.detectChanges();

          const modalContainer = document.getElementById('preview-modal-container');
          if (modalContainer) {
            modalContainer.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
            const firstFocusable = modalContainer.querySelector('button, [tabindex="0"]') as HTMLElement;
            if (firstFocusable) {
              firstFocusable.focus();
            } else {
              modalContainer.focus();
            }
          }
        },
        error: (err) => {
          this.toastService.error('Failed to load document preview: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  onDeleteDocument(doc: any) {
    if (confirm(`Are you sure you want to delete this document (${doc.originalFileName})?`)) {
      const id = this.selectedEmployee()?.id;
      if (id && doc.id) {
        this.employeeService.deleteDocument(id, doc.id).subscribe({
          next: () => {
            this.toastService.success('Document deleted successfully.');
            this.loadEmployeeDocuments(id);
          },
          error: (err) => {
            this.toastService.error(err.error?.error || 'Failed to delete document.');
          }
        });
      }
    }
  }

  closePreviewModal() {
    this.previewModalOpen = false;
    if (this.previewUrl) {
      this.previewUrl = null;
    }
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    if (this.lastActiveElement) {
      this.lastActiveElement.focus();
    }
  }

  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.2, 3.0);
  }

  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.2, 0.5);
  }

  countryCodes = [
    { code: '+91', name: 'India (+91)', length: 10, pattern: '^[0-9]{5} [0-9]{5}$', placeholder: '98765 43210', format: (val: string) => {
      const digits = val.replace(/\D/g, '').substring(0, 10);
      if (digits.length <= 5) return digits;
      return `${digits.substring(0, 5)} ${digits.substring(5)}`;
    }},
    { code: '+1', name: 'USA/Canada (+1)', length: 10, pattern: '^[0-9]{3} [0-9]{3} [0-9]{4}$', placeholder: '123 456 7890', format: (val: string) => {
      const digits = val.replace(/\D/g, '').substring(0, 10);
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.substring(0, 3)} ${digits.substring(3)}`;
      return `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
    }},
    { code: '+44', name: 'UK (+44)', length: 10, pattern: '^[0-9]{4} [0-9]{6}$', placeholder: '7123 456789', format: (val: string) => {
      const digits = val.replace(/\D/g, '').substring(0, 10);
      if (digits.length <= 4) return digits;
      return `${digits.substring(0, 4)} ${digits.substring(4)}`;
    }},
    { code: '+971', name: 'UAE (+971)', length: 9, pattern: '^[0-9]{2} [0-9]{3} [0-9]{4}$', placeholder: '50 123 4567', format: (val: string) => {
      const digits = val.replace(/\D/g, '').substring(0, 9);
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.substring(0, 2)} ${digits.substring(2)}`;
      return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    }},
    { code: '+61', name: 'Australia (+61)', length: 9, pattern: '^[0-9]{3} [0-9]{3} [0-9]{3}$', placeholder: '412 345 678', format: (val: string) => {
      const digits = val.replace(/\D/g, '').substring(0, 9);
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.substring(0, 3)} ${digits.substring(3)}`;
      return `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
    }}
  ];

  getMobilePlaceholder(): string {
    const code = this.employeeForm.get('mobileCountryCode')?.value || '+91';
    const country = this.countryCodes.find(c => c.code === code);
    return country ? country.placeholder : '98765 43210';
  }

  trackByDocType(index: number, item: any) {
    return item.type;
  }
}
