import { Injectable } from '@angular/core';

export interface GratuityEmployee {
  id: string;
  name: string;
  dept: string;
  desg: string;
  loc: string;
  unit: string;
  cat: string;
  status: string;
  doj: string;
  basic: number;
  da: number;
  retirementDate: string;
}

export interface GratuityClaim {
  claimNo: string;
  id: string;
  name: string;
  dept: string;
  joiningDate: string;
  leavingDate: string;
  years: number;
  lastSalary: number;
  eligibleAmt: number;
  approvedAmt: number;
  claimDate: string;
  approvalDate: string;
  status: string;
  settlementDate: string;
  desg?: string;
  basic?: number;
  da?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InsuranceGratuityService {
  private rawEmployeeDB: GratuityEmployee[] = [
    { id: 'EDS001', name: 'Arun Kumar', dept: 'Design', desg: 'UI/UX Designer', loc: 'Chennai', unit: 'Design Unit', cat: 'Permanent', status: 'Active', doj: '2018-08-10', basic: 29700, da: 7425, retirementDate: '2038-04-12' },
    { id: 'EDS002', name: 'Divya S', dept: 'Development', desg: 'Senior Developer', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', doj: '2015-05-15', basic: 43680, da: 10920, retirementDate: '2036-08-20' },
    { id: 'EDS003', name: 'Gokul Prasad', dept: 'QA', desg: 'QA Engineer', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', doj: '2022-10-01', basic: 25920, da: 6480, retirementDate: '2042-02-14' },
    { id: 'EDS004', name: 'Harini M', dept: 'HR', desg: 'HR Manager', loc: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', doj: '2017-02-20', basic: 36300, da: 9075, retirementDate: '2037-12-15' },
    { id: 'EDS005', name: 'Karthik P', dept: 'Development', desg: 'Software Engineer', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', doj: '2021-09-01', basic: 31680, da: 7920, retirementDate: '2041-07-28' },
    { id: 'EDS006', name: 'Lavanya R', dept: 'Design', desg: 'UI/UX Designer', loc: 'Chennai', unit: 'Design Unit', cat: 'Contract', status: 'Active', doj: '2023-01-15', basic: 26460, da: 6615, retirementDate: '2043-11-02' },
    { id: 'EDS007', name: 'Mohan Raj', dept: 'Support', desg: 'Support Specialist', loc: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', doj: '2019-11-12', basic: 22680, da: 5670, retirementDate: '2039-05-30' },
    { id: 'EDS008', name: 'Nandhini S', dept: 'Finance', desg: 'Finance Executive', loc: 'Bangalore', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', doj: '2021-08-01', basic: 30360, da: 7590, retirementDate: '2041-09-18' },
    { id: 'EDS009', name: 'Praveen K', dept: 'Development', desg: 'Software Engineer', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', doj: '2020-03-01', basic: 33000, da: 8250, retirementDate: '2040-01-25' },
    { id: 'EDS010', name: 'Swetha R', dept: 'Marketing', desg: 'Marketing Specialist', loc: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', doj: '2022-05-01', basic: 27864, da: 6966, retirementDate: '2042-06-19' },
    { id: 'EDS011', name: 'Ramesh Kumar', dept: 'Development', desg: 'Team Lead', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', doj: '2012-06-01', basic: 55200, da: 13800, retirementDate: '2026-12-30' },
    { id: 'EDS012', name: 'Priya Dharshini', dept: 'Finance', desg: 'Senior Executive', loc: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', doj: '2016-07-01', basic: 38976, da: 9744, retirementDate: '2036-10-05' },
    { id: 'EDS013', name: 'Abishek Nair', dept: 'Support', desg: 'Support Engineer', loc: 'Chennai', unit: 'Admin Unit', cat: 'Contract', status: 'Active', doj: '2023-06-01', basic: 17640, da: 4410, retirementDate: '2045-03-24' },
    { id: 'EDS014', name: 'Deepika J', dept: 'QA', desg: 'QA Lead', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', doj: '2014-04-15', basic: 47460, da: 11865, retirementDate: '2034-05-11' },
    { id: 'EDS015', name: 'Vijay Shankar', dept: 'Marketing', desg: 'Marketing Manager', loc: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', doj: '2015-09-01', basic: 47520, da: 11880, retirementDate: '2027-02-18' },
    { id: 'EDS016', name: 'Rajesh Koothrappali', dept: 'Support', desg: 'Support Engineer', loc: 'Chennai', unit: 'Admin Unit', cat: 'Permanent', status: 'Active', doj: '2022-12-01', basic: 18000, da: 4500, retirementDate: '2044-08-01' },
    { id: 'EDS017', name: 'Bernadette Rosten', dept: 'QA', desg: 'QA Engineer', loc: 'Bangalore', unit: 'Tech Unit', cat: 'Permanent', status: 'Active', doj: '2021-10-15', basic: 25200, da: 6300, retirementDate: '2041-11-20' }
  ];

  private gratuityClaimsDB: GratuityClaim[] = [
    { claimNo: 'CLM-GRT-001', id: 'EDS002', name: 'Divya S', dept: 'Development', joiningDate: '2015-05-15', leavingDate: '2026-05-30', years: 11.0, lastSalary: 54600, eligibleAmt: 346500, approvedAmt: 346500, claimDate: '2026-06-01', approvalDate: '2026-06-03', status: 'Settled', settlementDate: '2026-06-15' },
    { claimNo: 'CLM-GRT-002', id: 'EDS011', name: 'Ramesh Kumar', dept: 'Development', joiningDate: '2012-06-01', leavingDate: '2026-12-30', years: 14.5, lastSalary: 69000, eligibleAmt: 577500, approvedAmt: 577500, claimDate: '2026-06-02', approvalDate: '2026-06-04', status: 'Approved', settlementDate: '--:--' },
    { claimNo: 'CLM-GRT-003', id: 'EDS014', name: 'Deepika J', dept: 'QA', joiningDate: '2014-04-15', leavingDate: '2026-06-15', years: 12.1, lastSalary: 59325, eligibleAmt: 410712, approvedAmt: 410712, claimDate: '2026-06-05', approvalDate: '--:--', status: 'Submitted', settlementDate: '--:--' },
    { claimNo: 'CLM-GRT-004', id: 'EDS006', name: 'Lavanya R', dept: 'Design', joiningDate: '2023-01-15', leavingDate: '2026-05-31', years: 3.3, lastSalary: 33075, eligibleAmt: 0, approvedAmt: 0, claimDate: '2026-06-06', approvalDate: '2026-06-07', status: 'Rejected', settlementDate: '--:--' }
  ];

  private metadata: { [key: string]: any } = {
    calculations: {
      title: 'Gratuity Eligibility Calculations',
      filters: ['asOnDate', 'department', 'designation', 'employee', 'location', 'unit', 'category', 'empStatus'],
      headers: [
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'doj', label: 'Date of Joining' },
        { field: 'tenure', label: 'Tenure (Years)' },
        { field: 'eligibleBase', label: 'Eligible Salary (₹)' },
        { field: 'eligible', label: 'Status' },
        { field: 'gratuityAmt', label: 'Gratuity Liability (₹)' },
        { field: 'retirementDate', label: 'Retirement Date' }
      ]
    },
    claim: {
      title: 'Gratuity Claim Proforma',
      filters: ['claimDate', 'department', 'employee', 'claimStatus', 'category'],
      headers: [
        { field: 'claimNo', label: 'Claim No' },
        { field: 'id', label: 'Emp ID' },
        { field: 'name', label: 'Employee Name' },
        { field: 'dept', label: 'Department' },
        { field: 'years', label: 'Service Years' },
        { field: 'lastSalary', label: 'Eligible Salary (₹)' },
        { field: 'eligibleAmt', label: 'Eligible Amt (₹)' },
        { field: 'approvedAmt', label: 'Approved Amt (₹)' },
        { field: 'claimDate', label: 'Claim Date' },
        { field: 'status', label: 'Claim Status' }
      ]
    }
  };

  constructor() {}

  getReportMetadata(reportType: string): any {
    return this.metadata[reportType] || { title: 'Gratuity Report', filters: [], headers: [] };
  }

  getReportData(
    reportType: string,
    filters: any,
    searchQuery: string,
    page: number,
    pageSize: number,
    sortKey: string,
    sortDir: string
  ): { data: any[]; total: number; summaryCards: any[] } {
    let dataset: any[] = [];

    const asOnDateStr = filters.asOnDate || '23/06/2026';

    if (reportType === 'calculations') {
      dataset = this.rawEmployeeDB.map(e => {
        const tenure = this.calculateTenureYears(e.doj, asOnDateStr);
        const eligibleBase = e.basic + e.da;
        const isEligible = tenure >= 4.9 && e.cat === 'Permanent'; // 5 years rule, rounded roughly
        
        // Gratuity calculation formula: Base Salary * (15/26) * Rounded Service Years
        const roundedYears = Math.round(tenure);
        const gratuityAmt = isEligible ? Math.round(eligibleBase * (15 / 26) * roundedYears) : 0;

        return {
          id: e.id,
          name: e.name,
          doj: e.doj,
          tenure: Number(tenure.toFixed(1)),
          eligibleBase,
          eligible: isEligible ? 'Eligible' : 'Not Eligible',
          gratuityAmt,
          retirementDate: e.retirementDate,
          dept: e.dept,
          desg: e.desg,
          loc: e.loc,
          unit: e.unit,
          cat: e.cat,
          status: e.status
        };
      });
    } else if (reportType === 'claim') {
      dataset = [...this.gratuityClaimsDB];
    }

    // Apply filters
    dataset = dataset.filter(row => {
      if (filters.department && filters.department !== 'All' && row.dept !== filters.department) return false;
      if (filters.designation && filters.designation !== 'All' && row.desg !== filters.designation) return false;
      if (filters.location && filters.location !== 'All' && row.loc !== filters.location) return false;
      if (filters.unit && filters.unit !== 'All' && row.unit !== filters.unit) return false;
      if (filters.employee && filters.employee !== 'All') {
        const employeeFilter = String(filters.employee).toLowerCase();
        if (row.id.toLowerCase() !== employeeFilter && !row.name.toLowerCase().includes(employeeFilter)) return false;
      }
      if (filters.category && filters.category !== 'All' && row.cat !== filters.category) return false;
      if (filters.empStatus && filters.empStatus !== 'All' && row.status !== filters.empStatus) return false;

      if (reportType === 'claim' && filters.claimStatus && filters.claimStatus !== 'All' && row.status !== filters.claimStatus) return false;

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
    if (reportType === 'calculations') {
      const sanitized: GratuityEmployee[] = importedData.map(item => ({
        id: item.id || item['Emp ID'] || 'EDS' + Math.floor(100 + Math.random() * 900),
        name: item.name || item['Employee Name'] || 'Imported Employee',
        dept: item.dept || item['Department'] || 'Development',
        desg: item.desg || item['Designation'] || 'Software Engineer',
        loc: item.loc || item['Location'] || 'Bangalore',
        unit: item.unit || item['Functional Unit'] || 'Tech Unit',
        cat: item.cat || item['Category'] || 'Permanent',
        status: item.status || item['Status'] || 'Active',
        doj: item.doj || item['Date of Joining'] || '2015-05-15',
        basic: Number(item.basic || item['Basic Salary'] || 40000),
        da: Number(item.da || item['Dearness Allowance'] || 10000),
        retirementDate: item.retirementDate || item['Retirement Date'] || '2036-08-20'
      }));
      this.rawEmployeeDB = [...sanitized, ...this.rawEmployeeDB];
    } else if (reportType === 'claim') {
      const sanitized: GratuityClaim[] = importedData.map(item => ({
        claimNo: item.claimNo || item['Claim No'] || 'CLM-GRT-' + Math.floor(100 + Math.random() * 900),
        id: item.id || item['Emp ID'] || 'EDS' + Math.floor(100 + Math.random() * 900),
        name: item.name || item['Employee Name'] || 'Imported Employee',
        dept: item.dept || item['Department'] || 'Development',
        joiningDate: item.joiningDate || item['Date of Joining'] || '2015-05-15',
        leavingDate: item.leavingDate || item['Date of Relieving'] || '2026-05-30',
        years: Number(item.years || item['Service Years'] || 10.0),
        lastSalary: Number(item.lastSalary || item['Eligible Salary (₹)'] || 50000),
        eligibleAmt: Number(item.eligibleAmt || item['Eligible Amt (₹)'] || 300000),
        approvedAmt: Number(item.approvedAmt || item['Approved Amt (₹)'] || 300000),
        claimDate: item.claimDate || item['Claim Date'] || '2026-06-01',
        approvalDate: item.approvalDate || item['Approval Date'] || '2026-06-03',
        status: item.status || item['Claim Status'] || 'Approved',
        settlementDate: item.settlementDate || item['Settlement Date'] || '2026-06-15'
      }));
      this.gratuityClaimsDB = [...sanitized, ...this.gratuityClaimsDB];
    }
  }

  // Get specific claim details for printable sheet (Form I proforma)
  getClaimByNo(claimNo: string): GratuityClaim | undefined {
    const claim = this.gratuityClaimsDB.find(c => c.claimNo === claimNo);
    if (claim) {
      // Enrich with basic and da from profile if missing
      const profile = this.rawEmployeeDB.find(e => e.id === claim.id);
      if (profile) {
        return {
          ...claim,
          desg: profile.desg,
          basic: profile.basic,
          da: profile.da
        };
      }
    }
    return claim;
  }

  // Generate sidebar insights panel lists
  getEligibilityInsights(asOnDateStr: string): { approaching: any[]; highLiability: any[]; retiringSoon: any[] } {
    const employees = this.rawEmployeeDB.map(e => {
      const tenure = this.calculateTenureYears(e.doj, asOnDateStr);
      const eligibleBase = e.basic + e.da;
      const isEligible = tenure >= 4.9 && e.cat === 'Permanent';
      const roundedYears = Math.round(tenure);
      const liability = isEligible ? Math.round(eligibleBase * (15 / 26) * roundedYears) : 0;

      return {
        id: e.id,
        name: e.name,
        dept: e.dept,
        tenure,
        liability,
        retirementDate: new Date(e.retirementDate),
        doj: e.doj
      };
    });

    // 1. Approaching Eligibility (Tenure between 4.0 and 5.0 years)
    const approaching = employees
      .filter(e => e.tenure >= 4.0 && e.tenure < 4.9)
      .map(e => ({
        id: e.id,
        name: e.name,
        dept: e.dept,
        tenure: e.tenure.toFixed(1),
        progressPercent: Math.round((e.tenure / 5.0) * 100)
      }));

    // 2. Highest Gratuity Liability
    const highLiability = employees
      .filter(e => e.liability > 0)
      .sort((a, b) => b.liability - a.liability)
      .slice(0, 3)
      .map(e => ({
        id: e.id,
        name: e.name,
        dept: e.dept,
        amount: `₹${e.liability.toLocaleString()}`
      }));

    // 3. Upcoming Retirement (Retiring soonest)
    const retiringSoon = employees
      .sort((a, b) => a.retirementDate.getTime() - b.retirementDate.getTime())
      .slice(0, 3)
      .map(e => ({
        id: e.id,
        name: e.name,
        dept: e.dept,
        date: e.retirementDate.toLocaleDateString('en-GB')
      }));

    return { approaching, highLiability, retiringSoon };
  }

  // Calculate tenure years
  private calculateTenureYears(dojStr: string, asOnStr: string): number {
    const parseDate = (dStr: string) => {
      // Detect if DD/MM/YYYY or YYYY-MM-DD
      if (dStr.includes('/')) {
        const parts = dStr.split('/');
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      return new Date(dStr);
    };

    const doj = parseDate(dojStr);
    const asOn = parseDate(asOnStr);
    const diffMs = asOn.getTime() - doj.getTime();
    if (diffMs <= 0) return 0;
    return diffMs / (1000 * 60 * 60 * 24 * 365.25);
  }

  private calculateSummaryCards(reportType: string, activeList: any[]): any[] {
    let cards: any[] = [];

    if (reportType === 'calculations') {
      const total = activeList.length;
      const eligible = activeList.filter(r => r.eligible === 'Eligible').length;
      const liability = activeList.reduce((sum, r) => sum + (r.gratuityAmt || 0), 0);
      const avgTenure = total ? (activeList.reduce((sum, r) => sum + (r.tenure || 0), 0) / total).toFixed(1) : '0.0';

      cards = [
        { label: 'Total Employees Pool', value: total, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Gratuity Eligible Staff', value: eligible, icon: 'fa-user-shield', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Trust Liability', value: `₹${liability.toLocaleString()}`, icon: 'fa-sack-dollar', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Average Tenure (Years)', value: `${avgTenure} Yrs`, icon: 'fa-business-time', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'claim') {
      const total = activeList.length;
      const settled = activeList.filter(r => r.status === 'Settled').length;
      const totalDisbursed = activeList.filter(r => r.status === 'Settled').reduce((sum, r) => sum + (r.approvedAmt || 0), 0);
      const pending = activeList.filter(r => r.status === 'Submitted').length;

      cards = [
        { label: 'Claims Logged', value: total, icon: 'fa-file-invoice-dollar', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Settled Settlements', value: settled, icon: 'fa-handshake', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Disbursed Gratuity', value: `₹${totalDisbursed.toLocaleString()}`, icon: 'fa-money-bill-transfer', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Awaiting Settlement', value: pending, icon: 'fa-clock', color: 'bg-amber-50 text-amber-600' }
      ];
    }

    return cards;
  }
}
