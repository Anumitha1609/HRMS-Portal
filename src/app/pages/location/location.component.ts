import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService, MasterRecord } from '../../services/master.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LocationSearchComponent } from '../../components/location-search/location-search.component';
import { MapPickerComponent } from '../../components/map-picker/map-picker.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    LocationSearchComponent, 
    MapPickerComponent
  ],
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  masterService = inject(MasterService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);

  constructor() {
    effect(() => {
      const selected = this.selectedRecord();
      const editing = this.isEditing();
      const loading = this.isLoading();
      
      if (!selected && !editing && !loading) {
        this.initDashboardMap();
      }
    });
  }

  // States
  records = signal<MasterRecord[]>([]);
  filteredRecords = signal<MasterRecord[]>([]);
  selectedRecord = signal<MasterRecord | null>(null);
  isEditing = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  
  // Search Form
  searchQuery = signal<string>('');

  // Dashboard Map elements
  private dashboardMap: L.Map | null = null;
  private dashboardMarkers: Map<string, L.Marker> = new Map();
  selectedListRecordId: string | null = null;

  // Form Group
  locationForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    latitude: [null, [Validators.required]],
    longitude: [null, [Validators.required]],
    address: ['', [Validators.required]],
    city: [''],
    state: [''],
    country: [''],
    pinCode: [''],
    timezone: ['']
  });

  ngOnInit() {
    this.loadRecords();
    this.locationForm.disable();
  }

  ngOnDestroy() {
    this.destroyDashboardMap();
  }

  loadRecords() {
    this.isLoading.set(true);
    this.masterService.getMasters('location').subscribe({
      next: (data) => {
        this.records.set(data);
        this.filterRecords();
        this.isLoading.set(false);
        if (!this.selectedRecord() && !this.isEditing()) {
          this.initDashboardMap();
        }
      },
      error: (err) => {
        this.toastService.error('Failed to load locations: ' + (err.error?.error || err.message));
        this.isLoading.set(false);
      }
    });
  }

  filterRecords() {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredRecords.set(this.records());
    } else {
      this.filteredRecords.set(
        this.records().filter(r => r.name.toLowerCase().includes(query))
      );
    }
    // Re-render map markers when filter changes
    if (!this.selectedRecord() && !this.isEditing()) {
      this.initDashboardMap();
    }
  }

  onSearchChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.filterRecords();
  }

  selectRecord(record: MasterRecord) {
    if (this.isEditing()) {
      if (!confirm('You have unsaved changes. Discard and proceed?')) {
        return;
      }
    }
    this.destroyDashboardMap();
    this.selectedRecord.set(record);
    this.locationForm.patchValue({ 
      name: record.name,
      latitude: record.latitude,
      longitude: record.longitude,
      address: record.address || '',
      city: record.city || '',
      state: record.state || '',
      country: record.country || '',
      pinCode: record.pinCode || '',
      timezone: record.timezone || ''
    });
    this.isEditing.set(false);
    this.locationForm.disable();
  }

  editRecord(record: MasterRecord) {
    if (this.isEditing()) {
      if (!confirm('You have unsaved changes. Discard and proceed?')) {
        return;
      }
    }
    this.destroyDashboardMap();
    this.selectedRecord.set(record);
    this.locationForm.patchValue({ 
      name: record.name,
      latitude: record.latitude,
      longitude: record.longitude,
      address: record.address || '',
      city: record.city || '',
      state: record.state || '',
      country: record.country || '',
      pinCode: record.pinCode || '',
      timezone: record.timezone || ''
    });
    this.isEditing.set(true);
    this.locationForm.enable();
  }

  onNew() {
    this.destroyDashboardMap();
    this.selectedRecord.set(null);
    this.locationForm.reset();
    this.isEditing.set(true);
    this.locationForm.enable();
  }

  onEdit() {
    const selected = this.selectedRecord();
    if (!selected) return;
    this.isEditing.set(true);
    this.locationForm.enable();
  }

  onCancel() {
    this.isEditing.set(false);
    this.locationForm.disable();
    const selected = this.selectedRecord();
    if (selected) {
      this.locationForm.patchValue({ 
        name: selected.name,
        latitude: selected.latitude,
        longitude: selected.longitude,
        address: selected.address || '',
        city: selected.city || '',
        state: selected.state || '',
        country: selected.country || '',
        pinCode: selected.pinCode || '',
        timezone: selected.timezone || ''
      });
    } else {
      this.locationForm.reset();
    }
    this.loadRecords();
  }

  onLocationSelected(sug: any) {
    this.updateFormAndMap(sug);
  }

  onManualNameChange(name: string) {
    this.subLocationFormPatchName(name);
  }

  private subLocationFormPatchName(name: string) {
    this.locationForm.patchValue({ name }, { emitEvent: false });
  }

  onCoordinatesChanged(coords: { lat: number; lng: number }) {
    this.masterService.reverseGeocode(coords.lat, coords.lng).subscribe({
      next: (res) => {
        this.updateFormAndMap(res);
      },
      error: (err) => {
        this.toastService.error('Failed to retrieve address details for the selected coordinates.');
      }
    });
  }

  private updateFormAndMap(data: any) {
    this.locationForm.patchValue({
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pinCode: data.pinCode,
      timezone: data.timezone || 'Asia/Kolkata'
    });
  }

  onSave() {
    const { name, latitude, longitude, address } = this.locationForm.value;

    if (!name || !name.trim()) {
      this.locationForm.get('name')?.markAsTouched();
      this.toastService.warning('Location Name is mandatory.');
      return;
    }

    // Geocoding fallback: If user typed location name but has no coords/address selected
    if (latitude === null || longitude === null || !address) {
      this.masterService.geocode(name).subscribe({
        next: (results) => {
          if (results && results.length > 0) {
            this.updateFormAndMap(results[0]);
            this.saveRecord();
          } else {
            this.toastService.error('Unable to identify the selected location. Please choose a valid location from the suggestions or map.');
          }
        },
        error: () => {
          this.toastService.error('Unable to identify the selected location. Please choose a valid location from the suggestions or map.');
        }
      });
    } else {
      this.saveRecord();
    }
  }

  private saveRecord() {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const { name, latitude, longitude, address, city, state, country, pinCode, timezone } = this.locationForm.value;
    const selected = this.selectedRecord();

    const extraData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      city,
      state,
      country,
      pinCode,
      timezone
    };

    // Client-side duplicate detection
    const isDuplicate = this.records().some(r => 
      r.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      r.latitude === extraData.latitude &&
      r.longitude === extraData.longitude &&
      (!selected || r.id !== selected.id)
    );

    if (isDuplicate) {
      this.toastService.error('This location already exists.');
      return;
    }

    if (selected) {
      // Update
      this.masterService.updateMaster('location', selected.id, name, extraData).subscribe({
        next: (updated) => {
          this.toastService.success('Location updated successfully!');
          this.selectedRecord.set(updated);
          this.isEditing.set(false);
          this.locationForm.disable();
          this.loadRecords();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to update location');
        }
      });
    } else {
      // Create
      this.masterService.createMaster('location', name, extraData).subscribe({
        next: (created) => {
          this.toastService.success('Location created successfully!');
          this.selectedRecord.set(created);
          this.isEditing.set(false);
          this.locationForm.disable();
          this.loadRecords();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to create location');
        }
      });
    }
  }

  onDelete(record: MasterRecord) {
    const hasEmployees = !!record.employeeCount && record.employeeCount > 0;
    const confirmMessage = hasEmployees
      ? `Warning: "${record.name}" still has ${record.employeeCount} employee(s) assigned to it. Deleting it will leave those employee records pointing at a missing location. Are you sure you want to continue?`
      : `Are you sure you want to soft-delete the location "${record.name}"?`;

    if (confirm(confirmMessage)) {
      this.masterService.deleteMaster('location', record.id).subscribe({
        next: () => {
          this.toastService.success('Location deleted successfully!');
          this.selectedRecord.set(null);
          this.locationForm.reset();
          this.isEditing.set(false);
          this.locationForm.disable();
          this.loadRecords();
        },
        error: (err) => {
          this.toastService.error(err.error?.error || 'Failed to delete location');
        }
      });
    }
  }

  // --- Dashboard Map Logic ---
  private initDashboardMap() {
    setTimeout(() => {
      const container = document.getElementById('dashboard-map');
      if (!container) return;

      this.destroyDashboardMap();

      const validLocations = this.filteredRecords().filter(r => r.latitude !== null && r.longitude !== null);
      
      // Default center to Bangalore, India if no locations exist
      const centerLat = validLocations.length > 0 ? validLocations[0].latitude! : 12.9716;
      const centerLng = validLocations.length > 0 ? validLocations[0].longitude! : 77.5946;

      this.dashboardMap = L.map('dashboard-map').setView([centerLat, centerLng], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.dashboardMap);

      validLocations.forEach(loc => {
        const initials = this.getInitials(loc.name);
        const customIcon = L.divIcon({
          className: 'custom-map-marker-wrapper',
          html: `<div class="custom-map-marker"><div class="marker-badge">${initials}</div><div class="marker-arrow"></div></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 38],
          popupAnchor: [0, -38]
        });

        const marker = L.marker([loc.latitude!, loc.longitude!], { icon: customIcon })
          .addTo(this.dashboardMap!)
          .bindPopup(`
            <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 150px;">
              <h4 style="margin: 0 0 4px 0; color: #1e293b; font-size: 13px; font-weight: 600;">${loc.name}</h4>
              <p style="margin: 0; color: #64748b; font-size: 11px; line-height: 1.4;">${loc.address || 'No address details'}</p>
              <p style="margin: 6px 0 0 0; color: #2563EB; font-size: 11px; font-weight: 600;">${loc.employeeCount || 0} active employee(s)</p>
            </div>
          `);

        this.dashboardMarkers.set(loc.id, marker);
      });

      if (validLocations.length > 1) {
        const group = L.featureGroup(Array.from(this.dashboardMarkers.values()));
        this.dashboardMap.fitBounds(group.getBounds().pad(0.1));
      }

      // Force Leaflet to recalculate container size
      this.dashboardMap.invalidateSize();
    }, 100);
  }

  private destroyDashboardMap() {
    if (this.dashboardMap) {
      this.dashboardMap.remove();
      this.dashboardMap = null;
      this.dashboardMarkers.clear();
    }
  }

  trackLocation(record: MasterRecord) {
    this.selectedListRecordId = record.id;
    if (record.latitude !== undefined && record.latitude !== null && record.longitude !== undefined && record.longitude !== null && this.dashboardMap) {
      this.dashboardMap.setView([record.latitude!, record.longitude!], 15);
      const marker = this.dashboardMarkers.get(record.id);
      if (marker) {
        marker.openPopup();
      }
    } else {
      this.toastService.warning(`No coordinates configured for location "${record.name}". Edit the location to set coordinates.`);
    }
  }

  getInitials(name: string): string {
    if (!name) return 'LO';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
