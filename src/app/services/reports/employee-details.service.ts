import { Injectable } from '@angular/core';

export interface EmployeeDetailsRecord {
  empId: string;
  empName: string;
  department: string;
  designation: string;
  location: string;
  joinDate: string;
  dob: string;
  bloodGroup: string;
  shift: string;
  category: string;
  status: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  pan: string;
  aadhar: string;
  photo: string;
  basicSalary: number;
  qualification: string;
  maritalStatus: string;
  nationality: string;
}

export interface EmployeeHistoryEvent {
  empId: string;
  date: string;
  event: string;
  detail: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeDetailsService {
  private employees: EmployeeDetailsRecord[] = [
    {empId:'EMP001',empName:'Rajesh Kumar',department:'Engineering',designation:'Senior Engineer',location:'Mumbai',joinDate:'2019-03-15',dob:'1990-06-23',bloodGroup:'A+',shift:'General',category:'Permanent',status:'Active',gender:'Male',phone:'9876543210',email:'rajesh.k@eaze.com',address:'101, Marine Lines, Mumbai, MH 400001',emergencyContact:'Sita Kumar - 9876500001',pan:'ABCPK1234Q',aadhar:'1234-5678-9012',photo:'RK',basicSalary:45000,qualification:'B.Tech',maritalStatus:'Married',nationality:'Indian'},
    {empId:'EMP002',empName:'Priya Sharma',department:'Human Resources',designation:'Manager',location:'Delhi',joinDate:'2018-07-01',dob:'1988-12-15',bloodGroup:'B+',shift:'General',category:'Permanent',status:'Active',gender:'Female',phone:'9876543211',email:'priya.s@eaze.com',address:'45, Connaught Place, New Delhi, DL 110001',emergencyContact:'Vikram Sharma - 9876500002',pan:'XYZPS5678R',aadhar:'2345-6789-0123',photo:'PS',basicSalary:55000,qualification:'MBA',maritalStatus:'Married',nationality:'Indian'},
    {empId:'EMP003',empName:'Amit Patel',department:'Finance',designation:'Analyst',location:'Bangalore',joinDate:'2020-01-10',dob:'1993-01-28',bloodGroup:'O+',shift:'General',category:'Permanent',status:'Active',gender:'Male',phone:'9876543212',email:'amit.p@eaze.com',address:'221, Koramangala, Bangalore, KA 560095',emergencyContact:'Ramesh Patel - 9876500003',pan:'PQRAP3456T',aadhar:'3456-7890-1234',photo:'AP',basicSalary:38000,qualification:'CA',maritalStatus:'Single',nationality:'Indian'},
    {empId:'EMP004',empName:'Sneha Reddy',department:'Marketing',designation:'Executive',location:'Hyderabad',joinDate:'2021-06-20',dob:'1995-07-14',bloodGroup:'AB+',shift:'General',category:'Permanent',status:'Active',gender:'Female',phone:'9876543213',email:'sneha.r@eaze.com',address:'89, Banjara Hills, Hyderabad, TS 500034',emergencyContact:'Kiran Reddy - 9876500004',pan:'LMNSR7890U',aadhar:'4567-8901-2345',photo:'SR',basicSalary:32000,qualification:'B.Com',maritalStatus:'Single',nationality:'Indian'},
    {empId:'EMP005',empName:'Vikram Singh',department:'Operations',designation:'Lead',location:'Chennai',joinDate:'2017-11-05',dob:'1985-11-30',bloodGroup:'B-',shift:'Morning',category:'Permanent',status:'Active',gender:'Male',phone:'9876543214',email:'vikram.s@eaze.com',address:'12, T Nagar, Chennai, TN 600017',emergencyContact:'Meera Singh - 9876500005',pan:'EFGVS2345V',aadhar:'5678-9012-3456',photo:'VS',basicSalary:52000,qualification:'MBA',maritalStatus:'Married',nationality:'Indian'},
    {empId:'EMP006',empName:'Anita Desai',department:'Engineering',designation:'Engineer',location:'Pune',joinDate:'2022-02-14',dob:'1996-02-10',bloodGroup:'A-',shift:'General',category:'Probation',status:'Probation',gender:'Female',phone:'9876543215',email:'anita.d@eaze.com',address:'33, Koregaon Park, Pune, MH 411001',emergencyContact:'Suresh Desai - 9876500006',pan:'HIJAD4567W',aadhar:'6789-0123-4567',photo:'AD',basicSalary:30000,qualification:'M.Tech',maritalStatus:'Single',nationality:'Indian'},
    {empId:'EMP007',empName:'Mohammed Farooq',department:'Sales',designation:'Manager',location:'Mumbai',joinDate:'2016-09-12',dob:'1984-09-05',bloodGroup:'O-',shift:'General',category:'Permanent',status:'Active',gender:'Male',phone:'9876543216',email:'md.farooq@eaze.com',address:'78, Andheri West, Mumbai, MH 400058',emergencyContact:'Fatima Farooq - 9876500007',pan:'KLMMF6789X',aadhar:'7890-1234-5678',photo:'MF',basicSalary:58000,qualification:'MBA',maritalStatus:'Married',nationality:'Indian'},
    {empId:'EMP008',empName:'Deepa Nair',department:'IT',designation:'Coordinator',location:'Bangalore',joinDate:'2023-04-01',dob:'1997-04-22',bloodGroup:'AB-',shift:'Evening',category:'Contract',status:'Active',gender:'Female',phone:'9876543217',email:'deepa.n@eaze.com',address:'55, Indiranagar, Bangalore, KA 560038',emergencyContact:'Lakshmi Nair - 9876500008',pan:'NOPDN8901Y',aadhar:'8901-2345-6789',photo:'DN',basicSalary:28000,qualification:'BCA',maritalStatus:'Single',nationality:'Indian'},
    {empId:'EMP009',empName:'Suresh Iyer',department:'Admin',designation:'Executive',location:'Chennai',joinDate:'2020-08-18',dob:'1991-08-03',bloodGroup:'A+',shift:'General',category:'Permanent',status:'On Leave',gender:'Male',phone:'9876543218',email:'suresh.i@eaze.com',address:'90, Adyar, Chennai, TN 600020',emergencyContact:'Kamala Iyer - 9876500009',pan:'QRSSI0123Z',aadhar:'9012-3456-7890',photo:'SI',basicSalary:35000,qualification:'B.A',maritalStatus:'Married',nationality:'Indian'},
    {empId:'EMP010',empName:'Kavita Joshi',department:'Finance',designation:'Manager',location:'Delhi',joinDate:'2015-05-25',dob:'1983-05-18',bloodGroup:'B+',shift:'General',category:'Permanent',status:'Active',gender:'Female',phone:'9876543219',email:'kavita.j@eaze.com',address:'110, Dwarka Sector 7, Delhi, DL 110075',emergencyContact:'Arvind Joshi - 9876500010',pan:'TUVKJ2345A',aadhar:'0123-4567-8901',photo:'KJ',basicSalary:60000,qualification:'MBA',maritalStatus:'Married',nationality:'Indian'},
    {empId:'EMP011',empName:'Arjun Mehta',department:'Engineering',designation:'Lead',location:'Hyderabad',joinDate:'2019-10-07',dob:'1989-10-12',bloodGroup:'O+',shift:'Rotational',category:'Permanent',status:'Active',gender:'Male',phone:'9876543220',email:'arjun.m@eaze.com',address:'67, Jubilee Hills, Hyderabad, TS 500033',emergencyContact:'Pooja Mehta - 9876500011',pan:'WXRAM4567B',aadhar:'1234-8901-2345',photo:'AM',basicSalary:48000,qualification:'M.Tech',maritalStatus:'Single',nationality:'Indian'},
    {empId:'EMP012',empName:'Lakshmi Venkat',department:'Operations',designation:'Coordinator',location:'Pune',joinDate:'2021-12-01',dob:'1994-03-08',bloodGroup:'A-',shift:'Morning',category:'Trainee',status:'Active',gender:'Female',phone:'9876543221',email:'lakshmi.v@eaze.com',address:'14, Hinjewadi, Pune, MH 411057',emergencyContact:'Venkat S - 9876500012',pan:'YZALV6789C',aadhar:'2345-9012-3456',photo:'LV',basicSalary:22000,qualification:'B.Tech',maritalStatus:'Single',nationality:'Indian'},
    {empId:'EMP013',empName:'Rahul Gupta',department:'Marketing',designation:'Analyst',location:'Mumbai',joinDate:'2022-07-15',dob:'1996-06-01',bloodGroup:'B-',shift:'General',category:'Permanent',status:'Active',gender:'Male',phone:'9876543222',email:'rahul.g@eaze.com',address:'23, Powai, Mumbai, MH 400076',emergencyContact:'Mohan Gupta - 9876500013',pan:'BCDRG8901D',aadhar:'3456-0123-4567',photo:'RG',basicSalary:34000,qualification:'MBA',maritalStatus:'Single',nationality:'Indian'},
    {empId:'EMP014',empName:'Nisha Agarwal',department:'Human Resources',designation:'Executive',location:'Bangalore',joinDate:'2023-01-10',dob:'1998-12-25',bloodGroup:'AB+',shift:'General',category:'Intern',status:'Active',gender:'Female',phone:'9876543223',email:'nisha.a@eaze.com',address:'99, Whitefield, Bangalore, KA 560066',emergencyContact:'Ravi Agarwal - 9876500014',pan:'EFGNA0123E',aadhar:'4567-1234-5678',photo:'NA',basicSalary:18000,qualification:'B.A',maritalStatus:'Single',nationality:'Indian'},
    {empId:'EMP015',empName:'Karthik Raman',department:'IT',designation:'Senior Engineer',location:'Chennai',joinDate:'2018-03-22',dob:'1987-07-19',bloodGroup:'O+',shift:'Night',category:'Permanent',status:'Active',gender:'Male',phone:'9876543224',email:'karthik.r@eaze.com',address:'44, OMR Road, Chennai, TN 600119',emergencyContact:'Sarala Raman - 9876500015',pan:'HIJKR2345F',aadhar:'5678-2345-6789',photo:'KR',basicSalary:50000,qualification:'M.Sc',maritalStatus:'Married',nationality:'Indian'},
    {empId:'EMP016',empName:'Tanvi Bhatt',department:'Sales',designation:'Executive',location:'Pune',joinDate:'2024-01-08',dob:'1999-01-30',bloodGroup:'A+',shift:'General',category:'Contract',status:'Active',gender:'Female',phone:'9876543225',email:'tanvi.b@eaze.com',address:'77, Kothrud, Pune, MH 411038',emergencyContact:'Harsh Bhatt - 9876500016',pan:'KLMTB4567G',aadhar:'6789-3456-7890',photo:'TB',basicSalary:25000,qualification:'BBA',maritalStatus:'Single',nationality:'Indian'},
    {empId:'EMP017',empName:'Rohan Kulkarni',department:'Engineering',designation:'Director',location:'Mumbai',joinDate:'2014-06-01',dob:'1980-11-11',bloodGroup:'B+',shift:'General',category:'Permanent',status:'Active',gender:'Male',phone:'9876543226',email:'rohan.k@eaze.com',address:'5, Worli, Mumbai, MH 400018',emergencyContact:'Smita Kulkarni - 9876500017',pan:'NOPRK6789H',aadhar:'7890-4567-8901',photo:'RoK',basicSalary:85000,qualification:'PhD',maritalStatus:'Married',nationality:'Indian'},
    {empId:'EMP018',empName:'Divya Menon',department:'Finance',designation:'Coordinator',location:'Hyderabad',joinDate:'2022-09-20',dob:'1995-09-06',bloodGroup:'O-',shift:'General',category:'Permanent',status:'Inactive',gender:'Female',phone:'9876543227',email:'divya.m@eaze.com',address:'31, Madhapur, Hyderabad, TS 500081',emergencyContact:'Vijay Menon - 9876500018',pan:'PQRDM8901I',aadhar:'8901-5678-9012',photo:'DM',basicSalary:36000,qualification:'M.Com',maritalStatus:'Single',nationality:'Indian'}
  ];

  private historyDB: EmployeeHistoryEvent[] = [
    {empId:'EMP001',date:'2019-03-15',event:'Joined',detail:'Joined as Engineer in Engineering dept, Mumbai'},
    {empId:'EMP001',date:'2020-08-01',event:'Promotion',detail:'Promoted from Engineer to Senior Engineer'},
    {empId:'EMP001',date:'2021-04-01',event:'Salary Revision',detail:'Salary revised from ₹35,000 to ₹40,000'},
    {empId:'EMP001',date:'2023-04-01',event:'Salary Revision',detail:'Salary revised from ₹40,000 to ₹45,000'},
    {empId:'EMP002',date:'2018-07-01',event:'Joined',detail:'Joined as HR Executive in Human Resources dept, Delhi'},
    {empId:'EMP002',date:'2020-01-01',event:'Promotion',detail:'Promoted from HR Executive to Manager'},
    {empId:'EMP002',date:'2021-07-01',event:'Salary Revision',detail:'Salary revised from ₹40,000 to ₹50,000'},
    {empId:'EMP002',date:'2023-07-01',event:'Salary Revision',detail:'Salary revised from ₹50,000 to ₹55,000'},
    {empId:'EMP003',date:'2020-01-10',event:'Joined',detail:'Joined as Junior Analyst in Finance dept, Bangalore'},
    {empId:'EMP003',date:'2022-01-01',event:'Promotion',detail:'Promoted from Junior Analyst to Analyst'},
    {empId:'EMP003',date:'2023-01-01',event:'Transfer',detail:'Transfer considered but stayed in Bangalore'},
    {empId:'EMP005',date:'2017-11-05',event:'Joined',detail:'Joined as Supervisor in Operations dept, Chennai'},
    {empId:'EMP005',date:'2019-04-01',event:'Promotion',detail:'Promoted from Supervisor to Lead'},
    {empId:'EMP005',date:'2020-11-01',event:'Shift Change',detail:'Shift changed from General to Morning'},
    {empId:'EMP005',date:'2022-04-01',event:'Salary Revision',detail:'Salary revised from ₹42,000 to ₹52,000'},
    {empId:'EMP007',date:'2016-09-12',event:'Joined',detail:'Joined as Sales Executive in Sales dept, Mumbai'},
    {empId:'EMP007',date:'2018-09-01',event:'Promotion',detail:'Promoted from Sales Executive to Senior Executive'},
    {empId:'EMP007',date:'2020-09-01',event:'Promotion',detail:'Promoted from Senior Executive to Manager'},
    {empId:'EMP007',date:'2022-09-01',event:'Salary Revision',detail:'Salary revised from ₹48,000 to ₹58,000'},
    {empId:'EMP010',date:'2015-05-25',event:'Joined',detail:'Joined as Finance Analyst in Finance dept, Delhi'},
    {empId:'EMP010',date:'2017-06-01',event:'Promotion',detail:'Promoted from Finance Analyst to Senior Analyst'},
    {empId:'EMP010',date:'2019-06-01',event:'Promotion',detail:'Promoted from Senior Analyst to Manager'},
    {empId:'EMP010',date:'2021-06-01',event:'Salary Revision',detail:'Salary revised from ₹50,000 to ₹60,000'},
    {empId:'EMP011',date:'2019-10-07',event:'Joined',detail:'Joined as Engineer in Engineering dept, Hyderabad'},
    {empId:'EMP011',date:'2021-10-01',event:'Promotion',detail:'Promoted from Engineer to Lead'},
    {empId:'EMP011',date:'2022-04-01',event:'Shift Change',detail:'Shift changed from General to Rotational'},
    {empId:'EMP015',date:'2018-03-22',event:'Joined',detail:'Joined as IT Engineer in IT dept, Chennai'},
    {empId:'EMP015',date:'2020-04-01',event:'Promotion',detail:'Promoted from IT Engineer to Senior Engineer'},
    {empId:'EMP015',date:'2022-04-01',event:'Shift Change',detail:'Shift changed from Evening to Night'},
    {empId:'EMP015',date:'2023-04-01',event:'Salary Revision',detail:'Salary revised from ₹42,000 to ₹50,000'},
    {empId:'EMP017',date:'2014-06-01',event:'Joined',detail:'Joined as Senior Engineer in Engineering dept, Mumbai'},
    {empId:'EMP017',date:'2016-06-01',event:'Promotion',detail:'Promoted from Senior Engineer to Lead'},
    {empId:'EMP017',date:'2018-06-01',event:'Promotion',detail:'Promoted from Lead to Manager'},
    {empId:'EMP017',date:'2020-06-01',event:'Promotion',detail:'Promoted from Manager to Director'},
    {empId:'EMP017',date:'2022-06-01',event:'Salary Revision',detail:'Salary revised from ₹70,000 to ₹85,000'}
  ];

  private metadata: { [key: string]: any } = {
    headcount: {
      title: 'Employee Head Count',
      filters: ['department', 'designation', 'location', 'status', 'category'],
      headers: [
        { field: 'empId', label: 'Emp ID' },
        { field: 'empName', label: 'Employee Name' },
        { field: 'department', label: 'Department' },
        { field: 'designation', label: 'Designation' },
        { field: 'location', label: 'Location' },
        { field: 'joinDate', label: 'Join Date' },
        { field: 'category', label: 'Category' },
        { field: 'status', label: 'Status' }
      ]
    },
    birthday: {
      title: 'Employee Birthday List',
      filters: ['department', 'month'],
      headers: [
        { field: 'empId', label: 'Emp ID' },
        { field: 'empName', label: 'Employee Name' },
        { field: 'department', label: 'Department' },
        { field: 'designation', label: 'Designation' },
        { field: 'dob', label: 'Date of Birth' },
        { field: 'bloodGroup', label: 'Blood Group' },
        { field: 'phone', label: 'Phone' },
        { field: 'status', label: 'Status' }
      ]
    },
    shift: {
      title: 'Employee Shift Details',
      filters: ['department', 'shift', 'location', 'status'],
      headers: [
        { field: 'empId', label: 'Emp ID' },
        { field: 'empName', label: 'Employee Name' },
        { field: 'department', label: 'Department' },
        { field: 'designation', label: 'Designation' },
        { field: 'shift', label: 'Shift' },
        { field: 'location', label: 'Location' },
        { field: 'joinDate', label: 'Join Date' },
        { field: 'status', label: 'Status' }
      ]
    },
    bloodgroup: {
      title: 'Employee Blood Group Details',
      filters: ['department', 'bloodgroup', 'location'],
      headers: [
        { field: 'empId', label: 'Emp ID' },
        { field: 'empName', label: 'Employee Name' },
        { field: 'department', label: 'Department' },
        { field: 'designation', label: 'Designation' },
        { field: 'bloodGroup', label: 'Blood Group' },
        { field: 'gender', label: 'Gender' },
        { field: 'phone', label: 'Phone' },
        { field: 'location', label: 'Location' }
      ]
    },
    personal: {
      title: 'Employee Personal Details',
      filters: ['department', 'designation', 'location', 'status'],
      headers: [
        { field: 'empId', label: 'Emp ID' },
        { field: 'empName', label: 'Employee Name' },
        { field: 'department', label: 'Department' },
        { field: 'designation', label: 'Designation' },
        { field: 'gender', label: 'Gender' },
        { field: 'phone', label: 'Phone' },
        { field: 'email', label: 'Email' },
        { field: 'location', label: 'Location' }
      ]
    },
    idcard: {
      title: 'Employee ID Card Details',
      filters: ['department', 'designation', 'location', 'status'],
      headers: [
        { field: 'empId', label: 'Emp ID' },
        { field: 'empName', label: 'Employee Name' },
        { field: 'department', label: 'Department' },
        { field: 'designation', label: 'Designation' },
        { field: 'joinDate', label: 'Join Date' },
        { field: 'location', label: 'Location' },
        { field: 'status', label: 'Status' }
      ]
    },
    customized: {
      title: 'User Customized Report',
      filters: ['department', 'designation', 'location', 'status'],
      headers: [] // Determined dynamically based on state
    },
    history: {
      title: 'Employee History Report',
      filters: ['department', 'designation', 'location', 'fromdate', 'todate'],
      headers: [
        { field: 'empId', label: 'Emp ID' },
        { field: 'empName', label: 'Employee Name' },
        { field: 'department', label: 'Department' },
        { field: 'designation', label: 'Designation' },
        { field: 'joinDate', label: 'Join Date' },
        { field: 'location', label: 'Location' },
        { field: 'status', label: 'Status' }
      ]
    }
  };

  private allColumns: { [key: string]: { label: string; group: string } } = {
    empId: { label: 'Employee ID', group: 'Employee' },
    empName: { label: 'Employee Name', group: 'Employee' },
    department: { label: 'Department', group: 'Department' },
    designation: { label: 'Designation', group: 'Department' },
    location: { label: 'Location', group: 'Department' },
    joinDate: { label: 'Join Date', group: 'Employee' },
    dob: { label: 'Date of Birth', group: 'Personal' },
    bloodGroup: { label: 'Blood Group', group: 'Personal' },
    shift: { label: 'Shift', group: 'Attendance' },
    category: { label: 'Category', group: 'Employee' },
    status: { label: 'Status', group: 'Employee' },
    gender: { label: 'Gender', group: 'Personal' },
    phone: { label: 'Phone', group: 'Personal' },
    email: { label: 'Email', group: 'Personal' },
    address: { label: 'Address', group: 'Personal' },
    emergencyContact: { label: 'Emergency Contact', group: 'Personal' },
    pan: { label: 'PAN Card', group: 'Identity' },
    aadhar: { label: 'Aadhar Card', group: 'Identity' },
    basicSalary: { label: 'Basic Salary (₹)', group: 'Salary' },
    qualification: { label: 'Qualification', group: 'Personal' },
    maritalStatus: { label: 'Marital Status', group: 'Personal' },
    nationality: { label: 'Nationality', group: 'Personal' }
  };

  constructor() {}

  getEmployeeList(): EmployeeDetailsRecord[] {
    return this.employees;
  }

  getEmployeeById(id: string): EmployeeDetailsRecord | undefined {
    return this.employees.find(e => e.empId === id);
  }

  getAllColumnDefinitions(): any {
    return this.allColumns;
  }

  getReportMetadata(reportType: string, customColumns?: string[]): any {
    const meta = { ...this.metadata[reportType] };
    if (reportType === 'customized' && customColumns) {
      meta.headers = customColumns.map(col => ({
        field: col,
        label: this.allColumns[col]?.label || col
      }));
    }
    return meta;
  }

  getReportData(
    reportType: string,
    filters: any,
    searchQuery: string,
    page: number,
    pageSize: number,
    sortKey: string,
    sortDir: string,
    customColumns?: string[]
  ): { data: any[]; total: number; summaryCards: any[] } {
    let dataset: any[] = [...this.employees];

    // Apply filters
    dataset = dataset.filter(e => {
      if (filters.department && filters.department !== '' && filters.department !== 'All' && e.department !== filters.department) return false;
      if (filters.designation && filters.designation !== '' && filters.designation !== 'All' && e.designation !== filters.designation) return false;
      if (filters.location && filters.location !== '' && filters.location !== 'All' && e.location !== filters.location) return false;
      if (filters.status && filters.status !== '' && filters.status !== 'All' && e.status !== filters.status) return false;
      if (filters.category && filters.category !== '' && filters.category !== 'All' && e.category !== filters.category) return false;
      if (filters.shift && filters.shift !== '' && filters.shift !== 'All' && e.shift !== filters.shift) return false;
      if (filters.bloodgroup && filters.bloodgroup !== '' && filters.bloodgroup !== 'All' && e.bloodGroup !== filters.bloodgroup) return false;

      // Month filter for Birthdays
      if (reportType === 'birthday' && filters.month) {
        const dobMonth = new Date(e.dob).getMonth() + 1; // 1-indexed
        let filterMonth;
        if (filters.month.includes('-')) {
          filterMonth = Number(filters.month.split('-')[1]);
        } else {
          filterMonth = Number(filters.month);
        }
        if (dobMonth !== filterMonth) return false;
      }

      // Date Range filters
      if (filters.fromdate && new Date(e.joinDate) < new Date(filters.fromdate)) return false;
      if (filters.todate && new Date(e.joinDate) > new Date(filters.todate)) return false;

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
    const summaryCards = this.calculateSummaryCards(reportType, dataset, customColumns);

    const startIdx = (page - 1) * pageSize;
    const paginatedData = dataset.slice(startIdx, startIdx + pageSize);

    return {
      data: paginatedData,
      total,
      summaryCards
    };
  }

  importExcel(reportType: string, importedData: any[]): void {
    const sanitized: EmployeeDetailsRecord[] = importedData.map(item => ({
      empId: item.empId || item['Emp ID'] || 'EMP' + Math.floor(100 + Math.random() * 900),
      empName: item.empName || item['Employee Name'] || 'Imported Employee',
      department: item.department || item['Department'] || 'Engineering',
      designation: item.designation || item['Designation'] || 'Engineer',
      location: item.location || item['Location'] || 'Mumbai',
      joinDate: item.joinDate || item['Join Date'] || '2026-06-01',
      dob: item.dob || item['Date of Birth'] || '1995-01-01',
      bloodGroup: item.bloodGroup || item['Blood Group'] || 'O+',
      shift: item.shift || item['Shift'] || 'General',
      category: item.category || item['Category'] || 'Permanent',
      status: item.status || item['Status'] || 'Active',
      gender: item.gender || item['Gender'] || 'Male',
      phone: item.phone || item['Phone'] || '9876543210',
      email: item.email || item['Email'] || 'employee@eaze.com',
      address: item.address || item['Address'] || 'Corporate Head Office, Mumbai',
      emergencyContact: item.emergencyContact || item['Emergency Contact'] || 'Spouse - 9876500000',
      pan: item.pan || item['PAN Card'] || 'ABCDE1234F',
      aadhar: item.aadhar || item['Aadhar Card'] || '1234-5678-9012',
      photo: item.photo || 'IE',
      basicSalary: Number(item.basicSalary || item['Basic Salary (₹)'] || 30000),
      qualification: item.qualification || item['Qualification'] || 'Graduate',
      maritalStatus: item.maritalStatus || item['Marital Status'] || 'Single',
      nationality: item.nationality || item['Nationality'] || 'Indian'
    }));

    this.employees = [...sanitized, ...this.employees];
  }

  // Fetch chronological history events for a specific employee
  getHistoryEventsForEmployee(empId: string): EmployeeHistoryEvent[] {
    return this.historyDB
      .filter(h => h.empId === empId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private calculateSummaryCards(reportType: string, activeList: EmployeeDetailsRecord[], customColumns?: string[]): any[] {
    let cards: any[] = [];

    if (reportType === 'headcount' || reportType === 'personal' || reportType === 'idcard') {
      const total = activeList.length;
      const active = activeList.filter(e => e.status === 'Active').length;
      const leave = activeList.filter(e => e.status === 'On Leave').length;
      const depts = [...new Set(activeList.map(e => e.department))].length;

      cards = [
        { label: 'Total Employees', value: total, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Active Staff', value: active, icon: 'fa-user-check', color: 'bg-emerald-50 text-enterprise-success-text' },
        { label: 'On Leave', value: leave, icon: 'fa-user-clock', color: 'bg-amber-50 text-enterprise-pending-text' },
        { label: 'Active Departments', value: depts, icon: 'fa-building', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'birthday') {
      const today = new Date();
      const tm = today.getMonth();
      const td = today.getDate();

      const todayBday = activeList.filter(e => {
        const d = new Date(e.dob);
        return d.getMonth() === tm && d.getDate() === td;
      }).length;

      const thisMonth = activeList.filter(e => new Date(e.dob).getMonth() === tm).length;
      const nextMonth = activeList.filter(e => new Date(e.dob).getMonth() === (tm + 1) % 12).length;

      cards = [
        { label: 'Total Employees', value: activeList.length, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Birthdays Today', value: todayBday, icon: 'fa-cake-candles', color: 'bg-pink-50 text-pink-500', sub: 'Celebrate today! 🎉' },
        { label: 'This Month Birthdays', value: thisMonth, icon: 'fa-calendar-day', color: 'bg-amber-50 text-enterprise-pending-text' },
        { label: 'Next Month Birthdays', value: nextMonth, icon: 'fa-calendar-plus', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'shift') {
      const shifts: { [key: string]: number } = {};
      activeList.forEach(e => { shifts[e.shift] = (shifts[e.shift] || 0) + 1; });
      const topShift = Object.entries(shifts).sort((a, b) => b[1] - a[1])[0];
      const night = activeList.filter(e => e.shift === 'Night').length;

      cards = [
        { label: 'Total Assigned Staff', value: activeList.length, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Active Shift Types', value: Object.keys(shifts).length, icon: 'fa-clock', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Top Shift Type', value: topShift ? topShift[0] : 'N/A', icon: 'fa-star', color: 'bg-amber-50 text-enterprise-pending-text', sub: topShift ? topShift[1] + ' workers' : '' },
        { label: 'Night Shift Workers', value: night, icon: 'fa-moon', color: 'bg-slate-800 text-slate-100' }
      ];
    }
    else if (reportType === 'bloodgroup') {
      const bg: { [key: string]: number } = {};
      activeList.forEach(e => { bg[e.bloodGroup] = (bg[e.bloodGroup] || 0) + 1; });
      const top = Object.entries(bg).sort((a, b) => b[1] - a[1])[0];
      const rare = activeList.filter(e => ['AB-', 'O-', 'B-', 'A-'].includes(e.bloodGroup)).length;

      cards = [
        { label: 'Total Records Collected', value: activeList.length, icon: 'fa-droplet', color: 'bg-red-50 text-red-500' },
        { label: 'Most Common Group', value: top ? top[0] : 'N/A', icon: 'fa-heart-pulse', color: 'bg-blue-50 text-enterprise-blue', sub: top ? top[1] + ' employees' : '' },
        { label: 'Rare Blood Donors', value: rare, icon: 'fa-shield-heart', color: 'bg-amber-50 text-enterprise-pending-text' },
        { label: 'Unique Groups Present', value: Object.keys(bg).length, icon: 'fa-vials', color: 'bg-purple-50 text-purple-600' }
      ];
    }
    else if (reportType === 'customized') {
      cards = [
        { label: 'Total Matching Records', value: activeList.length, icon: 'fa-table-columns', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'Selected Columns', value: customColumns?.length || 0, icon: 'fa-list-check', color: 'bg-emerald-50 text-enterprise-success-text' },
        { label: 'Departments Present', value: [...new Set(activeList.map(e => e.department))].length, icon: 'fa-building', color: 'bg-purple-50 text-purple-600' },
        { label: 'Active Grid Scope', value: 'Customized', icon: 'fa-wand-magic-sparkles', color: 'bg-amber-50 text-enterprise-pending-text' }
      ];
    }
    else if (reportType === 'history') {
      const total = activeList.length;
      const withHistory = activeList.filter(e => this.historyDB.some(h => h.empId === e.empId)).length;
      const totalEvents = this.historyDB.filter(h => activeList.some(e => e.empId === h.empId)).length;
      const promos = this.historyDB.filter(h => h.event === 'Promotion' && activeList.some(e => e.empId === h.empId)).length;

      cards = [
        { label: 'Employees in Scope', value: total, icon: 'fa-users', color: 'bg-blue-50 text-enterprise-blue' },
        { label: 'With Logged History', value: withHistory, icon: 'fa-clock-rotate-left', color: 'bg-emerald-50 text-enterprise-success-text' },
        { label: 'Total Timeline Events', value: totalEvents, icon: 'fa-timeline', color: 'bg-amber-50 text-enterprise-pending-text' },
        { label: 'Logged Career Promotions', value: promos, icon: 'fa-circle-arrow-up', color: 'bg-purple-50 text-purple-600' }
      ];
    }

    return cards;
  }
}
