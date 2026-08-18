import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, of, throwError, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MasterService } from './master.service';

// ---------------------------------------------------------------------------
// Data source note:
// This service previously called the Prism AI backend (/api/employees/*,
// /api/dashboard/stats) over HTTP. It now reads from a local JSON file
// bundled with the app (/data/employees.json) and keeps an in-memory
// working copy for create/update/draft/document actions during the
// session. Public method names, signatures and return shapes are
// unchanged so every component that consumes this service (Employee
// master and any shared consumers such as the dashboard, employee print,
// employee picker, etc.) keeps working exactly as before.
// ---------------------------------------------------------------------------

export interface EmployeeSearchResult {
  id: string;
  employeeCode: string;
  employeeName: string;
  designation?: string;
  department: string;
  category: string;
  status: string;
}

export interface EmployeeSearchResponse {
  data: EmployeeSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DocumentRecord {
  id: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  dataUrl: string; // base64 data URL, kept client-side only
  uploadedAt: string;
}

const EMPLOYEE_DATA_FILE = '/data/employees.json';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private store: any[] | null = null;
  private loader$: Observable<any[]> | null = null;

  private draftsStore: { [id: string]: any } = {};
  private draftSeq = 1;

  private documentsStore: { [employeeId: string]: DocumentRecord[] } = {};

  constructor(private http: HttpClient, private masterService: MasterService) {}

  private load(): Observable<any[]> {
    if (this.store) {
      return of(this.store);
    }
    if (!this.loader$) {
      this.loader$ = this.http.get<any[]>(EMPLOYEE_DATA_FILE).pipe(
        map((data) => {
          this.store = (data || []).map((d) => ({ ...d }));
          return this.store;
        }),
        shareReplay(1)
      );
    }
    return this.loader$;
  }

  private notFound(message: string) {
    return throwError(() => ({ error: { error: message } }));
  }

  // --- Search / CRUD -------------------------------------------------------

  search(filters: { code?: string; name?: string; mobile?: string; email?: string; departmentId?: string; categoryId?: string; page?: number; limit?: number }): Observable<EmployeeSearchResponse> {
    return combineLatest([this.load(), this.masterService.getMasters('department'), this.masterService.getMasters('category')]).pipe(
      map(([all, departments, categories]) => {
        const deptNameById = new Map(departments.map((d) => [d.id, d.name]));
        const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
        let results = [...all];

        if (filters.code) {
          const q = filters.code.toLowerCase();
          results = results.filter((e) => (e.employeeCode || '').toLowerCase().includes(q));
        }
        if (filters.name) {
          const q = filters.name.toLowerCase();
          results = results.filter((e) => (e.employeeName || '').toLowerCase().includes(q));
        }
        if (filters.mobile) {
          const q = filters.mobile.replace(/\s/g, '');
          results = results.filter((e) => (e.mobileNumber || '').replace(/\s/g, '').includes(q));
        }
        if (filters.email) {
          const q = filters.email.toLowerCase();
          results = results.filter(
            (e) => (e.officialEmail || '').toLowerCase().includes(q) || (e.personalEmail || '').toLowerCase().includes(q)
          );
        }
        if (filters.departmentId) {
          results = results.filter((e) => e.departmentId === filters.departmentId);
        }
        if (filters.categoryId) {
          results = results.filter((e) => e.categoryId === filters.categoryId);
        }

        const total = results.length;
        const limit = filters.limit || 10;
        const page = filters.page || 1;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const start = (page - 1) * limit;
        const pageSlice = results.slice(start, start + limit);

        const mapped: EmployeeSearchResult[] = pageSlice.map((e) => ({
          id: e.id,
          employeeCode: e.employeeCode,
          employeeName: e.employeeName,
          designation: e.designation,
          department: deptNameById.get(e.departmentId) || e.departmentId || '',
          category: categoryNameById.get(e.categoryId) || e.categoryId || '',
          status: e.status
        }));

        return {
          data: mapped,
          pagination: { page, limit, total, totalPages }
        };
      })
    );
  }

  getById(id: string): Observable<any> {
    return this.load().pipe(
      map((all) => {
        const found = all.find((e) => e.id === id);
        if (!found) {
          throw { error: { error: 'Employee not found' } };
        }
        return { ...found };
      })
    );
  }

