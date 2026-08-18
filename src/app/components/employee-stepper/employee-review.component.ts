import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray } from '@angular/forms';

@Component({
  selector: 'app-employee-review',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="review-container">
      <div class="review-header">
        <h3>Review & Save Employee Profile</h3>
        <p class="subtitle">Please verify all information before finalizing the employee creation/update.</p>
      </div>

      <!-- Expandable Cards -->
      <div class="review-cards-list">
        
        <!-- 1. Primary Details -->
        <div class="review-card" [class.expanded]="expanded['primary']">
          <div class="card-header" (click)="toggleSection('primary')">
            <div class="header-title">
              <span class="material-icons">person</span>
              <h4>Primary Details</h4>
            </div>
            <div class="header-actions">
              <button type="button" class="btn-edit" (click)="jumpToStep(1); $event.stopPropagation()">Edit</button>
              <span class="material-icons expand-arrow">{{ expanded['primary'] ? 'expand_less' : 'expand_more' }}</span>
            </div>
          </div>
          <div class="card-body" *ngIf="expanded['primary']">
            <div class="detail-grid">
              <div class="detail-item"><span class="label">Code:</span><span class="value">{{ form.get('employeeCode')?.value || 'N/A' }}</span></div>
              <div class="detail-item"><span class="label">Name:</span><span class="value">{{ form.get('employeeName')?.value }}</span></div>
              <div class="detail-item"><span class="label">Gender:</span><span class="value">{{ form.get('gender')?.value }}</span></div>
              <div class="detail-item"><span class="label">DOB:</span><span class="value">{{ form.get('dob')?.value }}</span></div>
              <div class="detail-item"><span class="label">Age:</span><span class="value">{{ form.get('age')?.value }}</span></div>
              <div class="detail-item"><span class="label">Marital Status:</span><span class="value">{{ form.get('maritalStatus')?.value }}</span></div>
              <div class="detail-item"><span class="label">Blood Group:</span><span class="value">{{ form.get('bloodGroup')?.value || 'N/A' }}</span></div>
              <div class="detail-item"><span class="label">Mobile:</span><span class="value">{{ form.get('mobileNumber')?.value }}</span></div>
              <div class="detail-item"><span class="label">Official Email:</span><span class="value">{{ form.get('officialEmail')?.value }}</span></div>
              <div class="detail-item"><span class="label">Personal Email:</span><span class="value">{{ form.get('personalEmail')?.value }}</span></div>
              <div class="detail-item"><span class="label">Joining Date:</span><span class="value">{{ form.get('joiningDate')?.value }}</span></div>
              <div class="detail-item"><span class="label">Status:</span><span class="value">{{ form.get('status')?.value }}</span></div>
              <div class="detail-item"><span class="label">PAN:</span><span class="value">{{ form.get('pan')?.value }}</span></div>
              <div class="detail-item"><span class="label">Aadhaar:</span><span class="value">{{ form.get('aadhaar')?.value }}</span></div>
              <div class="detail-item"><span class="label">PF Number:</span><span class="value">{{ form.get('pfNumber')?.value || 'N/A' }}</span></div>
              <div class="detail-item"><span class="label">UAN:</span><span class="value">{{ form.get('uanNumber')?.value || 'N/A' }}</span></div>
            </div>
          </div>
        </div>

        <!-- 2. Classification -->
        <div class="review-card" [class.expanded]="expanded['classification']">
          <div class="card-header" (click)="toggleSection('classification')">
            <div class="header-title">
              <span class="material-icons">corporate_fare</span>
              <h4>Classification</h4>
            </div>
            <div class="header-actions">
              <button type="button" class="btn-edit" (click)="jumpToStep(2); $event.stopPropagation()">Edit</button>
              <span class="material-icons expand-arrow">{{ expanded['classification'] ? 'expand_less' : 'expand_more' }}</span>
            </div>
          </div>
          <div class="card-body" *ngIf="expanded['classification']">
            <div class="detail-grid">
              <div class="detail-item"><span class="label">Functional Unit:</span><span class="value">{{ getMasterName('functionalUnitId') }}</span></div>
              <div class="detail-item"><span class="label">Division:</span><span class="value">{{ getMasterName('divisionId') }}</span></div>
              <div class="detail-item"><span class="label">Department:</span><span class="value">{{ getMasterName('departmentId') }}</span></div>
              <div class="detail-item"><span class="label">Location:</span><span class="value">{{ getMasterName('locationId') }}</span></div>
              <div class="detail-item"><span class="label">Sub Location:</span><span class="value">{{ getMasterName('subLocationId') }}</span></div>
              <div class="detail-item"><span class="label">Category:</span><span class="value">{{ getMasterName('categoryId') }}</span></div>
              <div class="detail-item"><span class="label">Sub Category:</span><span class="value">{{ getMasterName('subCategoryId') }}</span></div>
              <div class="detail-item"><span class="label">Designation:</span><span class="value">{{ form.get('designation')?.value }}</span></div>
              <div class="detail-item"><span class="label">Access Card:</span><span class="value">{{ form.get('accessCardNumber')?.value }}</span></div>
              <div class="detail-item"><span class="label">Reporting Manager:</span><span class="value">{{ getEmployeeName('reportingManagerId') }}</span></div>
            </div>
          </div>
        </div>

        <!-- 3. Bank Details -->
        <div class="review-card" [class.expanded]="expanded['bank']">
          <div class="card-header" (click)="toggleSection('bank')">
            <div class="header-title">
              <span class="material-icons">account_balance</span>
              <h4>Bank Details</h4>
            </div>
            <div class="header-actions">
              <button type="button" class="btn-edit" (click)="jumpToStep(3); $event.stopPropagation()">Edit</button>
              <span class="material-icons expand-arrow">{{ expanded['bank'] ? 'expand_less' : 'expand_more' }}</span>
            </div>
          </div>
          <div class="card-body" *ngIf="expanded['bank']">
            <div class="detail-grid">
              <div class="detail-item"><span class="label">Holder Name:</span><span class="value">{{ form.get('bankAccountHolder')?.value || 'N/A' }}</span></div>
              <div class="detail-item"><span class="label">Account Number:</span><span class="value">{{ form.get('bankAccountNumber')?.value }}</span></div>
              <div class="detail-item"><span class="label">Bank Name:</span><span class="value">{{ form.get('bankName')?.value }}</span></div>
              <div class="detail-item"><span class="label">Branch:</span><span class="value">{{ form.get('bankBranch')?.value }}</span></div>
              <div class="detail-item"><span class="label">IFSC:</span><span class="value">{{ form.get('bankIfsc')?.value }}</span></div>
            </div>
          </div>
        </div>

        <!-- 4. Family Details -->
        <div class="review-card" [class.expanded]="expanded['family']">
          <div class="card-header" (click)="toggleSection('family')">
            <div class="header-title">
              <span class="material-icons">groups</span>
              <h4>Family Details ({{ getFamilyArray().length }} members)</h4>
            </div>
            <div class="header-actions">
              <button type="button" class="btn-edit" (click)="jumpToStep(4); $event.stopPropagation()">Edit</button>
              <span class="material-icons expand-arrow">{{ expanded['family'] ? 'expand_less' : 'expand_more' }}</span>
            </div>
          </div>
          <div class="card-body" *ngIf="expanded['family']">
            <table class="review-sub-table" *ngIf="getFamilyArray().length > 0; else noFamily">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Relationship</th>
                  <th>DOB</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let member of getFamilyArray()">
                  <td>{{ member.memberName }}</td>
                  <td>{{ member.relationship }}</td>
                  <td>{{ member.dob || 'N/A' }}</td>
                  <td>{{ member.contactNumber || 'N/A' }}</td>
                </tr>
              </tbody>
            </table>
            <ng-template #noFamily><p class="empty-msg">No family members configured.</p></ng-template>
          </div>
        </div>

        <!-- 5. Nominee Details -->
        <div class="review-card" [class.expanded]="expanded['nominees']">
          <div class="card-header" (click)="toggleSection('nominees')">
            <div class="header-title">
              <span class="material-icons">assignment_ind</span>
              <h4>Nominee Details ({{ getNomineesArray().length }} nominees)</h4>
            </div>
            <div class="header-actions">
              <button type="button" class="btn-edit" (click)="jumpToStep(5); $event.stopPropagation()">Edit</button>
              <span class="material-icons expand-arrow">{{ expanded['nominees'] ? 'expand_less' : 'expand_more' }}</span>
            </div>
          </div>
          <div class="card-body" *ngIf="expanded['nominees']">
            <table class="review-sub-table" *ngIf="getNomineesArray().length > 0; else noNominees">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Relationship</th>
                  <th>Share %</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let nominee of getNomineesArray()">
                  <td>{{ nominee.nomineeName }}</td>
                  <td>{{ nominee.relationship }}</td>
                  <td>{{ nominee.sharePercentage }}%</td>
                </tr>
              </tbody>
            </table>
            <ng-template #noNominees><p class="empty-msg">No nominees configured.</p></ng-template>
          </div>
        </div>

        <!-- 6. Scale & Scale Details -->
        <div class="review-card" [class.expanded]="expanded['salaryScale']">
          <div class="card-header" (click)="toggleSection('salaryScale')">
            <div class="header-title">
              <span class="material-icons">payments</span>
              <h4>Scale & Scale Details</h4>
            </div>
            <div class="header-actions">
              <button type="button" class="btn-edit" (click)="jumpToStep(6); $event.stopPropagation()">Edit</button>
              <span class="material-icons expand-arrow">{{ expanded['salaryScale'] ? 'expand_less' : 'expand_more' }}</span>
            </div>
          </div>
          <div class="card-body" *ngIf="expanded['salaryScale']">
            <div style="margin-bottom: 16px; font-size: 13px; color: #475569; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px; background: #f8fafc; border-radius: 6px;">
              <div><strong>Assignment Mode:</strong> 
                <span class="badge" [ngClass]="{
                  'badge-success': form.get('assignmentMode')?.value === 'PACKAGE',
                  'badge-warning': form.get('assignmentMode')?.value === 'CUSTOM_FROM_PACKAGE',
                  'badge-primary': form.get('assignmentMode')?.value === 'CUSTOM'
                }" style="margin-left: 4px; padding: 2px 8px;">
                  {{ form.get('assignmentMode')?.value || 'PACKAGE' }}
                </span>
              </div>
              <div *ngIf="form.get('assignmentMode')?.value !== 'CUSTOM'"><strong>CTC Package:</strong> {{ getCtcPackageDetails() }}</div>
              <div><strong>Effective From:</strong> {{ form.get('effectiveFrom')?.value || 'N/A' }}</div>
              <div><strong>Revision Reason:</strong> {{ form.get('revisionReason')?.value || 'N/A' }}</div>
              <div style="grid-column: span 2;"><strong>Remarks:</strong> {{ form.get('ctcRemarks')?.value || 'N/A' }}</div>
              <div *ngIf="form.get('assignmentMode')?.value === 'CUSTOM' && form.get('saveAsPackage')?.value" style="grid-column: span 2; background: #e0f2fe; color: #0369a1; padding: 8px; border-radius: 4px; border: 1px dashed #0284c7; font-weight: 500; font-size: 12px; margin-top: 4px;">
                <strong>Save as Reusable Package:</strong> Code: <code>{{ form.get('newPackageCode')?.value }}</code>, Name: "{{ form.get('newPackageName')?.value }}"
              </div>
            </div>
            
            <table class="review-sub-table" *ngIf="currentCtcComponents.length > 0; else noSalaryComponents">
              <thead>
                <tr>
                  <th>Salary Head</th>
                  <th>Calculation Type</th>
                  <th>Value</th>
                  <th style="text-align: right;">Monthly (₹)</th>
                  <th style="text-align: right;">Annual (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let comp of currentCtcComponents">
                  <td><strong>{{ comp.salaryHead }}</strong></td>
                  <td>{{ comp.calculationType }}</td>
                  <td>{{ comp.value || 0 }}</td>
                  <td style="text-align: right;">{{ comp.monthlyAmount | number:'1.2-2' }}</td>
                  <td style="text-align: right;">{{ comp.annualAmount | number:'1.2-2' }}</td>
                </tr>
                <tr style="background-color: #f8fafc; font-weight: 700; border-top: 1px solid #cbd5e1;">
                  <td colspan="3" style="text-align: right; color: #1e293b;">Total Salary Breakup:</td>
                  <td style="text-align: right; color: #1e293b;">₹{{ (totalAnnualCTC() / 12) | number:'1.2-2' }}</td>
                  <td style="text-align: right; color: #0f766e;">₹{{ totalAnnualCTC() | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
            <ng-template #noSalaryComponents>
              <p class="empty-msg">No salary components configured.</p>
            </ng-template>
          </div>
        </div>

        <!-- 7. General Information -->
        <div class="review-card" [class.expanded]="expanded['general']">
          <div class="card-header" (click)="toggleSection('general')">
            <div class="header-title">
              <span class="material-icons">info</span>
              <h4>General Information</h4>
            </div>
            <div class="header-actions">
              <button type="button" class="btn-edit" (click)="jumpToStep(7); $event.stopPropagation()">Edit</button>
              <span class="material-icons expand-arrow">{{ expanded['general'] ? 'expand_less' : 'expand_more' }}</span>
            </div>
          </div>
          <div class="card-body" *ngIf="expanded['general']">
            <div class="detail-grid">
              <div class="detail-item span-full"><span class="label">Current Address:</span><span class="value">{{ form.get('currentAddress1')?.value }}, {{ form.get('currentCity')?.value }}, {{ form.get('currentState')?.value }} - {{ form.get('currentPinCode')?.value }}</span></div>
              <div class="detail-item span-full"><span class="label">Permanent Address:</span><span class="value">{{ form.get('permanentAddress1')?.value }}, {{ form.get('permanentCity')?.value }}, {{ form.get('permanentState')?.value }} - {{ form.get('permanentPinCode')?.value }}</span></div>
              <div class="detail-item"><span class="label">Shift Group:</span><span class="value">{{ form.get('shiftGroup')?.value }}</span></div>
              <div class="detail-item"><span class="label">Shift Name:</span><span class="value">{{ form.get('shiftName')?.value }} ({{ form.get('shiftFrom')?.value }} - {{ form.get('shiftTo')?.value }})</span></div>
              <div class="detail-item"><span class="label">Qualification:</span><span class="value">{{ form.get('highestQualification')?.value || 'N/A' }}</span></div>
              <div class="detail-item"><span class="label">University:</span><span class="value">{{ form.get('university')?.value || 'N/A' }}</span></div>
              <div class="detail-item"><span class="label">Skills:</span><span class="value">{{ form.get('skills')?.value || 'N/A' }}</span></div>
              <div class="detail-item"><span class="label">Prev Employer:</span><span class="value">{{ form.get('prevEmployer')?.value || 'N/A' }}</span></div>
            </div>
          </div>
        </div>

        <!-- 8. Attachments -->
        <div class="review-card" [class.expanded]="expanded['attachments']">
          <div class="card-header" (click)="toggleSection('attachments')">
            <div class="header-title">
              <span class="material-icons">description</span>
              <h4>Attachments ({{ getUploadedCount() }} / {{ getRequiredDocs().length }} uploaded)</h4>
            </div>
            <div class="header-actions">
              <button type="button" class="btn-edit" (click)="jumpToStep(8); $event.stopPropagation()">Edit</button>
              <span class="material-icons expand-arrow">{{ expanded['attachments'] ? 'expand_less' : 'expand_more' }}</span>
            </div>
          </div>
          <div class="card-body" *ngIf="expanded['attachments']">
            <table class="review-sub-table" *ngIf="getRequiredDocs().length > 0; else noAttachments">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Status</th>
                  <th>File Name</th>
                  <th>Uploaded By</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let doc of getRequiredDocs()">
                  <td style="font-weight: 600;">{{ doc.name }}</td>
                  <td>
                    <span 
                      class="badge" 
                      [ngClass]="{
                        'badge-success': doc.uploadedFile,
                        'badge-danger': doc.isMandatory && !doc.uploadedFile,
                        'badge-warning': !doc.isMandatory && !doc.uploadedFile
                      }"
                    >
                      {{ doc.uploadedFile ? '🟢 Uploaded' : (doc.isMandatory ? '🔴 Missing (Mandatory)' : '🟡 Missing (Optional)') }}
                    </span>
                  </td>
                  <td style="font-family: monospace; font-size: 12px;">{{ doc.uploadedFile?.originalFileName || '—' }}</td>
                  <td>{{ doc.uploadedFile?.uploadedBy || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <ng-template #noAttachments><p class="empty-msg">No attachments required.</p></ng-template>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .review-container {
      background: #ffffff;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }
    .review-header {
      margin-bottom: 20px;
      h3 { margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #1e293b; }
      .subtitle { margin: 0; font-size: 13px; color: #64748b; }
    }
    .review-cards-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .review-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      background: #f8fafc;
      transition: all 0.2s;
      
      &.expanded {
        background: #ffffff;
        border-color: #cbd5e1;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }
    }
    .card-header {
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      
      .header-title {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #334155;
        
        span { font-size: 20px; color: #64748b; }
        h4 { margin: 0; font-size: 14px; font-weight: 600; }
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .btn-edit {
        background: rgba(37, 99, 235, 0.08);
        color: #2563EB;
        border: none;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        
        &:hover {
          background: rgba(37, 99, 235, 0.15);
        }
      }
      .expand-arrow {
        color: #64748b;
        font-size: 20px;
      }
    }
    .card-body {
      padding: 20px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      &.span-full {
        grid-column: 1 / -1;
      }
      
      .label {
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 600;
        color: #94a3b8;
      }
      .value {
        font-size: 13px;
        font-weight: 500;
        color: #1e293b;
      }
    }
    .review-sub-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      
      th, td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #f1f5f9;
      }
      th {
        background: #1a2b4a;
        font-weight: 600;
        color: #ffffff;
      }
      td {
        color: #334155;
      }
      tbody tr:nth-child(even) {
        background: #f8fafc;
      }
      tbody tr:hover {
        background: #eef2ff;
      }
    }
    .empty-msg {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      font-style: italic;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      font-size: 11px;
      border-radius: 12px;
      font-weight: 600;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-primary { background: #e0f2fe; color: #0369a1; }
  `]
})
export class EmployeeReviewComponent {
  @Input() form!: FormGroup;
  @Input() uploadedDocuments: any[] = [];
  @Input() masterData: {
    locations: any[];
    subLocations: any[];
    departments: any[];
    functionalUnits: any[];
    divisions: any[];
    categories: any[];
    subCategories: any[];
    employees: any[];
  } = {
    locations: [],
    subLocations: [],
    departments: [],
    functionalUnits: [],
    divisions: [],
    categories: [],
    subCategories: [],
    employees: []
  };
  @Input() ctcMasters: any[] = [];

  @Output() stepSelected = new EventEmitter<number>();

  expanded: { [key: string]: boolean } = {
    primary: true,
    classification: false,
    bank: false,
    family: false,
    nominees: false,
    salaryScale: false,
    general: false,
    attachments: false
  };

  toggleSection(section: string) {
    this.expanded[section] = !this.expanded[section];
  }

  jumpToStep(step: number) {
    this.stepSelected.emit(step);
  }

  getFamilyArray(): any[] {
    const arr = this.form.get('family') as FormArray;
    return arr ? arr.value : [];
  }

  getCtcPackageDetails(): string {
    const ctcId = this.form.get('ctcId')?.value;
    if (!ctcId) return 'None / Custom';
    const match = this.ctcMasters.find(c => c.id === ctcId);
    let details = match ? `${match.ctcName} (₹${match.annualCTC.toLocaleString('en-IN')}/Yr)` : 'None / Custom';
    if (this.form.get('overrideFlag')?.value) {
      details += ' - Custom Overridden';
    }
    return details;
  }

  get currentCtcComponents(): any[] {
    if (this.form.get('overrideFlag')?.value) {
      const arr = this.form.get('customComponents') as FormArray;
      return arr ? arr.value : [];
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

  getNomineesArray(): any[] {
    const arr = this.form.get('nominees') as FormArray;
    return arr ? arr.value : [];
  }

  getSalaryArray(): any[] {
    const arr = this.form.get('salaryHistory') as FormArray;
    return arr ? arr.value : [];
  }

  getScaleArray(): any[] {
    const arr = this.form.get('scaleHistory') as FormArray;
    return arr ? arr.value : [];
  }

  getMasterName(controlName: string): string {
    const id = this.form.get(controlName)?.value;
    if (!id) return 'N/A';
    
    let list: any[] = [];
    if (controlName === 'locationId') list = this.masterData.locations;
    else if (controlName === 'subLocationId') list = this.masterData.subLocations;
    else if (controlName === 'departmentId') list = this.masterData.departments;
    else if (controlName === 'functionalUnitId') list = this.masterData.functionalUnits;
    else if (controlName === 'divisionId') list = this.masterData.divisions;
    else if (controlName === 'categoryId') list = this.masterData.categories;
    else if (controlName === 'subCategoryId') list = this.masterData.subCategories;

    const match = list.find(item => item.id === id);
    return match ? match.name : id;
  }

  getEmployeeName(controlName: string): string {
    const id = this.form.get(controlName)?.value;
    if (!id) return 'N/A';
    const match = this.masterData.employees.find(e => e.id === id);
    return match ? match.employeeName : id;
  }

  getRequiredDocs(): any[] {
    const categoryId = this.form.get('categoryId')?.value;
    const categoryObj = this.masterData.categories.find(c => c.id === categoryId);
    const categoryName = categoryObj ? categoryObj.name.toLowerCase() : '';
    
    const isEmployee = categoryName.includes('employee');
    const isConsultant = categoryName.includes('consultant');
    const isIntern = categoryName.includes('intern') || categoryName.includes('apprentice');

    const expType = this.form.get('experienceType')?.value || 'Fresher';
    const isExperienced = expType === 'Experienced';

    const docs = [
      { type: 'AADHAAR', name: 'Aadhaar Card', isMandatory: true, isApplicable: true },
      { type: 'PAN', name: 'PAN Card', isMandatory: true, isApplicable: true },
      { type: 'BANK_PASSBOOK', name: 'Bank Passbook', isMandatory: true, isApplicable: true },
      { type: 'RESUME', name: 'Resume', isMandatory: true, isApplicable: true },
      { type: 'OFFER_LETTER', name: 'Offer Letter', isMandatory: true, isApplicable: true },
      { type: 'TWELFTH_CERTIFICATE', name: '12th Marksheet / Diploma Certificate', isMandatory: true, isApplicable: true },
      { type: 'UG_CERTIFICATE', name: 'UG Degree Certificate', isMandatory: isEmployee || isConsultant, isApplicable: !isIntern },
      { type: 'PG_CERTIFICATE', name: 'PG Degree Certificate', isMandatory: false, isApplicable: !isIntern },
      { type: 'PASSPORT', name: 'Passport', isMandatory: false, isApplicable: !isIntern },
      { type: 'EXPERIENCE_CERTIFICATE', name: 'Experience Certificate', isMandatory: isExperienced, isApplicable: !isIntern && isExperienced },
      { type: 'RELIEVING_LETTER', name: 'Relieving Letter', isMandatory: isExperienced, isApplicable: !isIntern && isExperienced }
    ];

    return docs.filter(d => d.isApplicable).map(d => {
      const uploaded = this.uploadedDocuments.find(u => u.documentType === d.type);
      return {
        ...d,
        uploadedFile: uploaded || null
      };
    });
  }

  getUploadedCount(): number {
    return this.getRequiredDocs().filter(d => d.uploadedFile).length;
  }

  totalAnnualCTC(): number {
    return this.currentCtcComponents.reduce((sum, c) => sum + (parseFloat(c.annualAmount) || 0), 0);
  }
}
