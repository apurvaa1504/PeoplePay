export interface EmployeeRecord {
  id: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  department?: string | null;
  managerId?: string | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
  jobPosition?: string | null;
  status: "ACTIVE" | "INACTIVE";
  scheduleId?: string | null;
  schedule?: { id: string; name: string; weeklyHours: number } | null;
  createdAt: string;
}

export interface ContractRecord {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string; department?: string | null; jobPosition?: string | null } | null;
  startDate: string;
  endDate?: string | null;
  wage: number;
  department?: string | null;
  jobPosition?: string | null;
  structureId?: string | null;
  status: "DRAFT" | "ACTIVE" | "EXPIRED";
  createdAt: string;
}

export interface WorkingScheduleRecord {
  id: string;
  name: string;
  weeklyHours: number;
  lines?: ScheduleLineRecord[];
  assignedEmployeesCount?: number;
}

export interface ScheduleLineRecord {
  id?: string;
  scheduleId?: string;
  day: string;
  startTime: string;
  endTime: string;
  breakMins: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: { id: string; firstName: string; lastName: string; department?: string | null } | null;
  checkIn: string;
  checkOut?: string | null;
  workedHours?: number | null;
  status: "PRESENT" | "LATE" | "ABSENT" | "OVERTIME" | "MANUAL_CORRECTION";
  correctedBy?: string | null;
  correctedAt?: string | null;
}
