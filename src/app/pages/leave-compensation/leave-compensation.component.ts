import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { SearchService } from '../../services/search.service';
import { LucideAngularModule } from 'lucide-angular';

interface RequestItem {
  id: string;
  empCode: string;
  empName: string;
  appliedBy: 'Employee' | 'HR' | 'Team Leader';
  leaveType?: string;
  compType?: string;
  fromDate?: string;
  toDate?: string;
  days?: number;
  workedOn?: string;
  compOffDate?: string;
  hoursWorked?: number;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks: string;
  attachments: number;
}

const PAGE_SIZE = 6;
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function parseDMY(str?: string): Date | null {
  if (!str) return null;
  const [d, m, y] = str.split('-');
  return new Date(+y, +m - 1, +d);
}

function isExpired(record: RequestItem): boolean {
  if (record.status !== 'Pending') return false;
  const dateStr = record.fromDate || record.compOffDate;
  const dt = parseDMY(dateStr);
  if (!dt) return false;
  return dt < TODAY;
}

const APPROVAL_RULES: Record<string, { approvers: string[]; label: string }> = {
  HR: { approvers: ['Manager'], label: 'Applied by HR. Needs approval from Manager.' },
  Employee: { approvers: ['Team Leader'], label: 'Applied by Employee. Needs approval from Team Leader.' },
  'Team Leader': { approvers: ['HR', 'Manager'], label: 'Applied by Team Leader. Needs approval from HR or Manager.' }
};

const APPROVER_NAMES: Record<string, string> = {
  Manager: 'Ramesh Kumar',
  HR: 'Anitha S',
  'Team Leader': 'Suresh Babu'
};

const APPLIED_BY_COLOR: Record<string, { color: string; bg: string }> = {
  HR: { color: '#7c3aed', bg: '#ede9fe' },
  Employee: { color: '#15803d', bg: '#dcfce7' },
  'Team Leader': { color: '#1d4ed8', bg: '#dbeafe' }
};

function canAct(viewerRole: string, appliedBy: string): boolean {
  if (viewerRole === 'Admin') return true;
  const rule = APPROVAL_RULES[appliedBy];
  if (!rule) return false;
  return rule.approvers.includes(viewerRole);
}

const INIT_LEAVE: RequestItem[] = [
  { id: 'LR001', empCode: 'EMP001', empName: 'Pramod Kumar O',  appliedBy: 'Employee',    leaveType: 'Casual Leave',    fromDate: '15-07-2026', toDate: '17-06-2026', days: 3.0,  reason: 'Family Function',     status: 'Pending',  remarks: '', attachments: 1 },
  { id: 'LR002', empCode: 'EMP002', empName: 'Priya Sharma',    appliedBy: 'Employee',    leaveType: 'Sick Leave',      fromDate: '18-07-2026', toDate: '18-06-2026', days: 1.0,  reason: 'Not feeling well',    status: 'Pending',  remarks: '', attachments: 2 },
  { id: 'LR003', empCode: 'EMP003', empName: 'Ravi Kumar',      appliedBy: 'HR',          leaveType: 'Earned Leave',    fromDate: '20-07-2026', toDate: '22-06-2026', days: 3.0,  reason: 'Vacation',            status: 'Approved', remarks: 'Approved by manager', attachments: 1 },
  { id: 'LR004', empCode: 'EMP004', empName: 'Karthik R',       appliedBy: 'HR',          leaveType: 'Maternity Leave', fromDate: '01-07-2026', toDate: '28-09-2026', days: 90.0, reason: 'Maternity leave',     status: 'Pending',  remarks: '', attachments: 1 },
  { id: 'LR005', empCode: 'EMP005', empName: 'Anjali Menon',     appliedBy: 'Team Leader', leaveType: 'Casual Leave',    fromDate: '25-06-2026', toDate: '26-06-2026', days: 2.0,  reason: 'Personal work',       status: 'Pending',  remarks: '', attachments: 0 },
  { id: 'LR006', empCode: 'EMP006', empName: 'Lakshmi Narayan', appliedBy: 'Team Leader', leaveType: 'Sick Leave',      fromDate: '23-06-2026', toDate: '23-06-2026', days: 1.0,  reason: 'Fever',               status: 'Rejected', remarks: 'Insufficient balance', attachments: 1 },
  { id: 'LR007', empCode: 'EMP007', empName: 'Pravin M',        appliedBy: 'Employee',    leaveType: 'Earned Leave',    fromDate: '30-06-2026', toDate: '04-07-2026', days: 5.0,  reason: 'Annual vacation',     status: 'Pending',  remarks: '', attachments: 2 },
  { id: 'LR008', empCode: 'EMP008', empName: 'Ponnaj K',        appliedBy: 'HR',          leaveType: 'Casual Leave',    fromDate: '28-07-2026', toDate: '28-06-2026', days: 1.0,  reason: 'Personal errand',     status: 'Pending',  remarks: '', attachments: 0 },
];

