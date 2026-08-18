export interface EmployeeMaster {
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
}

export interface EmployeeListItem {
  code: string;
  name: string;
  location: string;
}

export const EMPLOYEE_MASTER: EmployeeMaster[] = [
  {
    empCode: 'EMP009', empName: 'Saravanan T',
    category: 'Employee', location: 'Domestic',
    department: 'Production', designation: 'Machine Operator',
    doj: '10-06-2022',
    bankName: 'ICICI Bank', bankAccountNo: '6021 5678 9012', panNumber: 'BNZPS5678K',
    earnings: { basic: 27000, hra: 6000, conveyance: 1600, otherAllowance: 800 },
    deductions: { pf: 1500, professionalTax: 200, incomeTax: 800 },
  },
  {
    empCode: 'EMP010', empName: 'Divya R',
    category: 'Employee', location: 'Domestic',
    department: 'Quality', designation: 'QA Analyst',
    doj: '01-03-2023',
    bankName: 'HDFC Bank', bankAccountNo: '5011 2233 4455', panNumber: 'CDZPR4321L',
    earnings: { basic: 29500, hra: 6800, conveyance: 1800, otherAllowance: 900 },
    deductions: { pf: 1700, professionalTax: 200, incomeTax: 900 },
  },
  {
    empCode: 'EMP011', empName: 'Suresh Babu',
    category: 'Contract Staff', location: 'Domestic',
    department: 'Production', designation: 'Helper',
    doj: '15-09-2023',
    bankName: 'SBI', bankAccountNo: '3022 1144 7788', panNumber: 'DEZPS9988M',
    earnings: { basic: 21000, hra: 3000, conveyance: 800, otherAllowance: 0 },
    deductions: { pf: 1200, professionalTax: 200, incomeTax: 300 },
  },
  {
    empCode: 'EMP001', empName: 'John David',
    category: 'Employee', location: 'Domestic',
    department: 'IT', designation: 'Software Engineer',
    doj: '15-03-2024',
    bankName: 'HDFC Bank', bankAccountNo: '5010 1234 5678 90', panNumber: 'ABCPD1234F',
    earnings: { basic: 32000, hra: 8000, conveyance: 2000, otherAllowance: 1000 },
    deductions: { pf: 2400, professionalTax: 200, incomeTax: 600 },
  },
  {
    empCode: 'EMP002', empName: 'Priya Sharma',
    category: 'Employee', location: 'Domestic',
    department: 'HR', designation: 'HR Executive',
    doj: '05-07-2023',
    bankName: 'Axis Bank', bankAccountNo: '9120 8877 6655', panNumber: 'EFZPS5566N',
    earnings: { basic: 28000, hra: 6500, conveyance: 1800, otherAllowance: 700 },
    deductions: { pf: 2100, professionalTax: 200, incomeTax: 500 },
  },
  {
    empCode: 'EMP008', empName: 'Ponnaj K',
    category: 'Employee', location: 'Domestic',
    department: 'Finance', designation: 'Accounts Executive',
    doj: '20-11-2022',
    bankName: 'ICICI Bank', bankAccountNo: '6033 4455 6677', panNumber: 'GHZPK2233P',
    earnings: { basic: 24000, hra: 4500, conveyance: 1500, otherAllowance: 500 },
    deductions: { pf: 1800, professionalTax: 200, incomeTax: 300 },
  },
  {
    empCode: 'EMP012', empName: 'Vignesh Kumar',
    category: 'Contract Staff', location: 'Domestic',
    department: 'IT', designation: 'Support Engineer',
    doj: '01-01-2024',
    bankName: 'SBI', bankAccountNo: '3044 5566 7788', panNumber: 'HIZPV7788Q',
    earnings: { basic: 23000, hra: 4200, conveyance: 1200, otherAllowance: 0 },
    deductions: { pf: 1300, professionalTax: 200, incomeTax: 400 },
  },
  {
    empCode: 'EMP003', empName: 'Ravi Kumar',
    category: 'Employee', location: 'Acer Project',
    department: 'IT', designation: 'Senior Engineer',
    doj: '12-04-2021',
    bankName: 'HDFC Bank', bankAccountNo: '5099 1122 3344', panNumber: 'IJZPR3344R',
    earnings: { basic: 35000, hra: 9000, conveyance: 2200, otherAllowance: 1300 },
    deductions: { pf: 2600, professionalTax: 200, incomeTax: 700 },
  },
  {
    empCode: 'EMP006', empName: 'Lakshmi Narayan S P',
    category: 'Employee', location: 'Acer Project',
    department: 'IT', designation: 'Engineering Manager',
    doj: '03-02-2020',
    bankName: 'Axis Bank', bankAccountNo: '9166 7788 9900', panNumber: 'KLZPL9900S',
    earnings: { basic: 45000, hra: 12000, conveyance: 2800, otherAllowance: 1700 },
    deductions: { pf: 3400, professionalTax: 200, incomeTax: 900 },
  },
  {
    empCode: 'EMP007', empName: 'Pravin M',
    category: 'Contract Staff', location: 'Acer Project',
    department: 'Operations', designation: 'Field Executive',
    doj: '20-08-2023',
    bankName: 'SBI', bankAccountNo: '3077 8899 0011', panNumber: 'MNZPP0011T',
    earnings: { basic: 26000, hra: 5000, conveyance: 1400, otherAllowance: 0 },
    deductions: { pf: 1500, professionalTax: 200, incomeTax: 500 },
  },
  {
    empCode: 'EMP004', empName: 'Karthik R',
    category: 'Contract Staff', location: 'Acer Project',
    department: 'Operations', designation: 'Logistics Coordinator',
    doj: '11-05-2022',
    bankName: 'ICICI Bank', bankAccountNo: '6088 9900 1122', panNumber: 'OPZPJ1122U',
    earnings: { basic: 22000, hra: 4000, conveyance: 1100, otherAllowance: 0 },
    deductions: { pf: 1300, professionalTax: 200, incomeTax: 300 },
  },
  {
    empCode: 'EMP005', empName: 'Anjali Menon',
    category: 'Employee', location: 'Acer Project',
    department: 'Marketing', designation: 'Marketing Executive',
    doj: '09-09-2021',
    bankName: 'HDFC Bank', bankAccountNo: '5022 3344 5566', panNumber: 'QRZPA5566V',
    earnings: { basic: 30000, hra: 7000, conveyance: 1800, otherAllowance: 900 },
    deductions: { pf: 2000, professionalTax: 200, incomeTax: 600 },
  },
  {
    empCode: 'EMP013', empName: 'Sneha Reddy',
    category: 'Employee', location: 'Acer Project',
    department: 'Finance', designation: 'Finance Analyst',
    doj: '25-10-2023',
    bankName: 'Axis Bank', bankAccountNo: '9188 5566 7799', panNumber: 'STZPS7799W',
    earnings: { basic: 31500, hra: 7200, conveyance: 1900, otherAllowance: 900 },
    deductions: { pf: 2200, professionalTax: 200, incomeTax: 700 },
  },
  {
    empCode: 'EMP014', empName: 'Anumitha A',
    category: 'Employee', location: 'Domestic',
    department: 'Information Technology', designation: 'Software Developer Intern',
    doj: '01-01-2025',
    bankName: 'Indian Bank', bankAccountNo: '7745 2200 8891', panNumber: 'ANZPA1234H',
    email: 'anumithabe@gmail.com',
    earnings: { basic: 18000, hra: 4000, conveyance: 1200, otherAllowance: 500 },
    deductions: { pf: 1000, professionalTax: 200, incomeTax: 0 },
  },
];

export const EMPLOYEES_MAP: Record<string, string> = Object.fromEntries(
  EMPLOYEE_MASTER.map(e => [e.empCode, e.empName])
);

export const EMPLOYEE_LIST: EmployeeListItem[] = EMPLOYEE_MASTER.map(e => ({
  code: e.empCode,
  name: e.empName,
  location: e.location,
}));

export const LOCATIONS: string[] = [...new Set(EMPLOYEE_MASTER.map(e => e.location))];
