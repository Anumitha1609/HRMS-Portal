import { Component, Input, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeProgressService } from '../../services/employee-progress.service';
import { StepHeaderComponent } from './step-header.component';
import { StepNavigationComponent } from './step-navigation.component';
import { EmployeeReviewComponent } from './employee-review.component';
import { ToastService } from '../../services/toast.service';
import { MasterService } from '../../services/master.service';
import { EmployeeService } from '../../services/employee.service';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-employee-stepper',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StepHeaderComponent,
    StepNavigationComponent,
    EmployeeReviewComponent
  ],
  templateUrl: './employee-stepper.component.html',
  styleUrls: ['./employee-stepper.component.scss']
})
export class EmployeeStepperComponent implements OnInit {
  private fb = inject(FormBuilder);
  progressService = inject(EmployeeProgressService);
  private toastService = inject(ToastService);
  private masterService = inject(MasterService);
  private employeeService = inject(EmployeeService);
  private sanitizer = inject(DomSanitizer);

  @Input() form!: FormGroup;
  @Input() isEditMode: boolean = false;
  @Input() locations: any[] = [];
  @Input() subLocations: any[] = [];
  @Input() departments: any[] = [];
  @Input() functionalUnits: any[] = [];
  @Input() divisions: any[] = [];
  @Input() categories: any[] = [];
  @Input() subCategories: any[] = [];
  @Input() activeEmployees: any[] = [];
  @Input() filteredSubCategories: any[] = [];
  @Input() ctcMasters: any[] = [];

  @Output() saveEmployee = new EventEmitter<void>();
  
  selectedCtcAnnualAmount = signal<number>(0);
  @Output() cancel = new EventEmitter<void>();
  @Output() documentsChanged = new EventEmitter<any[]>();

  // Drawers
  familyDrawerOpen = false;
  familyDrawerMode: 'add' | 'edit' = 'add';
  selectedFamilyIndex: number | null = null;
  familyForm!: FormGroup;

  nomineeDrawerOpen = false;
  nomineeDrawerMode: 'add' | 'edit' = 'add';
  selectedNomineeIndex: number | null = null;
  nomineeForm!: FormGroup;

  inlineDepartmentOpen = false;
  inlineDepartmentForm!: FormGroup;

  documents = signal<any[]>([]);
  uploadProgress = signal<{ [key: string]: number }>({});

  // Preview Modal state
  previewUrl: any = null;
  previewMimeType: string | null = null;
  previewFileName: string | null = null;
  previewModalOpen = false;
  zoomLevel = 1.0;

