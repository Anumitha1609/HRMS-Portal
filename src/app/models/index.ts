export type AttendanceRowStatus = 'Success' | 'Error' | 'Warning' | 'Partial';

export interface AttendanceResultRow {
  employeeCode: string;
  employeeName: string;
  date: string;
  inTime: string;
  outTime: string;
  workHours: string;
  status: AttendanceRowStatus;
  remarks: string;
}
export interface Employee {
  employeeCode: string;
  employeeName: string;
  photo?: string;
  originalCardNumber?: string;
  department?: string;
  designation?: string;
}

export interface AttendanceSummary {
  totalLeaveDays: number;
  alopDays: number;
  adjustmentDays: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  employeeCode: string;
  employeeName: string;
  inTime?: string;
  outTime?: string;
  actualIn?: string;
  actualOut?: string;
  totalHours?: number;
  attendanceType?: AttendanceType;
  leaveHaving?: boolean;
  status?: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave';
  remarks?: string;
}

export interface AttendanceAdjustmentRecord {
  id: string;
  employeeCode: string;
  employeeName: string;
  employeeType?: string;
  tLDays: number;
  alopDays: number;
  adjDays: number;
  photo?: string;
  location?: string;
  department?: string;
  division?: string;
  dateOfJoining?: string;
}

export type AttendanceType =
  | 'Pre Attendance'
  | 'Attendance'
  | 'Unpunch'
  | 'Deputation'
  | 'Partial Present'
  | 'Absent'
  | 'WAH'
  | 'On Duty'
  | 'Leave'
  | 'Forgot Card';

export interface AttendanceSummaryCount {
  totalEmployees: number;
  present: number;
  absent: number;
  unpunch: number;
  deputation: number;
  forgotCard: number;
  partialPresent: number;
  wah: number;
  onDuty: number;
  leave: number;
  total: number;
}

/**
 * A single parsed row coming out of an Attendance Import run, before it has
 * been categorized into an AttendanceType. This is the shape stored in the
 * shared AttendanceRepositoryService so Attendance View can read it live.
 */
export interface AttendanceImportRow {
  employeeCode: string;
  employeeName: string;
  date: string; // any parseable date string; normalized on read
  inTime?: string;
  outTime?: string;
}

export interface ImportSummary {
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  duplicateRecords?: number;
  skippedRecords?: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  employeeCode: string;
  message: string;
  employeeName?: string;
  attendanceDate?: string;
  inTime?: string;
  outTime?: string;
  workHours?: string;
  attendanceType?: string;
  errorMessage?: string;
}

export type LeaveType =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Earned Leave'
  | 'Maternity Leave'
  | 'Paternity Leave'
  | 'Loss of Pay'
  | 'Compensatory Off';

export type CompensationType =
  | 'Overtime'
  | 'Holiday Working'
  | 'Weekly Off Working'
  | 'Compensatory Off Encashment';

export interface LeaveRequest {
  id?: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveType: LeaveType;
  description: string;
  status?: 'Pending Approval' | 'Approved' | 'Rejected';
  referenceNumber?: string;
}

export interface CompensationRequest {
  id?: string;
  employeeCode: string;
  employeeName?: string;
  employeePhoto?: string;
  compensationDate: string;
  compensationType: CompensationType;
  numberOfHours: number;
  reason: string;
  requestStatus?: 'Pending Approval' | 'Approved' | 'Rejected';
  approverRemarks?: string;
  referenceNumber?: string;
}

export interface ForgotCardRecord {
  employeeCode: string;
  employeeName: string;
  originalCardNumber: string;
  temporaryCardNumber: string;
  date: string;
  employeePhoto?: string;
}

export interface NavItem {
  label: string;
  path?: string;
  icon?: string;
  children?: NavItem[];
}
