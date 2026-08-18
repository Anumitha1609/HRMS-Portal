import { Injectable } from '@angular/core';

export interface SalaryRecord {
  id?: string;
  name?: string;
  dept?: string;
  desg?: string;
  gross?: number;
  deductions?: number;
  net?: number;
  mode?: string;
  status?: string;
  department?: string;
  count?: number;
  earnings?: number;
  head?: string;
  description?: string;
  netValue?: number;
  salary?: number;
  bonus?: number;
  incentives?: number;
  insurance?: number;
  total?: number;
  date?: string;
  advanceAmount?: number;
  recoveryAmount?: number;
  balance?: number;
  unit?: string;
  grade?: string;
  chequeNumber?: string;
  bank?: string;
  amount?: number;
  issueDate?: string;
  clearanceDate?: string;
  reference?: string;
  email?: string;
  month?: string;
  sentDate?: string;
  prevSalary?: number;
  revSalary?: number;
  incrementPercent?: number;
  incrementAmount?: number;
  effectiveDate?: string;
  revisionAmount?: number;
  loc?: string;
  account?: string;
  effDate?: string;
  incPercent?: number;
  incAmount?: number;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  dept: string;
  desg: string;
  loc: string;
  unit: string;
  cat: string;
  status: string;
  bank: string;
  account: string;
  email: string;
  prevSalary: number;
  revSalary: number;
  incPercent: number;
  incAmount: number;
  effDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  // Comprehensive employee master registry used as base data
  private rawEmployeeDB: EmployeeProfile[] = [
    { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', loc: 'Chennai', unit: 'Design Unit', cat: 'Permanent', status: 'Active', bank: 'SBI Bank', account: '**********4810', email: 'arunkumar@workateaze.com', prevSalary: 45000, revSalary: 49500, incPercent: 10, incAmount: 4500, effDate: '01/04/2026' },
    { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', bank: 'ICICI Bank', account: '**********4920', email: 'divyas@workateaze.com', prevSalary: 65000, revSalary: 72800, incPercent: 12, incAmount: 7800, effDate: '01/04/2026' },
    { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', bank: 'HDFC Bank', account: '**********7822', email: 'gokulp@workateaze.com', prevSalary: 40000, revSalary: 43200, incPercent: 8, incAmount: 3200, effDate: '01/04/2026' },
    { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', loc: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', bank: 'SBI Bank', account: '**********1029', email: 'harinim@workateaze.com', prevSalary: 55000, revSalary: 60500, incPercent: 10, incAmount: 5500, effDate: '01/04/2026' },
    { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', bank: 'Axis Bank', account: '**********3821', email: 'karthikp@workateaze.com', prevSalary: 48000, revSalary: 52800, incPercent: 10, incAmount: 4800, effDate: '01/04/2026' },
    { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', loc: 'Chennai', unit: 'Design Unit', cat: 'Contract', status: 'Active', bank: 'SBI Bank', account: '**********9402', email: 'lavanyar@workateaze.com', prevSalary: 42000, revSalary: 44100, incPercent: 5, incAmount: 2100, effDate: '01/04/2026' },
    { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', loc: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', bank: 'HDFC Bank', account: '**********4820', email: 'mohanraj@workateaze.com', prevSalary: 35000, revSalary: 37800, incPercent: 8, incAmount: 2800, effDate: '01/04/2026' },
    { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', loc: 'Bangalore', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', bank: 'ICICI Bank', account: '**********1022', email: 'nandhinis@workateaze.com', prevSalary: 46000, revSalary: 50600, incPercent: 10, incAmount: 4600, effDate: '01/04/2026' },
    { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', bank: 'Axis Bank', account: '**********3844', email: 'praveenk@workateaze.com', prevSalary: 50000, revSalary: 55000, incPercent: 10, incAmount: 5000, effDate: '01/04/2026' },
    { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', loc: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', bank: 'SBI Bank', account: '**********1920', email: 'swethar@workateaze.com', prevSalary: 43000, revSalary: 46440, incPercent: 8, incAmount: 3440, effDate: '01/04/2026' }
  ];

  // Specific reports database
  private db: { [key: string]: SalaryRecord[] } = {
    payroll: [
      { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', gross: 49500, deductions: 4455, net: 45045, mode: 'Bank Transfer', status: 'Released' },
      { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', gross: 72800, deductions: 6552, net: 66248, mode: 'Bank Transfer', status: 'Released' },
      { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', gross: 43200, deductions: 3888, net: 39312, mode: 'Bank Transfer', status: 'Released' },
      { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', gross: 60500, deductions: 5445, net: 55055, mode: 'Cheque', status: 'Approved' },
      { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', gross: 52800, deductions: 4752, net: 48048, mode: 'Bank Transfer', status: 'Released' },
      { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', gross: 44100, deductions: 3969, net: 40131, mode: 'Cash', status: 'Processed' },
      { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', gross: 37800, deductions: 3402, net: 34398, mode: 'Bank Transfer', status: 'Released' },
      { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', gross: 50600, deductions: 4554, net: 46046, mode: 'Cheque', status: 'Approved' },
      { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', gross: 55000, deductions: 4950, net: 50050, mode: 'Bank Transfer', status: 'Released' },
      { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', gross: 46440, deductions: 4180, net: 42260, mode: 'Bank Transfer', status: 'Released' }
    ],
    salarysummary: [
      { department: 'Design', count: 2, earnings: 93600, deductions: 8424, net: 85176 },
      { department: 'Development', count: 3, earnings: 180600, deductions: 16254, net: 164346 },
      { department: 'QA', count: 1, earnings: 43200, deductions: 3888, net: 39312 },
      { department: 'HR', count: 1, earnings: 60500, deductions: 5445, net: 55055 },
      { department: 'Support', count: 1, earnings: 37800, deductions: 3402, net: 34398 },
      { department: 'Finance', count: 1, earnings: 50600, deductions: 4554, net: 46046 },
      { department: 'Marketing', count: 1, earnings: 46440, deductions: 4180, net: 42260 }
    ],
    salaryabstract: [
      { head: 'Basic Pay', description: 'Core salary compensation base rate', earnings: 345000, deductions: 0, netValue: 345000 },
      { head: 'House Rent Allowance', description: 'HRA for employee housing support', earnings: 138000, deductions: 0, netValue: 138000 },
      { head: 'Conveyance Allowance', description: 'Travel compensation benefit', earnings: 16000, deductions: 0, netValue: 16000 },
      { head: 'Provident Fund (PF)', description: 'Retirement fund allocation', earnings: 0, deductions: 31200, netValue: -31200 },
      { head: 'Professional Tax (PT)', description: 'Government mandated professional levy', earnings: 0, deductions: 2000, netValue: -2000 },
      { head: 'Insurance Deductions', description: 'Corporate medical health coverage plan', earnings: 0, deductions: 6800, netValue: -6800 },
      { head: 'Loan / Advance Recovery', description: 'Deductions for advance repayments', earnings: 0, deductions: 4200, netValue: -4200 }
    ],
    benefits: [
      { id: 'EDS001', name: 'Arun Kumar', salary: 49500, bonus: 5000, incentives: 2500, insurance: 1200, total: 58200 },
      { id: 'EDS002', name: 'Divya S', salary: 72800, bonus: 8000, incentives: 4000, insurance: 1800, total: 86600 },
      { id: 'EDS003', name: 'Gokul Prasad', salary: 43200, bonus: 4000, incentives: 1500, insurance: 1200, total: 49900 },
      { id: 'EDS004', name: 'Harini M', salary: 60500, bonus: 6000, incentives: 0, insurance: 1500, total: 68000 },
      { id: 'EDS005', name: 'Karthik P', salary: 52800, bonus: 5000, incentives: 3000, insurance: 1200, total: 62000 },
      { id: 'EDS006', name: 'Lavanya R', salary: 44100, bonus: 3000, incentives: 1000, insurance: 1000, total: 49100 },
      { id: 'EDS007', name: 'Mohan Raj', salary: 37800, bonus: 3000, incentives: 1500, insurance: 1000, total: 43300 },
      { id: 'EDS008', name: 'Nandhini S', salary: 50600, bonus: 5000, incentives: 2000, insurance: 1500, total: 59100 },
      { id: 'EDS009', name: 'Praveen K', salary: 55000, bonus: 5000, incentives: 3000, insurance: 1500, total: 64500 },
      { id: 'EDS010', name: 'Swetha R', salary: 46440, bonus: 4000, incentives: 2000, insurance: 1200, total: 53640 }
    ],
    advance: [
      { id: 'EDS003', name: 'Gokul Prasad', date: '10/03/2026', advanceAmount: 15000, recoveryAmount: 10000, balance: 5000, status: 'Recovering' },
      { id: 'EDS005', name: 'Karthik P', date: '15/02/2026', advanceAmount: 20000, recoveryAmount: 20000, balance: 0, status: 'Fully Recovered' },
      { id: 'EDS007', name: 'Mohan Raj', date: '01/05/2026', advanceAmount: 10000, recoveryAmount: 2000, balance: 8000, status: 'Recovering' },
      { id: 'EDS009', name: 'Praveen K', date: '12/04/2026', advanceAmount: 12000, recoveryAmount: 4000, balance: 8000, status: 'Recovering' },
      { id: 'EDS006', name: 'Lavanya R', date: '20/05/2026', advanceAmount: 8000, recoveryAmount: 0, balance: 8000, status: 'Pending' }
    ],
    unitgrade: [
      { unit: 'Tech Unit', grade: 'Grade A', count: 1, gross: 72800, deductions: 6552, net: 66248 },
      { unit: 'Tech Unit', grade: 'Grade B', count: 3, gross: 151000, deductions: 13590, net: 137410 },
      { unit: 'Design Unit', grade: 'Grade B', count: 2, gross: 93600, deductions: 8424, net: 85176 },
      { unit: 'Admin Unit', grade: 'Grade A', count: 1, gross: 60500, deductions: 5445, net: 55055 },
      { unit: 'Admin Unit', grade: 'Grade B', count: 2, gross: 97040, deductions: 8734, net: 88306 },
      { unit: 'Admin Unit', grade: 'Grade C', count: 1, gross: 37800, deductions: 3402, net: 34398 }
    ],
    cheque: [
      { chequeNumber: 'CHQ-890281', name: 'Harini M', bank: 'SBI Bank', amount: 55055, issueDate: '28/05/2026', clearanceDate: '30/05/2026', status: 'Cleared' },
      { chequeNumber: 'CHQ-890282', name: 'Nandhini S', bank: 'ICICI Bank', amount: 46046, issueDate: '28/05/2026', clearanceDate: '--:--', status: 'Pending' },
      { chequeNumber: 'CHQ-890283', name: 'Lavanya R', bank: 'SBI Bank', amount: 40131, issueDate: '29/05/2026', clearanceDate: '--:--', status: 'Pending' }
    ],
    bankcredit: [
      { id: 'EDS001', name: 'Arun Kumar', bank: 'SBI Bank', account: '**********4810', amount: 45045, reference: 'REF-TXN-902819', status: 'Success' },
      { id: 'EDS002', name: 'Divya S', bank: 'ICICI Bank', account: '**********4920', amount: 66248, reference: 'REF-TXN-902820', status: 'Success' },
      { id: 'EDS003', name: 'Gokul Prasad', bank: 'HDFC Bank', account: '**********7822', amount: 39312, reference: 'REF-TXN-902821', status: 'Success' },
      { id: 'EDS005', name: 'Karthik P', bank: 'Axis Bank', account: '**********3821', amount: 48048, reference: 'REF-TXN-902822', status: 'Success' },
      { id: 'EDS007', name: 'Mohan Raj', bank: 'HDFC Bank', account: '**********4820', amount: 34398, reference: 'REF-TXN-902823', status: 'Success' },
      { id: 'EDS009', name: 'Praveen K', bank: 'Axis Bank', account: '**********3844', amount: 50050, reference: 'REF-TXN-902824', status: 'Success' },
      { id: 'EDS010', name: 'Swetha R', bank: 'SBI Bank', account: '**********1920', amount: 42260, reference: 'REF-TXN-902825', status: 'Success' }
    ]
  };

  private metadata: { [key: string]: any } = {
    payroll: {
      title: 'Payroll',
      filters: ['month', 'year', 'department', 'designation', 'employee', 'location', 'unit', 'category', 'empstatus', 'payrollstatus'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'gross', label: 'Gross Salary (₹)' },
        { field: 'deductions', label: 'Deductions (₹)' },
        { field: 'net', label: 'Net Salary (₹)' },
        { field: 'mode', label: 'Payment Mode' },
        { field: 'status', label: 'Status' }
      ]
    },
    salarysummary: {
      title: 'Salary Summary',
      filters: ['month', 'year', 'department', 'location', 'unit'],
      headers: [
        { field: 'department', label: 'Department' },
        { field: 'count', label: 'Employee Count' },
        { field: 'earnings', label: 'Gross Earnings (₹)' },
        { field: 'deductions', label: 'Deductions (₹)' },
        { field: 'net', label: 'Net Payable (₹)' }
      ]
    },
    salaryabstract: {
      title: 'Salary Abstract',
      filters: ['month', 'year', 'department', 'location', 'unit'],
      headers: [
        { field: 'head', label: 'Salary Component Head' },
        { field: 'description', label: 'Component Description' },
        { field: 'earnings', label: 'Total Paid (₹)' },
        { field: 'deductions', label: 'Total Deducted (₹)' },
        { field: 'netValue', label: 'Net Budget Impact (₹)' }
      ]
    },
    benefits: {
      title: 'Salary & Other Benefits',
      filters: ['month', 'year', 'department', 'designation', 'employee', 'location', 'unit'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'salary', label: 'Base Salary (₹)' },
        { field: 'bonus', label: 'Performance Bonus (₹)' },
        { field: 'incentives', label: 'Sales Incentives (₹)' },
        { field: 'insurance', label: 'Med Insurance Premium (₹)' },
        { field: 'total', label: 'Total Benefits (₹)' }
      ]
    },
    consolidated: {
      title: 'Consolidated Payslip Summary',
      filters: ['month', 'year', 'department', 'designation', 'employee', 'location', 'unit', 'payrollstatus'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'gross', label: 'Gross Earnings (₹)' },
        { field: 'deductions', label: 'Deductions (₹)' },
        { field: 'net', label: 'Net Disbursed (₹)' },
        { field: 'mode', label: 'Payment Method' },
        { field: 'status', label: 'Payroll State' }
      ]
    },
    advance: {
      title: 'Advance Details',
      filters: ['month', 'year', 'department', 'designation', 'employee', 'location'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'date', label: 'Advance Date' },
        { field: 'advanceAmount', label: 'Advance Amount (₹)' },
        { field: 'recoveryAmount', label: 'Recovered Amount (₹)' },
        { field: 'balance', label: 'Balance Due (₹)' },
        { field: 'status', label: 'Recovery Status' }
      ]
    },
    unitgrade: {
      title: 'Unit / Grade Wise Salary',
      filters: ['month', 'year', 'location', 'unit'],
      headers: [
        { field: 'unit', label: 'Functional Unit' },
        { field: 'grade', label: 'Employee Grade' },
        { field: 'count', label: 'Employee Count' },
        { field: 'gross', label: 'Gross Salary (₹)' },
        { field: 'deductions', label: 'Deductions (₹)' },
        { field: 'net', label: 'Net Payable (₹)' }
      ]
    },
    label: {
      title: 'Label',
      filters: ['department', 'designation', 'employee', 'location', 'unit'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'loc', label: 'Location' },
        { field: 'unit', label: 'Functional Unit' }
      ]
    },
    cheque: {
      title: 'Given Cheque Details',
      filters: ['month', 'year', 'employee'],
      headers: [
        { field: 'chequeNumber', label: 'Cheque Number' },
        { field: 'name', label: 'Issued To (Employee)' },
        { field: 'bank', label: 'Bank Name' },
        { field: 'amount', label: 'Cheque Amount (₹)' },
        { field: 'issueDate', label: 'Date Issued' },
        { field: 'clearanceDate', label: 'Clearance Date' },
        { field: 'status', label: 'Cheque Status' }
      ]
    },
    functionalunit: {
      title: 'Functional Unit Wise Details',
      filters: ['month', 'year', 'unit'],
      headers: [
        { field: 'unit', label: 'Functional Unit' },
        { field: 'count', label: 'Employee Count' },
        { field: 'gross', label: 'Gross Budget (₹)' },
        { field: 'deductions', label: 'Total Deductions (₹)' },
        { field: 'net', label: 'Net Disbursed (₹)' }
      ]
    },
    bankcredit: {
      title: 'Bank Credit Details',
      filters: ['month', 'year', 'employee', 'department', 'location'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'bank', label: 'Bank Name' },
        { field: 'account', label: 'Account Number' },
        { field: 'amount', label: 'Credited Amount (₹)' },
        { field: 'reference', label: 'Transaction Reference' },
        { field: 'status', label: 'Transfer Status' }
      ]
    },
    payslipemail: {
      title: 'Pay Slip Email',
      filters: ['month', 'year', 'department', 'employee'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'email', label: 'Email Address' },
        { field: 'month', label: 'Payslip Month' },
        { field: 'sentDate', label: 'Date Emailed' },
        { field: 'status', label: 'Delivery Status' }
      ]
    },
    revisionpercentage: {
      title: 'Salary Revision Certificate Percentage',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee', 'location'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'prevSalary', label: 'Previous Salary (₹)' },
        { field: 'revSalary', label: 'Revised Salary (₹)' },
        { field: 'incrementPercent', label: 'Increment (%)' },
        { field: 'incrementAmount', label: 'Increment Amount (₹)' },
        { field: 'effectiveDate', label: 'Effective Date' }
      ]
    },
    revisionbulk: {
      title: 'Salary Revision Certificate Bulk',
      filters: ['fromDate', 'toDate', 'department', 'location', 'unit'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'prevSalary', label: 'Previous Salary (₹)' },
        { field: 'revSalary', label: 'Revised Salary (₹)' },
        { field: 'revisionAmount', label: 'Revision Amount (₹)' },
        { field: 'effectiveDate', label: 'Effective Date' },
        { field: 'status', label: 'Certificate Status' }
      ]
    }
  };

  constructor() {}

  getEmployeeList(): EmployeeProfile[] {
    return this.rawEmployeeDB;
  }

  getEmployeeById(id: string): EmployeeProfile | undefined {
    return this.rawEmployeeDB.find(e => e.id === id);
  }

  getReportMetadata(reportType: string): any {
    return this.metadata[reportType] || { title: 'Salary Report', filters: [], headers: [] };
  }

  getReportData(
    reportType: string,
    filters: any,
    searchQuery: string,
    page: number,
    pageSize: number,
    sortKey: string,
    sortDir: string
  ): { data: SalaryRecord[]; total: number; summaryCards: any[] } {
    let dataset: SalaryRecord[] = [];

    // Map screen inputs
    if (reportType === 'payroll') {
      dataset = [...this.db['payroll']];
    } else if (reportType === 'salarysummary') {
      dataset = [...this.db['salarysummary']];
    } else if (reportType === 'salaryabstract') {
      dataset = [...this.db['salaryabstract']];
    } else if (reportType === 'benefits') {
      dataset = [...this.db['benefits']];
    } else if (reportType === 'consolidated') {
      dataset = [...this.db['payroll']];
    } else if (reportType === 'advance') {
      dataset = [...this.db['advance']];
    } else if (reportType === 'unitgrade') {
      dataset = [...this.db['unitgrade']];
    } else if (reportType === 'label') {
      dataset = this.rawEmployeeDB.map(e => ({
        id: e.id, name: e.name, dept: e.dept, desg: e.desg, loc: e.loc, unit: e.unit
      }));
    } else if (reportType === 'cheque') {
      dataset = [...this.db['cheque']];
    } else if (reportType === 'functionalunit') {
      dataset = this.calculateFunctionalUnitRecords();
    } else if (reportType === 'bankcredit') {
      dataset = [...this.db['bankcredit']];
    } else if (reportType === 'payslipemail') {
      dataset = this.calculateEmailDeliveryRecords();
    } else if (reportType === 'revisionpercentage') {
      dataset = this.rawEmployeeDB.map(e => ({
        id: e.id, name: e.name, prevSalary: e.prevSalary, revSalary: e.revSalary, incrementPercent: e.incPercent, incrementAmount: e.incAmount, effectiveDate: e.effDate
      }));
    } else if (reportType === 'revisionbulk') {
      dataset = this.rawEmployeeDB.map(e => ({
        id: e.id, name: e.name, prevSalary: e.prevSalary, revSalary: e.revSalary, revisionAmount: e.incAmount, effectiveDate: e.effDate, status: 'Generated'
      }));
    }

    // 1. Core Profile Filters
    dataset = dataset.filter(row => {
      let empId = row.id || (row.name ? this.rawEmployeeDB.find(e => e.name === row.name)?.id : null);
      if (!empId && row.department) return true; 
      if (!empId && row.head) return true; 
      if (!empId && row.unit) return true; 

      const empInfo = this.rawEmployeeDB.find(e => e.id === empId);
      if (!empInfo) return true;

      if (filters.department && filters.department !== 'All' && empInfo.dept !== filters.department) return false;
      if (filters.designation && filters.designation !== 'All' && empInfo.desg !== filters.designation) return false;
      if (filters.location && filters.location !== 'All' && empInfo.loc !== filters.location) return false;
      if (filters.unit && filters.unit !== 'All' && empInfo.unit !== filters.unit) return false;
      if (filters.category && filters.category !== 'All' && empInfo.cat !== filters.category) return false;
      if (filters.empstatus && filters.empstatus !== 'All' && empInfo.status !== filters.empstatus) return false;
      if (filters.employee && filters.employee !== 'All') {
        const employeeFilter = String(filters.employee).toLowerCase();
        if (empInfo.id.toLowerCase() !== employeeFilter && !empInfo.name.toLowerCase().includes(employeeFilter)) return false;
      }

      return true;
    });

    // 2. Specific Payroll Status filter
    if (filters.payrollstatus && filters.payrollstatus !== 'All' && ['payroll', 'consolidated'].includes(reportType)) {
      dataset = dataset.filter(r => r.status === filters.payrollstatus);
    }

    // 3. Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      dataset = dataset.filter(row => {
        return Object.values(row).some(v => String(v).toLowerCase().includes(q));
      });
    }

    // 4. Custom sorting logic
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
    const summaryCards = this.calculateSummaryCards(reportType, dataset);

    const startIdx = (page - 1) * pageSize;
    const paginatedData = dataset.slice(startIdx, startIdx + pageSize);

    return {
      data: paginatedData,
      total,
      summaryCards
    };
  }

  importExcel(reportType: string, importedData: any[]): void {
    if (!this.db[reportType] && reportType !== 'label' && reportType !== 'functionalunit' && reportType !== 'payslipemail' && reportType !== 'revisionpercentage' && reportType !== 'revisionbulk') {
      this.db[reportType] = [];
    }

    const sanitized: SalaryRecord[] = importedData.map(item => {
      return {
        id: item.id || item['Emp ID'] || 'EDS' + Math.floor(100 + Math.random() * 900),
        name: item.name || item['Employee Name'] || 'Imported Employee',
        dept: item.dept || item['Department'] || 'Development',
        desg: item.desg || item['Designation'] || 'Software Engineer',
        gross: Number(item.gross || item['Gross Salary (₹)'] || item['Gross Earnings (₹)'] || 45000),
        deductions: Number(item.deductions || item['Deductions (₹)'] || 4000),
        net: Number(item.net || item['Net Salary (₹)'] || item['Net Payable (₹)'] || item['Net Disbursed (₹)'] || 41000),
        mode: item.mode || item['Payment Mode'] || 'Bank Transfer',
        status: item.status || item['Status'] || 'Released',
        salary: Number(item.salary || item['Base Salary (₹)'] || 45000),
        bonus: Number(item.bonus || item['Performance Bonus (₹)'] || 0),
        incentives: Number(item.incentives || item['Sales Incentives (₹)'] || 0),
        insurance: Number(item.insurance || item['Med Insurance Premium (₹)'] || 0),
        total: Number(item.total || item['Total Benefits (₹)'] || 45000),
        date: item.date || item['Advance Date'] || item['Issue Date'] || '24/06/2026',
        advanceAmount: Number(item.advanceAmount || item['Advance Amount (₹)'] || 0),
        recoveryAmount: Number(item.recoveryAmount || item['Recovered Amount (₹)'] || 0),
        balance: Number(item.balance || item['Balance Due (₹)'] || 0),
        chequeNumber: item.chequeNumber || item['Cheque Number'] || 'CHQ-' + Math.floor(100000 + Math.random() * 900000),
        bank: item.bank || item['Bank Name'] || 'SBI Bank',
        amount: Number(item.amount || item['Cheque Amount (₹)'] || item['Credited Amount (₹)'] || 45000),
        issueDate: item.issueDate || item['Issue Date'] || '24/06/2026',
        clearanceDate: item.clearanceDate || item['Clearance Date'] || '--:--',
        reference: item.reference || item['Transaction Reference'] || 'REF-TXN-' + Math.floor(100000 + Math.random() * 900000),
        email: item.email || item['Email Address'] || 'employee@workateaze.com',
        month: item.month || item['Payslip Month'] || 'June 2026',
        sentDate: item.sentDate || item['Date Emailed'] || '24/06/2026',
        prevSalary: Number(item.prevSalary || item['Previous Salary (₹)'] || 45000),
        revSalary: Number(item.revSalary || item['Revised Salary (₹)'] || 49500),
        effectiveDate: item.effectiveDate || item['Effective Date'] || '01/06/2026'
      };
    });

    if (reportType === 'payroll' || reportType === 'consolidated') {
      this.db['payroll'] = [...sanitized, ...this.db['payroll']];
    } else if (this.db[reportType]) {
      this.db[reportType] = [...sanitized, ...this.db[reportType]];
    } else {
      // For read-only/calculated databases, we can import into the base employee registry
      sanitized.forEach(s => {
        if (s.id && s.name) {
          this.rawEmployeeDB.unshift({
            id: s.id,
            name: s.name,
            dept: s.dept || 'Development',
            desg: s.desg || 'Software Engineer',
            loc: s.loc || 'Bangalore',
            unit: s.unit || 'Tech Unit',
            cat: 'Permanent',
            status: 'Active',
            bank: s.bank || 'SBI Bank',
            account: s.account || '**********1234',
            email: s.email || 'imported@workateaze.com',
            prevSalary: s.prevSalary || 45000,
            revSalary: s.revSalary || 49500,
            incPercent: s.incrementPercent || 10,
            incAmount: s.incrementAmount || 4500,
            effDate: s.effectiveDate || '01/06/2026'
          });
        }
      });
    }
  }

  private calculateFunctionalUnitRecords(): SalaryRecord[] {
    const list = [...this.db['payroll']];
    const map: { [key: string]: SalaryRecord } = {};
    
    list.forEach(item => {
      if (item.id) {
        const emp = this.rawEmployeeDB.find(e => e.id === item.id);
        if (emp) {
          const u = emp.unit;
          if (!map[u]) {
            map[u] = { unit: u, count: 0, gross: 0, deductions: 0, net: 0 };
          }
          map[u].count = (map[u].count || 0) + 1;
          map[u].gross = (map[u].gross || 0) + (item.gross || 0);
          map[u].deductions = (map[u].deductions || 0) + (item.deductions || 0);
          map[u].net = (map[u].net || 0) + (item.net || 0);
        }
      }
    });

    return Object.values(map);
  }

  private calculateEmailDeliveryRecords(): SalaryRecord[] {
    return this.rawEmployeeDB.map(e => {
      let delivery = 'Delivered';
      if (e.id === 'EDS006') delivery = 'Bounced';
      if (e.id === 'EDS004' || e.id === 'EDS008') delivery = 'Pending';
      
      return {
        id: e.id,
        name: e.name,
        email: e.email,
        month: 'May 2026',
        sentDate: delivery === 'Delivered' ? '28/05/2026' : '--:--',
        status: delivery
      };
    });
  }

  private calculateSummaryCards(reportType: string, activeList: SalaryRecord[]): any[] {
    let cards: any[] = [];

    if (reportType === 'payroll' || reportType === 'consolidated') {
      const grossSum = activeList.reduce((sum, r) => sum + (r.gross || 0), 0);
      const netSum = activeList.reduce((sum, r) => sum + (r.net || 0), 0);
      const totalEmp = activeList.length;
      const modes = [...new Set(activeList.map(r => r.mode))].length;

      cards = [
        { label: 'Total Employees', value: totalEmp, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Gross Earnings Budget', value: `₹${grossSum.toLocaleString()}`, icon: 'fa-sack-dollar', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Net Payable Disbursed', value: `₹${netSum.toLocaleString()}`, icon: 'fa-wallet', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Active Payment Methods', value: modes, icon: 'fa-credit-card', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'salarysummary') {
      const depts = activeList.length;
      const totalEmp = activeList.reduce((sum, r) => sum + (r.count || 0), 0);
      const totalNet = activeList.reduce((sum, r) => sum + (r.net || 0), 0);
      const avgNet = totalEmp ? Math.round(totalNet / totalEmp) : 0;

      cards = [
        { label: 'Active Departments', value: depts, icon: 'fa-building', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Total Staff Count', value: totalEmp, icon: 'fa-users', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Total Net Payroll', value: `₹${totalNet.toLocaleString()}`, icon: 'fa-money-bill-wave', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Average Net Salary', value: `₹${avgNet.toLocaleString()}`, icon: 'fa-user-tag', color: 'bg-amber-50 text-amber-600' }
      ];
    }
    else if (reportType === 'salaryabstract') {
      const grossItems = activeList.filter(r => (r.earnings || 0) > 0).length;
      const dedItems = activeList.filter(r => (r.deductions || 0) > 0).length;
      const totalEarn = activeList.reduce((sum, r) => sum + (r.earnings || 0), 0);
      const totalDed = activeList.reduce((sum, r) => sum + (r.deductions || 0), 0);

      cards = [
        { label: 'Earnings Components', value: grossItems, icon: 'fa-circle-plus', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Deduction Categories', value: dedItems, icon: 'fa-circle-minus', color: 'bg-red-50 text-red-500' },
        { label: 'Gross Disbursed', value: `₹${totalEarn.toLocaleString()}`, icon: 'fa-money-bill-trend-up', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Deductions Pool', value: `₹${totalDed.toLocaleString()}`, icon: 'fa-vault', color: 'bg-slate-100 text-slate-700' }
      ];
    }
    else if (reportType === 'benefits') {
      const totalEmp = activeList.length;
      const totalBenefits = activeList.reduce((sum, r) => sum + (r.total || 0), 0);
      const totalIncentives = activeList.reduce((sum, r) => sum + (r.incentives || 0), 0);
      const avgBenefits = totalEmp ? Math.round(totalBenefits / totalEmp) : 0;

      cards = [
        { label: 'Employees Configured', value: totalEmp, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Total Incentives Paid', value: `₹${totalIncentives.toLocaleString()}`, icon: 'fa-award', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Total Benefits Cost', value: `₹${totalBenefits.toLocaleString()}`, icon: 'fa-gem', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Average CTC Package', value: `₹${avgBenefits.toLocaleString()}`, icon: 'fa-user-shield', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'advance') {
      const totalAdv = activeList.length;
      const totalAmount = activeList.reduce((sum, r) => sum + (r.advanceAmount || 0), 0);
      const recovered = activeList.reduce((sum, r) => sum + (r.recoveryAmount || 0), 0);
      const balance = activeList.reduce((sum, r) => sum + (r.balance || 0), 0);

      cards = [
        { label: 'Total Advance Files', value: totalAdv, icon: 'fa-hand-holding-dollar', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Total Outlay Given', value: `₹${totalAmount.toLocaleString()}`, icon: 'fa-file-invoice-dollar', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Total Recovered', value: `₹${recovered.toLocaleString()}`, icon: 'fa-circle-check', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Outstanding Balance', value: `₹${balance.toLocaleString()}`, icon: 'fa-triangle-exclamation', color: 'bg-red-50 text-red-600' }
      ];
    }
    else if (reportType === 'unitgrade') {
      const units = [...new Set(activeList.map(r => r.unit))].length;
      const totalEmp = activeList.reduce((sum, r) => sum + (r.count || 0), 0);
      const totalNet = activeList.reduce((sum, r) => sum + (r.net || 0), 0);

      cards = [
        { label: 'Functional Units', value: units, icon: 'fa-sitemap', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Staff Count', value: totalEmp, icon: 'fa-users', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Total Net Payroll', value: `₹${totalNet.toLocaleString()}`, icon: 'fa-coins', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Grade Distributions', value: activeList.length, icon: 'fa-chart-pie', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'cheque') {
      const total = activeList.length;
      const totalAmt = activeList.reduce((sum, r) => sum + (r.amount || 0), 0);
      const cleared = activeList.filter(r => r.status === 'Cleared').length;
      const pending = activeList.filter(r => r.status === 'Pending').length;

      cards = [
        { label: 'Cheques Issued', value: total, icon: 'fa-money-check-dollar', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Total Cheques Amount', value: `₹${totalAmt.toLocaleString()}`, icon: 'fa-file-invoice-dollar', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Cleared Cheques', value: cleared, icon: 'fa-check-double', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Awaiting Clearance', value: pending, icon: 'fa-hourglass-half', color: 'bg-amber-50 text-amber-600' }
      ];
    }
    else if (reportType === 'functionalunit') {
      const units = activeList.length;
      const count = activeList.reduce((sum, r) => sum + (r.count || 0), 0);
      const net = activeList.reduce((sum, r) => sum + (r.net || 0), 0);

      cards = [
        { label: 'Active Units', value: units, icon: 'fa-folder-tree', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Total Employees', value: count, icon: 'fa-users', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Net Disbursed', value: `₹${net.toLocaleString()}`, icon: 'fa-wallet', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Avg Unit Budget', value: `₹${Math.round(net / (units || 1)).toLocaleString()}`, icon: 'fa-chart-simple', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'bankcredit') {
      const total = activeList.length;
      const sum = activeList.reduce((sum, r) => sum + (r.amount || 0), 0);
      const success = activeList.filter(r => r.status === 'Success').length;

      cards = [
        { label: 'Bank Transfers', value: total, icon: 'fa-building-columns', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Total Credited Net', value: `₹${sum.toLocaleString()}`, icon: 'fa-money-bill-transfer', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Transfer Success', value: success, icon: 'fa-circle-check', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Transfer Errors', value: total - success, icon: 'fa-circle-xmark', color: 'bg-red-50 text-red-600' }
      ];
    }
    else if (reportType === 'payslipemail') {
      const total = activeList.length;
      const delivered = activeList.filter(r => r.status === 'Delivered').length;
      const pending = activeList.filter(r => r.status === 'Pending').length;
      const bounced = activeList.filter(r => r.status === 'Bounced').length;

      cards = [
        { label: 'Total Emails Scheduled', value: total, icon: 'fa-envelope-open-text', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Delivered Successfully', value: delivered, icon: 'fa-circle-check', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Awaiting Sending Queue', value: pending, icon: 'fa-clock', color: 'bg-amber-50 text-amber-600' },
        { label: 'Delivery Bounces', value: bounced, icon: 'fa-triangle-exclamation', color: 'bg-red-50 text-red-600' }
      ];
    }
    else if (reportType === 'revisionpercentage') {
      const total = activeList.length;
      const totalInc = activeList.reduce((sum, r) => sum + (r.incrementAmount || 0), 0);
      const avgInc = total ? Math.round(totalInc / total) : 0;
      const avgIncPercent = total ? (activeList.reduce((sum, r) => sum + (r.incrementPercent || 0), 0) / total).toFixed(1) : '0.0';

      cards = [
        { label: 'Employees Revised', value: total, icon: 'fa-user-pen', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Average Revision (%)', value: `${avgIncPercent}%`, icon: 'fa-percent', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Total Increment Outlay', value: `₹${totalInc.toLocaleString()}`, icon: 'fa-money-bill-trend-up', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Average Revision (₹)', value: `₹${avgInc.toLocaleString()}`, icon: 'fa-circle-dollar-to-slot', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'revisionbulk') {
      const total = activeList.length;
      const totalAmt = activeList.reduce((sum, r) => sum + (r.revisionAmount || 0), 0);
      const avgAmt = total ? Math.round(totalAmt / total) : 0;

      cards = [
        { label: 'Employees Selected', value: total, icon: 'fa-users-viewfinder', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Total Revised Outlay', value: `₹${totalAmt.toLocaleString()}`, icon: 'fa-chart-line-up', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Average Bulk Revision', value: `₹${avgAmt.toLocaleString()}`, icon: 'fa-circle-dollar-to-slot', color: 'bg-purple-50 text-purple-600' },
        { label: 'Certificates Status', value: 'Ready', icon: 'fa-stamp', color: 'bg-amber-50 text-amber-600' }
      ];
    }

    return cards;
  }
}
