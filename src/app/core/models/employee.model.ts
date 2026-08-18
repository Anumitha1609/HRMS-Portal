export interface Employee {
  empCode: string;
  name: string;
  department: string;
  designation: string;
  location: string;
  dateOfJoining: string;
  currentCtc: number; // monthly gross, in rupees
  status: string;
}

export interface IncrementRecord {
  empCode: string;
  name: string;
  increDate: string;
  basic: number;
  ta: number;
  ca: number;
  otherAl: number;
  hra: number;
  fMedi: number;
  vAllo: number;
  total: number;
  remarks?: string;
}
