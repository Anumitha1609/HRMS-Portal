import { Component, OnInit, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-employee-print',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee-print.component.html',
  styleUrls: ['./employee-print.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EmployeePrintComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);

  employee = signal<any | null>(null);
  isLoading = signal<boolean>(true);
  generatedAt = new Date();

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeService.getById(id).subscribe({
        next: (emp) => {
          this.employee.set(emp);
          this.isLoading.set(false);
          
          // Trigger print dialog automatically once rendering completes
          setTimeout(() => {
            window.print();
            window.onafterprint = () => {
              window.close();
            };
          }, 800);
        },
        error: () => {
          this.toastService.error('Failed to load employee details for printing.');
          this.isLoading.set(false);
        }
      });
    }
  }

  calculateAge(dob: string): number {
    if (!dob) return 0;
    const birthday = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  }

  calculateServiceYears(joiningDate: string, dateOfRelieving?: string): string {
    if (!joiningDate) return 'N/A';
    const start = new Date(joiningDate);
    const end = dateOfRelieving ? new Date(dateOfRelieving) : new Date();
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years} Year(s)`);
    if (months > 0) parts.push(`${months} Month(s)`);
    if (days > 0 && years === 0) parts.push(`${days} Day(s)`);
    
    return parts.length > 0 ? parts.join(' ') : '0 Days';
  }

  getNomineeTotalShare(): number {
    const emp = this.employee();
    if (!emp || !emp.nomineeDetails) return 0;
    return emp.nomineeDetails.reduce((sum: number, nom: any) => sum + (nom.sharePercentage || 0), 0);
  }

  getSalaryCTC(): number {
    const emp = this.employee();
    if (!emp) return 0;
    if (emp.ctcId) {
      if (emp.overrideFlag && emp.customSalaryComponents) {
        const comps = this.getPrintComponents();
        return comps.reduce((sum: number, c: any) => sum + (c.annualAmount || 0), 0);
      }
      if (emp.ctc) {
        return emp.ctc.annualCTC || 0;
      }
    }
    if (!emp.salaryBreakups) return 0;
    return emp.salaryBreakups.reduce((sum: number, sal: any) => sum + (sal.amount || 0), 0) * 12;
  }

  getPrintComponents(): any[] {
    const emp = this.employee();
    if (!emp) return [];
    if (emp.ctcId) {
      if (emp.overrideFlag && emp.customSalaryComponents) {
        try {
          return typeof emp.customSalaryComponents === 'string' ? JSON.parse(emp.customSalaryComponents) : emp.customSalaryComponents;
        } catch (e) {}
      }
      if (emp.ctc) {
        try {
          return emp.ctc.salaryComponents ? (typeof emp.ctc.salaryComponents === 'string' ? JSON.parse(emp.ctc.salaryComponents) : emp.ctc.salaryComponents) : [];
        } catch (e) {
          const annualCTC = emp.ctc.annualCTC || 0;
          const monthlyCTC = annualCTC / 12;
          return [
            { salaryHead: 'Basic', calculationType: 'Percentage of CTC', value: 50, formula: 'CTC * 50%', monthlyAmount: monthlyCTC * 0.5, annualAmount: annualCTC * 0.5 },
            { salaryHead: 'HRA', calculationType: 'Percentage of Basic', value: 40, formula: 'Basic * 40%', monthlyAmount: monthlyCTC * 0.2, annualAmount: annualCTC * 0.2 },
            { salaryHead: 'CA', calculationType: 'Fixed Amount', value: 1600, formula: 'Fixed: ₹1600', monthlyAmount: 1600, annualAmount: 19200 },
            { salaryHead: 'Others', calculationType: 'Remaining Balance', value: 0, formula: 'CTC - Sum(Others)', monthlyAmount: Math.max(0, monthlyCTC - (monthlyCTC * 0.7 + 1600)), annualAmount: Math.max(0, annualCTC - (annualCTC * 0.7 + 19200)) }
          ];
        }
      }
    }
    return [];
  }

  getComponentAmount(headName: string, monthly: boolean = true): number {
    const comps = this.getPrintComponents();
    const match = comps.find(c => c.salaryHead.toLowerCase() === headName.toLowerCase());
    if (!match) return 0;
    return monthly ? match.monthlyAmount : match.annualAmount;
  }
}
