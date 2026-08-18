import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import {
  buildBarRows, buildDonut, buildLine, buildDualBars, lastNMonthLabels
} from './dashboard-chart.utils';

export type ConsoleRole = 'admin' | 'executive' | 'viewer';

/* ---------------------------------------------------------------------
 * Raw org data. Shape this to match your real API response — every
 * dashboard view below is *derived* from this single source so the
 * three roles never disagree with each other on numbers.
 * ------------------------------------------------------------------- */
export interface OrgData {
  totalEmployees: number;
  newJoineesThisMonth: number;
  exitsThisMonth: number;
  attritionRate: number;
  employeeGrowthPercent: number;
  departmentCount: number;
  branchCount: number;
  openPositions: number;
  recruitmentProgress: number;

  attendanceToday: { present: number; absent: number; onLeave: number };
  birthdaysToday: { name: string; department: string }[];
  anniversariesToday: { name: string; years: number }[];
  pendingApprovals: number;
  payroll: { status: 'Draft' | 'Processing' | 'Completed'; runDate: string; monthlyCost: number; currency: string };
  performanceReviewsPending: number;
  expiringDocuments: { name: string; docType: string; expiryDate: string }[];
  probationEmployees: number;

  departmentBreakdown: { department: string; count: number }[];
  genderDistribution: { label: string; value: number }[];
  ageDistribution: { label: string; value: number }[];
  employeeGrowthTrend: number[];
  attritionTrend: number[];
  hiringVsExit: { label: string; hires: number; exits: number }[];
  attendanceTrend: number[];
  leaveTrend: number[];
  payrollCostTrend: number[];

  leaveRequestsPending: number;
  interviewsToday: number;
  candidatesInPipeline: number;
  documentsPending: number;
  upcomingConfirmations: number;
  pendingOnboarding: number;
  exitClearancePending: number;
  payrollTasksPending: number;
  myTasks: { label: string; count: number; icon: string }[];
  recruitmentPipeline: { stage: string; count: number }[];
  leaveRequestsBreakdown: { label: string; value: number }[];
  interviewStatus: { label: string; value: number }[];
  employeeJoiningTrend: number[];
  notifications: { icon: string; text: string; time: string; tone: 'info' | 'warn' | 'alert' }[];

  avgAttendancePercent: number;
  avgPerformanceRating: number;
  payrollCostByDepartment: { department: string; cost: number }[];
}

interface KpiTile {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  accent: 'amber' | 'teal' | 'sky' | 'violet' | 'rose';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  isLoading = signal<boolean>(true);
  today = new Date();
  months = lastNMonthLabels(6);

  // NOTE: extend your AuthService `User` model with
  // `role: 'admin' | 'executive' | 'viewer'`. Falls back to 'viewer'
  // (least-privileged) until that field exists.
  role = computed<ConsoleRole>(() => {
    const u = this.authService.currentUser() as { role?: string } | null;

    switch (u?.role) {
      case 'HR_ADMIN':
        return 'admin';

      case 'HR_EXECUTIVE':
        return 'executive';

      case 'VIEWER':
        return 'viewer';

      default:
        return 'viewer';
    }
  });

  roleLabel = computed(() => {
    switch (this.role()) {
      case 'admin': return 'Admin Access';
      case 'executive': return 'HR Executive Access';
      default: return 'View-Only Access';
    }
  });

  org = signal<OrgData>(this.buildSampleOrgData());

