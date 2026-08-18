import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AttendanceResultRow } from '../models';

/**
 * Shared, in-memory store for the most recent Attendance Import run.
 * Attendance View (and any other feature) can subscribe to `importedAttendance$`
 * to react live when a new import completes.
 */
@Injectable({ providedIn: 'root' })
export class AttendanceRepositoryService {
  private readonly importedAttendanceSubject = new BehaviorSubject<AttendanceResultRow[]>([]);

  /** Observable stream of the latest imported attendance rows. */
  readonly importedAttendance$: Observable<AttendanceResultRow[]> = this.importedAttendanceSubject.asObservable();

  /** Replaces the current set of imported attendance rows. */
  setImportedAttendance(rows: AttendanceResultRow[]): void {
    this.importedAttendanceSubject.next(rows);
  }

  /** Snapshot getter for consumers that don't want to subscribe. */
  getImportedAttendance(): AttendanceResultRow[] {
    return this.importedAttendanceSubject.value;
  }

  /** Clears the stored data. */
  clear(): void {
    this.importedAttendanceSubject.next([]);
  }
}