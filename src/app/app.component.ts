import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  toasts = this.toastService.toasts;

  // Global search input trigger
  triggerGlobalSearch(query: string) {
    if (query && query.trim()) {
      this.router.navigate(['/employee'], { queryParams: { q: query.trim() } });
    }
  }

  // Live notification states
  notifications = signal<any[]>([
    { id: 1, text: 'Welcome to Work@Eaze HRMS Portal!', time: 'Just now', read: false },
    { id: 2, text: 'New employee profile 1001 (Ananth Narayanan) created.', time: '2 hours ago', read: false },
    { id: 3, text: 'Monthly payroll processing is complete.', time: '1 day ago', read: true }
  ]);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  showNotificationsDropdown = signal<boolean>(false);
  showUserDropdown = signal<boolean>(false);

  toggleNotifications() {
    this.showNotificationsDropdown.update(val => !val);
    this.showUserDropdown.set(false);
  }

  toggleUserDropdown() {
    this.showUserDropdown.update(val => !val);
    this.showNotificationsDropdown.set(false);
  }

  closeUserDropdown() {
    this.showUserDropdown.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // User Dropdown Click Outside
    const userProfileEl = this.elementRef.nativeElement.querySelector('.user-profile-container');
    if (userProfileEl && !userProfileEl.contains(target)) {
      this.showUserDropdown.set(false);
    }

    // Notifications Dropdown Click Outside
    const notifBtn = this.elementRef.nativeElement.querySelector('.icon-nav-btn');
    const notifDrop = this.elementRef.nativeElement.querySelector('.notifications-dropdown');
    if (notifDrop && !notifDrop.contains(target) && notifBtn && !notifBtn.contains(target)) {
      this.showNotificationsDropdown.set(false);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: Event) {
    this.showUserDropdown.set(false);
    this.showNotificationsDropdown.set(false);
  }

  markAsRead(id: number) {
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  clearAllNotifications() {
    this.notifications.set([]);
  }

  // Sidebar expand/collapse state
  sidebarCollapsed = signal<boolean>(false);

  toggleSidebar() {
    this.sidebarCollapsed.update(val => !val);
  }

  // Sidebar dropdown groups (accordion: only one open at a time)
  private masterRoutes = ['/employee', '/location', '/sub-location', '/department', '/functional-unit', '/division', '/category', '/ctc-master', '/company-profile', '/salary-heads', '/holiday-entry', '/blood-group-master', '/designation-master', '/email-config', '/payroll-configuration', '/payroll'];
  private transactionRoutes = ['/attendance-view', '/attendance-import', '/attendance-adjustment', '/forgot-card', '/leave-request', '/compensation-request', '/leave-compensation', '/leave-approval', '/earnings', '/deduction', '/advance', '/salary-generation', '/salary-removal', '/increment-entry', '/increment-modification', '/shift-generation'  ];
  private reportRoutes: string[] = ['/reports/attendance', '/reports/salary', '/reports/increment', '/reports/insurance-gratuity', '/reports/employee-details'];

  expandedGroup = signal<string | null>(this.getGroupForUrl(this.router.url));

  // Reports sub-menu (accordion within the Reports group: one module open at a time)
  reportModules: { id: string; label: string; icon: string; routePrefix: string; items: { label: string; route: string }[] }[] = [
    {
      id: 'attendance',
      label: 'Attendance',
      icon: 'event_available',
      routePrefix: '/reports/attendance',
      items: [
        { label: 'Over Time Details', route: '/reports/attendance/overtime' },
        { label: 'Leave Details', route: '/reports/attendance/leave' },
        { label: 'Permission', route: '/reports/attendance/permission' },
        { label: 'Late-In List', route: '/reports/attendance/latein' },
        { label: 'In-Out Actual Time', route: '/reports/attendance/inout' },
        { label: 'Leave Availed', route: '/reports/attendance/leaveavail' },
        { label: 'Employee Experience', route: '/reports/attendance/experience' },
        { label: 'Leave / Permission Details View', route: '/reports/attendance/detailsview' },
        { label: 'Shift Details', route: '/reports/attendance/shiftdetails' }
      ]
    },
    {
      id: 'salary',
      label: 'Salary',
      icon: 'account_balance_wallet',
      routePrefix: '/reports/salary',
      items: [
        { label: 'Payroll Statement', route: '/reports/salary/payroll' },
        { label: 'Salary Summary', route: '/reports/salary/salarysummary' },
        { label: 'Salary Abstract', route: '/reports/salary/salaryabstract' },
        { label: 'Salary & Other Benefits', route: '/reports/salary/benefits' },
        { label: 'Consolidated Payslip Summary', route: '/reports/salary/consolidated' },
        { label: 'Advance Details', route: '/reports/salary/advance' },
        { label: 'Unit / Grade Wise Salary', route: '/reports/salary/unitgrade' },
        { label: 'Label & Badges', route: '/reports/salary/label' },
        { label: 'Given Cheque Details', route: '/reports/salary/cheque' },
        { label: 'Functional Unit Wise Details', route: '/reports/salary/functionalunit' },
        { label: 'Bank Credit Details', route: '/reports/salary/bankcredit' },
        { label: 'Pay Slip Email Log', route: '/reports/salary/payslipemail' },
        { label: 'Salary Revision Percentage', route: '/reports/salary/revisionpercentage' },
        { label: 'Salary Revision Bulk', route: '/reports/salary/revisionbulk' }
      ]
    },
    {
      id: 'increment',
      label: 'Increment',
      icon: 'trending_up',
      routePrefix: '/reports/increment',
      items: [
        { label: 'Increment Details', route: '/reports/increment/increment-details' },
        { label: 'Salary Comparison Report', route: '/reports/increment/salary-comparison' },
        { label: 'Increment History', route: '/reports/increment/increment-history' },
        { label: 'Employee Increment Summary', route: '/reports/increment/appraisal-rating' }
      ]
    },
    {
      id: 'insurance',
      label: 'Insurance & Gratuity',
      icon: 'health_and_safety',
      routePrefix: '/reports/insurance-gratuity',
      items: [
        { label: 'Gratuity and Eligibility Calculations', route: '/reports/insurance-gratuity/gratuity-calculation' },
        { label: 'Gratuity Claim Proforma', route: '/reports/insurance-gratuity/gratuity-claim' }
      ]
    },
    {
      id: 'employee',
      label: 'Employee Details',
      icon: 'groups',
      routePrefix: '/reports/employee-details',
      items: [
        { label: 'Employee Head Count', route: '/reports/employee-details/head-count' },
        { label: 'Employee Birthday List', route: '/reports/employee-details/birthday-list' },
        { label: 'Employee Shift Details', route: '/reports/employee-details/shift-details' },
        { label: 'Employee Blood Group Details', route: '/reports/employee-details/blood-group' },
        { label: 'Employee Personal Details', route: '/reports/employee-details/personal-details' },
        { label: 'Employee ID Card Details', route: '/reports/employee-details/id-card' },
        { label: 'User Customized Report', route: '/reports/employee-details/customized-report' },
        { label: 'Employee History Report', route: '/reports/employee-details/employee-history' }
      ]
    }
  ];

  expandedReportModule = signal<string | null>(this.getReportModuleForUrl(this.router.url));

  toggleReportModule(id: string) {
    this.expandedReportModule.update(curr => (curr === id ? null : id));
  }

  private getReportModuleForUrl(url: string): string | null {
    const mod = this.reportModules.find(m => this.routeMatches(url, m.routePrefix));
    return mod ? mod.id : null;
  }

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const group = this.getGroupForUrl(this.router.url);
      if (group) {
        this.expandedGroup.set(group);
      }
    });
  }

  toggleGroup(name: string) {
    this.expandedGroup.update(curr => (curr === name ? null : name));
  }

  // Matches on full path segments so e.g. '/employee' does not also match
  // '/employee-history' the way a plain url.startsWith(r) check would.
  private routeMatches(url: string, route: string): boolean {
    return url === route || url.startsWith(route + '/');
  }

  private getGroupForUrl(url: string): string | null {
    if (this.masterRoutes.some(r => this.routeMatches(url, r))) return 'masters';
    if (this.transactionRoutes.some(r => this.routeMatches(url, r))) return 'transaction';
    if (this.reportRoutes.some(r => this.routeMatches(url, r))) return 'reports';
    return null;
  }

  isGroupActive(group: string): boolean {
    const url = this.router.url;
    if (group === 'masters') return this.masterRoutes.some(r => this.routeMatches(url, r));
    if (group === 'transaction') return this.transactionRoutes.some(r => this.routeMatches(url, r));
    if (group === 'reports') return this.reportRoutes.some(r => this.routeMatches(url, r));
    return false;
  }

  logout() {
    this.authService.logout();
  }

  removeToast(id: number) {
    this.toastService.remove(id);
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'HR';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getActiveRouteName(): string {
    const url = this.router.url;
    // NOTE: more specific paths (e.g. '/employee-history') must be checked
    // before their shorter prefixes (e.g. '/employee'), since startsWith()
    // would otherwise always match the shorter one first.
    if (url.startsWith('/employee-history')) return 'Employee History';
    if (url.startsWith('/employee')) return 'Employee Master';
    if (url.startsWith('/location')) return 'Location Master';
    if (url.startsWith('/sub-location')) return 'Sub Location Master';
    if (url.startsWith('/department')) return 'Department Master';
    if (url.startsWith('/functional-unit')) return 'Functional Unit Master';
    if (url.startsWith('/division')) return 'Division Master';
    if (url.startsWith('/category')) return 'Category Master';
    if (url.startsWith('/ctc-master')) return 'CTC Master';
    if (url.startsWith('/attendance-view')) return 'Attendance View';
    if (url.startsWith('/attendance-import')) return 'Attendance Import';
    if (url.startsWith('/attendance-adjustment')) return 'Attendance Adjustment';
    if (url.startsWith('/forgot-card')) return 'Forgot Card';
    if (url.startsWith('/leave-request')) return 'Leave Request';
    if (url.startsWith('/compensation-request')) return 'Compensation Request';
    if (url.startsWith('/company-profile')) return 'Company Profile';
    if (url.startsWith('/salary-heads')) return 'Salary Heads';
    if (url.startsWith('/holiday-entry')) return 'Holiday Entry';
    if (url.startsWith('/blood-group-master')) return 'Blood Group Master';
    if (url.startsWith('/designation-master')) return 'Designation Master';
    if (url.startsWith('/email-config')) return 'Email Configuration';
    if (url.startsWith('/payroll-configuration')) return 'Payroll Configuration';
    if (url.startsWith('/payroll')) return 'Payroll';
    if (url.startsWith('/leave-compensation')) return 'Leave / Compensation';
    if (url.startsWith('/leave-approval')) return 'Leave Approval';
    if (url.startsWith('/earnings')) return 'Earnings';
    if (url.startsWith('/deduction')) return 'Deduction';
    if (url.startsWith('/advance')) return 'Advance';
    if (url.startsWith('/increment-entry')) return 'Increment Entry';
    if (url.startsWith('/increment-modification')) return 'Increment Modification';
    if (url.startsWith('/shift-generation')) return 'Shift Generation / Change';
    if (url.startsWith('/salary-generation')) return 'Salary Generation';
    if (url.startsWith('/salary-removal')) return 'Salary Removal';
    if (url.startsWith('/reports')) {
      const mod = this.reportModules.find(m => this.routeMatches(url, m.routePrefix));
      return mod ? `Reports - ${mod.label}` : 'Reports';
    }
    return 'Dashboard';
  }

  getActiveRoutePath(): string {
    const url = this.router.url;
    // Same ordering note as getActiveRouteName() above.
    if (url.startsWith('/employee-history')) return '/employee-history';
    if (url.startsWith('/employee')) return '/employee';
    if (url.startsWith('/location')) return '/location';
    if (url.startsWith('/sub-location')) return '/sub-location';
    if (url.startsWith('/department')) return '/department';
    if (url.startsWith('/functional-unit')) return '/functional-unit';
    if (url.startsWith('/division')) return '/division';
    if (url.startsWith('/category')) return '/category';
    if (url.startsWith('/ctc-master')) return '/ctc-master';
    if (url.startsWith('/attendance-view')) return '/attendance-view';
    if (url.startsWith('/attendance-import')) return '/attendance-import';
    if (url.startsWith('/attendance-adjustment')) return '/attendance-adjustment';
    if (url.startsWith('/forgot-card')) return '/forgot-card';
    if (url.startsWith('/leave-request')) return '/leave-request';
    if (url.startsWith('/compensation-request')) return '/compensation-request';
    if (url.startsWith('/company-profile')) return '/company-profile';
    if (url.startsWith('/salary-heads')) return '/salary-heads';
    if (url.startsWith('/holiday-entry')) return '/holiday-entry';
    if (url.startsWith('/blood-group-master')) return '/blood-group-master';
    if (url.startsWith('/designation-master')) return '/designation-master';
    if (url.startsWith('/email-config')) return '/email-config';
    if (url.startsWith('/payroll-configuration')) return '/payroll-configuration';
    if (url.startsWith('/payroll')) return '/payroll';
    if (url.startsWith('/leave-compensation')) return '/leave-compensation';
    if (url.startsWith('/leave-approval')) return '/leave-approval';
    if (url.startsWith('/earnings')) return '/earnings';
    if (url.startsWith('/deduction')) return '/deduction';
    if (url.startsWith('/advance')) return '/advance';
    if (url.startsWith('/increment-entry')) return '/increment-entry';
    if (url.startsWith('/increment-modification')) return '/increment-modification';
    if (url.startsWith('/shift-generation')) return '/shift-generation';
    if (url.startsWith('/salary-generation')) return '/salary-generation';
    if (url.startsWith('/salary-removal')) return '/salary-removal';
    if (url.startsWith('/reports')) {
      const mod = this.reportModules.find(m => this.routeMatches(url, m.routePrefix));
      return mod ? mod.routePrefix : '/reports';
    }
    return '/';
  }
}