  ngOnInit() {
    this.initStepperForms();
    if (this.progressService.employeeId() || this.progressService.draftId()) {
      this.loadDocuments();
    }

    // Subscribe to assignmentMode changes
    this.form.get('assignmentMode')?.valueChanges.subscribe(mode => {
      this.customComponentsArray.clear();
      this.form.get('saveAsPackage')?.setValue(false, { emitEvent: false });
      this.form.get('newPackageName')?.setValue('', { emitEvent: false });
      this.form.get('newPackageCode')?.setValue('', { emitEvent: false });
      this.form.get('newPackageDescription')?.setValue('', { emitEvent: false });

      if (mode === 'PACKAGE') {
        this.form.get('ctcId')?.setValidators([Validators.required]);
        this.form.get('overrideFlag')?.setValue(false, { emitEvent: false });
        this.updateSelectedCtcAmount();
        this.updateCustomSalaryControlsState();
      } else if (mode === 'CUSTOM_FROM_PACKAGE') {
        this.form.get('ctcId')?.setValidators([Validators.required]);
        this.form.get('overrideFlag')?.setValue(true, { emitEvent: false });
        
        // Force populate from reference package
        const ctcId = this.form.get('ctcId')?.value;
        if (ctcId) {
          const match = this.ctcMasters.find(c => c.id === ctcId);
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
        this.updateSelectedCtcAmount();
        this.updateCustomSalaryControlsState();
        this.recalculateCustomComponents();
      } else if (mode === 'CUSTOM') {
        this.form.get('ctcId')?.clearValidators();
        this.form.get('ctcId')?.setValue('', { emitEvent: false });
        this.form.get('overrideFlag')?.setValue(true, { emitEvent: false });
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
      this.form.get('ctcId')?.updateValueAndValidity();
    });

    // Subscribe to saveAsPackage changes
    this.form.get('saveAsPackage')?.valueChanges.subscribe(save => {
      const nameCtrl = this.form.get('newPackageName');
      const codeCtrl = this.form.get('newPackageCode');
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
    this.form.get('ctcId')?.valueChanges.subscribe(ctcId => {
      this.updateSelectedCtcAmount();
      
      const mode = this.form.get('assignmentMode')?.value || 'PACKAGE';
      if (ctcId && (mode === 'PACKAGE' || mode === 'CUSTOM_FROM_PACKAGE')) {
        const match = this.ctcMasters.find(c => c.id === ctcId);
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
        this.customComponentsArray.clear();
      }
    });

    this.form.get('customComponents')?.valueChanges.subscribe(() => {
      this.recalculateCustomComponents();
    });

    setTimeout(() => {
      this.updateSelectedCtcAmount();
      this.updateCustomSalaryControlsState();
    }, 100);
  }

  private initStepperForms() {
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

    // Nominee DOB age auto-calculation
    this.nomineeForm.get('dob')?.valueChanges.subscribe(dobStr => {
      if (dobStr) {
        const age = this.calculateAge(new Date(dobStr));
        this.nomineeForm.get('age')?.setValue(age, { emitEvent: false });
      }
    });

    // Manager visibility/validation based on Director subcategory
    this.form.get('subCategoryId')?.valueChanges.subscribe(() => {
      this.handleDirectorManagerValidation();
    });

    // Run initially for edit mode
    setTimeout(() => {
      this.handleDirectorManagerValidation();
    });
  }

  updateSelectedCtcAmount() {
    const ctcId = this.form.get('ctcId')?.value;
    if (ctcId) {
      const match = this.ctcMasters.find(c => c.id === ctcId);
      this.selectedCtcAnnualAmount.set(match ? match.annualCTC : 0);
    } else {
      this.selectedCtcAnnualAmount.set(0);
    }
  }

  getCtcNameById(id: string): string {
    if (!id) return '';
    const match = this.ctcMasters.find(c => c.id === id);
    return match ? match.ctcName : '';
  }

  get customComponentsArray() { return this.form.get('customComponents') as FormArray; }

  get customComponentsTotalAnnual(): number {
    const customCompsArr = this.customComponentsArray;
    if (!customCompsArr) return 0;
    return customCompsArr.controls.reduce((sum, ctrl) => sum + (parseFloat(ctrl.get('annualAmount')?.value) || 0), 0);
  }

  get activeCtcAnnualAmount(): number {
    if (this.form.get('overrideFlag')?.value) {
      return this.customComponentsTotalAnnual;
    }
    return this.selectedCtcAnnualAmount();
  }

  get currentCtcComponents(): any[] {
    if (this.form.get('overrideFlag')?.value) {
      return this.customComponentsArray.value;
    }
    const ctcId = this.form.get('ctcId')?.value;
    if (!ctcId) return [];
    const match = this.ctcMasters.find(c => c.id === ctcId);
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

  isDirectorSelected(): boolean {
    const subCatId = this.form.get('subCategoryId')?.value;
    if (!subCatId) return false;
    const subCat = this.subCategories.find(s => s.id === subCatId);
    return subCat ? subCat.name.toLowerCase() === 'director' : false;
  }

  handleDirectorManagerValidation() {
    const isDirector = this.isDirectorSelected();
    const repCtrl = this.form.get('reportingManagerId');
    const funcCtrl = this.form.get('functionalManagerId');
    const skipCtrl = this.form.get('skipLevelManagerId');

    if (isDirector) {
      repCtrl?.setValue('', { emitEvent: false });
      repCtrl?.clearValidators();
      repCtrl?.updateValueAndValidity({ emitEvent: false });

      funcCtrl?.setValue('', { emitEvent: false });
      funcCtrl?.clearValidators();
      funcCtrl?.updateValueAndValidity({ emitEvent: false });

      skipCtrl?.setValue('', { emitEvent: false });
      skipCtrl?.clearValidators();
      skipCtrl?.updateValueAndValidity({ emitEvent: false });
    } else {
      repCtrl?.setValidators(Validators.required);
      repCtrl?.updateValueAndValidity({ emitEvent: false });
    }
  }

  openAddDepartmentModal() {
    this.inlineDepartmentForm.reset();
    this.inlineDepartmentOpen = true;
  }

  saveInlineDepartment() {
    if (this.inlineDepartmentForm.invalid) {
      this.inlineDepartmentForm.markAllAsTouched();
      return;
    }

    const name = this.inlineDepartmentForm.get('name')?.value;
    if (name && name.trim()) {
      this.masterService.createMaster('department', name.trim()).subscribe({
        next: (newDept: any) => {
          this.toastService.success('Department created successfully!');
          // Push new department to local array
          this.departments = [...this.departments, newDept];
          // Select the new department in the form
          this.form.get('departmentId')?.setValue(newDept.id);
          this.inlineDepartmentOpen = false;
        },
        error: (err: any) => {
          this.toastService.error(err.error?.error || 'Failed to create department');
        }
      });
    }
  }

  // Getters for FormArrays
  get familyArray() { return this.form.get('family') as FormArray; }
  get nomineesArray() { return this.form.get('nominees') as FormArray; }
  get salaryArray() { return this.form.get('salaryHistory') as FormArray; }
  get scaleArray() { return this.form.get('scaleHistory') as FormArray; }

  // Calculations
  totalNomineeShare(): number {
    return this.nomineesArray.value.reduce((sum: number, n: any) => sum + parseFloat(n.sharePercentage || 0), 0);
  }

  monthlySalary(): number {
    const heads = this.salaryArray.value;
    const latestHeads: { [key: string]: number } = {};
    heads.forEach((h: any) => {
      if (h.salaryHead) {
        latestHeads[h.salaryHead] = parseFloat(h.amount || 0);
      }
    });
    return Object.values(latestHeads).reduce((total: number, amt: number) => total + amt, 0);
  }

  annualSalary(): number {
    return this.monthlySalary() * 12;
  }

  ctcSalary(): number {
    return this.annualSalary() * 1.15; // 15% employer markup
  }

  isNomineeShareValid(): boolean {
    const total = this.totalNomineeShare();
    return Math.abs(total - 100) < 0.01;
  }

  scaleTotalSalary(): number {
    let scaleSum = 0;
    for (let i = 0; i < this.scaleArray.length; i++) {
      const basic = parseFloat(this.scaleArray.at(i).get('basic')?.value || 0);
      const ca = parseFloat(this.scaleArray.at(i).get('ca')?.value || 0);
      const hra = parseFloat(this.scaleArray.at(i).get('hra')?.value || 0);
      const others = parseFloat(this.scaleArray.at(i).get('others')?.value || 0);
      const total = basic + ca + hra + others;
      this.scaleArray.at(i).get('totalSalary')?.setValue(total, { emitEvent: false });
      scaleSum = total;
    }
    return scaleSum;
  }

  // Validation
  isStepValid(step: number): boolean {
    if (!this.form) return false;

    switch (step) {
      case 1:
        return this.checkControlsValid([
          'employeeName', 'gender', 'dob', 'maritalStatus', 'mobileNumber', 
          'officialEmail', 'personalEmail', 'joiningDate', 'status', 'pan', 'aadhaar'
        ]);
      case 2:
        return this.checkControlsValid([
          'functionalUnitId', 'divisionId', 'departmentId', 'locationId', 
          'subLocationId', 'categoryId', 'subCategoryId', 'designation', 
          'accessCardNumber', 'reportingManagerId'
        ]);
      case 3:
        return this.checkControlsValid([
          'bankAccountNumber', 'bankName', 'bankBranch', 'bankIfsc'
        ]);
      case 4:
        return true;
      case 5:
        const nominees = this.nomineesArray.value;
        if (nominees.length === 0) return true;
        return Math.abs(this.totalNomineeShare() - 100) < 0.01;
      case 6:
        // Combined Scale & Scale Details validation
        const mode = this.form.get('assignmentMode')?.value || 'PACKAGE';
        const ctcIdValid = this.form.get('ctcId')?.valid;
        const effFromValid = this.form.get('effectiveFrom')?.valid;
        if (mode === 'PACKAGE') {
          return !!ctcIdValid && !!effFromValid;
        } else if (mode === 'CUSTOM_FROM_PACKAGE') {
          return !!ctcIdValid && !!effFromValid && this.customComponentsArray.valid;
        } else if (mode === 'CUSTOM') {
          const customCompsValid = this.customComponentsArray.valid;
          const savePkg = this.form.get('saveAsPackage')?.value;
          if (savePkg) {
            const pkgNameValid = this.form.get('newPackageName')?.valid;
            const pkgCodeValid = this.form.get('newPackageCode')?.valid;
            return !!effFromValid && !!customCompsValid && !!pkgNameValid && !!pkgCodeValid;
          }
          return !!effFromValid && !!customCompsValid;
        }
        return false;
      case 7:
        return this.checkControlsValid([
          'currentAddress1', 'currentCity', 'currentState', 'currentCountry', 'currentPinCode',
          'permanentAddress1', 'permanentCity', 'permanentState', 'permanentCountry', 'permanentPinCode',
          'shiftGroup', 'shiftName', 'shiftFrom', 'shiftTo'
        ]);
      case 8:
        const applicable = this.getRequiredDocuments();
        const missingMandatory = applicable.filter(d => d.isMandatory && !d.uploadedFile);
        return missingMandatory.length === 0;
      case 9:
        return this.form.valid && (this.nomineesArray.value.length === 0 || Math.abs(this.totalNomineeShare() - 100) < 0.01);
      default:
        return false;
    }
  }

  private checkControlsValid(controls: string[]): boolean {
    return controls.every(name => {
      const ctrl = this.form.get(name);
      return ctrl ? ctrl.valid : true;
    });
  }

  // Navigation handlers
  onStepSelected(step: number) {
    this.progressService.currentStep.set(step);
    if (step === 8 || step === 9) {
      this.loadDocuments();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onBack() {
    const current = this.progressService.currentStep();
    if (current > 1) {
      this.onStepSelected(current - 1);
    }
  }

  async onNext() {
    const current = this.progressService.currentStep();
    if (this.isStepValid(current)) {
      this.progressService.markStepComplete(current, true);
      if (this.isEditMode && this.isStepDirty(current)) {
        this.progressService.markStepModified(current, true);
      }
      // Auto save draft on transition
      await this.progressService.autoSaveDraft(this.form.getRawValue());
      this.onStepSelected(current + 1);
    } else {
      this.form.markAllAsTouched();
      this.toastService.error('Please resolve validation errors before proceeding.');
    }
  }

  onSaveDraft() {
    const current = this.progressService.currentStep();
    if (this.isEditMode && this.isStepDirty(current)) {
      this.progressService.markStepModified(current, true);
    }
    this.progressService.autoSaveDraft(this.form.getRawValue());
  }

  isStepDirty(step: number): boolean {
    if (!this.form) return false;

    let controls: string[] = [];
    switch (step) {
      case 1:
        controls = [
          'employeeName', 'gender', 'dob', 'maritalStatus', 'mobileNumber', 
          'officialEmail', 'personalEmail', 'joiningDate', 'status', 'pan', 'aadhaar'
        ];
        break;
      case 2:
        controls = [
          'functionalUnitId', 'divisionId', 'departmentId', 'locationId', 
          'subLocationId', 'categoryId', 'subCategoryId', 'designation', 
          'accessCardNumber', 'reportingManagerId', 'functionalManagerId', 'skipLevelManagerId'
        ];
        break;
      case 3:
        controls = [
          'bankAccountNumber', 'bankName', 'bankBranch', 'bankIfsc'
        ];
        break;
      case 4:
        return this.familyArray.dirty;
      case 5:
        return this.nomineesArray.dirty;
      case 6:
        return !!(this.form.get('ctcId')?.dirty || 
                  this.form.get('effectiveFrom')?.dirty || 
                  this.form.get('revisionReason')?.dirty || 
                  this.form.get('ctcRemarks')?.dirty || 
                  this.form.get('assignmentMode')?.dirty || 
                  this.form.get('saveAsPackage')?.dirty || 
                  this.form.get('newPackageName')?.dirty || 
                  this.form.get('newPackageCode')?.dirty || 
                  this.form.get('newPackageDescription')?.dirty || 
                  this.customComponentsArray.dirty);
      case 7:
        controls = [
          'currentAddress1', 'currentCity', 'currentState', 'currentCountry', 'currentPinCode',
          'permanentAddress1', 'permanentCity', 'permanentState', 'permanentCountry', 'permanentPinCode',
          'shiftGroup', 'shiftName', 'shiftFrom', 'shiftTo'
        ];
        break;
      default:
        return false;
    }

    return controls.some(name => this.form.get(name)?.dirty);
  }

  onCancel() {
    if (this.form.dirty) {
      if (confirm('You have unsaved changes. Do you want to save them as a draft before leaving?')) {
        this.progressService.autoSaveDraft(this.form.getRawValue());
      }
    }
    this.cancel.emit();
  }

  onSaveEmployee() {
    if (this.isStepValid(9)) {
      this.saveEmployee.emit();
    } else {
      this.toastService.error('Please correct all validation errors before saving.');
    }
  }

  // Photo uploads
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
        this.form.get('photoUrl')?.setValue(reader.result as string);
        this.toastService.success('Photo uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  }

  onDeletePhoto(event: Event) {
    event.stopPropagation();
    this.form.get('photoUrl')?.setValue('');
    this.toastService.success('Photo removed');
  }

  // Sub-grid: Family
  openFamilyDrawer(mode: 'add' | 'edit', index: number | null = null) {
    this.familyDrawerMode = mode;
    this.selectedFamilyIndex = index;
    this.familyDrawerOpen = true;

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
    if (this.familyDrawerMode === 'edit' && this.selectedFamilyIndex !== null) {
      this.familyArray.at(this.selectedFamilyIndex).patchValue(val);
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
    this.familyDrawerOpen = false;
  }

  removeFamilyMember(index: number) {
    if (confirm('Are you sure you want to remove this family member?')) {
      this.familyArray.removeAt(index);
    }
  }

  // Sub-grid: Nominees
  openNomineeDrawer(mode: 'add' | 'edit', index: number | null = null) {
    this.nomineeDrawerMode = mode;
    this.selectedNomineeIndex = index;
    this.nomineeDrawerOpen = true;

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
    if (this.nomineeDrawerMode === 'edit' && this.selectedNomineeIndex !== null) {
      this.nomineesArray.at(this.selectedNomineeIndex).patchValue(val);
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
    this.nomineeDrawerOpen = false;
  }

  removeNominee(index: number) {
    if (confirm('Are you sure you want to remove this nominee?')) {
      this.nomineesArray.removeAt(index);
    }
  }

  // Sub-grid: Salary History
  addSalaryHead() {
    this.salaryArray.push(this.fb.group({
      salaryHead: ['', Validators.required],
      wef: [new Date().toISOString().substring(0, 10), Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeSalaryHead(index: number) {
    this.salaryArray.removeAt(index);
  }

  // Sub-grid: Scale History
  addScaleHead() {
    this.scaleArray.push(this.fb.group({
      wef: [new Date().toISOString().substring(0, 10), Validators.required],
      basic: [0, [Validators.required, Validators.min(0)]],
      ca: [0, [Validators.required, Validators.min(0)]],
      hra: [0, [Validators.required, Validators.min(0)]],
      others: [0, [Validators.required, Validators.min(0)]],
      totalSalary: [{ value: 0, disabled: true }]
    }));
  }

  removeScaleHead(index: number) {
    this.scaleArray.removeAt(index);
  }

  // Helpers
  copyPermanentAddress() {
    const permAddr = {
      currentAddress1: this.form.get('permanentAddress1')?.value,
      currentAddress2: this.form.get('permanentAddress2')?.value,
      currentCity: this.form.get('permanentCity')?.value,
      currentState: this.form.get('permanentState')?.value,
      currentCountry: this.form.get('permanentCountry')?.value,
      currentPinCode: this.form.get('permanentPinCode')?.value,
    };
    this.form.patchValue(permAddr);
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  showValidationError(controlName: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  // --- Document Management Methods ---
  loadDocuments() {
    const id = this.progressService.employeeId() || this.progressService.draftId();
    if (id) {
      this.employeeService.getDocuments(id).subscribe({
        next: (docs) => {
          this.documents.set(docs);
          this.documentsChanged.emit(docs);
        },
        error: (err) => {
          this.toastService.error('Failed to load documents: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  getRequiredDocuments() {
    const categoryId = this.form.get('categoryId')?.value;
    const categoryObj = this.categories.find(c => c.id === categoryId);
    const categoryName = categoryObj ? categoryObj.name.toLowerCase() : '';
    
    const isEmployee = categoryName.includes('employee');
    const isConsultant = categoryName.includes('consultant');
    const isIntern = categoryName.includes('intern') || categoryName.includes('apprentice');

    const expType = this.form.get('experienceType')?.value || 'Fresher';
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
      const uploaded = this.documents().find(doc => doc.documentType === d.type);
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

      const id = this.progressService.employeeId() || this.progressService.draftId();
      if (!id) {
        this.toastService.error('Please save step 1 details before uploading documents.');
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
            this.loadDocuments();
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
    const id = this.progressService.employeeId() || this.progressService.draftId();
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
    const id = this.progressService.employeeId() || this.progressService.draftId();
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
          this.previewModalOpen = true;
        },
        error: (err) => {
          this.toastService.error('Failed to load document preview: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  onDeleteDocument(doc: any) {
    if (confirm(`Are you sure you want to delete this document (${doc.originalFileName})?`)) {
      const id = this.progressService.employeeId() || this.progressService.draftId();
      if (id && doc.id) {
        this.employeeService.deleteDocument(id, doc.id).subscribe({
          next: () => {
            this.toastService.success('Document deleted successfully.');
            this.loadDocuments();
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
    const code = this.form.get('mobileCountryCode')?.value || '+91';
    const country = this.countryCodes.find(c => c.code === code);
    return country ? country.placeholder : '98765 43210';
  }

  trackByDocType(index: number, item: any) {
    return item.type;
  }

  enableSalaryOverride() {
    this.form.get('overrideFlag')?.setValue(true);
    
    // If customComponents is empty, copy from the default package components
    const customCompsArr = this.customComponentsArray;
    if (customCompsArr.length === 0) {
      const ctcId = this.form.get('ctcId')?.value;
      if (ctcId) {
        const match = this.ctcMasters.find(c => c.id === ctcId);
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
      this.form.get('overrideFlag')?.setValue(false);
      
      // Clear custom components and repopulate from package
      const customCompsArr = this.customComponentsArray;
      customCompsArr.clear();
      
      const ctcId = this.form.get('ctcId')?.value;
      if (ctcId) {
        const match = this.ctcMasters.find(c => c.id === ctcId);
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
    // Always enable controls if override flag is true in stepper (we are in creation flow, so we are always in "editing" mode)
    if (this.form.get('overrideFlag')?.value) {
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
    const mode = this.form.get('assignmentMode')?.value || 'PACKAGE';
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
}
