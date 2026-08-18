import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { SearchService } from '../../services/search.service';
import { LucideAngularModule } from 'lucide-angular';
import { EMPLOYEE_MASTER } from '../../data/employee-data';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

/**
 * Base URL of the deployed HRMS portal, used to build the "view/download
 * your payslip" link sent in the email. Currently pointed at the local dev
 * server — the link will only resolve while `ng serve` is running on this
 * machine. Swap this for the real domain once the app is deployed.
 */
const HRMS_PORTAL_URL = 'http://localhost:4200';

/** localStorage key used to persist generated batches so the "View / Download
 * Full Payslip" email link can find the right payslip on a fresh page load
 * (this component previously kept everything in memory only, so a page
 * reload — like the one that happens when a link is opened from an email —
 * would always show an empty page). */
const STORAGE_KEY = 'hrms_salary_generation_batches_v1';

interface GeneratedRow {
  empCode: string;
  empName: string;
  category: string;
  location: string;
  department: string;
  designation: string;
  doj: string;
  bankName: string;
  bankAccountNo: string;
  panNumber: string;
  email?: string;
  earnings: { basic: number; hra: number; conveyance: number; otherAllowance: number };
  deductions: { pf: number; professionalTax: number; incomeTax: number };
  gross: number;
  deductionTotal: number;
  net: number;
}

interface Batch {
  key: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  generatedBy: string;
  generatedOn: string;
  rows: GeneratedRow[];
}

const COMPANY = {
  name: 'Eazy Design Systems',
  address: 'No. 15, 2nd Floor, Tech Park, Outer Ring Road,\nBangalore, Karnataka - 560103',
  email: 'info@eaze.com',
};

function todayISO() { return new Date().toISOString().slice(0, 10); }
function monthStartISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function monthEndISO() {
  const d = new Date();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
}

function formatTimestamp(date: Date) {
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).replace(',', '');
}

