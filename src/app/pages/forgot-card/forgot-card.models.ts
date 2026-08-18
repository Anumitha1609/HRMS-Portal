/**
 * Domain models for the Forgot Card / Temporary Card Assignment feature.
 *
 * NOTE ON INTEGRATION:
 * Your existing stub imported `Employee` and `ForgotCardRecord` from
 * '../../models'. If those interfaces already exist in your shared models
 * file, either:
 *   1) Extend them there with the optional `department` / `designation` /
 *      `photo` fields used below, and delete the duplicate declarations
 *      from this file, OR
 *   2) Keep importing the shared `Employee` / `ForgotCardRecord` from
 *      '../../models' and only import `CardRecord`, `AssignmentHistoryEntry`,
 *      `RecordStatus`, and `ToastMessage` from here.
 */

export interface Employee {
  employeeCode: string;
  employeeName: string;
  department?: string;
  designation?: string;
  originalCardNumber?: string;
  photo?: string;
}

/** Payload sent to the backend when a temporary card is assigned. */
export interface ForgotCardRecord {
  employeeCode: string;
  employeeName: string;
  originalCardNumber: string;
  temporaryCardNumber: string;
  date: string;
  employeePhoto?: string;
}

/** Locally-derived record describing the currently mapped temporary card. */
export interface CardRecord {
  employeeCode: string;
  originalCardNumber: string;
  temporaryCardNumber: string;
  assignedDate: string;
  validUntil: string;
  remarks: string;
  status: 'Temporary Assigned';
}

export interface AssignmentHistoryEntry {
  id: string;
  employeeCode: string;
  employeeName: string;
  originalCardNumber: string;
  temporaryCardNumber: string;
  assignedDate: string;
  returnedDate: string | null;
  hrUser: string;
  remarks: string;
}

/**
 * Derived status for a row in the employee directory table:
 * - No record                          -> Active
 * - Record mapped, validUntil lapsed   -> Expired
 * - Record mapped, within validity     -> Temporary Assigned
 *
 * "Returned" is never a table status; a revert clears the record entirely.
 */
export type RecordStatus = 'Active' | 'Temporary Assigned' | 'Expired';

export interface EmployeeRow {
  employee: Employee;
  record: CardRecord | undefined;
  status: RecordStatus;
}

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}