  create(employeeData: any): Observable<any> {
    return this.load().pipe(
      map((all) => {
        const id = `emp-${Date.now()}`;
        const employeeCode = employeeData.employeeCode && employeeData.employeeCode.trim()
          ? employeeData.employeeCode
          : `EMP${String(all.length + 1).padStart(4, '0')}`;
        const newRecord = { ...employeeData, id, employeeCode };
        all.push(newRecord);
        this.documentsStore[id] = this.documentsStore[id] || [];
        return { ...newRecord };
      })
    );
  }

  update(id: string, employeeData: any): Observable<any> {
    return this.load().pipe(
      map((all) => {
        const idx = all.findIndex((e) => e.id === id);
        if (idx === -1) {
          throw { error: { error: 'Employee not found' } };
        }
        const updated = { ...all[idx], ...employeeData, id };
        all[idx] = updated;
        return { ...updated };
      })
    );
  }

  getDashboardStats(): Observable<any> {
    return this.load().pipe(
      map((all) => {
        const totalEmployees = all.length;
        const departments = new Set(all.map((e) => e.departmentId).filter(Boolean));
        return {
          totalEmployees,
          departmentCount: departments.size
        };
      })
    );
  }

  // --- Draft APIs ------------------------------------------------------------

  createDraft(data: any, employeeId?: string): Observable<any> {
    const id = `draft-${this.draftSeq++}`;
    const record = { id, employeeId, data, createdAt: new Date().toISOString() };
    this.draftsStore[id] = record;
    return of({ ...record });
  }

  updateDraft(id: string, data: any): Observable<any> {
    const existing = this.draftsStore[id];
    if (!existing) {
      return this.notFound('Draft not found');
    }
    const updated = { ...existing, data, updatedAt: new Date().toISOString() };
    this.draftsStore[id] = updated;
    return of({ ...updated });
  }

  getDraft(id: string): Observable<any> {
    const existing = this.draftsStore[id];
    if (!existing) {
      return this.notFound('Draft not found');
    }
    return of({ ...existing });
  }

  deleteDraft(id: string): Observable<any> {
    delete this.draftsStore[id];
    return of({ success: true });
  }

  listDrafts(): Observable<any[]> {
    return of(Object.values(this.draftsStore).map((d) => ({ ...d })));
  }

  // --- Document APIs (fully client-side; files kept as base64 in memory) ---

  getDocuments(id: string): Observable<any[]> {
    const docs = this.documentsStore[id] || [];
    return of(docs.map((d) => ({ id: d.id, documentType: d.documentType, originalFileName: d.originalFileName, mimeType: d.mimeType, uploadedAt: d.uploadedAt })));
  }

  uploadDocument(id: string, documentType: string, file: File): Observable<any> {
    return new Observable((subscriber) => {
      subscriber.next({ type: HttpEventType.UploadProgress, loaded: 0, total: file.size });

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const record: DocumentRecord = {
          id: `doc-${Date.now()}`,
          documentType,
          originalFileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toISOString()
        };
        this.documentsStore[id] = [...(this.documentsStore[id] || []), record];

        subscriber.next({ type: HttpEventType.UploadProgress, loaded: file.size, total: file.size });
        subscriber.next({
          type: HttpEventType.Response,
          body: { id: record.id, documentType: record.documentType, originalFileName: record.originalFileName, mimeType: record.mimeType }
        });
        subscriber.complete();
      };
      reader.onerror = () => {
        subscriber.error({ error: { error: 'Failed to read file' } });
      };
      reader.readAsDataURL(file);
    });
  }

  deleteDocument(id: string, documentId: string): Observable<any> {
    const docs = this.documentsStore[id] || [];
    this.documentsStore[id] = docs.filter((d) => d.id !== documentId);
    return of({ success: true });
  }

  private dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
    const parts = dataUrl.split(',');
    const byteString = atob(parts[1] || '');
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  downloadDocumentFile(id: string, documentId: string): Observable<Blob> {
    const doc = (this.documentsStore[id] || []).find((d) => d.id === documentId);
    if (!doc) {
      return this.notFound('Document not found');
    }
    return of(this.dataUrlToBlob(doc.dataUrl, doc.mimeType));
  }

  previewDocumentFile(id: string, documentId: string): Observable<Blob> {
    const doc = (this.documentsStore[id] || []).find((d) => d.id === documentId);
    if (!doc) {
      return this.notFound('Document not found');
    }
    return of(this.dataUrlToBlob(doc.dataUrl, doc.mimeType));
  }
}