  private fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);
  private fmtPct = (n: number) => `${n}%`;
  private fmtCurrencyCompact = (n: number) =>
    new Intl.NumberFormat('en-IN', { notation: 'compact', style: 'currency', currency: 'INR', maximumFractionDigits: 1 }).format(n);

  formatCurrency(amount: number, currency = 'INR'): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  }
  formatShortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  /* =====================================================================
   * ADMIN VIEW
   * =================================================================== */
  adminKpis = computed<KpiTile[]>(() => {
    const o = this.org();
    return [
      { label: 'Total Employees', value: this.fmtNum(o.totalEmployees), sub: `${o.employeeGrowthPercent >= 0 ? '+' : ''}${o.employeeGrowthPercent}% YoY`, icon: 'groups', accent: 'amber' },
      { label: 'New Joinees (This Month)', value: this.fmtNum(o.newJoineesThisMonth), icon: 'person_add', accent: 'teal' },
      { label: 'Employee Exits (This Month)', value: this.fmtNum(o.exitsThisMonth), icon: 'logout', accent: 'rose' },
      { label: 'Attrition Rate', value: this.fmtPct(o.attritionRate), sub: 'Trailing 12 months', icon: 'trending_down', accent: 'rose' },
      { label: 'Departments', value: this.fmtNum(o.departmentCount), icon: 'lan', accent: 'sky' },
      { label: 'Branches', value: this.fmtNum(o.branchCount), icon: 'factory', accent: 'sky' },
      { label: 'Open Job Positions', value: this.fmtNum(o.openPositions), icon: 'work', accent: 'teal' },
      { label: 'Recruitment Progress', value: this.fmtPct(o.recruitmentProgress), sub: 'Positions in pipeline', icon: 'insights', accent: 'teal' },
      { label: 'Attendance Today', value: this.fmtNum(o.attendanceToday.present), sub: `of ${o.totalEmployees} employees`, icon: 'event_available', accent: 'sky' },
      { label: 'Employees Absent Today', value: this.fmtNum(o.attendanceToday.absent), icon: 'event_busy', accent: 'rose' },
      { label: 'Employees on Leave Today', value: this.fmtNum(o.attendanceToday.onLeave), icon: 'beach_access', accent: 'sky' },
      { label: "Today's Birthdays", value: this.fmtNum(o.birthdaysToday.length), icon: 'cake', accent: 'violet' },
      { label: 'Work Anniversaries', value: this.fmtNum(o.anniversariesToday.length), icon: 'celebration', accent: 'violet' },
      { label: 'Pending Approvals', value: this.fmtNum(o.pendingApprovals), icon: 'fact_check', accent: 'rose' },
      { label: 'Monthly Payroll Status', value: o.payroll.status, sub: this.formatCurrency(o.payroll.monthlyCost, o.payroll.currency), icon: 'payments', accent: 'violet' },
      { label: 'Performance Reviews Pending', value: this.fmtNum(o.performanceReviewsPending), icon: 'rate_review', accent: 'amber' },
      { label: 'Expiring Documents', value: this.fmtNum(o.expiringDocuments.length), sub: 'Passport, visa, contracts', icon: 'description', accent: 'rose' },
      { label: 'Probation Employees', value: this.fmtNum(o.probationEmployees), icon: 'hourglass_top', accent: 'amber' },
      { label: 'Employee Growth', value: `${o.employeeGrowthPercent >= 0 ? '+' : ''}${o.employeeGrowthPercent}%`, sub: '6-month trend', icon: 'trending_up', accent: 'teal' }
    ];
  });

  adminCharts = computed(() => {
    const o = this.org();
    return {
      employeeGrowth: buildLine(o.employeeGrowthTrend),
      departmentDistribution: buildBarRows(o.departmentBreakdown.map(d => ({ label: d.department, value: d.count })), 'var(--amber)'),
      genderDistribution: buildDonut([
        { label: 'Male', value: o.genderDistribution.find(g => g.label === 'Male')?.value ?? 0, color: 'var(--sky)' },
        { label: 'Female', value: o.genderDistribution.find(g => g.label === 'Female')?.value ?? 0, color: 'var(--violet)' },
        { label: 'Other', value: o.genderDistribution.find(g => g.label === 'Other')?.value ?? 0, color: 'var(--teal)' }
      ]),
      ageDistribution: buildBarRows(o.ageDistribution.map(a => ({ label: a.label, value: a.value })), 'var(--sky)'),
      attritionTrend: buildLine(o.attritionTrend),
      hiringVsExit: buildDualBars(o.hiringVsExit.map(h => ({ label: h.label, a: h.hires, b: h.exits }))),
      attendanceTrend: buildLine(o.attendanceTrend),
      leaveTrend: buildLine(o.leaveTrend),
      payrollCostTrend: buildLine(o.payrollCostTrend)
    };
  });

  /* =====================================================================
   * HR EXECUTIVE VIEW
   * =================================================================== */
  hrKpis = computed<KpiTile[]>(() => {
    const o = this.org();
    return [
      { label: "Today's Attendance", value: this.fmtNum(o.attendanceToday.present), sub: `of ${o.totalEmployees} employees`, icon: 'event_available', accent: 'sky' },
      { label: 'Leave Requests Pending', value: this.fmtNum(o.leaveRequestsPending), icon: 'pending_actions', accent: 'amber' },
      { label: 'Interviews Scheduled Today', value: this.fmtNum(o.interviewsToday), icon: 'record_voice_over', accent: 'teal' },
      { label: 'Candidates in Pipeline', value: this.fmtNum(o.candidatesInPipeline), icon: 'groups_3', accent: 'teal' },
      { label: 'Documents Pending', value: this.fmtNum(o.documentsPending), icon: 'description', accent: 'rose' },
      { label: 'Employees on Probation', value: this.fmtNum(o.probationEmployees), icon: 'hourglass_top', accent: 'amber' },
      { label: 'Upcoming Confirmations', value: this.fmtNum(o.upcomingConfirmations), icon: 'verified', accent: 'violet' },
      { label: 'Pending Onboarding', value: this.fmtNum(o.pendingOnboarding), icon: 'badge', accent: 'sky' },
      { label: 'Exit Clearance Pending', value: this.fmtNum(o.exitClearancePending), icon: 'assignment_late', accent: 'rose' },
      { label: 'Payroll Tasks Pending', value: this.fmtNum(o.payrollTasksPending), icon: 'payments', accent: 'violet' }
    ];
  });

  hrCharts = computed(() => {
    const o = this.org();
    return {
      recruitmentPipeline: buildBarRows(
        o.recruitmentPipeline.map((s, i) => ({ label: s.stage, value: s.count, color: ['var(--steel-light)', 'var(--sky)', 'var(--teal)', 'var(--amber)', 'var(--violet)'][i % 5] })),
        'var(--teal)'
      ),
      attendanceSummary: buildDonut([
        { label: 'Present', value: o.attendanceToday.present, color: 'var(--teal)' },
        { label: 'On leave', value: o.attendanceToday.onLeave, color: 'var(--amber)' },
        { label: 'Absent', value: o.attendanceToday.absent, color: 'var(--rose)' }
      ]),
      leaveRequests: buildBarRows(
        o.leaveRequestsBreakdown.map(l => ({ label: l.label, value: l.value, color: l.label === 'Approved' ? 'var(--teal)' : l.label === 'Rejected' ? 'var(--rose)' : 'var(--amber)' })),
        'var(--amber)'
      ),
      interviewStatus: buildDonut(
        o.interviewStatus.map((s, i) => ({ label: s.label, value: s.value, color: ['var(--teal)', 'var(--sky)', 'var(--amber)', 'var(--rose)'][i % 4] }))
      ),
      joiningTrend: buildLine(o.employeeJoiningTrend)
    };
  });

  /* =====================================================================
   * VIEWER VIEW
   * =================================================================== */
  viewerKpis = computed<KpiTile[]>(() => {
    const o = this.org();
    return [
      { label: 'Total Employees', value: this.fmtNum(o.totalEmployees), icon: 'groups', accent: 'amber' },
      { label: 'Present Today', value: this.fmtNum(o.attendanceToday.present), icon: 'event_available', accent: 'sky' },
      { label: 'On Leave', value: this.fmtNum(o.attendanceToday.onLeave), icon: 'beach_access', accent: 'sky' },
      { label: 'Attrition %', value: this.fmtPct(o.attritionRate), icon: 'trending_down', accent: 'rose' },
      { label: 'New Joinees', value: this.fmtNum(o.newJoineesThisMonth), sub: 'This month', icon: 'person_add', accent: 'teal' },
      { label: 'Payroll Cost', value: this.fmtCurrencyCompact(o.payroll.monthlyCost), sub: 'This month', icon: 'payments', accent: 'violet' },
      { label: 'Average Attendance', value: this.fmtPct(o.avgAttendancePercent), sub: 'Trailing 30 days', icon: 'query_stats', accent: 'sky' },
      { label: 'Average Performance Rating', value: o.avgPerformanceRating.toFixed(1), sub: 'out of 5', icon: 'star', accent: 'violet' },
      { label: 'Open Positions', value: this.fmtNum(o.openPositions), icon: 'work', accent: 'teal' },
      { label: 'Recruitment Progress', value: this.fmtPct(o.recruitmentProgress), icon: 'insights', accent: 'teal' }
    ];
  });

  viewerCharts = computed(() => {
    const o = this.org();
    return {
      employeeDistribution: buildDonut(
        o.departmentBreakdown.map((d, i) => ({ label: d.department, value: d.count, color: ['var(--amber)', 'var(--teal)', 'var(--sky)', 'var(--violet)', 'var(--rose)', 'var(--steel-light)', 'var(--amber-dim)'][i % 7] }))
      ),
      attendanceTrend: buildLine(o.attendanceTrend),
      attritionTrend: buildLine(o.attritionTrend),
      hiringVsExit: buildDualBars(o.hiringVsExit.map(h => ({ label: h.label, a: h.hires, b: h.exits }))),
      departmentHeadcount: buildBarRows(o.departmentBreakdown.map(d => ({ label: d.department, value: d.count })), 'var(--sky)'),
      payrollByDepartment: buildBarRows(
        o.payrollCostByDepartment.map(d => ({ label: d.department, value: d.cost })),
        'var(--violet)',
        (n) => this.fmtCurrencyCompact(n)
      )
    };
  });

  viewerReports = [
    { label: 'Employee Summary', icon: 'summarize' },
    { label: 'Attendance Report', icon: 'event_available' },
    { label: 'Leave Report', icon: 'beach_access' },
    { label: 'Payroll Summary', icon: 'payments' },
    { label: 'Recruitment Status', icon: 'work' },
    { label: 'Performance Summary', icon: 'star' }
  ];

  quickActions = [
    { label: 'Add Employee', icon: 'person_add' },
    { label: 'Approve Leave', icon: 'fact_check' },
    { label: 'Run Payroll', icon: 'payments' },
    { label: 'Create Job Opening', icon: 'work' },
    { label: 'Add Holiday', icon: 'event' },
    { label: 'Generate Reports', icon: 'summarize' }
  ];

  ngOnInit() {
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    // TODO: update EmployeeService.getDashboardStats() to return
    // Observable<Partial<OrgData>> (see the OrgData interface above).
    // Cast to `any` here only until that return type is aligned, so
    // this file compiles against your existing service in the meantime.
    (this.employeeService.getDashboardStats() as unknown as import('rxjs').Observable<Partial<OrgData>>).subscribe({
      next: (data: Partial<OrgData>) => {
        this.org.set({ ...this.buildSampleOrgData(), ...data });
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error fetching dashboard stats:', err);
        this.toastService.error('Failed to load dashboard statistics. Showing sample data.');
        this.isLoading.set(false);
      }
    });
  }

  onQuickAction(label: string) {
    // Wire these to real routes/modals as they come online, e.g.
    // this.router.navigate(['/employees/new']) for 'Add Employee'.
    // Cast defensively in case ToastService only exposes `.error()` today.
    (this.toastService as unknown as { success?: (msg: string) => void }).success?.(
      `${label} — action not yet wired to a route.`
    );
  }

  onReportRequest(label: string) {
    (this.toastService as unknown as { success?: (msg: string) => void }).success?.(
      `Generating ${label}…`
    );
  }

  /* =====================================================================
   * Sample data — realistic numbers for a ~600-person industrial ERP
   * tenant with plants across Tamil Nadu. Replace via the live API by
   * matching the OrgData shape above.
   * =================================================================== */
  private buildSampleOrgData(): OrgData {
    const now = Date.now();
    const months = lastNMonthLabels(6);
    return {
      totalEmployees: 612,
      newJoineesThisMonth: 14,
      exitsThisMonth: 6,
      attritionRate: 8.4,
      employeeGrowthPercent: 4.2,
      departmentCount: 7,
      branchCount: 6,
      openPositions: 21,
      recruitmentProgress: 57,

      attendanceToday: { present: 561, absent: 23, onLeave: 28 },
      birthdaysToday: [
        { name: 'Aishwarya K', department: 'Production' },
        { name: 'Rahul Menon', department: 'Procurement' }
      ],
      anniversariesToday: [
        { name: 'Suresh Babu', years: 5 },
        { name: 'Divya Ramesh', years: 2 }
      ],
      pendingApprovals: 17,
      payroll: { status: 'Processing', runDate: new Date(now - 2 * 86400000).toISOString(), monthlyCost: 8940000, currency: 'INR' },
      performanceReviewsPending: 22,
      expiringDocuments: [
        { name: 'Mohammed Irfan', docType: 'Work Visa', expiryDate: new Date(now + 12 * 86400000).toISOString() },
        { name: 'Lakshmi Narayanan', docType: 'Employment Contract', expiryDate: new Date(now + 27 * 86400000).toISOString() },
        { name: 'Steven Paul', docType: 'Passport', expiryDate: new Date(now + 41 * 86400000).toISOString() }
      ],
      probationEmployees: 19,

      departmentBreakdown: [
        { department: 'Production', count: 214 },
        { department: 'Warehouse & Logistics', count: 96 },
        { department: 'Procurement', count: 74 },
        { department: 'Sales & Dispatch', count: 68 },
        { department: 'Quality Control', count: 61 },
        { department: 'Finance & Admin', count: 53 },
        { department: 'HR & Admin', count: 46 }
      ],
      genderDistribution: [
        { label: 'Male', value: 428 },
        { label: 'Female', value: 176 },
        { label: 'Other', value: 8 }
      ],
      ageDistribution: [
        { label: '18-24', value: 84 },
        { label: '25-34', value: 241 },
        { label: '35-44', value: 176 },
        { label: '45-54', value: 88 },
        { label: '55+', value: 23 }
      ],
      employeeGrowthTrend: [571, 583, 592, 598, 605, 612],
      attritionTrend: [7.1, 7.6, 8.0, 7.8, 8.2, 8.4],
      hiringVsExit: months.map((m, i) => ({ label: m, hires: [11, 9, 15, 12, 10, 14][i], exits: [5, 7, 4, 8, 6, 6][i] })),
      attendanceTrend: [93.4, 92.8, 94.1, 93.6, 94.3, 91.7],
      leaveTrend: [142, 158, 133, 171, 149, 164],
      payrollCostTrend: [8320000, 8410000, 8560000, 8690000, 8770000, 8940000],

      leaveRequestsPending: 11,
      interviewsToday: 5,
      candidatesInPipeline: 38,
      documentsPending: 9,
      upcomingConfirmations: 7,
      pendingOnboarding: 4,
      exitClearancePending: 3,
      payrollTasksPending: 6,
      myTasks: [
        { label: 'Employee Verification', count: 6, icon: 'fact_check' },
        { label: 'Offer Letters', count: 4, icon: 'mail' },
        { label: 'Interview Schedule', count: 5, icon: 'event' },
        { label: 'Leave Approval', count: 11, icon: 'pending_actions' },
        { label: 'Attendance Corrections', count: 3, icon: 'edit_calendar' },
        { label: 'Payroll Verification', count: 6, icon: 'payments' }
      ],
      recruitmentPipeline: [
        { stage: 'Applied', count: 96 },
        { stage: 'Screened', count: 58 },
        { stage: 'Interview', count: 34 },
        { stage: 'Offer', count: 12 },
        { stage: 'Hired', count: 8 }
      ],
      leaveRequestsBreakdown: [
        { label: 'Pending', value: 11 },
        { label: 'Approved', value: 46 },
        { label: 'Rejected', value: 5 }
      ],
      interviewStatus: [
        { label: 'Scheduled', value: 5 },
        { label: 'Completed', value: 18 },
        { label: 'Pending', value: 7 },
        { label: 'Cancelled', value: 2 }
      ],
      employeeJoiningTrend: [9, 12, 8, 15, 11, 14],
      notifications: [
        { icon: 'cake', text: '2 birthdays today — Aishwarya K, Rahul Menon', time: '9:00 AM', tone: 'info' },
        { icon: 'celebration', text: 'Suresh Babu completes 5 years today', time: '9:00 AM', tone: 'info' },
        { icon: 'event_busy', text: '4 employees have not clocked in yet', time: '10:15 AM', tone: 'warn' },
        { icon: 'description', text: '3 documents expiring within 45 days', time: 'Yesterday', tone: 'alert' },
        { icon: 'verified', text: '7 confirmations due in the next 2 weeks', time: 'Yesterday', tone: 'info' }
      ],

      avgAttendancePercent: 93.2,
      avgPerformanceRating: 3.8,
      payrollCostByDepartment: [
        { department: 'Production', cost: 3120000 },
        { department: 'Warehouse & Logistics', cost: 1380000 },
        { department: 'Procurement', cost: 1180000 },
        { department: 'Sales & Dispatch', cost: 1090000 },
        { department: 'Quality Control', cost: 890000 },
        { department: 'Finance & Admin', cost: 780000 },
        { department: 'HR & Admin', cost: 500000 }
      ]
    };
  }
}