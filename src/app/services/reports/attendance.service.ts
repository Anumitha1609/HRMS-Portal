import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AttendanceRecord {
  id?: string;
  name?: string;
  dept?: string;
  desg?: string;
  date?: string;
  shift?: string;
  actual?: number;
  ot?: number;
  rate?: number;
  status?: string;
  type?: string;
  from?: string;
  to?: string;
  days?: number;
  reason?: string;
  duration?: string;
  shiftStart?: string;
  login?: string;
  delay?: number;
  in?: string;
  out?: string;
  working?: any;
  break?: any;
  start?: string;
  end?: string;
  applied?: string;
  manager?: string;
  joined?: string;
  years?: number;
  months?: number;
  category?: string;
  code?: string;
  off?: string;
  reqNo?: string;
  details?: any;
  timeline?: any[];
  leaveType?: string;
  monthlyDays?: number;
  monthlyBalance?: number;
  yearlyDays?: number;
  yearlyBalance?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  // Biometric and attendance mock databases
  private db: { [key: string]: AttendanceRecord[] } = {
    overtime: [
      { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', date: '02/05/2026', shift: 'General Shift', actual: 10.75, ot: 2.25, rate: 250, status: 'Approved' },
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', date: '02/05/2026', shift: 'General Shift', actual: 9.50, ot: 1.00, rate: 300, status: 'Approved' },
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', date: '03/05/2026', shift: 'General Shift', actual: 11.00, ot: 2.50, rate: 200, status: 'Approved' },
      { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', date: '03/05/2026', shift: 'General Shift', actual: 9.25, ot: 0.75, rate: 220, status: 'Approved' },
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', date: '05/05/2026', shift: 'Night Shift', actual: 11.50, ot: 2.50, rate: 300, status: 'Approved' },
      { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', date: '05/05/2026', shift: 'General Shift', actual: 10.00, ot: 1.50, rate: 250, status: 'Approved' },
      { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', date: '06/05/2026', shift: 'General Shift', actual: 9.75, ot: 1.25, rate: 180, status: 'Approved' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', date: '06/05/2026', shift: 'General Shift', actual: 10.50, ot: 2.00, rate: 240, status: 'Approved' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', date: '07/05/2026', shift: 'General Shift', actual: 10.25, ot: 1.75, rate: 280, status: 'Pending' },
      { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', date: '07/05/2026', shift: 'General Shift', actual: 9.50, ot: 1.00, rate: 200, status: 'Pending' },
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', date: '08/05/2026', shift: 'General Shift', actual: 10.50, ot: 2.00, rate: 300, status: 'Approved' },
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', date: '08/05/2026', shift: 'General Shift', actual: 10.00, ot: 1.50, rate: 200, status: 'Rejected' },
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', date: '12/05/2026', shift: 'Night Shift', actual: 11.00, ot: 2.00, rate: 300, status: 'Approved' },
      { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', date: '12/05/2026', shift: 'General Shift', actual: 10.25, ot: 1.75, rate: 180, status: 'Pending' },
      { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', date: '15/05/2026', shift: 'General Shift', actual: 9.75, ot: 1.25, rate: 250, status: 'Approved' }
    ],
    leave: [
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', type: 'Sick Leave', from: '10/05/2026', to: '12/05/2026', days: 3, reason: 'Severe fever and flu', status: 'Approved' },
      { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', type: 'Casual Leave', from: '15/05/2026', to: '16/05/2026', days: 2, reason: 'Family wedding in hometown', status: 'Approved' },
      { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', type: 'Earned Leave', from: '20/05/2026', to: '25/05/2026', days: 6, reason: 'Summer vacation trip', status: 'Approved' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', type: 'Loss of Pay', from: '04/05/2026', to: '05/05/2026', days: 2, reason: 'Personal work', status: 'Approved' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', type: 'Sick Leave', from: '26/05/2026', to: '27/05/2026', days: 2, reason: 'Dental surgery and rest', status: 'Pending' },
      { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', type: 'Casual Leave', from: '29/05/2026', to: '29/05/2026', days: 1, reason: 'Car servicing & licensing', status: 'Pending' },
      { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', type: 'Casual Leave', from: '08/05/2026', to: '08/05/2026', days: 1, reason: 'Home repairs setup', status: 'Rejected' },
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', type: 'Earned Leave', from: '18/05/2026', to: '22/05/2026', days: 5, reason: 'Family relocation support', status: 'Approved' },
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', type: 'Sick Leave', from: '11/05/2026', to: '11/05/2026', days: 1, reason: 'Medical checkup', status: 'Approved' },
      { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', type: 'Loss of Pay', from: '14/05/2026', to: '16/05/2026', days: 3, reason: 'Out of town urgent travel', status: 'Approved' },
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', type: 'Casual Leave', from: '25/05/2026', to: '26/05/2026', days: 2, reason: 'Relative visiting', status: 'Pending' },
      { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', type: 'Sick Leave', from: '12/05/2026', to: '13/05/2026', days: 2, reason: 'Migraine and headache', status: 'Approved' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', type: 'Casual Leave', from: '18/05/2026', to: '19/05/2026', days: 2, reason: 'Domestic chore obligations', status: 'Approved' },
      { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', type: 'Sick Leave', from: '22/05/2026', to: '22/05/2026', days: 1, reason: 'Doctor consultation', status: 'Rejected' }
    ],
    permission: [
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', date: '14/05/2026', from: '14:00', to: '16:00', duration: '02:00', reason: 'Personal bank work', status: 'Approved' },
      { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', date: '08/05/2026', from: '09:00', to: '10:30', duration: '01:30', reason: 'School admission for kid', status: 'Approved' },
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', date: '11/05/2026', from: '16:30', to: '18:00', duration: '01:30', reason: 'Hospital visit for parent', status: 'Approved' },
      { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', date: '15/05/2026', from: '10:00', to: '12:00', duration: '02:00', reason: 'Govt office verification', status: 'Approved' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', date: '20/05/2026', from: '13:00', to: '15:00', duration: '02:00', reason: 'Emergency plumbing at home', status: 'Pending' },
      { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', date: '22/05/2026', from: '15:00', to: '16:30', duration: '01:30', reason: 'Broadband technician visit', status: 'Pending' },
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', date: '05/05/2026', from: '11:00', to: '12:30', duration: '01:30', reason: 'Passport verification office', status: 'Approved' },
      { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', date: '19/05/2026', from: '14:00', to: '15:30', duration: '01:30', reason: 'Tax filing consultation', status: 'Approved' },
      { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', date: '21/05/2026', from: '09:30', to: '11:00', duration: '01:30', reason: 'Mechanic car drop', status: 'Rejected' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', date: '25/05/2026', from: '15:30', to: '17:00', duration: '01:30', reason: 'Utility payment center', status: 'Approved' },
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', date: '28/05/2026', from: '10:30', to: '12:00', duration: '01:30', reason: 'Gas cylinder delivery signature', status: 'Approved' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', date: '29/05/2026', from: '15:00', to: '17:00', duration: '02:00', reason: 'Courier package collection', status: 'Rejected' }
    ],
    latein: [
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', shiftStart: '09:00 AM', login: '09:45 AM', delay: 45, date: '18/05/2026', status: 'Late-In' },
      { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', shiftStart: '09:00 AM', login: '09:25 AM', delay: 25, date: '02/05/2026', status: 'Excused' },
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', shiftStart: '09:00 AM', login: '09:18 AM', delay: 18, date: '03/05/2026', status: 'Late-In' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', shiftStart: '09:00 AM', login: '10:15 AM', delay: 75, date: '07/05/2026', status: 'Late-In' },
      { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', shiftStart: '09:00 AM', login: '09:35 AM', delay: 35, date: '06/05/2026', status: 'Late-In' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', shiftStart: '09:00 AM', login: '09:22 AM', delay: 22, date: '06/05/2026', status: 'Excused' },
      { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', shiftStart: '09:00 AM', login: '09:40 AM', delay: 40, date: '07/05/2026', status: 'Late-In' },
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', shiftStart: '09:00 AM', login: '09:12 AM', delay: 12, date: '08/05/2026', status: 'Approved' },
      { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', shiftStart: '09:00 AM', login: '09:32 AM', delay: 32, date: '11/05/2026', status: 'Excused' },
      { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', shiftStart: '09:00 AM', login: '09:15 AM', delay: 15, date: '15/05/2026', status: 'Approved' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', shiftStart: '09:00 AM', login: '09:50 AM', delay: 50, date: '18/05/2026', status: 'Late-In' },
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', shiftStart: '09:00 AM', login: '09:28 AM', delay: 28, date: '22/05/2026', status: 'Approved' }
    ],
    inout: [
      { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', date: '20/05/2026', in: '09:10 AM', out: '06:05 PM', working: 8.92, break: 0.92, status: 'Present' },
      { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', date: '20/05/2026', in: '08:55 AM', out: '05:35 PM', working: 8.67, break: 1.00, status: 'Present' },
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', date: '20/05/2026', in: '08:58 AM', out: '06:15 PM', working: 9.28, break: 1.15, status: 'Present' },
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', date: '20/05/2026', in: '09:02 AM', out: '05:40 PM', working: 8.63, break: 1.00, status: 'Present' },
      { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', date: '20/05/2026', in: '--:--', out: '--:--', working: 0.00, break: 0.00, status: 'Absent' },
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', date: '20/05/2026', in: '09:02 PM', out: '06:12 AM', working: 9.17, break: 1.00, status: 'Present' },
      { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', date: '20/05/2026', in: '08:50 AM', out: '05:30 PM', working: 8.67, break: 1.00, status: 'Present' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', date: '20/05/2026', in: '09:15 AM', out: '01:30 PM', working: 4.25, break: 0.50, status: 'Half Day' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', date: '20/05/2026', in: '09:05 AM', out: '06:20 PM', working: 9.25, break: 1.00, status: 'Present' },
      { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', date: '20/05/2026', in: '09:22 AM', out: '05:50 PM', working: 8.47, break: 1.00, status: 'Present' },
      { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', date: '21/05/2026', in: '08:50 AM', out: '05:45 PM', working: 8.92, break: 1.00, status: 'Present' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', date: '21/05/2026', in: '--:--', out: '--:--', working: 0.00, break: 0.00, status: 'Absent' }
    ],
    leaveavail: [
      { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', leaveType: 'Casual Leave (CL)', monthlyDays: 3, monthlyBalance: 0, yearlyDays: 30, yearlyBalance: 6, status: 'Monthly Limit Reached', manager: 'Sanjay Kumar' },
      { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', leaveType: 'Annual Leave (AL)', monthlyDays: 1, monthlyBalance: 2, yearlyDays: 18, yearlyBalance: 18, status: 'Within Limit', manager: 'Sanjay Kumar' },
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', leaveType: 'Casual Leave (CL)', monthlyDays: 2, monthlyBalance: 1, yearlyDays: 20, yearlyBalance: 16, status: 'Within Limit', manager: 'Meera Nair' },
      { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', leaveType: 'Sick Leave (SL)', monthlyDays: 3, monthlyBalance: 0, yearlyDays: 37, yearlyBalance: -1, status: 'Yearly Limit Exceeded', manager: 'Rajesh Sharma' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', leaveType: 'Annual Leave (AL)', monthlyDays: 0, monthlyBalance: 3, yearlyDays: 36, yearlyBalance: 0, status: 'Yearly Limit Reached', manager: 'Sanjay Kumar' },
      { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', leaveType: 'Casual Leave (CL)', monthlyDays: 1, monthlyBalance: 2, yearlyDays: 22, yearlyBalance: 14, status: 'Within Limit', manager: 'Meera Nair' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', leaveType: 'Sick Leave (SL)', monthlyDays: 3, monthlyBalance: 0, yearlyDays: 34, yearlyBalance: 2, status: 'Monthly Limit Reached', manager: 'Rajesh Sharma' },
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', leaveType: 'Annual Leave (AL)', monthlyDays: 1, monthlyBalance: 2, yearlyDays: 15, yearlyBalance: 21, status: 'Within Limit', manager: 'Rajesh Sharma' },
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', leaveType: 'Casual Leave (CL)', monthlyDays: 2, monthlyBalance: 1, yearlyDays: 28, yearlyBalance: 8, status: 'Within Limit', manager: 'Rajesh Sharma' }
    ],
    experience: [
      { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', joined: '15/04/2020', years: 6, months: 2, category: 'More Than 5 Years' },
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', joined: '10/08/2021', years: 4, months: 10, category: '1–5 Years' },
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', joined: '18/02/2024', years: 2, months: 4, category: '1–5 Years' },
      { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', joined: '01/11/2019', years: 6, months: 7, category: 'More Than 5 Years' },
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', joined: '20/07/2025', years: 0, months: 11, category: 'Less Than 1 Year' },
      { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', joined: '05/10/2023', years: 2, months: 8, category: '1–5 Years' },
      { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', joined: '15/10/2025', years: 0, months: 8, category: 'Less Than 1 Year' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', joined: '20/01/2021', years: 5, months: 5, category: 'More Than 5 Years' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', joined: '12/06/2024', years: 2, months: 0, category: '1–5 Years' },
      { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', joined: '28/02/2025', years: 1, months: 4, category: '1–5 Years' },
      { id: 'EDS011', name: 'Anjali Sharma', dept: 'Development', desg: 'Associate Developer', joined: '10/01/2026', years: 0, months: 5, category: 'Less Than 1 Year' },
      { id: 'EDS012', name: 'Vikram Singh', dept: 'Marketing', desg: 'Marketing Lead', joined: '14/05/2018', years: 8, months: 1, category: 'More Than 5 Years' }
    ],
    detailsview: [
      { reqNo: 'REQ-2026-001', id: 'EDS002', name: 'Divya S', dept: 'Development', type: 'Leave', date: '10/05/2026', status: 'Approved',
        details: {
          leaveType: 'Sick Leave',
          fromDate: '10/05/2026',
          toDate: '12/05/2026',
          totalDays: 3,
          reason: 'Severe fever, body aches and flu. Doctor recommended bed rest.',
          approver: 'Rajesh Sharma (Development Lead)',
          hrComments: 'Approved on medical grounds. Sick Leave balance remaining: 8 days.',
          attachment: 'medical_certificate.pdf',
          attachmentSize: '1.2 MB'
        },
        timeline: [
          { time: '09/05/2026 09:30 AM', title: 'Request Submitted', desc: 'Submitted by Divya S' },
          { time: '09/05/2026 02:15 PM', title: 'Reviewed by Tech Lead', desc: 'Recommended for approval by Rajesh Sharma' },
          { time: '10/05/2026 10:00 AM', title: 'Approved by HR', desc: 'Processed and final status updated by Admin User' }
        ]
      },
      { reqNo: 'REQ-2026-002', id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', type: 'Permission', date: '14/05/2026', status: 'Approved',
        details: {
          permissionDate: '14/05/2026',
          fromTime: '02:00 PM',
          toTime: '04:00 PM',
          duration: '2 Hours',
          reason: 'Urgent personal work at Bank of Baroda for home loan paperwork verification.',
          approver: 'Meera Nair (QA Head)',
          hrComments: 'Approved. Standard monthly permission quota remaining: 1 out of 2.',
          attachment: 'bank_appointment_letter.pdf',
          attachmentSize: '450 KB'
        },
        timeline: [
          { time: '13/05/2026 04:00 PM', title: 'Request Submitted', desc: 'Submitted by Gokul Prasad' },
          { time: '14/05/2026 09:30 AM', title: 'Approved by QA Head', desc: 'Approved by Meera Nair' },
          { time: '14/05/2026 10:15 AM', title: 'Processed by HR', desc: 'Permission marked in biometric system by Admin User' }
        ]
      },
      { reqNo: 'REQ-2026-003', id: 'EDS009', name: 'Praveen K', dept: 'Development', type: 'Leave', date: '26/05/2026', status: 'Pending',
        details: {
          leaveType: 'Sick Leave',
          fromDate: '26/05/2026',
          toDate: '27/05/2026',
          totalDays: 2,
          reason: 'Emergency wisdom tooth extraction surgery. Doctor recommended 2 days rest.',
          approver: 'Rajesh Sharma (Development Lead)',
          hrComments: 'Pending verification. Awaiting medical certificate upload.',
          attachment: 'dentist_prescription.jpg',
          attachmentSize: '890 KB'
        },
        timeline: [
          { time: '25/05/2026 11:20 AM', title: 'Request Submitted', desc: 'Submitted by Praveen K' },
          { time: '25/05/2026 04:45 PM', title: 'Reviewed by Tech Lead', desc: 'Recommended with request for certificate by Rajesh Sharma' }
        ]
      },
      { reqNo: 'REQ-2026-004', id: 'EDS010', name: 'Swetha R', dept: 'Marketing', type: 'Permission', date: '22/05/2026', status: 'Pending',
        details: {
          permissionDate: '22/05/2026',
          fromTime: '03:00 PM',
          toTime: '04:30 PM',
          duration: '1.5 Hours',
          reason: 'Broadband technician home visit for fiber connection configuration.',
          approver: 'Meera Nair (Marketing Lead)',
          hrComments: 'Pending review. Quota check completed.',
          attachment: 'service_ticket.pdf',
          attachmentSize: '180 KB'
        },
        timeline: [
          { time: '21/05/2026 02:30 PM', title: 'Request Submitted', desc: 'Submitted by Swetha R' }
        ]
      },
      { reqNo: 'REQ-2026-005', id: 'EDS001', name: 'Arun Kumar', dept: 'Design', type: 'Leave', date: '08/05/2026', status: 'Rejected',
        details: {
          leaveType: 'Casual Leave',
          fromDate: '08/05/2026',
          toDate: '08/05/2026',
          totalDays: 1,
          reason: 'Home painters setup check and supervision.',
          approver: 'Sanjay Kumar (Design Director)',
          hrComments: 'Rejected due to critical project delivery deadline. Alternative date suggested.',
          attachment: null,
          attachmentSize: null
        },
        timeline: [
          { time: '06/05/2026 09:00 AM', title: 'Request Submitted', desc: 'Submitted by Arun Kumar' },
          { time: '06/05/2026 05:00 PM', title: 'Rejected by Director', desc: 'Rejected with comments by Sanjay Kumar' }
        ]
      }
    ],
    shiftdetails: [
      { code: 'GEN01', name: 'General Shift', start: '09:00 AM', end: '05:30 PM', break: '01:00 Hr', working: '8.5 Hrs', off: 'Sunday', status: 'Active' },
      { code: 'MORN01', name: 'Morning Shift', start: '06:00 AM', end: '02:30 PM', break: '00:30 Min', working: '8.0 Hrs', off: 'Sunday', status: 'Active' },
      { code: 'EVNG02', name: 'Evening Shift', start: '02:00 PM', end: '10:30 PM', break: '00:30 Min', working: '8.0 Hrs', off: 'Sunday', status: 'Active' },
      { code: 'NGHT03', name: 'Night Shift', start: '10:00 PM', end: '06:30 AM', break: '00:30 Min', working: '8.0 Hrs', off: 'Saturday', status: 'Active' },
      { code: 'GEN02', name: 'Support General Shift', start: '10:00 AM', end: '06:30 PM', break: '01:00 Hr', working: '8.5 Hrs', off: 'Sunday', status: 'Active' },
      { code: 'TEMP04', name: 'Part-Time Shift', start: '09:00 AM', end: '01:00 PM', break: '00:00 Min', working: '4.0 Hrs', off: 'Sunday', status: 'Inactive' }
    ]
  };

  private metadata: { [key: string]: any } = {
    overtime: {
      title: 'Over Time Details',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee', 'status'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'date', label: 'Date' },
        { field: 'shift', label: 'Shift' },
        { field: 'actual', label: 'Actual Hours' },
        { field: 'ot', label: 'OT Hours' },
        { field: 'rate', label: 'OT Rate (₹)' },
        { field: 'status', label: 'Status' }
      ],
      infoBannerText: 'Over Time hours are calculated based on the employee\'s assigned shift and overtime configuration. Minimum 30 minutes must be clocked past regular shift hours to qualify.'
    },
    leave: {
      title: 'Leave Details',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee', 'status', 'leaveType'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'type', label: 'Leave Type' },
        { field: 'from', label: 'From Date' },
        { field: 'to', label: 'To Date' },
        { field: 'days', label: 'Total Days' },
        { field: 'reason', label: 'Reason' },
        { field: 'status', label: 'Status' }
      ],
      infoBannerText: 'Leave requests must be approved by the designated department head and final clearance processed by HR. Loss of Pay (LOP) leaves directly impact payroll calculations.'
    },
    permission: {
      title: 'Permission Details',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee', 'status'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'date', label: 'Date' },
        { field: 'from', label: 'From Time' },
        { field: 'to', label: 'To Time' },
        { field: 'duration', label: 'Duration' },
        { field: 'reason', label: 'Reason' },
        { field: 'status', label: 'Status' }
      ],
      infoBannerText: 'Permissions are capped at a maximum of 2 occurrences or 3 total hours per month. Unused permissions do not carry forward to the next month.'
    },
    latein: {
      title: 'Late-In List',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'date', label: 'Date' },
        { field: 'shiftStart', label: 'Shift Start' },
        { field: 'login', label: 'Actual Login' },
        { field: 'delay', label: 'Delay (Min)' },
        { field: 'status', label: 'Status' }
      ],
      infoBannerText: 'Grace period for shift login is 10 minutes. Three late-ins in a month without prior approvals or excused status will trigger a half-day salary deduction.'
    },
    inout: {
      title: 'In-Out Actual Time',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'date', label: 'Date' },
        { field: 'in', label: 'In Time' },
        { field: 'out', label: 'Out Time' },
        { field: 'working', label: 'Working Hours' },
        { field: 'break', label: 'Break Hours' },
        { field: 'status', label: 'Biometric Status' }
      ],
      infoBannerText: 'Biometric punch logs are refreshed every 15 minutes. Missed punches must be regularized by the employee within 48 hours to ensure correct attendance computation.'
    },
    leaveavail: {
      title: 'Leave Availed',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee', 'status', 'leaveType', 'monthlyLimit'],
      headers: [
        { field: 'id', label: 'EMP ID' },
        { field: 'name', label: 'EMPLOYEE NAME' },
        { field: 'dept', label: 'DEPARTMENT' },
        { field: 'desg', label: 'DESIGNATION' },
        { field: 'leaveType', label: 'LEAVE TYPE' },
        { field: 'monthlyDays', label: 'MONTHLY DAYS AVAILED' },
        { field: 'monthlyBalance', label: 'MONTHLY BALANCE (3 DAYS)' },
        { field: 'yearlyDays', label: 'YEARLY DAYS AVAILED' },
        { field: 'yearlyBalance', label: 'YEARLY BALANCE (36 DAYS)' },
        { field: 'status', label: 'STATUS' },
        { field: 'manager', label: 'REPORTING MANAGER' }
      ],
      infoBannerText: 'Leave availed more than 3 days in a month or more than 36 days in a year will be highlighted for this report. Monthly Leave Entitlement: 3 Days per employee | Yearly Leave Entitlement: 36 Days per employee'
    },
    experience: {
      title: 'Employee Experience',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee', 'expCategory'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'joined', label: 'Date of Joining' },
        { field: 'years', label: 'Tenure Years' },
        { field: 'months', label: 'Tenure Months' },
        { field: 'category', label: 'Tenure Bracket' }
      ],
      infoBannerText: 'Experience brackets represent the employee\'s active service tenure. This classification is used to calculate gratuity eligibilities, service bonuses, and long service awards.'
    },
    shiftdetails: {
      title: 'Shift Details',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'status'],
      headers: [
        { field: 'code', label: 'Shift Code' },
        { field: 'name', label: 'Shift Name' },
        { field: 'start', label: 'Start Time' },
        { field: 'end', label: 'End Time' },
        { field: 'break', label: 'Break Duration' },
        { field: 'working', label: 'Net Work Hours' },
        { field: 'off', label: 'Weekly Off' },
        { field: 'status', label: 'Status' }
      ],
      infoBannerText: 'Standard work configurations are mapped above. Rotational shifts must be assigned to employees at least 7 days in advance in the shift scheduler panel.'
    }
  };

  constructor() {}

  getReportMetadata(reportType: string): any {
    return this.metadata[reportType] || { title: 'Report', filters: [], headers: [], infoBannerText: '' };
  }

  getReportData(
    reportType: string,
    filters: any,
    searchQuery: string,
    page: number,
    pageSize: number,
    sortKey: string,
    sortDir: string
  ): { data: AttendanceRecord[]; total: number; summaryCards: any[] } {
    let dataset = [...(this.db[reportType] || [])];

    if (reportType === 'leaveavail') {
      const monthlyLimit = filters.monthlyLimit !== undefined ? Number(filters.monthlyLimit) : 3;
      const yearlyLimit = monthlyLimit * 12;
      
      dataset = dataset.map(r => {
        const monthlyDays = r.monthlyDays || 0;
        const yearlyDays = r.yearlyDays || 0;
        const monthlyBalance = monthlyLimit - monthlyDays;
        const yearlyBalance = yearlyLimit - yearlyDays;
        
        let status = 'Within Limit';
        if (monthlyDays > monthlyLimit || yearlyDays > yearlyLimit) {
          status = 'Yearly Limit Exceeded';
        } else if (yearlyDays === yearlyLimit) {
          status = 'Yearly Limit Reached';
        } else if (monthlyDays === monthlyLimit) {
          status = 'Monthly Limit Reached';
        }
        
        return {
          ...r,
          monthlyBalance,
          yearlyBalance,
          status
        };
      });
    }

    // 1. Apply Filters
    if (filters.department && filters.department !== 'All') {
      dataset = dataset.filter(r => r.dept === filters.department);
    }
    if (filters.designation && filters.designation !== 'All') {
      dataset = dataset.filter(r => r.desg === filters.designation);
    }
    if (filters.employee && filters.employee !== '' && filters.employee !== 'All') {
      const empFilter = String(filters.employee).toLowerCase();
      dataset = dataset.filter(r => (r.id && r.id.toLowerCase() === empFilter) || (r.name && r.name.toLowerCase().includes(empFilter)));
    }
    if (filters.status && filters.status !== 'All') {
      dataset = dataset.filter(r => r.status === filters.status);
    }
    if (reportType === 'leave' && filters.leaveType && filters.leaveType !== 'All') {
      dataset = dataset.filter(r => r.type === filters.leaveType);
    }
    if (reportType === 'leaveavail' && filters.leaveType && filters.leaveType !== 'All') {
      dataset = dataset.filter(r => r.leaveType === filters.leaveType);
    }
    if (reportType === 'experience' && filters.expCategory && filters.expCategory !== 'All') {
      dataset = dataset.filter(r => r.category === filters.expCategory);
    }

    // 2. Global search bar filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      dataset = dataset.filter(r => {
        return Object.entries(r).some(([key, val]) => {
          if (key === 'details' || key === 'timeline') return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    // 3. Sorting
    if (sortKey) {
      dataset.sort((a: any, b: any) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }

        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = dataset.length;
    
    // Calculate metric cards based on the filtered dataset
    const summaryCards = this.calculateSummaryCards(reportType, dataset, filters, searchQuery);

    // 4. Pagination
    const startIdx = (page - 1) * pageSize;
    const paginatedData = dataset.slice(startIdx, startIdx + pageSize);

    return {
      data: paginatedData,
      total,
      summaryCards
    };
  }

  // Functional Excel import simulation
  importExcel(reportType: string, importedData: any[]): void {
    if (!this.db[reportType]) {
      this.db[reportType] = [];
    }

    // Process and sanitize imported rows, attaching sensible defaults if columns are missing
    const sanitized: AttendanceRecord[] = importedData.map(item => {
      return {
        id: item.id || item['Emp ID'] || 'EDS' + Math.floor(100 + Math.random() * 900),
        name: item.name || item['Employee Name'] || 'Imported Employee',
        dept: item.dept || item['Department'] || 'Development',
        desg: item.desg || item['Designation'] || 'Software Engineer',
        date: item.date || item['Date'] || '24/06/2026',
        shift: item.shift || item['Shift'] || 'General Shift',
        actual: Number(item.actual || item['Actual Hours'] || 8.5),
        ot: Number(item.ot || item['OT Hours'] || 0.0),
        rate: Number(item.rate || item['OT Rate (₹)'] || 250),
        status: item.status || item['Status'] || 'Approved',
        type: item.type || item['Leave Type'] || 'Casual Leave',
        from: item.from || item['From Date'] || '24/06/2026',
        to: item.to || item['To Date'] || '24/06/2026',
        days: Number(item.days || item['Total Days'] || 1),
        reason: item.reason || item['Reason'] || 'Imported record',
        duration: item.duration || item['Duration'] || '01:00',
        shiftStart: item.shiftStart || item['Shift Start'] || '09:00 AM',
        login: item.login || item['Actual Login'] || '09:00 AM',
        delay: Number(item.delay || item['Delay (Min)'] || 0),
        in: item.in || item['In Time'] || '09:00 AM',
        out: item.out || item['Out Time'] || '05:30 PM',
        working: Number(item.working || item['Working Hours'] || 8.5),
        break: Number(item.break || item['Break Hours'] || 1.0),
        applied: item.applied || item['Leave Applied Post'] || 'Yes',
        manager: item.manager || item['Reporting Manager'] || 'Rajesh Sharma',
        joined: item.joined || item['Date of Joining'] || '01/01/2024',
        years: Number(item.years || item['Tenure Years'] || 2),
        months: Number(item.months || item['Tenure Months'] || 0),
        category: item.category || item['Tenure Bracket'] || '1–5 Years',
        code: item.code || item['Shift Code'] || 'GEN01',
        off: item.off || item['Weekly Off'] || 'Sunday'
      };
    });

    // Merge into the front of our database
    this.db[reportType] = [...sanitized, ...this.db[reportType]];
  }

  // Fetch Master-Detail Request Records
  getMasterRequests(searchQuery: string): AttendanceRecord[] {
    let list = [...this.db['detailsview']];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.reqNo?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.dept?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q)
      );
    }
    return list;
  }

  // Get specific request details by Request Number
  getRequestByNumber(reqNo: string): AttendanceRecord | undefined {
    return this.db['detailsview'].find(r => r.reqNo === reqNo);
  }

  private calculateSummaryCards(reportType: string, activeList: AttendanceRecord[], filters?: any, searchQuery?: string): any[] {
    let cards: any[] = [];

    if (reportType === 'overtime') {
      const totalEmployees = new Set(activeList.map(r => r.id)).size;
      const totalOT = activeList.reduce((sum, r) => sum + (r.ot || 0), 0).toFixed(2);
      const approvedOT = activeList.filter(r => r.status === 'Approved').reduce((sum, r) => sum + (r.ot || 0), 0).toFixed(2);
      const pendingOT = activeList.filter(r => r.status === 'Pending').reduce((sum, r) => sum + (r.ot || 0), 0).toFixed(2);

      cards = [
        { label: 'Total Employees', value: totalEmployees, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Total OT Hours', value: `${totalOT} Hrs`, icon: 'fa-business-time', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Approved OT', value: `${approvedOT} Hrs`, icon: 'fa-circle-check', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Pending OT', value: `${pendingOT} Hrs`, icon: 'fa-circle-pause', color: 'bg-amber-50 text-amber-600' }
      ];
    }
    else if (reportType === 'leave') {
      const totalRequests = activeList.length;
      const approved = activeList.filter(r => r.status === 'Approved').length;
      const pending = activeList.filter(r => r.status === 'Pending').length;
      const rejected = activeList.filter(r => r.status === 'Rejected').length;

      cards = [
        { label: 'Total Leave Requests', value: totalRequests, icon: 'fa-file-signature', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Approved Leaves', value: approved, icon: 'fa-circle-check', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Pending Leaves', value: pending, icon: 'fa-circle-pause', color: 'bg-amber-50 text-amber-600' },
        { label: 'Rejected Leaves', value: rejected, icon: 'fa-circle-xmark', color: 'bg-red-50 text-red-600' }
      ];
    }
    else if (reportType === 'permission') {
      const totalPerm = activeList.length;
      const approved = activeList.filter(r => r.status === 'Approved').length;
      const pending = activeList.filter(r => r.status === 'Pending').length;
      const rejected = activeList.filter(r => r.status === 'Rejected').length;

      cards = [
        { label: 'Total Permissions', value: totalPerm, icon: 'fa-user-shield', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Approved', value: approved, icon: 'fa-circle-check', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Pending', value: pending, icon: 'fa-circle-pause', color: 'bg-amber-50 text-amber-600' },
        { label: 'Rejected', value: rejected, icon: 'fa-circle-xmark', color: 'bg-red-50 text-red-600' }
      ];
    }
    else if (reportType === 'latein') {
      const totalEmp = new Set(activeList.map(r => r.id)).size;
      const lateArrivals = activeList.filter(r => r.status === 'Late-In').length;
      
      const delays = activeList.map(r => r.delay || 0);
      const avgDelay = delays.length ? Math.round(delays.reduce((s, v) => s + v, 0) / delays.length) : 0;
      const maxDelay = delays.length ? Math.max(...delays) : 0;

      cards = [
        { label: 'Total Employees', value: totalEmp, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Late Arrivals', value: lateArrivals, icon: 'fa-user-clock', color: 'bg-red-50 text-red-500' },
        { label: 'Average Delay', value: `${avgDelay} Min`, icon: 'fa-gauge-high', color: 'bg-amber-50 text-amber-600' },
        { label: 'Maximum Delay', value: `${maxDelay} Min`, icon: 'fa-triangle-exclamation', color: 'bg-rose-50 text-rose-600' }
      ];
    }
    else if (reportType === 'inout') {
      const totalEmp = new Set(activeList.map(r => r.id)).size;
      const present = activeList.filter(r => r.status === 'Present').length;
      const absent = activeList.filter(r => r.status === 'Absent').length;
      const workings = activeList.filter(r => (r.working || 0) > 0).map(r => r.working || 0);
      const avgHrs = workings.length ? (workings.reduce((s, v) => s + v, 0) / workings.length).toFixed(1) : 0.0;

      cards = [
        { label: 'Total Employees', value: totalEmp, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Present Today', value: present, icon: 'fa-user-check', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Absent Today', value: absent, icon: 'fa-user-slash', color: 'bg-red-50 text-red-600' },
        { label: 'Avg Working Hours', value: `${avgHrs} Hrs`, icon: 'fa-clock', color: 'bg-indigo-50 text-indigo-600' }
      ];
    }
    else if (reportType === 'leaveavail') {
      const monthlyLimit = filters && filters.monthlyLimit !== undefined ? Number(filters.monthlyLimit) : 3;
      const yearlyLimit = monthlyLimit * 12;
      const isFiltered = (activeList.length !== 9 || searchQuery || (filters && (filters.department !== 'All' || filters.designation !== 'All' || (filters.employee && filters.employee !== '') || (filters.status && filters.status !== 'All') || (filters.leaveType && filters.leaveType !== 'All') || (filters.monthlyLimit !== 3))));
      
      let withinLimitVal = 142;
      let exceededLimitVal = 18;
      let totalEmpVal = 160;
      
      if (isFiltered) {
        totalEmpVal = activeList.length;
        exceededLimitVal = activeList.filter(r => (r.monthlyDays || 0) > monthlyLimit || (r.yearlyDays || 0) > yearlyLimit).length;
        withinLimitVal = totalEmpVal - exceededLimitVal;
      } else {
        if (monthlyLimit !== 3) {
          totalEmpVal = activeList.length;
          exceededLimitVal = activeList.filter(r => (r.monthlyDays || 0) > monthlyLimit || (r.yearlyDays || 0) > yearlyLimit).length;
          withinLimitVal = totalEmpVal - exceededLimitVal;
        }
      }
      
      const withinPct = totalEmpVal ? ((withinLimitVal / totalEmpVal) * 100).toFixed(2) : '0.00';
      const exceededPct = totalEmpVal ? ((exceededLimitVal / totalEmpVal) * 100).toFixed(2) : '0.00';

      cards = [
        { label: 'Monthly Leave Entitlement', value: `${monthlyLimit} Days`, icon: 'fa-calendar-days', color: 'bg-blue-50 text-enterprise-blue', subtitle: 'Per Employee' },
        { label: 'Yearly Leave Entitlement', value: `${yearlyLimit} Days`, icon: 'fa-calendar-check', color: 'bg-emerald-50 text-emerald-600', subtitle: 'Per Employee' },
        { label: 'Employees Within Limit', value: withinLimitVal, icon: 'fa-user-check', color: 'bg-purple-50 text-purple-600', subtitle: `Of ${totalEmpVal} Employees (${withinPct}%)` },
        { label: 'Employees Exceeded Limit', value: exceededLimitVal, icon: 'fa-circle-exclamation', color: 'bg-red-50 text-red-600', subtitle: `Of ${totalEmpVal} Employees (${exceededPct}%)` }
      ];
    }
    else if (reportType === 'experience') {
      const totalEmp = activeList.length;
      const fresh = activeList.filter(r => r.category === 'Less Than 1 Year').length;
      const intermediate = activeList.filter(r => r.category === '1–5 Years').length;
      const senior = activeList.filter(r => r.category === 'More Than 5 Years').length;

      cards = [
        { label: 'Total Employees', value: totalEmp, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Less Than 1 Year', value: fresh, icon: 'fa-seedling', color: 'bg-teal-50 text-teal-600' },
        { label: '1–5 Years', value: intermediate, icon: 'fa-user-gear', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'More Than 5 Years', value: senior, icon: 'fa-medal', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'shiftdetails') {
      const totalShifts = activeList.length;
      const morning = activeList.filter(r => r.name && r.name.includes('Morning')).length;
      const evening = activeList.filter(r => r.name && r.name.includes('Evening')).length;
      const night = activeList.filter(r => r.name && r.name.includes('Night')).length;

      cards = [
        { label: 'Total Shifts', value: totalShifts, icon: 'fa-calendar-days', color: 'bg-slate-100 text-slate-700' },
        { label: 'Morning Shifts', value: morning, icon: 'fa-sun', color: 'bg-amber-50 text-amber-600' },
        { label: 'Evening Shifts', value: evening, icon: 'fa-cloud-sun', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Night Shifts', value: night, icon: 'fa-moon', color: 'bg-slate-800 text-slate-100' }
      ];
    }

    return cards;
  }
}