const INIT_COMP: RequestItem[] = [
  { id: 'CR001', empCode: 'EMP001', empName: 'Pramod Kumar O',  appliedBy: 'Employee',    compType: 'Comp Off Leave',   workedOn: 'Sunday',  compOffDate: '20-07-2026', hoursWorked: 8.0, status: 'Pending',  remarks: '', attachments: 1 },
  { id: 'CR002', empCode: 'EMP002', empName: 'Priya Sharma',    appliedBy: 'Employee',    compType: 'Comp Off Leave',   workedOn: 'Holiday', compOffDate: '15-07-2026', hoursWorked: 9.0, status: 'Pending',  remarks: '', attachments: 2 },
  { id: 'CR003', empCode: 'EMP003', empName: 'Ramesh K',        appliedBy: 'HR',          compType: 'Leave Encashment', workedOn: 'Weekday', compOffDate: '25-07-2026', hoursWorked: 7.5, status: 'Pending',  remarks: '', attachments: 0 },
  { id: 'CR004', empCode: 'EMP004', empName: 'Karthik R',       appliedBy: 'HR',          compType: 'Comp Off Leave',   workedOn: 'Sunday',  compOffDate: '10-06-2026', hoursWorked: 8.5, status: 'Pending',  remarks: '', attachments: 1 },
  { id: 'CR005', empCode: 'EMP005', empName: 'Anjali Menon',     appliedBy: 'Team Leader', compType: 'Comp Off Leave',   workedOn: 'Holiday', compOffDate: '22-06-2026', hoursWorked: 8.0, status: 'Approved', remarks: 'Approved', attachments: 0 },
  { id: 'CR006', empCode: 'EMP006', empName: 'Lakshmi Narayan', appliedBy: 'Team Leader', compType: 'Leave Encashment', workedOn: 'Weekday', compOffDate: '12-07-2026', hoursWorked: 6.5, status: 'Rejected', remarks: 'Not eligible', attachments: 1 },
  { id: 'CR007', empCode: 'EMP007', empName: 'Pravin M',        appliedBy: 'Team Leader', compType: 'Leave Encashment', workedOn: 'Weekday', compOffDate: '18-07-2026', hoursWorked: 6.0, status: 'Pending',  remarks: '', attachments: 2 },
  { id: 'CR008', empCode: 'EMP008', empName: 'Ponnaj K',        appliedBy: 'Employee',    compType: 'Comp Off Leave',   workedOn: 'Sunday',  compOffDate: '28-06-2026', hoursWorked: 7.0, status: 'Pending',  remarks: '', attachments: 0 },
  { id: 'CR009', empCode: 'EMP009', empName: 'Anitha S',        appliedBy: 'HR',          compType: 'Leave Encashment', workedOn: 'Holiday', compOffDate: '05-06-2026', hoursWorked: 8.0, status: 'Pending',  remarks: '', attachments: 1 },
  { id: 'CR010', empCode: 'EMP010', empName: 'Vijay R',         appliedBy: 'HR',          compType: 'Comp Off Leave',   workedOn: 'Sunday',  compOffDate: '30-06-2026', hoursWorked: 9.0, status: 'Pending',  remarks: '', attachments: 0 },
];

