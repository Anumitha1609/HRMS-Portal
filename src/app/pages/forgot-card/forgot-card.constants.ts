import { Employee } from './forgot-card.models';

/**
 * Mock employee directory used for local development / demo purposes.
 * Replace with a real EmployeeService call (e.g. this.employeeService.getAll())
 * once a backend endpoint is available — the rest of the component does not
 * care where `employees` comes from.
 */
export const MOCK_EMPLOYEES: Employee[] = [
  { employeeCode: 'EMP001', employeeName: 'John Doe', department: 'Engineering', designation: 'Software Engineer', originalCardNumber: 'CARD-1001' },
  { employeeCode: 'EMP002', employeeName: 'Jane Smith', department: 'Engineering', designation: 'Senior Engineer', originalCardNumber: 'CARD-1002' },
  { employeeCode: 'EMP003', employeeName: 'Michael Johnson', department: 'Human Resources', designation: 'HR Executive', originalCardNumber: 'CARD-1003' },
  { employeeCode: 'EMP004', employeeName: 'Emily Davis', department: 'Finance', designation: 'Accountant', originalCardNumber: 'CARD-1004' },
  { employeeCode: 'EMP005', employeeName: 'Robert Brown', department: 'Operations', designation: 'Operations Manager', originalCardNumber: 'CARD-1005' },
  { employeeCode: 'EMP006', employeeName: 'Priya Nair', department: 'Engineering', designation: 'QA Engineer', originalCardNumber: 'CARD-1006' },
  { employeeCode: 'EMP007', employeeName: 'David Wilson', department: 'Sales', designation: 'Sales Executive', originalCardNumber: 'CARD-1007' },
  { employeeCode: 'EMP008', employeeName: 'Sara Ahmed', department: 'Marketing', designation: 'Marketing Lead', originalCardNumber: 'CARD-1008' },
  { employeeCode: 'EMP009', employeeName: 'Karthik Raman', department: 'Finance', designation: 'Financial Analyst', originalCardNumber: 'CARD-1009' },
  { employeeCode: 'EMP010', employeeName: 'Laura Martinez', department: 'Human Resources', designation: 'HR Manager', originalCardNumber: 'CARD-1010' },
];

export const PAGE_SIZE = 8;
export const CURRENT_HR_USER = 'HR Admin';