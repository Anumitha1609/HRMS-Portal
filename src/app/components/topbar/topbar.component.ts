import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';

/**
 * Lightweight page header used inside transaction/master pages:
 * a page title on the left and a page-scoped search box on the
 * right, wired to SearchService so pages can filter their own
 * grids against the typed term via `searchService.matches(record)`.
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  @Input() title = '';

  searchService = inject(SearchService);
}