@Component({
  selector: 'app-leave-compensation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './leave-compensation.component.html',
  styleUrls: ['./leave-compensation.component.scss']
})
export class LeaveCompensationComponent implements OnInit {
  activeTab = 'Leave Approval';
  viewerRole = 'Admin';

  leaveRequests = [...INIT_LEAVE];
  compRequests = [...INIT_COMP];

  // Leave pagination & UI states
  leaveShowPending = true;
  leavePage = 1;
  leaveRejectId: string | null = null;
  leaveRejectText = '';
  leaveRejectErr = false;
  leaveChangeActionId: string | null = null;
  leaveCaRejectActive = false;
  leaveCaRejectText = '';
  leaveCaRejectErr = false;

  // Compensation pagination & UI states
  compShowPending = true;
  compPage = 1;
  compRejectId: string | null = null;
  compRejectText = '';
  compRejectErr = false;
  compChangeActionId: string | null = null;
  compCaRejectActive = false;
  compCaRejectText = '';
  compCaRejectErr = false;

  attachModal: RequestItem | null = null;

  TABS = ['Leave Approval', 'Compensation Approval'];
  VIEW_ROLES = ['Admin', 'Manager', 'HR', 'Team Leader'];
  APPROVAL_RULES = APPROVAL_RULES;
  APPROVER_NAMES = APPROVER_NAMES;

  STATUS_COLOR: Record<string, string> = { Approved: '#16a34a', Rejected: '#dc2626', Pending: '#d97706', Expired: '#6b7280' };
  STATUS_BG: Record<string, string> = { Approved: '#dcfce7', Rejected: '#fee2e2', Pending: '#fef3c7', Expired: '#f3f4f6' };

  constructor(private toastService: ToastService, public searchService: SearchService) {}

  ngOnInit() {}

  isExpired(r: RequestItem) {
    return isExpired(r);
  }

  canAct(appliedBy: string) {
    return canAct(this.viewerRole, appliedBy);
  }

  getAppliedByColor(appliedBy: string) {
    return APPLIED_BY_COLOR[appliedBy] || { color: '#475569', bg: '#e2e8f0' };
  }

  getApprovers(appliedBy: string) {
    const rule = APPROVAL_RULES[appliedBy];
    return rule ? rule.approvers : [];
  }

  getApproverName(role: string) {
    return APPROVER_NAMES[role] || '';
  }

  // --- LEAVE FILTERED & SORTED ---
  get filteredLeave(): RequestItem[] {
    const filtered = this.leaveRequests.filter(r => {
      const exp = isExpired(r);
      if (this.leaveShowPending) return r.status === 'Pending' || exp;
      return r.status === 'Approved' || r.status === 'Rejected';
    });
    return filtered
      .filter(r => this.searchService.matches(r))
      .sort((a, b) => {
        const o: Record<string, number> = { Pending: 0, Expired: 1, Approved: 2, Rejected: 3 };
        const statusA = isExpired(a) ? 'Expired' : a.status;
        const statusB = isExpired(b) ? 'Expired' : b.status;
        return (o[statusA] ?? 4) - (o[statusB] ?? 4);
      });
  }

