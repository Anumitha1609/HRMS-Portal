import { Injectable } from '@angular/core';

export interface IncrementRecord {
  id?: string;
  name?: string;
  dept?: string;
  desg?: string;
  prevSalary?: number;
  revSalary?: number;
  incAmount?: number;
  incPercent?: number;
  effDate?: string;
  incType?: string;
  approvalStatus?: string;
  approvedBy?: string;
  date?: string;
  reqId?: string;
  propSalary?: number;
  reqDate?: string;
  status?: string;
  location?: string;
  unit?: string;
  cat?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IncrementService {
  private rawEmployeeDB: IncrementRecord[] = [
    { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', location: 'Chennai', unit: 'Design Unit', cat: 'Permanent', status: 'Active', prevSalary: 45000, revSalary: 49500, incAmount: 4500, incPercent: 10.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Harini M' },
    { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', location: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', prevSalary: 65000, revSalary: 72800, incAmount: 7800, incPercent: 12.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Ramesh Kumar' },
    { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', location: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', prevSalary: 40000, revSalary: 43200, incAmount: 3200, incPercent: 8.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Deepika J' },
    { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', location: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', prevSalary: 55000, revSalary: 60500, incAmount: 5500, incPercent: 10.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Vijay Shankar' },
    { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', location: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', prevSalary: 48000, revSalary: 52800, incAmount: 4800, incPercent: 10.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Ramesh Kumar' },
    { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', location: 'Chennai', unit: 'Design Unit', cat: 'Contract', status: 'Active', prevSalary: 42000, revSalary: 44100, incAmount: 2100, incPercent: 5.0, effDate: '2026-04-01', incType: 'Market Correction', approvalStatus: 'Rejected', approvedBy: 'Harini M' },
    { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', location: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', prevSalary: 35000, revSalary: 37800, incAmount: 2800, incPercent: 8.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Vijay Shankar' },
    { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', location: 'Bangalore', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', prevSalary: 46000, revSalary: 50600, incAmount: 4600, incPercent: 10.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Priya Dharshini' },
    { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', location: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', prevSalary: 50000, revSalary: 55000, incAmount: 5000, incPercent: 10.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Pending', approvedBy: '--' },
    { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', location: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', prevSalary: 43000, revSalary: 46440, incAmount: 3440, incPercent: 8.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Vijay Shankar' },
    { id: 'EDS011', name: 'Ramesh Kumar', dept: 'Development', desg: 'Team Lead', location: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', prevSalary: 80000, revSalary: 92000, incAmount: 12000, incPercent: 15.0, effDate: '2026-04-01', incType: 'Promotion', approvalStatus: 'Approved', approvedBy: 'Admin User' },
    { id: 'EDS012', name: 'Priya Dharshini', dept: 'Finance', desg: 'Senior Executive', location: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', prevSalary: 58000, revSalary: 64960, incAmount: 6960, incPercent: 12.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Admin User' },
    { id: 'EDS013', name: 'Abishek Nair', dept: 'Support', desg: 'Support Engineer', location: 'Chennai', unit: 'Admin Unit', cat: 'Contract', status: 'Active', prevSalary: 28000, revSalary: 29400, incAmount: 1400, incPercent: 5.0, effDate: '2026-04-01', incType: 'Off-cycle', approvalStatus: 'Pending', approvedBy: '--' },
    { id: 'EDS014', name: 'Deepika J', dept: 'QA', desg: 'QA Lead', location: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', prevSalary: 70000, revSalary: 79100, incAmount: 9100, incPercent: 13.0, effDate: '2026-04-01', incType: 'Promotion', approvalStatus: 'Approved', approvedBy: 'Admin User' },
    { id: 'EDS015', name: 'Vijay Shankar', dept: 'Marketing', desg: 'Marketing Manager', location: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', prevSalary: 72000, revSalary: 79200, incAmount: 7200, incPercent: 10.0, effDate: '2026-04-01', incType: 'Annual', approvalStatus: 'Approved', approvedBy: 'Admin User' },
    { id: 'EDS016', name: 'Rajesh Koothrappali', dept: 'Support', desg: 'Support Engineer', location: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', prevSalary: 30000, revSalary: 30000, incAmount: 0, incPercent: 0.0, effDate: 'N/A', incType: 'Annual', approvalStatus: 'Approved', approvedBy: '--' },
    { id: 'EDS017', name: 'Bernadette Rosten', dept: 'QA', desg: 'QA Engineer', location: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', prevSalary: 42000, revSalary: 42000, incAmount: 0, incPercent: 0.0, effDate: 'N/A', incType: 'Annual', approvalStatus: 'Approved', approvedBy: '--' }
  ];

  private incrementHistoryDB: IncrementRecord[] = [
    { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', date: '2023-04-01', prevSalary: 38000, revSalary: 41000, incAmount: 3000, incPercent: 7.9, approvedBy: 'Harini M' },
    { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', date: '2024-04-01', prevSalary: 41000, revSalary: 45000, incAmount: 4000, incPercent: 9.8, approvedBy: 'Harini M' },
    { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', date: '2026-04-01', prevSalary: 45000, revSalary: 49500, incAmount: 4500, incPercent: 10.0, approvedBy: 'Harini M' },
    { id: 'EDS002', name: 'Divya S', dept: 'Development', date: '2023-04-01', prevSalary: 52000, revSalary: 58000, incAmount: 6000, incPercent: 11.5, approvedBy: 'Ramesh Kumar' },
    { id: 'EDS002', name: 'Divya S', dept: 'Development', date: '2024-04-01', prevSalary: 58000, revSalary: 65000, incAmount: 7000, incPercent: 12.1, approvedBy: 'Ramesh Kumar' },
    { id: 'EDS002', name: 'Divya S', dept: 'Development', date: '2026-04-01', prevSalary: 65000, revSalary: 72800, incAmount: 7800, incPercent: 12.0, approvedBy: 'Ramesh Kumar' },
    { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', date: '2024-04-01', prevSalary: 36000, revSalary: 40000, incAmount: 4000, incPercent: 11.1, approvedBy: 'Deepika J' },
    { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', date: '2026-04-01', prevSalary: 40000, revSalary: 43200, incAmount: 3200, incPercent: 8.0, approvedBy: 'Deepika J' },
    { id: 'EDS004', name: 'Harini M', dept: 'HR', date: '2023-04-01', prevSalary: 46000, revSalary: 50000, incAmount: 4000, incPercent: 8.7, approvedBy: 'Vijay Shankar' },
    { id: 'EDS004', name: 'Harini M', dept: 'HR', date: '2024-04-01', prevSalary: 50000, revSalary: 55000, incAmount: 5000, incPercent: 10.0, approvedBy: 'Vijay Shankar' },
    { id: 'EDS004', name: 'Harini M', dept: 'HR', date: '2026-04-01', prevSalary: 55000, revSalary: 60500, incAmount: 5500, incPercent: 10.0, approvedBy: 'Vijay Shankar' },
    { id: 'EDS005', name: 'Karthik P', dept: 'Development', date: '2024-04-01', prevSalary: 43000, revSalary: 48000, incAmount: 5000, incPercent: 11.6, approvedBy: 'Ramesh Kumar' },
    { id: 'EDS005', name: 'Karthik P', dept: 'Development', date: '2026-04-01', prevSalary: 48000, revSalary: 52800, incAmount: 4800, incPercent: 10.0, approvedBy: 'Ramesh Kumar' },
    { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', date: '2024-04-01', prevSalary: 41000, revSalary: 46000, incAmount: 5000, incPercent: 12.2, approvedBy: 'Priya Dharshini' },
    { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', date: '2026-04-01', prevSalary: 46000, revSalary: 50600, incAmount: 4600, incPercent: 10.0, approvedBy: 'Priya Dharshini' },
    { id: 'EDS011', name: 'Ramesh Kumar', dept: 'Development', date: '2023-04-01', prevSalary: 68000, revSalary: 74000, incAmount: 6000, incPercent: 8.8, approvedBy: 'Admin User' },
    { id: 'EDS011', name: 'Ramesh Kumar', dept: 'Development', date: '2024-04-01', prevSalary: 74000, revSalary: 80000, incAmount: 6000, incPercent: 8.1, approvedBy: 'Admin User' },
    { id: 'EDS011', name: 'Ramesh Kumar', dept: 'Development', date: '2026-04-01', prevSalary: 80000, revSalary: 92000, incAmount: 12000, incPercent: 15.0, approvedBy: 'Admin User' }
  ];

  private incrementApprovalDB: IncrementRecord[] = [
    { reqId: 'REQ-INC-001', id: 'EDS011', name: 'Ramesh Kumar', dept: 'Development', prevSalary: 80000, propSalary: 92000, incAmount: 12000, incPercent: 15.0, reqDate: '2026-03-10', status: 'Approved', approvedBy: 'Admin User' },
    { reqId: 'REQ-INC-002', id: 'EDS002', name: 'Divya S', dept: 'Development', prevSalary: 65000, propSalary: 72800, incAmount: 7800, incPercent: 12.0, reqDate: '2026-03-11', status: 'Approved', approvedBy: 'Ramesh Kumar' },
    { reqId: 'REQ-INC-003', id: 'EDS014', name: 'Deepika J', dept: 'QA', prevSalary: 70000, propSalary: 79100, incAmount: 9100, incPercent: 13.0, reqDate: '2026-03-12', status: 'Approved', approvedBy: 'Admin User' },
    { reqId: 'REQ-INC-004', id: 'EDS001', name: 'Arun Kumar', dept: 'Design', prevSalary: 45000, propSalary: 49500, incAmount: 4500, incPercent: 10.0, reqDate: '2026-03-14', status: 'Approved', approvedBy: 'Harini M' },
    { reqId: 'REQ-INC-005', id: 'EDS004', name: 'Harini M', dept: 'HR', prevSalary: 55000, propSalary: 60500, incAmount: 5500, incPercent: 10.0, reqDate: '2026-03-15', status: 'Approved', approvedBy: 'Vijay Shankar' },
    { reqId: 'REQ-INC-006', id: 'EDS009', name: 'Praveen K', dept: 'Development', prevSalary: 50000, propSalary: 55000, incAmount: 5000, incPercent: 10.0, reqDate: '2026-03-16', status: 'Pending', approvedBy: '--' },
    { reqId: 'REQ-INC-007', id: 'EDS013', name: 'Abishek Nair', dept: 'Support', prevSalary: 28000, propSalary: 29400, incAmount: 1400, incPercent: 5.0, reqDate: '2026-03-18', status: 'Pending', approvedBy: '--' },
    { reqId: 'REQ-INC-008', id: 'EDS006', name: 'Lavanya R', dept: 'Design', prevSalary: 42000, propSalary: 44100, incAmount: 2100, incPercent: 5.0, reqDate: '2026-03-18', status: 'Rejected', approvedBy: 'Harini M' },
    { reqId: 'REQ-INC-009', id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', prevSalary: 40000, propSalary: 43200, incAmount: 3200, incPercent: 8.0, reqDate: '2026-03-19', status: 'Approved', approvedBy: 'Deepika J' },
    { reqId: 'REQ-INC-010', id: 'EDS005', name: 'Karthik P', dept: 'Development', prevSalary: 48000, propSalary: 52800, incAmount: 4800, incPercent: 10.0, reqDate: '2026-03-20', status: 'Approved', approvedBy: 'Ramesh Kumar' },
    { reqId: 'REQ-INC-011', id: 'EDS008', name: 'Nandhini S', dept: 'Finance', prevSalary: 46000, propSalary: 50600, incAmount: 4600, incPercent: 10.0, reqDate: '2026-03-21', status: 'Approved', approvedBy: 'Priya Dharshini' },
    { reqId: 'REQ-INC-012', id: 'EDS007', name: 'Mohan Raj', dept: 'Support', prevSalary: 35000, propSalary: 37800, incAmount: 2800, incPercent: 8.0, reqDate: '2026-03-22', status: 'Approved', approvedBy: 'Vijay Shankar' },
    { reqId: 'REQ-INC-013', id: 'EDS010', name: 'Swetha R', dept: 'Marketing', prevSalary: 43000, propSalary: 46440, incAmount: 3440, incPercent: 8.0, reqDate: '2026-03-23', status: 'Approved', approvedBy: 'Vijay Shankar' },
    { reqId: 'REQ-INC-014', id: 'EDS012', name: 'Priya Dharshini', dept: 'Finance', prevSalary: 58000, propSalary: 64960, incAmount: 6960, incPercent: 12.0, reqDate: '2026-03-24', status: 'Approved', approvedBy: 'Admin User' },
    { reqId: 'REQ-INC-015', id: 'EDS015', name: 'Vijay Shankar', dept: 'Marketing', prevSalary: 72000, propSalary: 79200, incAmount: 7200, incPercent: 10.0, reqDate: '2026-03-25', status: 'Approved', approvedBy: 'Admin User' }
  ];

  private metadata: { [key: string]: any } = {
    details: {
      title: 'Increment Details',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee', 'location', 'unit', 'incrementType', 'empStatus', 'approvalStatus'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'prevSalary', label: 'Previous Salary (₹)' },
        { field: 'revSalary', label: 'Revised Salary (₹)' },
        { field: 'incAmount', label: 'Increment Amt (₹)' },
        { field: 'incPercent', label: 'Increment (%)' },
        { field: 'effDate', label: 'Effective Date' },
        { field: 'incType', label: 'Increment Type' },
        { field: 'approvalStatus', label: 'Approval Status' }
      ]
    },
    comparison: {
      title: 'Salary Comparison Report',
      filters: ['fromDate', 'toDate', 'department', 'designation', 'employee', 'location', 'unit', 'incrementType', 'approvalStatus'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'prevSalary', label: 'Previous Salary (₹)' },
        { field: 'revSalary', label: 'Revised Salary (₹)' },
        { field: 'incAmount', label: 'Variance Amount (₹)' },
        { field: 'incPercent', label: 'Variance (%)' },
        { field: 'effDate', label: 'Effective Date' },
        { field: 'incType', label: 'Revision Category' }
      ]
    },
    history: {
      title: 'Increment History',
      filters: ['department', 'designation', 'employee', 'location'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'date', label: 'Revision Date' },
        { field: 'prevSalary', label: 'Previous Salary (₹)' },
        { field: 'revSalary', label: 'Revised Salary (₹)' },
        { field: 'incAmount', label: 'Increment Amt (₹)' },
        { field: 'incPercent', label: 'Percentage (%)' },
        { field: 'approvedBy', label: 'Authorized By' }
      ]
    },
    summary: {
      title: 'Employee Increment Summary',
      filters: ['department', 'designation', 'employee', 'location', 'unit', 'empStatus'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'desg', label: 'Designation' },
        { field: 'prevSalary', label: 'Starting Salary (₹)' },
        { field: 'revSalary', label: 'Current Salary (₹)' },
        { field: 'incAmount', label: 'Cumulative Rev (₹)' },
        { field: 'incPercent', label: 'Cumulative (%)' }
      ]
    },
    approval: {
      title: 'Increment Approval Status',
      filters: ['fromDate', 'toDate', 'department', 'employee', 'approvalStatus', 'category'],
      headers: [
        { field: 'reqId', label: 'Request ID' },
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'prevSalary', label: 'Current Salary (₹)' },
        { field: 'propSalary', label: 'Proposed Salary (₹)' },
        { field: 'incAmount', label: 'Variance (₹)' },
        { field: 'incPercent', label: 'Increase (%)' },
        { field: 'reqDate', label: 'Request Date' },
        { field: 'status', label: 'Approval Status' },
        { field: 'approvedBy', label: 'Approver' }
      ]
    }
  };

  constructor() {}

  getReportMetadata(reportType: string): any {
    return this.metadata[reportType] || { title: 'Increment Report', filters: [], headers: [] };
  }

  getReportData(
    reportType: string,
    filters: any,
    searchQuery: string,
    page: number,
    pageSize: number,
    sortKey: string,
    sortDir: string
  ): { data: IncrementRecord[]; total: number; summaryCards: any[] } {
    let dataset: IncrementRecord[] = [];

    if (reportType === 'details' || reportType === 'comparison' || reportType === 'summary') {
      dataset = [...this.rawEmployeeDB];
    } else if (reportType === 'history') {
      dataset = [...this.incrementHistoryDB];
    } else if (reportType === 'approval') {
      dataset = [...this.incrementApprovalDB];
    }

    // Apply Filter Configurations
    dataset = dataset.filter(row => {
      const empId = row.id;
      const empInfo = this.rawEmployeeDB.find(e => e.id === empId) || row;

      if (filters.department && filters.department !== 'All' && empInfo.dept !== filters.department) return false;
      if (filters.designation && filters.designation !== 'All' && empInfo.desg !== filters.designation) return false;
      if (filters.location && filters.location !== 'All' && empInfo.location !== filters.location) return false;
      if (filters.unit && filters.unit !== 'All' && empInfo.unit !== filters.unit) return false;
      if (filters.employee && filters.employee !== 'All') {
        const employeeFilter = String(filters.employee).toLowerCase();
        const empIdVal = empInfo.id ? String(empInfo.id).toLowerCase() : '';
        const empNameVal = empInfo.name ? String(empInfo.name).toLowerCase() : '';
        if (empIdVal !== employeeFilter && !empNameVal.includes(employeeFilter)) return false;
      }
      if (filters.incrementType && filters.incrementType !== 'All' && empInfo.incType !== filters.incrementType) return false;
      if (filters.empStatus && filters.empStatus !== 'All' && empInfo.status !== filters.empStatus) return false;
      if (filters.category && filters.category !== 'All' && empInfo.cat !== filters.category) return false;

      if (filters.approvalStatus && filters.approvalStatus !== 'All') {
        const stat = row.approvalStatus || row.status;
        if (stat !== filters.approvalStatus) return false;
      }

      return true;
    });

    // Global Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      dataset = dataset.filter(row => {
        return Object.values(row).some(v => String(v).toLowerCase().includes(q));
      });
    }

    // Sort
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
    if (reportType === 'history') {
      const sanitized: IncrementRecord[] = importedData.map(item => ({
        id: item.id || item['Emp ID'] || 'EDS' + Math.floor(100 + Math.random() * 900),
        name: item.name || item['Employee Name'] || 'Imported Employee',
        dept: item.dept || item['Department'] || 'Development',
        date: item.date || item['Revision Date'] || '2026-04-01',
        prevSalary: Number(item.prevSalary || item['Previous Salary (₹)'] || 45000),
        revSalary: Number(item.revSalary || item['Revised Salary (₹)'] || 49500),
        incAmount: Number(item.incAmount || item['Increment Amt (₹)'] || 4500),
        incPercent: Number(item.incPercent || item['Percentage (%)'] || 10.0),
        approvedBy: item.approvedBy || item['Authorized By'] || 'Admin User'
      }));
      this.incrementHistoryDB = [...sanitized, ...this.incrementHistoryDB];
    } else if (reportType === 'approval') {
      const sanitized: IncrementRecord[] = importedData.map(item => ({
        reqId: item.reqId || item['Request ID'] || 'REQ-INC-' + Math.floor(100 + Math.random() * 900),
        id: item.id || item['Emp ID'] || 'EDS' + Math.floor(100 + Math.random() * 900),
        name: item.name || item['Employee Name'] || 'Imported Employee',
        dept: item.dept || item['Department'] || 'Development',
        prevSalary: Number(item.prevSalary || item['Current Salary (₹)'] || 45000),
        propSalary: Number(item.propSalary || item['Proposed Salary (₹)'] || 49500),
        incAmount: Number(item.incAmount || item['Variance (₹)'] || 4500),
        incPercent: Number(item.incPercent || item['Increase (%)'] || 10.0),
        reqDate: item.reqDate || item['Request Date'] || '2026-03-24',
        status: item.status || item['Approval Status'] || 'Pending',
        approvedBy: item.approvedBy || item['Approver'] || '--'
      }));
      this.incrementApprovalDB = [...sanitized, ...this.incrementApprovalDB];
    } else {
      const sanitized: IncrementRecord[] = importedData.map(item => ({
        id: item.id || item['Emp ID'] || 'EDS' + Math.floor(100 + Math.random() * 900),
        name: item.name || item['Employee Name'] || 'Imported Employee',
        dept: item.dept || item['Department'] || 'Development',
        desg: item.desg || item['Designation'] || 'Software Engineer',
        location: item.location || item['Location'] || 'Bangalore',
        unit: item.unit || item['Functional Unit'] || 'Tech Unit',
        cat: 'Permanent',
        status: 'Active',
        prevSalary: Number(item.prevSalary || item['Previous Salary (₹)'] || item['Starting Salary (₹)'] || 45000),
        revSalary: Number(item.revSalary || item['Revised Salary (₹)'] || item['Current Salary (₹)'] || 49500),
        incAmount: Number(item.incAmount || item['Increment Amt (₹)'] || item['Variance Amount (₹)'] || item['Cumulative Rev (₹)'] || 4500),
        incPercent: Number(item.incPercent || item['Increment (%)'] || item['Variance (%)'] || item['Cumulative (%)'] || 10.0),
        effDate: item.effDate || item['Effective Date'] || '2026-04-01',
        incType: item.incType || item['Increment Type'] || item['Revision Category'] || 'Annual',
        approvalStatus: item.approvalStatus || item['Approval Status'] || 'Approved',
        approvedBy: item.approvedBy || item['Authorized By'] || 'Admin User'
      }));
      this.rawEmployeeDB = [...sanitized, ...this.rawEmployeeDB];
    }
  }

  // Fetch chronological increment history for the timeline panel
  getTimelineHistoryForEmployee(empId: string): IncrementRecord[] {
    return this.incrementHistoryDB
      .filter(h => h.id === empId)
      .sort((a, b) => {
        const dateA = new Date(a.date || '');
        const dateB = new Date(b.date || '');
        return dateB.getTime() - dateA.getTime(); // Descending order (latest first)
      });
  }

  private calculateSummaryCards(reportType: string, activeList: IncrementRecord[]): any[] {
    let cards: any[] = [];

    if (reportType === 'details' || reportType === 'comparison') {
      const total = activeList.length;
      const revised = activeList.filter(r => (r.incAmount || 0) > 0).length;
      const totalOutlay = activeList.reduce((sum, r) => sum + (r.incAmount || 0), 0);
      const avgIncPercent = total ? (activeList.reduce((sum, r) => sum + (r.incPercent || 0), 0) / total).toFixed(1) : '0.0';

      cards = [
        { label: 'Total Employees', value: total, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Revised Profiles', value: revised, icon: 'fa-user-pen', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Increment Outlay', value: `₹${totalOutlay.toLocaleString()}`, icon: 'fa-money-bill-trend-up', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Average Revision (%)', value: `${avgIncPercent}%`, icon: 'fa-percent', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'history') {
      const totalRevisions = activeList.length;
      const employees = new Set(activeList.map(r => r.id)).size;
      const totalAmt = activeList.reduce((sum, r) => sum + (r.incAmount || 0), 0);
      const maxInc = activeList.length ? Math.max(...activeList.map(r => r.incAmount || 0)) : 0;

      cards = [
        { label: 'Total Revisions Logged', value: totalRevisions, icon: 'fa-folder-open', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Unique Staff Revised', value: employees, icon: 'fa-users', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Historical Revisions Outlay', value: `₹${totalAmt.toLocaleString()}`, icon: 'fa-coins', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Maximum Increment Paid', value: `₹${maxInc.toLocaleString()}`, icon: 'fa-arrow-up-right-dots', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'summary') {
      const total = activeList.length;
      const startingPool = activeList.reduce((sum, r) => sum + (r.prevSalary || 0), 0);
      const currentPool = activeList.reduce((sum, r) => sum + (r.revSalary || 0), 0);
      const cumulativeOutlay = activeList.reduce((sum, r) => sum + (r.incAmount || 0), 0);

      cards = [
        { label: 'Employees Catalogued', value: total, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Initial Salary Pool', value: `₹${startingPool.toLocaleString()}`, icon: 'fa-wallet', color: 'bg-slate-100 text-slate-700' },
        { label: 'Current Salary Pool', value: `₹${currentPool.toLocaleString()}`, icon: 'fa-sack-dollar', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Cumulative Rev Outlay', value: `₹${cumulativeOutlay.toLocaleString()}`, icon: 'fa-money-bill-trend-up', color: 'bg-emerald-50 text-emerald-600' }
      ];
    }
    else if (reportType === 'approval') {
      const total = activeList.length;
      const approved = activeList.filter(r => r.status === 'Approved').length;
      const pending = activeList.filter(r => r.status === 'Pending').length;
      const rejected = activeList.filter(r => r.status === 'Rejected').length;

      cards = [
        { label: 'Total Requests', value: total, icon: 'fa-file-signature', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Approved & Finalized', value: approved, icon: 'fa-circle-check', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Pending Review', value: pending, icon: 'fa-circle-pause', color: 'bg-amber-50 text-amber-600' },
        { label: 'Rejected / Returned', value: rejected, icon: 'fa-circle-xmark', color: 'bg-red-50 text-red-600' }
      ];
    }

    return cards;
  }
}
