import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PayslipMailPayload {
  to: string;
  subject: string;
  payslip: Record<string, any>;
  pdfBase64?: string;
  pdfFileName?: string;
}

export interface MailResponse {
  success: boolean;
  message: string;
}

/**
 * Thin HTTP client for the node-backend (see /node-backend in the repo root).
 * Currently only wraps the POST /send-mail endpoint used to email payslips
 * from the Salary Generation screen. Requires the backend to be running
 * (`npm start` inside node-backend) with a valid .env — see its README.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  sendPayslipMail(payload: PayslipMailPayload): Observable<MailResponse> {
    return this.http.post<MailResponse>(`${this.baseUrl}/send-mail`, payload);
  }
}
