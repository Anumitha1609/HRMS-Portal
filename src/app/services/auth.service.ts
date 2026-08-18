import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'HR_ADMIN' | 'HR_EXECUTIVE' | 'VIEWER';
}

// Known test accounts (used by the Quick Login buttons). Any other
// email/password entered on the form will also succeed and sign in
// as an Admin, since this app runs without a live backend for now.
const MOCK_ACCOUNTS: Record<string, { password: string; user: User }> = {
  'admin@workeaze.com': {
    password: 'admin123',
    user: { id: 'u-admin', name: 'Admin User', email: 'admin@workeaze.com', role: 'HR_ADMIN' }
  },
  'executive@workeaze.com': {
    password: 'exec123',
    user: { id: 'u-exec', name: 'Executive User', email: 'executive@workeaze.com', role: 'HR_EXECUTIVE' }
  },
  'viewer@workeaze.com': {
    password: 'view123',
    user: { id: 'u-viewer', name: 'Viewer User', email: 'viewer@workeaze.com', role: 'VIEWER' }
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signals for state management
  currentUser = signal<User | null>(null);
  token = signal<string | null>(null);
  
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.role === 'HR_ADMIN');
  isExecutive = computed(() => this.currentUser()?.role === 'HR_EXECUTIVE' || this.currentUser()?.role === 'HR_ADMIN');

  constructor(private router: Router) {
    this.loadSession();
  }

  private loadSession() {
    const savedToken = localStorage.getItem('work_eaze_token');
    const savedUser = localStorage.getItem('work_eaze_user');
    
    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string): Observable<{ token: string; user: User }> {
    // Use the matching known account if the email/password pair matches one
    // of the quick-login test accounts; otherwise sign the entered email in
    // as an Admin. There is no backend call here — this always succeeds.
    const account = MOCK_ACCOUNTS[email.toLowerCase()];
    const user: User = (account && account.password === password)
      ? account.user
      : { id: 'u-local', name: email.split('@')[0] || 'User', email, role: 'HR_ADMIN' };

    const token = 'mock-token-' + Date.now();
    const res = { token, user };

    return of(res).pipe(
      delay(300), // small delay so the loading state on the button is visible
      tap(() => {
        localStorage.setItem('work_eaze_token', res.token);
        localStorage.setItem('work_eaze_user', JSON.stringify(res.user));
        this.token.set(res.token);
        this.currentUser.set(res.user);
      })
    );
  }

  logout() {
    localStorage.removeItem('work_eaze_token');
    localStorage.removeItem('work_eaze_user');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
