import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-address-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="address-preview-container" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
      <!-- Coordinates Row -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <label style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">Latitude</label>
          <div class="read-only-field" style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; font-family: monospace; min-height: 38px;">
            {{ latitude !== null ? latitude : 'Not selected' }}
          </div>
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">Longitude</label>
          <div class="read-only-field" style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; font-family: monospace; min-height: 38px;">
            {{ longitude !== null ? longitude : 'Not selected' }}
          </div>
        </div>
      </div>

      <!-- Address Row -->
      <div>
        <label style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">Address</label>
        <div class="read-only-field" style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; min-height: 60px; line-height: 1.5;">
          {{ address || 'Not selected' }}
        </div>
      </div>

      <!-- Grid of Details -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <label style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">PIN Code</label>
          <div class="read-only-field" style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; min-height: 38px;">
            {{ pinCode || 'N/A' }}
          </div>
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">City</label>
          <div class="read-only-field" style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; min-height: 38px;">
            {{ city || 'N/A' }}
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <label style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">State</label>
          <div class="read-only-field" style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; min-height: 38px;">
            {{ state || 'N/A' }}
          </div>
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">Country</label>
          <div class="read-only-field" style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; min-height: 38px;">
            {{ country || 'N/A' }}
          </div>
        </div>
      </div>

      <!-- Timezone Row -->
      <div>
        <label style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">Timezone</label>
        <div class="read-only-field" style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; min-height: 38px;">
          <span class="material-icons" style="font-size: 16px; color: #64748b;">schedule</span>
          {{ timezone || 'Automatic' }}
        </div>
      </div>
    </div>
  `
})
export class AddressPreviewComponent {
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() address = '';
  @Input() pinCode = '';
  @Input() city = '';
  @Input() state = '';
  @Input() country = '';
  @Input() timezone = '';
}
