import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  let request = req;
  // Attach token if present and calling backend API
  if (token && (req.url.startsWith(environment.backendUrl) || req.url.startsWith(environment.apiUrl)) && !req.url.includes('/auth/login')) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Auto logout and redirect to login if token is expired/invalid
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
