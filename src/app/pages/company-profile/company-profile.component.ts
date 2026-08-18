import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

interface CompanyProfile {
  id: number;
  companyName: string;
  shortName: string;
  logoUrl: string | null;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pinCode: string;
  telephone: string;
  mobile: string;
  fax: string;
  email: string;
  website: string;
  approved: boolean;
}

const EMPTY_PROFILE: Omit<CompanyProfile, 'id'> = {
  companyName: '', shortName: '', logoUrl: null,
  addressLine1: '', addressLine2: '', addressLine3: '', addressLine4: '',
  city: '', district: '', state: '', country: 'India', pinCode: '',
  telephone: '', mobile: '', fax: '', email: '', website: '', approved: false
};

const INIT_PROFILES: CompanyProfile[] = [
  {
    id: 1,
    companyName: 'Easy Design Systems',
    shortName: 'EDS',
    logoUrl: null,
    addressLine1: '8, V.I.P. Nagar',
    addressLine2: 'Civil Aerodrome Post',
    addressLine3: 'Goldwins',
    addressLine4: 'Near Coimbatore Airport',
    city: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    pinCode: '641014',
    telephone: '0422-4201234',
    mobile: '9876543210',
    fax: '0422-4205678',
    email: 'sales@easydesignsystems.com',
    website: 'www.easydesignsystems.com',
    approved: true
  },
  {
    id: 2,
    companyName: 'Easy Design Systems',
    shortName: 'EDS-CHN',
    logoUrl: null,
    addressLine1: '12, Anna Salai',
    addressLine2: 'Teynampet',
    addressLine3: '',
    addressLine4: 'Near Chennai Metro',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    pinCode: '600018',
    telephone: '044-4301234',
    mobile: '9876500011',
    fax: '',
    email: 'chennai@easydesignsystems.com',
    website: 'www.easydesignsystems.com',
    approved: true
  },
  {
    id: 3,
    companyName: 'Easy Design Systems',
    shortName: 'EDS-BLR',
    logoUrl: null,
    addressLine1: '45, MG Road',
    addressLine2: 'Ashok Nagar',
    addressLine3: '',
    addressLine4: 'Near Trinity Metro',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    country: 'India',
    pinCode: '560001',
    telephone: '080-4501234',
    mobile: '9876500022',
    fax: '',
    email: 'bengaluru@easydesignsystems.com',
    website: 'www.easydesignsystems.com',
    approved: false
  }
];

const STATES = [
  'Tamil Nadu', 'Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra',
  'Telangana', 'Delhi', 'Gujarat', 'West Bengal', 'Punjab'
];

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore'];

const PAGE_SIZE = 10;

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './company-profile.component.html',
  styleUrls: ['./company-profile.component.scss']
})
export class CompanyProfileComponent implements OnInit {
  @ViewChild('gridSearchInput') gridSearchInput?: ElementRef<HTMLInputElement>;

  profiles: CompanyProfile[] = [...INIT_PROFILES];

  form: Omit<CompanyProfile, 'id'> & { id: number | null } = { id: null, ...EMPTY_PROFILE };
  editMode = false;
  selectedId: number | null = null;

  searchTerm = '';
  page = 1;

  states = STATES;
  countries = COUNTRIES;

  constructor(private toastService: ToastService) {}

  ngOnInit() {}

  get filteredProfiles(): CompanyProfile[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.profiles;
    return this.profiles.filter(p =>
      p.companyName.toLowerCase().includes(term) ||
      p.shortName.toLowerCase().includes(term) ||
      p.city.toLowerCase().includes(term) ||
      p.state.toLowerCase().includes(term) ||
      p.mobile.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProfiles.length / PAGE_SIZE));
  }

  get currentPage(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pageRows(): CompanyProfile[] {
    const start = (this.currentPage - 1) * PAGE_SIZE;
    return this.filteredProfiles.slice(start, start + PAGE_SIZE);
  }

  get startEntry(): number {
    return this.filteredProfiles.length === 0 ? 0 : (this.currentPage - 1) * PAGE_SIZE + 1;
  }

  get endEntry(): number {
    return Math.min(this.currentPage * PAGE_SIZE, this.filteredProfiles.length);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3) return [1, 2, 3, 4, '…', total];
    if (cur >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
    return [1, '…', cur, '…', total];
  }

  setPage(p: number | string) {
    if (typeof p === 'number') this.page = p;
  }

  prevPage() {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage() {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  onSearchChange(val: string) {
    this.searchTerm = val;
    this.page = 1;
  }

  focusGridSearch() {
    this.gridSearchInput?.nativeElement.focus();
  }

  selectRow(p: CompanyProfile) {
    this.selectedId = p.id;
  }

  onNew() {
    this.selectedId = null;
    this.form = { id: null, ...EMPTY_PROFILE };
    this.editMode = true;
  }

  onEdit() {
    if (this.selectedId === null) {
      this.toastService.addToast('Select a company profile from the list to edit.', 'warning');
      return;
    }
    const selected = this.profiles.find(p => p.id === this.selectedId);
    this.form = selected ? { ...selected } : { id: null, ...EMPTY_PROFILE };
    this.editMode = true;
  }

  editRow(p: CompanyProfile) {
    this.selectedId = p.id;
    this.form = { ...p };
    this.editMode = true;
  }

  deleteRow(p: CompanyProfile) {
    this.selectedId = p.id;
    this.onDelete();
  }

  onDelete() {
    if (this.selectedId === null) {
      this.toastService.addToast('Select a company profile from the list to delete.', 'warning');
      return;
    }
    const profile = this.profiles.find(p => p.id === this.selectedId);
    this.profiles = this.profiles.filter(p => p.id !== this.selectedId);
    this.toastService.addToast(`Company profile "${profile?.shortName}" deleted.`, 'error');
    this.selectedId = null;
  }

  onSave() {
    if (!this.form.companyName || !this.form.shortName) {
      this.toastService.addToast('Company Name and Short Name are required.', 'error');
      return;
    }
    if (!this.form.addressLine1 || !this.form.city || !this.form.district || !this.form.state || !this.form.country || !this.form.pinCode) {
      this.toastService.addToast('Please fill all required address fields.', 'error');
      return;
    }
    if (!this.form.mobile || !this.form.email) {
      this.toastService.addToast('Mobile and Email are required.', 'error');
      return;
    }

    if (this.form.id === null) {
      const newId = this.profiles.length > 0 ? Math.max(...this.profiles.map(p => p.id)) + 1 : 1;
      const newProfile: CompanyProfile = { ...(this.form as Omit<CompanyProfile, 'id'>), id: newId };
      this.profiles = [...this.profiles, newProfile];
      this.selectedId = newId;
      this.toastService.addToast(`Company profile "${newProfile.shortName}" added.`, 'success');
    } else {
      this.profiles = this.profiles.map(p => p.id === this.form.id ? { ...(this.form as CompanyProfile) } : p);
      this.toastService.addToast(`Company profile "${this.form.shortName}" updated.`, 'success');
    }
    this.editMode = false;
  }

  onCancel() {
    this.form = { id: null, ...EMPTY_PROFILE };
    this.editMode = false;
  }

  onPrint() {
    window.print();
  }

  onExit() {
    this.toastService.addToast('Exited Company Profile.', 'success');
  }

  onLogoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.addToast('Logo must be under 2 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.form.logoUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onLogoRemove() {
    this.form.logoUrl = null;
  }
}
