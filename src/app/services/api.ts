import { Injectable } from '@angular/core';
import { MOCK_EMPLOYEES, MOCK_ATTENDANCE_RECORDS } from '../constants';
import type {
  Employee, AttendanceSummary, AttendanceRecord, ImportSummary,
  AttendanceSummaryCount, AttendanceType, ForgotCardRecord,
  LeaveRequest, CompensationRequest, AttendanceAdjustmentRecord
} from '../models';

const delay = (ms = 800) => new Promise(res => setTimeout(res, ms));

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Employee API
  async fetchEmployee(code: string): Promise<Employee> {
    await delay();
    const emp = MOCK_EMPLOYEES.find((e: Employee) => e.employeeCode.toLowerCase() === code.toLowerCase());
    if (!emp) throw new Error('Employee not found or employee is inactive.');
    return emp;
  }

  // Attendance View API
  async fetchAttendanceSummary(employeeCode: string): Promise<AttendanceSummary> {
    await delay();
    const emp = MOCK_EMPLOYEES.find((e: Employee) => e.employeeCode.toLowerCase() === employeeCode.toLowerCase());
    if (!emp) throw new Error('Employee not found or employee is inactive.');
    return { totalLeaveDays: 3.5, alopDays: 1.0, adjustmentDays: 0.5 };
  }

  async fetchAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    await delay();
    const normalizedDate = date.includes('-') ? date.split('-').reverse().join('/') : date;
    const records = MOCK_ATTENDANCE_RECORDS.filter((record: AttendanceRecord) => record.date === normalizedDate);

    return records.map((record: AttendanceRecord) => {
      let status: AttendanceRecord['status'] = 'Present';
      let remarks = '';

      if (record.attendanceType === 'Absent') {
        status = 'Absent';
        remarks = 'Absent';
      } else if (record.attendanceType === 'Unpunch') {
        status = 'Late';
        remarks = 'Unpunched';
      } else if (record.attendanceType === 'Partial Present') {
        status = 'Half Day';
        remarks = 'Partial Present';
      } else if (record.leaveHaving) {
        status = 'Leave';
        remarks = 'Leave';
      }

      return {
        ...record,
        status,
        remarks: remarks || undefined,
        inTime: record.inTime || undefined,
        outTime: record.outTime || undefined,
      };
    });
  }

  // Attendance Import API
  async importAttendance(_date: string, file: File): Promise<ImportSummary> {
    await delay(1500);
    if (file.size > 10 * 1024 * 1024) throw new Error('File size exceeds the maximum allowed limit of 10 MB.');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'csv'].includes(ext || '')) throw new Error('Only .xlsx and .csv files are supported.');
    return {
      totalRecords: 45,
      successRecords: 42,
      failedRecords: 3,
      duplicateRecords: 2,
      skippedRecords: 1,
      errors: [
        { row: 5, employeeCode: 'EMP099', message: 'Employee Code not found in master.' },
        { row: 12, employeeCode: 'EMP007', message: 'Duplicate attendance record for this date.' },
        { row: 28, employeeCode: 'EMP015', message: 'Invalid time format in In Time column.' },
      ],
    };
  }

  async exportValidationReport(summary: ImportSummary): Promise<Blob> {
    await delay();
    const payload = JSON.stringify(summary, null, 2);
    return new Blob([payload], { type: 'application/json' });
  }

  async importAttendanceToDatabase(_attendanceDate: string, summary: ImportSummary): Promise<{ importedCount: number; skippedCount: number }> {
    await delay();
    return {
      importedCount: summary.successRecords,
      skippedCount: (summary.skippedRecords ?? 0) + (summary.duplicateRecords ?? 0),
    };
  }

  // Attendance Adjustment API
  async fetchAttendanceAdjustmentRecords(month: string): Promise<{ records: AttendanceAdjustmentRecord[] }> {
    await delay(300);

    if (!month) {
      return { records: [] };
    }

    // month comes from <input type="month"> as 'yyyy-MM'
    const [year, mon] = month.split('-');

    // MOCK_ATTENDANCE_RECORDS store date as 'dd/mm/yyyy' (see fetchAttendanceByDate above)
    const matchingRecords = MOCK_ATTENDANCE_RECORDS.filter((record: AttendanceRecord) => {
      const parts = record.date.split('/');
      if (parts.length !== 3) return false;
      const [, recMonth, recYear] = parts;
      return recMonth === mon && recYear === year;
    });

    return {
      records: matchingRecords.slice(0, 8).map((record: AttendanceRecord, index: number) => ({
        id: `${record.date}-${index}`,
        employeeCode: record.employeeCode,
        employeeName: record.employeeName,
        employeeType: index % 2 === 0 ? 'NEW' : 'EXISTING',
        tLDays: index % 3 === 0 ? 1.5 : 0.5,
        alopDays: index % 2 === 0 ? 0.5 : 0.0,
        adjDays: index % 4 === 0 ? 1.0 : 0.0,
        photo: undefined,
        location: 'Head Office',
        department: 'Operations',
        division: 'Attendance',
        dateOfJoining: '2022-01-15',
      })),
    };
  }

  async fetchAttendanceRecords(_date: string, types: AttendanceType[]): Promise<{ records: AttendanceRecord[], summary: AttendanceSummaryCount }> {
    await delay();
    const records = MOCK_ATTENDANCE_RECORDS.filter((r: AttendanceRecord) =>
      types.length === 0 || (r.attendanceType != null && types.includes(r.attendanceType))
    );
    const summary: AttendanceSummaryCount = {
      totalEmployees: MOCK_ATTENDANCE_RECORDS.length,
      present: MOCK_ATTENDANCE_RECORDS.filter((r: AttendanceRecord) => r.attendanceType === 'Attendance').length,
      absent: MOCK_ATTENDANCE_RECORDS.filter((r: AttendanceRecord) => r.attendanceType === 'Absent').length,
      unpunch: MOCK_ATTENDANCE_RECORDS.filter((r: AttendanceRecord) => r.attendanceType === 'Unpunch').length,
      deputation: MOCK_ATTENDANCE_RECORDS.filter((r: AttendanceRecord) => r.attendanceType === 'Deputation').length,
      forgotCard: 0,
      partialPresent: MOCK_ATTENDANCE_RECORDS.filter((r: AttendanceRecord) => r.attendanceType === 'Partial Present').length,
      wah: 0,
      onDuty: 0,
      leave: MOCK_ATTENDANCE_RECORDS.filter((r: AttendanceRecord) => r.leaveHaving).length,
      total: MOCK_ATTENDANCE_RECORDS.length,
    };
    return { records, summary };
  }

  async saveAttendanceAdjustments(records: AttendanceRecord[]): Promise<void> {
    await delay();
    console.log('Saved adjustments:', records);
  }

  // Forgot Card API
  async saveForgotCard(data: ForgotCardRecord): Promise<void> {
    await delay();
    if (data.temporaryCardNumber === data.originalCardNumber) {
      throw new Error('Temporary Card Number must be different from the Original Card Number.');
    }
    if (data.temporaryCardNumber === 'CARD-USED') {
      throw new Error('This temporary card is already assigned to another employee.');
    }
  }

  async revertForgotCard(_data: { employeeCode: string; temporaryCardNumber: string }): Promise<void> {
    await delay();
  }

  // Leave Request API
  async submitLeaveRequest(_data: LeaveRequest): Promise<{ referenceNumber: string }> {
    await delay();
    return { referenceNumber: `LR-${Date.now()}` };
  }

  // Compensation Request API
  async submitCompensationRequest(_data: CompensationRequest): Promise<{ referenceNumber: string }> {
    await delay();
    return { referenceNumber: `CR-${Date.now()}` };
  }
}