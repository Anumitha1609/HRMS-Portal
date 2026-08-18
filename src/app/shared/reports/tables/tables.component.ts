import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableHeader {
  field: string;
  label: string;
}

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent {
  @Input() title = 'Report Details';
  @Input() headers: TableHeader[] = [];
  @Input() data: any[] = [];
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() sortKey = '';
  @Input() sortDir = 'asc';
  @Input() searchPlaceholder = 'Search report content...';
  @Input() showSearch = true;
  @Input() selectedRow: any = null;
  @Input() reportId = '';
  @Input() monthlyLimit = 3;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() search = new EventEmitter<string>();
  @Output() sort = new EventEmitter<string>();
  @Output() rowSelect = new EventEmitter<any>();

  searchText = '';

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize) || 1;
  }

  get showingStart(): number {
    if (this.total === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSearchChange() {
    this.search.emit(this.searchText);
  }

  onSort(field: string) {
    this.sort.emit(field);
  }

  onPageSelect(p: number) {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.pageChange.emit(p);
  }

  onPageSizeSelect(event: Event) {
    const size = Number((event.target as HTMLSelectElement).value);
    this.pageSizeChange.emit(size);
  }

  onRowClick(row: any) {
    this.rowSelect.emit(row);
  }

  isRowSelected(row: any): boolean {
    if (!this.selectedRow) return false;
    // Check key fields: reqNo, id, chequeNumber, department, unit
    const key = this.selectedRow.reqNo || this.selectedRow.id || this.selectedRow.chequeNumber || this.selectedRow.department || this.selectedRow.unit;
    const rowKey = row.reqNo || row.id || row.chequeNumber || row.department || row.unit;
    return key && rowKey && key === rowKey;
  }

  // Format utility to print column values cleanly (handles numbers, currency, dates, statuses)
  formatValue(value: any, field: string): string {
    if (value === undefined || value === null) return '';
    
    // Check currency columns
    if (['rate', 'gross', 'deductions', 'net', 'earnings', 'netValue', 'salary', 'bonus', 'incentives', 'insurance', 'total', 'advanceAmount', 'recoveryAmount', 'balance', 'amount', 'eligibleAmt', 'approvedAmt', 'prevSalary', 'revSalary', 'incrementAmount', 'revisionAmount', 'propSalary'].includes(field)) {
      if (typeof value === 'number') {
        return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    
    // Check percentage
    if (['incPercent', 'incrementPercent', 'incPercentCumulative'].includes(field)) {
      if (typeof value === 'number') {
        return value.toFixed(1) + '%';
      }
    }
    
    return String(value);
  }

  getStatusClass(status: string, field: string): string {
    if (field !== 'status' && field !== 'eligible' && field !== 'approvalStatus') return '';
    const s = String(status).toLowerCase();
    
    if (this.reportId === 'leaveavail') {
      if (s === 'within limit') {
        return 'bg-green-50 text-green-700 border border-green-200/50';
      }
      if (s === 'monthly limit reached') {
        return 'bg-amber-50 text-amber-600 border border-amber-200/50';
      }
      if (s === 'yearly limit reached') {
        return 'bg-red-50 text-red-600 border border-red-200/50';
      }
      if (s.includes('exceeded')) {
        return 'bg-red-100 text-red-800 border border-red-300';
      }
    }

    if (['approved', 'released', 'success', 'cleared', 'eligible', 'present', 'without leave'].includes(s)) {
      return 'bg-enterprise-success-bg text-enterprise-success-text';
    }
    if (['pending', 'recovering', 'submitted', 'draft', 'leave applied', 'half day'].includes(s)) {
      return 'bg-enterprise-pending-bg text-enterprise-pending-text';
    }
    if (['rejected', 'inactive', 'bounced', 'not eligible', 'absent'].includes(s)) {
      return 'bg-enterprise-rejected-bg text-enterprise-rejected-text';
    }
    return 'bg-slate-100 text-slate-700';
  }

  isRowExceeded(row: any): boolean {
    if (this.reportId !== 'leaveavail') return false;
    return (row.monthlyDays || 0) > this.monthlyLimit || (row.yearlyDays || 0) > (this.monthlyLimit * 12);
  }

  isCellExceeded(row: any, field: string): boolean {
    if (this.reportId !== 'leaveavail') return false;
    if (field.startsWith('monthly')) return (row.monthlyDays || 0) > this.monthlyLimit;
    if (field.startsWith('yearly')) return (row.yearlyDays || 0) > (this.monthlyLimit * 12);
    return false;
  }
}
