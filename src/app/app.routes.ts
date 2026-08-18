import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'employee/:id/print',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/employee-print/employee-print.component').then(m => m.EmployeePrintComponent)
  },
  {
    path: 'reports/:module/:reportId/print',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reports/report-print/report-print.component').then(m => m.ReportPrintComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'employee',
        loadComponent: () => import('./pages/employee/employee.component').then(m => m.EmployeeComponent)
      },
      {
        path: 'location',
        loadComponent: () => import('./pages/location/location.component').then(m => m.LocationComponent)
      },
      {
        path: 'sub-location',
        loadComponent: () => import('./pages/sub-location/sub-location.component').then(m => m.SubLocationComponent)
      },
      {
        path: 'department',
        loadComponent: () => import('./pages/department/department.component').then(m => m.DepartmentComponent)
      },
      {
        path: 'functional-unit',
        loadComponent: () => import('./pages/functional-unit/functional-unit.component').then(m => m.FunctionalUnitComponent)
      },
      {
        path: 'division',
        loadComponent: () => import('./pages/division/division.component').then(m => m.DivisionComponent)
      },
      {
        path: 'category',
        loadComponent: () => import('./pages/category/category.component').then(m => m.CategoryComponent)
      },
      {
        path: 'ctc-master',
        loadComponent: () => import('./pages/ctc-master/ctc-master.component').then(m => m.CtcMasterComponent)
      },
      {
        path: 'attendance-view',
        loadComponent: () => import('./pages/attendance-view/attendance-view').then(m => m.AttendanceView)
      },
      {
        path: 'attendance-import',
        loadComponent: () => import('./pages/attendance-import/attendance-import').then(m => m.AttendanceImport)
      },
      {
        path: 'attendance-adjustment',
        loadComponent: () => import('./pages/attendance-adjustment/attendance-adjustment').then(m => m.AttendanceAdjustment)
      },
      {
        path: 'forgot-card',
        loadComponent: () => import('./pages/forgot-card/forgot-card').then(m => m.ForgotCard)
      },
      {
        path: 'leave-request',
        loadComponent: () => import('./pages/leave/leave-page/leave-page').then(m => m.LeavePage),
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/leave/leave-request/leave-request').then(m => m.LeaveRequest)
          }
        ]
      },
      {
        path: 'compensation-request',
        loadComponent: () => import('./pages/leave/leave-page/leave-page').then(m => m.LeavePage),
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/leave/compensation-request/compensation-request').then(m => m.CompensationRequest)
          }
        ]
      },
      {
        path: 'employee-history',
        loadComponent: () => import('./pages/employee-history/employee-history').then(m => m.EmployeeHistory)
      },
      {
        path: 'company-profile',
        loadComponent: () => import('./pages/company-profile/company-profile.component').then(m => m.CompanyProfileComponent)
      },
      {
        path: 'advance',
        loadComponent: () => import('./pages/advance/advance.component').then(m => m.AdvanceComponent)
      },
      {
        path: 'leave-approval',
        loadComponent: () => import('./pages/leave-approval/leave-approval.component').then(m => m.LeaveApprovalComponent)
      },
      {
        path: 'leave-compensation',
        loadComponent: () => import('./pages/leave-compensation/leave-compensation.component').then(m => m.LeaveCompensationComponent)
      },
      {
        path: 'deduction',
        loadComponent: () => import('./pages/deduction/deduction.component').then(m => m.DeductionComponent)
      },
      {
        path: 'earnings',
        loadComponent: () => import('./pages/earnings/earnings.component').then(m => m.EarningsComponent)
      },
      {
        path: 'salary-heads',
        loadComponent: () => import('./pages/salary-heads/salary-heads.component').then(m => m.SalaryHeadsComponent)
      },
      {
        path: 'shift-generation',
        loadComponent: () => import('./pages/shift-generation/shift-generation.component').then(m => m.ShiftGenerationComponent)
      },
      {
        path: 'shifts',
        loadComponent: () => import('./pages/shifts/shifts.component').then(m => m.ShiftsComponent)
      },
      {
        path: 'increment-entry',
        loadComponent: () => import('./pages/increment-entry/increment-entry.component').then(m => m.IncrementEntryComponent)
      },
      {
        path: 'increment-modification',
        loadComponent: () => import('./pages/increment-modification/increment-modification.component').then(m => m.IncrementModificationComponent)
      },
      {
        path: 'holiday-entry',
        loadComponent: () => import('./pages/holiday-entry/holiday-entry.component').then(m => m.HolidayEntryComponent)
      },
      {
        path: 'blood-group-master',
        loadComponent: () => import('./pages/blood-group-master/blood-group.component').then(m => m.BloodGroupComponent)
      },
      {
        path: 'designation-master',
        loadComponent: () => import('./pages/designation-master/designation.component').then(m => m.DesignationComponent)
      },
      {
        path: 'email-config',
        loadComponent: () => import('./pages/email-config/email-config.component').then(m => m.EmailConfigComponent)
      },
       {
        path: 'payroll-configuration',
        loadComponent: () => import('./pages/payroll-configuration/payroll-configuration').then(m => m.PayrollConfiguration)
      },
      {
        path: 'payroll',
        loadComponent: () => import('./pages/payroll/payroll.component').then(m => m.PayrollComponent)
      },
      {
        path: 'salary-generation',
        loadComponent: () => import('./pages/salary-generation/salary-generation.component').then(m => m.SalaryGenerationComponent)
      },
      {
        path: 'salary-removal',
        loadComponent: () => import('./pages/salary-removal/salary-removal.component').then(m => m.SalaryRemovalComponent)
      },
      {
        path: 'reports',
        children: [
          { path: '', redirectTo: 'attendance/overtime', pathMatch: 'full' },
          {
            path: 'attendance',
            children: [
              { path: '', redirectTo: 'overtime', pathMatch: 'full' },
              { path: ':reportId', loadComponent: () => import('./pages/reports/attendance/attendance.component').then(m => m.AttendanceComponent) }
            ]
          },
          {
            path: 'salary',
            children: [
              { path: '', redirectTo: 'payroll', pathMatch: 'full' },
              { path: ':reportId', loadComponent: () => import('./pages/reports/salary/salary.component').then(m => m.SalaryComponent) }
            ]
          },
          {
            path: 'increment',
            children: [
              { path: '', redirectTo: 'increment-details', pathMatch: 'full' },
              { path: ':reportId', loadComponent: () => import('./pages/reports/increment/increment.component').then(m => m.IncrementComponent) }
            ]
          },
          {
            path: 'insurance-gratuity',
            children: [
              { path: '', redirectTo: 'gratuity-calculation', pathMatch: 'full' },
              { path: ':reportId', loadComponent: () => import('./pages/reports/insurance-gratuity/insurance-gratuity.component').then(m => m.InsuranceGratuityComponent) }
            ]
          },
          {
            path: 'employee-details',
            children: [
              { path: '', redirectTo: 'head-count', pathMatch: 'full' },
              { path: ':reportId', loadComponent: () => import('./pages/reports/employee-details/employee-details.component').then(m => m.EmployeeDetailsComponent) }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