  get leaveTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredLeave.length / PAGE_SIZE));
  }

  get leavePageRows(): RequestItem[] {
    const start = (this.leavePage - 1) * PAGE_SIZE;
    return this.filteredLeave.slice(start, start + PAGE_SIZE);
  }

  // --- COMPENSATION FILTERED & SORTED ---
  get filteredComp(): RequestItem[] {
    const filtered = this.compRequests.filter(r => {
      const exp = isExpired(r);
      if (this.compShowPending) return r.status === 'Pending' || exp;
      return r.status === 'Approved' || r.status === 'Rejected';
    });
    return filtered
      .filter(r => this.searchService.matches(r))
      .sort((a, b) => {
        const o: Record<string, number> = { Pending: 0, Expired: 1, Approved: 2, Rejected: 3 };
        const statusA = isExpired(a) ? 'Expired' : a.status;
        const statusB = isExpired(b) ? 'Expired' : b.status;
        return (o[statusA] ?? 4) - (o[statusB] ?? 4);
      });
  }

  get compTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredComp.length / PAGE_SIZE));
  }

  get compPageRows(): RequestItem[] {
    const start = (this.compPage - 1) * PAGE_SIZE;
    return this.filteredComp.slice(start, start + PAGE_SIZE);
  }

  // Helper pagination calculations
  getPaginationDetails(type: 'leave' | 'comp') {
    const rows = type === 'leave' ? this.filteredLeave : this.filteredComp;
    const page = type === 'leave' ? this.leavePage : this.compPage;
    const total = type === 'leave' ? this.leaveTotalPages : this.compTotalPages;

    const startEntry = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const endEntry = Math.min(page * PAGE_SIZE, rows.length);

    let pageNumbers: (number | string)[] = [];
    if (total <= 5) pageNumbers = Array.from({ length: total }, (_, i) => i + 1);
    else if (page <= 3) pageNumbers = [1, 2, 3, 4, '…', total];
    else if (page >= total - 2) pageNumbers = [1, '…', total - 3, total - 2, total - 1, total];
    else pageNumbers = [1, '…', page, '…', total];

    return { startEntry, endEntry, pageNumbers, total };
  }

  // Actions
  handleLeaveApprove(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (isExpired(r)) { this.toastService.addToast('This request has expired.', 'error'); return; }
    if (!this.canAct(r.appliedBy)) { this.toastService.addToast(`As ${this.viewerRole}, you cannot approve this.`, 'error'); return; }
    this.leaveRequests = this.leaveRequests.map(x => x.id === r.id ? { ...x, status: 'Approved', remarks: `Approved by ${this.viewerRole}` } : x);
    this.closeAll();
    this.toastService.addToast(`Leave ${r.id} (${r.empName}) approved.`, 'success');
  }

  handleLeaveRejectClick(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (isExpired(r)) { this.toastService.addToast('This request has expired.', 'error'); return; }
    if (!this.canAct(r.appliedBy)) { this.toastService.addToast(`As ${this.viewerRole}, you cannot reject this.`, 'error'); return; }
    if (this.leaveRejectId === r.id) { this.closeAll(); return; }
    this.closeAll();
    this.leaveRejectId = r.id;
  }

  updateLeaveRejectText(val: string) {
    this.leaveRejectText = val;
    if (val) this.leaveRejectErr = false;
  }

  handleLeaveRejectConfirm(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (!this.leaveRejectText.trim()) { this.leaveRejectErr = true; return; }
    this.leaveRequests = this.leaveRequests.map(x => x.id === r.id ? { ...x, status: 'Rejected', remarks: this.leaveRejectText.trim() } : x);
    this.closeAll();
    this.toastService.addToast(`Leave ${r.id} (${r.empName}) rejected.`, 'error');
  }

  handleLeaveChangeAction(r: RequestItem, e: Event) {
    e.stopPropagation();
    this.leaveChangeActionId = this.leaveChangeActionId === r.id ? null : r.id;
  }

  handleLeaveTriggerChange(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (r.status === 'Approved') {
      this.leaveCaRejectActive = true;
    } else {
      this.handleLeaveApprove(r, e);
      this.leaveChangeActionId = null;
    }
  }

  updateLeaveCaRejectText(val: string) {
    this.leaveCaRejectText = val;
    if (val) this.leaveCaRejectErr = false;
  }

  handleLeaveCARejectConfirm(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (!this.leaveCaRejectText.trim()) { this.leaveCaRejectErr = true; return; }
    this.leaveRequests = this.leaveRequests.map(x => x.id === r.id ? { ...x, status: 'Rejected', remarks: this.leaveCaRejectText.trim() } : x);
    this.toastService.addToast(`Leave ${r.id} changed to Rejected.`, 'error');
    this.leaveCaRejectActive = false;
    this.leaveCaRejectText = '';
    this.leaveCaRejectErr = false;
  }

  // Compensation Actions
  handleCompApprove(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (isExpired(r)) { this.toastService.addToast('This request has expired.', 'error'); return; }
    if (!this.canAct(r.appliedBy)) { this.toastService.addToast(`As ${this.viewerRole}, you cannot approve this.`, 'error'); return; }
    this.compRequests = this.compRequests.map(x => x.id === r.id ? { ...x, status: 'Approved', remarks: `Approved by ${this.viewerRole}` } : x);
    this.closeAll();
    this.toastService.addToast(`Compensation ${r.id} (${r.empName}) approved.`, 'success');
  }

  handleCompRejectClick(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (isExpired(r)) { this.toastService.addToast('This request has expired.', 'error'); return; }
    if (!this.canAct(r.appliedBy)) { this.toastService.addToast(`As ${this.viewerRole}, you cannot reject this.`, 'error'); return; }
    if (this.compRejectId === r.id) { this.closeAll(); return; }
    this.closeAll();
    this.compRejectId = r.id;
  }

  updateCompRejectText(val: string) {
    this.compRejectText = val;
    if (val) this.compRejectErr = false;
  }

  handleCompRejectConfirm(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (!this.compRejectText.trim()) { this.compRejectErr = true; return; }
    this.compRequests = this.compRequests.map(x => x.id === r.id ? { ...x, status: 'Rejected', remarks: this.compRejectText.trim() } : x);
    this.closeAll();
    this.toastService.addToast(`Compensation ${r.id} (${r.empName}) rejected.`, 'error');
  }

  handleCompChangeAction(r: RequestItem, e: Event) {
    e.stopPropagation();
    this.compChangeActionId = this.compChangeActionId === r.id ? null : r.id;
  }

  handleCompTriggerChange(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (r.status === 'Approved') {
      this.compCaRejectActive = true;
    } else {
      this.handleCompApprove(r, e);
      this.compChangeActionId = null;
    }
  }

  updateCompCaRejectText(val: string) {
    this.compCaRejectText = val;
    if (val) this.compCaRejectErr = false;
  }

  handleCompCARejectConfirm(r: RequestItem, e: Event) {
    e.stopPropagation();
    if (!this.compCaRejectText.trim()) { this.compCaRejectErr = true; return; }
    this.compRequests = this.compRequests.map(x => x.id === r.id ? { ...x, status: 'Rejected', remarks: this.compCaRejectText.trim() } : x);
    this.toastService.addToast(`Compensation ${r.id} changed to Rejected.`, 'error');
    this.compCaRejectActive = false;
    this.compCaRejectText = '';
    this.compCaRejectErr = false;
  }

  closeAll() {
    this.leaveRejectId = null; this.leaveRejectText = ''; this.leaveRejectErr = false;
    this.leaveChangeActionId = null; this.leaveCaRejectActive = false; this.leaveCaRejectText = ''; this.leaveCaRejectErr = false;

    this.compRejectId = null; this.compRejectText = ''; this.compRejectErr = false;
    this.compChangeActionId = null; this.compCaRejectActive = false; this.compCaRejectText = ''; this.compCaRejectErr = false;
  }

  goBack() {
    window.history.back();
  }

  get attachmentArray(): any[] {
    if (!this.attachModal) return [];
    return Array.from({ length: this.attachModal.attachments });
  }
}
