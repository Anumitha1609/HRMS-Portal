import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <nav class="breadcrumb" *ngIf="breadcrumb?.length">
        <span *ngFor="let crumb of breadcrumb; let last = last">
          {{ crumb }}<span class="sep" *ngIf="!last"> / </span>
        </span>
      </nav>
      <h2>{{ title }}</h2>
      <p *ngIf="description">{{ description }}</p>
    </div>
  `,
  styles: [
    `
      .page-header {
        margin-bottom: var(--space-4, 16px);
      }
      .breadcrumb {
        font-size: 12px;
        color: var(--color-text-faint, #94a3b8);
        margin-bottom: 6px;
      }
      .breadcrumb .sep {
        margin: 0 4px;
      }
      h2 {
        font-size: 20px;
        font-weight: 700;
        color: var(--color-text, #1f2937);
        margin-bottom: 4px;
      }
      p {
        font-size: 13px;
        color: var(--color-text-muted, #6b7280);
        margin: 0;
      }
    `
  ]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() breadcrumb: string[] = [];
}