function formatDateDMY(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

function formatMonthLabel(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function numberToWordsIndian(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function twoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }
  function threeDigits(n: number): string {
    if (n < 100) return twoDigits(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
  }
  let n = Math.round(num);
  if (n === 0) return 'Zero';
  let result = '';
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh  = Math.floor(n / 100000);   n %= 100000;
  const thousand = Math.floor(n / 1000);  n %= 1000;
  const hundred = n;
  if (crore)    result += threeDigits(crore) + ' Crore ';
  if (lakh)     result += threeDigits(lakh) + ' Lakh ';
  if (thousand) result += threeDigits(thousand) + ' Thousand ';
  if (hundred)  result += threeDigits(hundred);
  return result.trim();
}

@Component({
  selector: 'app-salary-generation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './salary-generation.component.html',
  styleUrls: ['./salary-generation.component.scss']
})
export class SalaryGenerationComponent implements OnInit {
  CATEGORIES = ['Employee', 'Contract Staff', 'All'];
  LOCATIONS = ['Domestic', 'Acer Project'];
  COMPANY = COMPANY;

  category = 'Employee';
  genDate = '';
  location = 'Domestic';
  startDate = '';
  endDate = '';

  errors: Record<string, string> = {};
  isGenerating = false;
  generatedBatches: Batch[] = [];
  generatedKeys = new Set<string>();
  conflict: any = null;
  previewSelection: { batchKey: string; empCode: string } | null = null;
  isSlipEditing = false;
  // Reference to the rendered slip DOM node (template ref #slipContainer),
  // used to snapshot each employee's slip into a PDF for the email attachment.
  @ViewChild('slipContainer') slipContainerRef?: ElementRef<HTMLElement>;
  editSlipValues: any = null;

  constructor(
    private toastService: ToastService,
    public searchService: SearchService,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  /** Filters any row array by the topbar search term. */
  filterRows<T extends Record<string, any>>(rows: T[]): T[] {
    return rows.filter(r => this.searchService.matches(r));
  }

  ngOnInit() {
    this.loadBatchesFromStorage();

    const emp = this.route.snapshot.queryParamMap.get('emp');
    const batchKey = this.route.snapshot.queryParamMap.get('batchKey');
    if (!emp) return;

    const batch = batchKey
      ? this.generatedBatches.find(b => b.key === batchKey)
      : this.generatedBatches.find(b => b.rows.some(r => r.empCode === emp));
    const row = batch?.rows.find(r => r.empCode === emp);

    if (batch && row) {
      this.previewSelection = { batchKey: batch.key, empCode: emp };
    } else {
      this.toastService.addToast(
        'Could not find that payslip on this device. It may have been generated on a different browser/computer.',
        'warning'
      );
    }
  }

  private saveBatchesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.generatedBatches));
    } catch (err) {
      console.error('Failed to persist generated salary batches:', err);
    }
  }

  private loadBatchesFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: Batch[] = JSON.parse(raw);
      this.generatedBatches = parsed;
      this.generatedKeys = new Set(parsed.map(b => b.key));
    } catch (err) {
      console.error('Failed to load persisted salary batches:', err);
    }
  }

  makeKey(cat: string) {
    return `${cat}|${this.location}|${this.startDate}|${this.endDate}`;
  }

  get currentKey() {
    return this.makeKey(this.category);
  }

  validate(): boolean {
    const e: Record<string, string> = {};
    if (!this.category) e['category'] = 'Please select a Category.';
    if (!this.location) e['location'] = 'Please select a Location.';
    if (!this.startDate) e['startDate'] = 'Start Date is mandatory.';
    if (!this.endDate) e['endDate'] = 'End Date is mandatory.';
    if (this.startDate && this.endDate && new Date(this.endDate) < new Date(this.startDate)) {
      e['endDate'] = 'End Date cannot be before Start Date.';
    }
    this.errors = e;
    if (Object.keys(e).length) {
      this.toastService.addToast(Object.values(e)[0], 'error');
      return false;
    }
    return true;
  }

  runGeneration(resolvedCategory: string) {
    const key = this.makeKey(resolvedCategory);
    this.isGenerating = true;
    this.toastService.addToast('Salary generation started…', 'success');

    setTimeout(() => {
      const matches = EMPLOYEE_MASTER.filter(e =>
        (resolvedCategory === 'All' || e.category === resolvedCategory) &&
        e.location === this.location
      );

      const rows: GeneratedRow[] = matches.map(e => {
        const totalEarnings = e.earnings.basic + e.earnings.hra + e.earnings.conveyance + e.earnings.otherAllowance;
        const totalDeductions = e.deductions.pf + e.deductions.professionalTax + e.deductions.incomeTax;
        return {
          ...e,
          gross: totalEarnings,
          deductionTotal: totalDeductions,
          net: totalEarnings - totalDeductions
        };
      });

      const newBatch: Batch = {
        key,
        category: resolvedCategory,
        location: this.location,
        startDate: this.startDate,
        endDate: this.endDate,
        generatedBy: 'Admin',
        generatedOn: formatTimestamp(new Date()),
        rows
      };

      this.generatedBatches = [...this.generatedBatches, newBatch];
      this.generatedKeys.add(key);
      this.saveBatchesToStorage();
      this.isGenerating = false;
      this.toastService.addToast(rows.length ? `Salary generated successfully for ${rows.length} employee(s).` : 'No employees matched the selected filters.', 'success');
      if (rows.length) {
        this.previewSelection = { batchKey: key, empCode: rows[0].empCode };
      }
    }, 1200);
  }

  handleGenerate() {
    this.genDate = todayISO();
    if (!this.validate()) return;
    const empKey = this.makeKey('Employee');
    const contractKey = this.makeKey('Contract Staff');
    const allKey = this.makeKey('All');
    const empDone = this.generatedKeys.has(empKey);
    const contractDone = this.generatedKeys.has(contractKey);
    const allDone = this.generatedKeys.has(allKey);

    if (this.generatedKeys.has(this.currentKey)) {
      this.toastService.addToast('Salary has already been generated for this cycle.', 'warning');
      return;
    }

    if (this.category === 'All') {
      if (empDone && contractDone) {
        this.conflict = {
          message: `Salary has already been generated separately for both Employee and Contract Staff for ${this.location} (${this.startDate} to ${this.endDate}). There is nothing left to generate under "All".`,
          alreadyDone: ['Employee', 'Contract Staff'],
          canProceedWith: null
        };
        return;
      }
      if (empDone && !contractDone) {
        this.conflict = {
          message: `Salary for Employee has already been generated for ${this.location} (${this.startDate} to ${this.endDate}). Generating "All" would duplicate those records.`,
          alreadyDone: ['Employee'],
          canProceedWith: 'Contract Staff'
        };
        return;
      }
      if (contractDone && !empDone) {
        this.conflict = {
          message: `Salary for Contract Staff has already been generated for ${this.location} (${this.startDate} to ${this.endDate}). Generating "All" would duplicate those records.`,
          alreadyDone: ['Contract Staff'],
          canProceedWith: 'Employee'
        };
        return;
      }
    }

    if (allDone && (this.category === 'Employee' || this.category === 'Contract Staff')) {
      this.conflict = {
        message: `Salary for "All" categories has already been generated for ${this.location} (${this.startDate} to ${this.endDate}), which includes ${this.category}. Generating it again separately would create duplicate records.`,
        alreadyDone: ['All (Employee + Contract Staff)'],
        canProceedWith: null
      };
      return;
    }

    this.runGeneration(this.category);
  }

  handleModalProceed(resolvedCategory: string) {
    this.conflict = null;
    this.category = resolvedCategory;
    this.runGeneration(resolvedCategory);
  }

  handleCancel() {
    this.category = 'Employee';
    this.genDate = '';
    this.location = 'Domestic';
    this.startDate = '';
    this.endDate = '';
    this.errors = {};
    this.isGenerating = false;
    this.generatedBatches = [];
    this.generatedKeys.clear();
    this.previewSelection = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  get currentBatch() {
    return this.generatedBatches.find(b => b.key === this.currentKey);
  }

  get status() {
    return this.isGenerating ? 'Processing' : this.currentBatch ? 'Completed' : null;
  }

  get statusClass() {
    return this.status === 'Completed' ? 'status-approved' : this.status === 'Processing' ? 'status-pending' : '';
  }

  get allRows(): GeneratedRow[] {
    return this.generatedBatches.flatMap(b => b.rows);
  }

  get totals() {
    const rows = this.allRows;
    return {
      employees: rows.length,
      earnings: rows.reduce((sum, r) => sum + r.gross, 0),
      deductions: rows.reduce((sum, r) => sum + r.deductionTotal, 0),
      netPay: rows.reduce((sum, r) => sum + r.net, 0)
    };
  }

  get previewBatch() {
    return this.previewSelection ? this.generatedBatches.find(b => b.key === this.previewSelection!.batchKey) : null;
  }

  get previewRow() {
    return (this.previewBatch && this.previewSelection) ? this.previewBatch.rows.find(r => r.empCode === this.previewSelection!.empCode) : null;
  }

  handlePreview(batchKey: string, empCode: string) {
    this.previewSelection = { batchKey, empCode };
    this.isSlipEditing = false;
  }

  async handleSaveSendAll() {
    if (!this.allRows.length) {
      this.toastService.addToast('Generate salary first before sending emails.', 'warning');
      return;
    }

    const recipients = this.allRows.filter(r => !!r.email);
    if (!recipients.length) {
      this.toastService.addToast('No employee has an email on file — add one in employee-data.ts to send a payslip.', 'warning');
      return;
    }

    this.toastService.addToast('Sending payslip email…', 'success');

    try {
      for (const r of recipients) {
        const batch = this.generatedBatches.find(b => b.rows.some(row => row.empCode === r.empCode));
        const payPeriod = batch ? `${formatDateDMY(batch.startDate)} to ${formatDateDMY(batch.endDate)}` : '';
        const payDate = batch ? formatDateDMY(batch.endDate) : '';

        // Points the recipient back to the portal, pre-selecting their own
        // payslip via query params — replace HRMS_PORTAL_URL below once this
        // app is deployed. Note: this only resolves to the right payslip on
        // the *same device/browser* the batch was generated on, since
        // batches are persisted to localStorage rather than a real shared
        // backend.
        const payslipLink = batch
          ? `${HRMS_PORTAL_URL}/salary-generation?emp=${encodeURIComponent(r.empCode)}&batchKey=${encodeURIComponent(batch.key)}`
          : `${HRMS_PORTAL_URL}/salary-generation`;

        // Render this employee's slip off the on-screen preview and turn it
        // into a base64 PDF so it can go out as a real email attachment
        // (rather than only linking back to the portal).
        const pdfResult = batch
          ? await this.generatePayslipPdfBase64(batch.key, r.empCode)
          : null;

        await firstValueFrom(this.apiService.sendPayslipMail({
          to: r.email!,
          subject: `Your Payslip - ${payPeriod}`,
          payslip: {
            to_name: r.empName,
            emp_code: r.empCode,
            designation: r.designation,
            department: r.department,
            location: r.location,
            doj: r.doj,
            bank_name: r.bankName,
            bank_account_no: r.bankAccountNo,
            pan_number: r.panNumber,
            pay_period: payPeriod,
            pay_date: payDate,
            basic: r.earnings.basic.toFixed(2),
            hra: r.earnings.hra.toFixed(2),
            conveyance: r.earnings.conveyance.toFixed(2),
            other_allowance: r.earnings.otherAllowance.toFixed(2),
            total_earnings: r.gross.toFixed(2),
            pf: r.deductions.pf.toFixed(2),
            professional_tax: r.deductions.professionalTax.toFixed(2),
            income_tax: r.deductions.incomeTax.toFixed(2),
            total_deductions: r.deductionTotal.toFixed(2),
            net_pay: r.net.toFixed(2),
            company_name: COMPANY.name,
            company_address: COMPANY.address,
            payslip_link: payslipLink
          },
          ...(pdfResult ? { pdfBase64: pdfResult.base64, pdfFileName: pdfResult.fileName } : {})
        }));
      }

      this.toastService.addToast(
        `Payslip emailed to ${recipients.map(r => r.empName).join(', ')}.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      this.toastService.addToast('Failed to send payslip email. Check that node-backend is running and .env is configured.', 'error');
    }
  }

  handleExport() {
    if (!this.allRows.length) {
      this.toastService.addToast('Generate salary first before exporting.', 'warning');
      return;
    }

    const sheetData = this.generatedBatches.flatMap(batch =>
      batch.rows.map((r, i) => ({
        '#': i + 1,
        'Employee Code': r.empCode,
        'Employee Name': r.empName,
        'Category': r.category,
        'Location': r.location,
        'Department': r.department,
        'Designation': r.designation,
        'Pay Period': `${formatDateDMY(batch.startDate)} to ${formatDateDMY(batch.endDate)}`,
        'Basic (₹)': r.earnings.basic,
        'HRA (₹)': r.earnings.hra,
        'Conveyance (₹)': r.earnings.conveyance,
        'Other Allowance (₹)': r.earnings.otherAllowance,
        'Total Earnings (₹)': r.gross,
        'PF (₹)': r.deductions.pf,
        'Professional Tax (₹)': r.deductions.professionalTax,
        'Income Tax (₹)': r.deductions.incomeTax,
        'Total Deductions (₹)': r.deductionTotal,
        'Net Pay (₹)': r.net,
        'Status': 'Processed'
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    worksheet['!cols'] = Object.keys(sheetData[0]).map(() => ({ wch: 20 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Salary Generation');
    XLSX.writeFile(workbook, `Salary_Generation_${this.endDate}.xlsx`);
    this.toastService.addToast('Salary data exported to Excel successfully.', 'success');
  }

  // Edit Slip Preview Functions
  handleUpdateClick() {
    if (!this.previewRow) return;
    this.editSlipValues = {
      earnings: { ...this.previewRow.earnings },
      deductions: { ...this.previewRow.deductions }
    };
    this.isSlipEditing = true;
  }

  handleSaveUpdate() {
    if (!this.previewSelection) return;
    const { batchKey, empCode } = this.previewSelection;
    this.generatedBatches = this.generatedBatches.map(batch => {
      if (batch.key !== batchKey) return batch;
      return {
        ...batch,
        rows: batch.rows.map(r => {
          if (r.empCode !== empCode) return r;
          const newEarnings = { ...this.editSlipValues.earnings };
          const newDeductions = { ...this.editSlipValues.deductions };
          const gross = newEarnings.basic + newEarnings.hra + newEarnings.conveyance + newEarnings.otherAllowance;
          const deductionTotal = newDeductions.pf + newDeductions.professionalTax + newDeductions.incomeTax;
          return {
            ...r,
            earnings: newEarnings,
            deductions: newDeductions,
            gross,
            deductionTotal,
            net: gross - deductionTotal
          };
        })
      };
    });

    this.isSlipEditing = false;
    this.saveBatchesToStorage();
    this.toastService.addToast(`Salary slip updated for ${this.previewRow?.empName}.`, 'success');
  }

  /** Renders a slip DOM node into a jsPDF document (shared by download + email-attachment paths). */
  private async renderSlipElementToPdf(el: HTMLElement): Promise<jsPDF> {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    return pdf;
  }

  async handleDownloadPDF(el: HTMLElement) {
    if (!el) {
      this.toastService.addToast('Could not find slip element.', 'error');
      return;
    }
    this.toastService.addToast('Preparing PDF…', 'success');

    try {
      const pdf = await this.renderSlipElementToPdf(el);
      pdf.save(`PaySlip_${this.previewRow?.empCode}_${this.previewBatch?.endDate}.pdf`);
      this.toastService.addToast(`Salary slip downloaded for ${this.previewRow?.empName}.`, 'success');
    } catch (err) {
      console.error(err);
      this.toastService.addToast('PDF generation failed. Please try again.', 'error');
    }
  }

  /**
   * Renders the payslip for a specific employee/batch by temporarily driving
   * the same on-screen preview used by "Download PDF", then snapshots it and
   * returns the PDF as a base64 string (no `data:` prefix) ready to attach
   * to an email. Restores whatever was previously previewed when done.
   */
  private async generatePayslipPdfBase64(batchKey: string, empCode: string): Promise<{ base64: string; fileName: string } | null> {
    const previousSelection = this.previewSelection;
    const previousEditing = this.isSlipEditing;

    this.previewSelection = { batchKey, empCode };
    this.isSlipEditing = false;
    this.cdr.detectChanges();
    // Give the browser a moment to paint the newly-bound values before html2canvas reads the DOM.
    await new Promise((resolve) => setTimeout(resolve, 60));

    const el = this.slipContainerRef?.nativeElement;
    let result: { base64: string; fileName: string } | null = null;

    if (el) {
      const pdf = await this.renderSlipElementToPdf(el);
      const dataUri = pdf.output('datauristring'); // "data:application/pdf;base64,...."
      const base64 = dataUri.split(',')[1];
      const batch = this.generatedBatches.find(b => b.key === batchKey);
      result = { base64, fileName: `PaySlip_${empCode}_${batch?.endDate || ''}.pdf` };
    }

    this.previewSelection = previousSelection;
    this.isSlipEditing = previousEditing;
    this.cdr.detectChanges();

    return result;
  }

  // Number/words/formatting helpers for template
  numberToWords(n: number) {
    return numberToWordsIndian(n);
  }

  formatDateDMYStr(iso: string) {
    return formatDateDMY(iso);
  }

  formatMonthLabelStr(iso: string) {
    return formatMonthLabel(iso);
  }

  goBack() {
    window.history.back();
  }
}