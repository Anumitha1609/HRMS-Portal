import { Injectable, signal } from '@angular/core';

/**
 * Lightweight global search service.
 * Holds a single search term (typically bound to a search box in the
 * page topbar) and exposes a generic `matches()` helper that pages can
 * use to filter their own record arrays against that term.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  query = signal<string>('');

  setQuery(value: string) {
    this.query.set(value ?? '');
  }

  clear() {
    this.query.set('');
  }

  /**
   * Returns true if the record has no search term to match against,
   * or if any of its own (non-nested) values contains the current
   * search term (case-insensitive).
   */
  matches(record: object | null | undefined): boolean {
    const term = this.query().trim().toLowerCase();
    if (!term) return true;
    if (!record) return false;

    return Object.values(record).some(value => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    });
  }
}
