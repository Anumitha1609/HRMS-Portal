import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MasterService } from '../../services/master.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-location-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="location-search-container" style="position: relative; width: 100%;">
      <div style="position: relative; width: 100%;">
        <input
          [formControl]="searchCtrl"
          type="text"
          class="input-control"
          placeholder="Search location..."
          style="width: 100%; padding: 10px 12px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px;"
          (keydown)="onKeyDown($event)"
          (focus)="showSuggestions = true"
          [attr.disabled]="disabled ? true : null"
        />
        <span *ngIf="isLoading" class="material-icons rotating" style="position: absolute; right: 12px; top: 10px; font-size: 18px; color: #94a3b8; animation: spin 1.5s linear infinite;">
          sync
        </span>
      </div>

      <!-- Suggestions Dropdown -->
      <ul
        *ngIf="showSuggestions && suggestions.length > 0"
        class="suggestions-list"
        style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 4px; padding: 0; list-style: none; max-height: 240px; overflow-y: auto; z-index: 999; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);"
      >
        <li
          *ngFor="let sug of suggestions; let i = index"
          [class.active]="i === activeIndex"
          (click)="selectSuggestion(sug)"
          style="padding: 10px 12px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.15s;"
          [style.background]="i === activeIndex ? '#f1f5f9' : 'transparent'"
        >
          <div style="font-weight: 600; color: #1e293b;">{{ sug.name }}</div>
          <div style="font-size: 11px; color: #64748b; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            {{ sug.address }}
          </div>
        </li>
      </ul>
    </div>

    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `
})
export class LocationSearchComponent implements OnInit, OnDestroy {
  @Input() set value(val: string) {
    if (val !== undefined && val !== this.searchCtrl.value) {
      this.searchCtrl.setValue(val, { emitEvent: false });
    }
  }
  @Input() disabled = false;
  @Output() locationSelected = new EventEmitter<any>();
  @Output() manualNameChange = new EventEmitter<string>();

  searchCtrl = new FormControl('');
  suggestions: any[] = [];
  activeIndex = 0;
  showSuggestions = false;
  isLoading = false;

  private sub = new Subscription();

  constructor(private masterService: MasterService, private eRef: ElementRef) {}

  ngOnInit() {
    this.sub.add(
      this.searchCtrl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((val) => {
          this.manualNameChange.emit(val || '');
          if (!val || val.trim().length < 2) {
            this.suggestions = [];
            this.isLoading = false;
            return [];
          }
          this.isLoading = true;
          return this.masterService.geocode(val);
        })
      ).subscribe({
        next: (res) => {
          this.suggestions = res;
          this.activeIndex = 0;
          this.isLoading = false;
          this.showSuggestions = true;
        },
        error: () => {
          this.isLoading = false;
        }
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  selectSuggestion(sug: any) {
    this.locationSelected.emit(sug);
    this.searchCtrl.setValue(sug.name, { emitEvent: false });
    this.showSuggestions = false;
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.showSuggestions || this.suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % this.suggestions.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length;
        break;
      case 'Enter':
        event.preventDefault();
        if (this.suggestions[this.activeIndex]) {
          this.selectSuggestion(this.suggestions[this.activeIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.showSuggestions = false;
        break;
      case 'Tab':
        this.showSuggestions = false;
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
    }
  }
}
