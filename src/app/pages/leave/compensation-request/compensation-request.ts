import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api';

type RequestStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Comp-Off Earned';

interface HistoryRecord {
  id: string;
  holidayDate: string;
  day: string;
  reason: string;
  project: string;
  approver: string;
  status: RequestStatus;
  workedHours: string;
  compOffEarned: string;
  requestedOn: string;
}

@Component({
  selector: 'app-compensation-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './compensation-request.html',
  styleUrl: './compensation-request.scss'
})
export class CompensationRequest {
  showModal = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  activeTab: RequestStatus | 'All' = 'All';
  tabs: (RequestStatus | 'All')[] = ['Pending Approval', 'Approved', 'Rejected', 'Comp-Off Earned', 'All'];

  projects = ['Production Support', 'Deployment Activity', 'System Maintenance', 'Client Support', 'Infrastructure Activity'];
  approvers = ['Rahul Sharma (Team Lead)', 'Ravi Kumar (Reporting Manager)', 'Priya Menon (Project Manager)'];

  history: HistoryRecord[] = [
    { id: '1', holidayDate: '25-May-2026', day: 'Sunday', reason: 'Production support deployment', project: 'Deployment Activity', approver: 'Rahul Sharma', status: 'Pending Approval', workedHours: '—', compOffEarned: '—', requestedOn: '24-May-2026' },
    { id: '2', holidayDate: '18-May-2026', day: 'Sunday', reason: 'System maintenance', project: 'Infrastructure Activity', approver: 'Rahul Sharma', status: 'Approved', workedHours: '8h 15m', compOffEarned: '1.0 Day', requestedOn: '17-May-2026' },
    { id: '3', holidayDate: '04-May-2026', day: 'Sunday', reason: 'Client issue support', project: 'Client Support', approver: 'Ravi Kumar', status: 'Approved', workedHours: '5h 00m', compOffEarned: '0.5 Day', requestedOn: '03-May-2026' },
    { id: '4', holidayDate: '27-Apr-2026', day: 'Sunday', reason: 'Release deployment', project: 'Deployment Activity', approver: 'Priya Menon', status: 'Rejected', workedHours: '—', compOffEarned: '—', requestedOn: '26-Apr-2026' },
  ];

  requestForm: FormGroup;

  private successToastTimer: any = null;

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.requestForm = this.fb.group({
      date: ['', Validators.required],
      reason: ['', Validators.required],
      project: ['', Validators.required],
      approver: ['', Validators.required],
    });
  }

  get filteredHistory(): HistoryRecord[] {
    if (this.activeTab === 'All') return this.history;
    return this.history.filter(r => r.status === this.activeTab);
  }

  countFor(tab: RequestStatus | 'All'): number {
    return tab === 'All' ? this.history.length : this.history.filter(r => r.status === tab).length;
  }

  openModal() {
    this.showModal = true;
    this.requestForm.reset();
    this.errorMessage = '';
  }

  closeModal() {
    // Don't allow the modal to be dismissed mid-submit — avoids an
    // orphaned in-flight request and a stuck disabled button on reopen.
    if (this.isSubmitting) return;
    this.showModal = false;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Pending Approval': 'status-pending',
      'Approved': 'status-approved',
      'Rejected': 'status-rejected',
      'Comp-Off Earned': 'status-earned'
    };
    return map[status] || '';
  }

  async onSubmit() {
    // Guard against duplicate submissions (double-click / Enter spam)
    // and against submitting an invalid form.
    if (this.isSubmitting) return;
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      // apiService.submitCompensationRequest may be Promise- or
      // Observable-based depending on ApiService's implementation.
      // Wrapping in Promise.resolve() ensures we always get a real
      // thenable to await, so the loader can never hang on a bare
      // Observable reference that never resolves via `await`.
      const call = this.apiService.submitCompensationRequest(this.requestForm.value);
      const result: any = await Promise.resolve(call);

      const v = this.requestForm.value;
      this.history.unshift({
        id: result?.referenceNumber ?? `TMP-${Date.now()}`,
        holidayDate: v.date,
        day: new Date(v.date).toLocaleDateString('en-GB', { weekday: 'long' }),
        reason: v.reason,
        project: v.project,
        approver: v.approver,
        status: 'Pending Approval',
        workedHours: '—',
        compOffEarned: '—',
        requestedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      });

      this.requestForm.reset();
      this.closeModalForced();
      this.showSuccessToast('Work request submitted successfully.');
    } catch (err: any) {
      this.errorMessage = err?.message || 'Failed to submit request. Please try again.';
    } finally {
      // Guaranteed to run whether the call resolved or rejected,
      // so the loader/button can never get stuck.
      this.isSubmitting = false;
    }
  }

  private closeModalForced() {
    this.showModal = false;
  }

  private showSuccessToast(message: string) {
    this.successMessage = message;
    if (this.successToastTimer) {
      clearTimeout(this.successToastTimer);
    }
    this.successToastTimer = setTimeout(() => {
      this.successMessage = '';
      this.successToastTimer = null;
    }, 3000);
  }
}