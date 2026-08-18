import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';

interface LeaveTab {
  label: string;
  path: string;
}

@Component({
  selector: 'app-leave-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './leave-page.html',
  styleUrls: ['./leave-page.scss'],
})
export class LeavePage implements OnInit, OnDestroy {
  readonly tabs: LeaveTab[] = [
    { label: 'Leave Request', path: '/leave-request' },
    { label: 'Compensation Request', path: '/compensation-request' },
  ];

  currentPath = '';
  private routerSub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.currentPath = this.router.url;
    this.handleRedirect(this.currentPath);

    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentPath = event.urlAfterRedirects;
        this.handleRedirect(this.currentPath);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private handleRedirect(path: string): void {
    if (path === '/leave-management') {
      this.router.navigate(['/leave-request'], { replaceUrl: true });
    }
  }

  isActive(path: string): boolean {
    return this.currentPath === path;
  }
}