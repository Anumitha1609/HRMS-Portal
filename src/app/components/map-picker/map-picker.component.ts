import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="position: relative; width: 100%; height: 100%;">
      <div id="map-picker-canvas" style="height: 550px; width: 100%; border-radius: 12px; border: 1px solid #cbd5e1; z-index: 1;"></div>
      
      <!-- Current Location Button -->
      <button 
        *ngIf="isEditing"
        type="button" 
        (click)="getCurrentLocation()" 
        class="map-btn"
        title="Use Current Location"
        style="position: absolute; bottom: 20px; right: 20px; z-index: 1000; background: white; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #1e293b; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
      >
        <span class="material-icons" style="font-size: 16px; color: #2563EB;">my_location</span>
        Current Location
      </button>
    </div>
  `,
  styles: [`
    ::ng-deep {
      .edit-map-marker-wrapper {
        background: transparent;
        border: none;
      }
      .edit-map-marker {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        
        .pin-svg {
          filter: drop-shadow(0px 3px 4px rgba(0, 0, 0, 0.3));
        }
        
        .marker-text {
          background: #1e293b;
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 2px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          white-space: nowrap;
        }
      }
    }
  `]
})
export class MapPickerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() isEditing = true;

  @Output() coordinatesChanged = new EventEmitter<{ lat: number; lng: number }>();

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  ngOnInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map && (changes['latitude'] || changes['longitude'])) {
      this.updateMarkerPosition();
    }
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  private initMap() {
    // Wait for DOM element to render
    setTimeout(() => {
      const container = document.getElementById('map-picker-canvas');
      if (!container) return;

      this.destroyMap();

      // Default to Bangalore, India [12.9716, 77.5946] if no coords are provided
      const defaultLat = this.latitude !== null && this.latitude !== undefined ? this.latitude : 12.9716;
      const defaultLng = this.longitude !== null && this.longitude !== undefined ? this.longitude : 77.5946;

      this.map = L.map('map-picker-canvas', {
        zoomControl: this.isEditing
      }).setView([defaultLat, defaultLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      if (this.latitude !== null && this.longitude !== null) {
        this.placeMarker(this.latitude, this.longitude);
      }

      if (this.isEditing) {
        this.map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          this.placeMarker(lat, lng);
          this.coordinatesChanged.emit({ lat, lng });
        });
      } else {
        this.map.dragging.disable();
        this.map.touchZoom.disable();
        this.map.doubleClickZoom.disable();
        this.map.scrollWheelZoom.disable();
        this.map.boxZoom.disable();
        this.map.keyboard.disable();
        if ((this.map as any).tap) (this.map as any).tap.disable();
      }
    }, 100);
  }

  private destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  private placeMarker(lat: number, lng: number) {
    if (!this.map) return;

    // Custom Red Pin SVG and "Mark" Label
    const editIcon = L.divIcon({
      className: 'edit-map-marker-wrapper',
      html: `
        <div class="edit-map-marker">
          <svg class="pin-svg" viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EF4444"/>
          </svg>
          <div class="marker-text">Mark</div>
        </div>
      `,
      iconSize: [40, 56],
      iconAnchor: [20, 36] // Anchor at the bottom tip of the pin
    });

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], {
        draggable: this.isEditing,
        icon: editIcon
      }).addTo(this.map);

      if (this.isEditing) {
        this.marker.on('dragend', () => {
          if (this.marker) {
            const pos = this.marker.getLatLng();
            this.coordinatesChanged.emit({ lat: pos.lat, lng: pos.lng });
          }
        });
      }
    }
  }

  private updateMarkerPosition() {
    if (!this.map) return;

    const lat = this.latitude !== null ? this.latitude : 12.9716;
    const lng = this.longitude !== null ? this.longitude : 77.5946;

    this.map.setView([lat, lng], this.map.getZoom());
    this.placeMarker(lat, lng);
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.placeMarker(lat, lng);
          this.coordinatesChanged.emit({ lat, lng });
          if (this.map) {
            this.map.setView([lat, lng], 15);
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  }
}
