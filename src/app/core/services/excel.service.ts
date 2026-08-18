import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface UploadRow {
  employeeCode: string;
  incrementAmount: number;
  effectiveDate: string;
  remarks?: string;
}

export interface PreviewRow {
  employeeCode: string;
  employeeName: string;
  department: string;
  currentSalary: number;
  incrementAmount: number;
  revisedSalary: number;
  effectiveDate: string;
  remarks?: string;
  status: 'valid' | 'invalid';
  errors: string[];
}

interface EmployeeLookup {
  empCode: string;
  name: string;
  department: string;
  designation: string;
  currentCtc: number;
  status: string;
}

interface ExistingIncrementLookup {
  empCode: string;
  increDate: string;
}

@Injectable({ providedIn: 'root' })
export class ExcelService {
  /** Parses an uploaded .xlsx/.xls file into raw upload rows. */
  async parseExcelFile(file: File): Promise<UploadRow[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    return raw
      .map((row) => ({
        employeeCode: String(row['Employee Code'] ?? row['empCode'] ?? '').trim(),
        incrementAmount: Number(row['Increment Amount'] ?? row['incrementAmount'] ?? 0),
        effectiveDate: String(row['Effective Date'] ?? row['effectiveDate'] ?? '').trim(),
        remarks: String(row['Remarks'] ?? row['remarks'] ?? '').trim() || undefined
      }))
      .filter((row) => row.employeeCode.length > 0);
  }

  /** Cross-checks uploaded rows against known employees and existing increments. */
  validateRows(
    uploadRows: UploadRow[],
    employees: EmployeeLookup[],
    existingIncrements: ExistingIncrementLookup[],
    defaultEffectiveDate: string
  ): PreviewRow[] {
    return uploadRows.map((row) => {
      const errors: string[] = [];
      const emp = employees.find((e) => e.empCode === row.employeeCode);
      const effectiveDate = row.effectiveDate || defaultEffectiveDate;

      if (!emp) {
        errors.push(`Employee code ${row.employeeCode} not found`);
      } else if (emp.status && emp.status !== 'Active') {
        errors.push(`Employee ${row.employeeCode} is not active`);
      }

      if (!row.incrementAmount || row.incrementAmount <= 0) {
        errors.push('Increment amount must be greater than zero');
      }

      if (
        emp &&
        existingIncrements.some((r) => r.empCode === row.employeeCode && r.increDate === effectiveDate)
      ) {
        errors.push(`Increment already exists for ${effectiveDate}`);
      }

      const currentSalary = emp?.currentCtc ?? 0;
      const incrementAmount = row.incrementAmount || 0;

      return {
        employeeCode: row.employeeCode,
        employeeName: emp?.name ?? 'Unknown',
        department: emp?.department ?? '\u2014',
        currentSalary,
        incrementAmount,
        revisedSalary: currentSalary + incrementAmount,
        effectiveDate,
        remarks: row.remarks,
        status: errors.length ? 'invalid' : 'valid',
        errors
      };
    });
  }

  getSummary(rows: PreviewRow[]): { total: number; valid: number; invalid: number } {
    const valid = rows.filter((r) => r.status === 'valid').length;
    const invalid = rows.filter((r) => r.status === 'invalid').length;
    return { total: rows.length, valid, invalid };
  }

  downloadTemplate(): void {
    const ws = XLSX.utils.json_to_sheet([
      { 'Employee Code': 'EMP001', 'Increment Amount': 5000, 'Effective Date': '2026-06-01', Remarks: '' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'increment-upload-template.xlsx');
  }

  downloadErrorReport(rows: PreviewRow[]): void {
    const invalid = rows.filter((r) => r.status === 'invalid');
    const ws = XLSX.utils.json_to_sheet(
      invalid.map((r) => ({
        'Employee Code': r.employeeCode,
        'Employee Name': r.employeeName,
        Errors: r.errors.join('; ')
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, 'increment-upload-errors.xlsx');
  }
}
