import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success('Logged in successfully!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.error || 'Invalid credentials. Please try again.';
        this.toastService.error(msg);
      }
    });
  }

  quickLogin(role: 'admin' | 'executive' | 'viewer') {
    const credentials = {
      admin: { email: 'admin@workeaze.com', pass: 'admin123' },
      executive: { email: 'executive@workeaze.com', pass: 'exec123' },
      viewer: { email: 'viewer@workeaze.com', pass: 'view123' }
    };

    const creds = credentials[role];
    this.loginForm.patchValue({
      email: creds.email,
      password: creds.pass
    });
    this.onSubmit();
  }
}
