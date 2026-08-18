import type { Employee, AttendanceRecord, LeaveType, CompensationType, AttendanceType } from '../models';
import type { AttendanceResultRow } from '../models';

export const MOCK_EMPLOYEES: Employee[] = [
  { employeeCode: 'EMP001', employeeName: 'Arun Kumar', originalCardNumber: 'CARD-A001', department: 'IT', designation: 'Software Engineer' },
  { employeeCode: 'EMP002', employeeName: 'Priya Sharma', originalCardNumber: 'CARD-A002', department: 'HR', designation: 'HR Executive' },
  { employeeCode: 'EMP003', employeeName: 'Rajan Nair', originalCardNumber: 'CARD-A003', department: 'Finance', designation: 'Accountant' },
  { employeeCode: 'EMP004', employeeName: 'Meena Devi', originalCardNumber: 'CARD-A004', department: 'Operations', designation: 'Team Lead' },
  { employeeCode: 'EMP005', employeeName: 'Suresh Babu', originalCardNumber: 'CARD-A005', department: 'IT', designation: 'Senior Developer' },
];

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { id: '1', date: '16/06/2026', employeeCode: 'EMP001', employeeName: 'Arun Kumar', inTime: '09:02', outTime: '18:05', actualIn: '09:02', actualOut: '18:05', totalHours: 9.03, attendanceType: 'Attendance', leaveHaving: false },
  { id: '2', date: '16/06/2026', employeeCode: 'EMP002', employeeName: 'Priya Sharma', inTime: '09:15', outTime: '', actualIn: '09:15', actualOut: '', totalHours: 0, attendanceType: 'Unpunch', leaveHaving: false },
  { id: '3', date: '16/06/2026', employeeCode: 'EMP003', employeeName: 'Rajan Nair', inTime: '08:55', outTime: '17:58', actualIn: '08:55', actualOut: '17:58', totalHours: 9.03, attendanceType: 'Attendance', leaveHaving: false },
  { id: '4', date: '16/06/2026', employeeCode: 'EMP004', employeeName: 'Meena Devi', inTime: '10:00', outTime: '14:00', actualIn: '10:00', actualOut: '14:00', totalHours: 4.0, attendanceType: 'Partial Present', leaveHaving: true },
  { id: '5', date: '16/06/2026', employeeCode: 'EMP005', employeeName: 'Suresh Babu', inTime: '', outTime: '', actualIn: '', actualOut: '', totalHours: 0, attendanceType: 'Absent', leaveHaving: false },
];

export const LEAVE_TYPES: LeaveType[] = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Loss of Pay',
  'Compensatory Off',
];

export const COMPENSATION_TYPES: CompensationType[] = [
  'Overtime',
  'Holiday Working',
  'Weekly Off Working',
  'Compensatory Off Encashment',
];

export const ATTENDANCE_TYPES: AttendanceType[] = [
  'Pre Attendance',
  'Attendance',
  'Unpunch',
  'Deputation',
  'Partial Present',
];

export const NAV_STRUCTURE = [
  {
    section: 'Transactions',
    items: [
      { label: 'Attendance View', path: '/attendance-view' },
      { label: 'Attendance Import', path: '/attendance-import' },
      { label: 'Attendance Adjustment', path: '/attendance-adjustment' },
      { label: 'Forgot Card', path: '/forgot-card' },
      { label: 'Leave Request', path: '/leave-request' },
      { label: 'Compensation Request', path: '/compensation-request' },
    ],
  },
  {
    section: 'Masters',
    items: [
      { label: 'Payroll Configuration', path: '/masters/payroll-configuration' },
    ],
  },
  {
    section: 'Reports',
    items: [
      { label: 'Attendance Reports', path: '/reports/attendance' },
      { label: 'Leave Reports', path: '/reports/leave' },
      { label: 'Compensation Reports', path: '/reports/compensation' },
    ],
  },
  {
    section: 'Settings',
    items: [{ label: 'Settings', path: '/settings' }],
  },
];

export interface MockAttendanceDatabaseRecord extends AttendanceResultRow {
  database: string;
}

export const MOCK_ATTENDANCE_DATABASE: MockAttendanceDatabaseRecord[] = [
  {
    employeeCode: 'EMP001',
    employeeName: 'Arun Kumar',
    date: '2026-06-01',
    inTime: '09:00 AM',
    outTime: '06:00 PM',
    workHours: '9.00',
    status: 'Success',
    remarks: '',
    database: 'Acer',
  },
  {
    employeeCode: 'EMP002',
    employeeName: 'Priya Sharma',
    date: '2026-06-01',
    inTime: '09:15 AM',
    outTime: '05:30 PM',
    workHours: '8.25',
    status: 'Warning',
    remarks: 'Late',
    database: 'Domestic',
  },
];