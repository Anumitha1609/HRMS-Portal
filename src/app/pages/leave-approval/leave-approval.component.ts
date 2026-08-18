import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { SearchService } from '../../services/search.service';
import { LucideAngularModule } from 'lucide-angular';

interface LeaveRequest {
  id: string;
  empCode: string;
  empName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks: string;
  attachments: number;
}

interface AttachmentModal {
  id: string;
  empName: string;
  count: number;
}

const PAGE_SIZE = 5;

const INIT_REQUESTS: LeaveRequest[] = [
  { id: 'LR001', empCode: 'EMP001', empName: 'Pramod Kumar O',   leaveType: 'Casual Leave',    fromDate: '15-07-2026', toDate: '17-06-2026', days: 3.0,  reason: 'Family Function',          status: 'Pending',  remarks: '', attachments: 1 },
  { id: 'LR002', empCode: 'EMP002', empName: 'Priya Sharma',     leaveType: 'Sick Leave',       fromDate: '18-07-2026', toDate: '18-06-2026', days: 1.0,  reason: 'Not feeling well',         status: 'Pending',  remarks: '', attachments: 2 },
  { id: 'LR003', empCode: 'EMP003', empName: 'Ravi Kumar',       leaveType: 'Earned Leave',     fromDate: '20-06-2026', toDate: '22-06-2026', days: 3.0,  reason: 'Vacation',                 status: 'Approved', remarks: 'Approved by manager', attachments: 1 },
  { id: 'LR004', empCode: 'EMP004', empName: 'Karthik R',        leaveType: 'Maternity Leave',  fromDate: '01-07-2026', toDate: '28-09-2026', days: 90.0, reason: 'Maternity leave',          status: 'Pending',  remarks: '', attachments: 1 },
  { id: 'LR005', empCode: 'EMP005', empName: 'Anjali Menon',     leaveType: 'Casual Leave',     fromDate: '25-07-2026', toDate: '26-06-2026', days: 2.0,  reason: 'Personal work',            status: 'Pending',  remarks: '', attachments: 0 },
  { id: 'LR006', empCode: 'EMP006', empName: 'Lakshmi Narayan',  leaveType: 'Sick Leave',       fromDate: '23-06-2026', toDate: '23-06-2026', days: 1.0,  reason: 'Fever',                    status: 'Rejected', remarks: 'Insufficient balance', attachments: 1 },
  { id: 'LR007', empCode: 'EMP007', empName: 'Pravin M',         leaveType: 'Earned Leave',     fromDate: '30-06-2026', toDate: '04-07-2026', days: 5.0,  reason: 'Annual vacation',          status: 'Pending',  remarks: '', attachments: 2 },
  { id: 'LR008', empCode: 'EMP008', empName: 'Ponnaj K',         leaveType: 'Casual Leave',     fromDate: '28-07-2026', toDate: '28-06-2026', days: 1.0,  reason: 'Personal errand',          status: 'Pending',  remarks: '', attachments: 0 },
];

@Component({
  selector: 'app-leave-approval',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './leave-approval.component.html',
  styleUrls: ['./leave-approval.component.scss']
})
export class LeaveApprovalComponent implements OnInit {
  requests: LeaveRequest[] = [...INIT_REQUESTS];
  page = 1;
  rejectId: string | null = null;
  rejectText = '';
  rejectErr = false;
  attachModal: AttachmentModal | null = null;

  STATUS_COLOR: Record<string, string> = { Approved: '#16a34a', Rejected: '#dc2626', Pending: '#d97706' };
  STATUS_BG: Record<string, string> = { Approved: '#dcfce7', Rejected: '#fee2e2', Pending: '#fef3c7' };

  constructor(private toastService: ToastService, public searchService: SearchService) {}

  ngOnInit() {}

  get sortedRows(): LeaveRequest[] {
    return [...this.requests]
      .filter(r => this.searchService.matches(r))
      .sort((a, b) => {
        const order: Record<string, number> = { Pending: 0, Approved: 1, Rejected: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedRows.length / PAGE_SIZE));
  }

  get currentPage(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pageRows(): LeaveRequest[] {
    const start = (this.currentPage - 1) * PAGE_SIZE;
    return this.sortedRows.slice(start, start + PAGE_SIZE);
  }

  get startEntry(): number {
    return this.sortedRows.length === 0 ? 0 : (this.currentPage - 1) * PAGE_SIZE + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * PAGE_SIZE, this.sortedRows.length);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur, '…', total];
  }

  handleApprove(r: LeaveRequest, e: Event) {
    e.stopPropagation();
    if (r.status === 'Approved') {
      this.toastService.addToast('Already approved.', 'error');
      return;
    }
    this.requests = this.requests.map(x => x.id === r.id ? { ...x, status: 'Approved', remarks: 'Approved' } : x);
    if (this.rejectId === r.id) {
      this.rejectId = null;
      this.rejectText = '';
    }
    this.toastService.addToast(`Leave ${r.id} (${r.empName}) approved. Balance updated.`, 'success');
  }

  handleRejectClick(r: LeaveRequest, e: Event) {
    e.stopPropagation();
    if (r.status === 'Rejected') {
      this.toastService.addToast('Already rejected.', 'error');
      return;
    }
    if (this.rejectId === r.id) {
      this.rejectId = null;
      this.rejectText = '';
      this.rejectErr = false;
      return;
    }
    this.rejectId = r.id;
    this.rejectText = '';
    this.rejectErr = false;
  }

  updateRejectText(val: string) {
    this.rejectText = val;
    if (val) this.rejectErr = false;
  }

  handleRejectConfirm(r: LeaveRequest, e: Event) {
    e.stopPropagation();
    if (!this.rejectText.trim()) {
      this.rejectErr = true;
      return;
    }
    this.requests = this.requests.map(x => x.id === r.id ? { ...x, status: 'Rejected', remarks: this.rejectText.trim() } : x);
    this.rejectId = null;
    this.rejectText = '';
    this.rejectErr = false;
    this.toastService.addToast(`Leave ${r.id} (${r.empName}) rejected.`, 'error');
  }

  setPage(p: number | string) {
    if (typeof p === 'number') {
      this.page = p;
    }
  }

  prevPage() {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage() {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  goBack() {
    window.history.back();
  }

  get attachmentArray(): any[] {
    if (!this.attachModal) return [];
    return Array.from({ length: this.attachModal.count });
  }
}
