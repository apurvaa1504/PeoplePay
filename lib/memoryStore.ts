import { EmployeeRecord, ContractRecord, WorkingScheduleRecord, AttendanceRecord } from "./types";

interface MemoryStore {
  employees: EmployeeRecord[];
  contracts: ContractRecord[];
  schedules: (WorkingScheduleRecord & { lines: { id: string; scheduleId: string; day: string; startTime: string; endTime: string; breakMins: number }[] })[];
  attendances: AttendanceRecord[];
}

// Global reference survives Hot Module Reloading in Next.js development
const globalStore = global as unknown as { __peoplePayStore?: MemoryStore };

if (!globalStore.__peoplePayStore) {
  const defaultScheduleId = "sched-1";
  const defaultSchedule = {
    id: defaultScheduleId,
    name: "Standard Full-Time (40h)",
    weeklyHours: 40,
    lines: [
      { id: "line-1", scheduleId: defaultScheduleId, day: "Monday", startTime: "09:00", endTime: "17:00", breakMins: 0 },
      { id: "line-2", scheduleId: defaultScheduleId, day: "Tuesday", startTime: "09:00", endTime: "17:00", breakMins: 0 },
      { id: "line-3", scheduleId: defaultScheduleId, day: "Wednesday", startTime: "09:00", endTime: "17:00", breakMins: 0 },
      { id: "line-4", scheduleId: defaultScheduleId, day: "Thursday", startTime: "09:00", endTime: "17:00", breakMins: 0 },
      { id: "line-5", scheduleId: defaultScheduleId, day: "Friday", startTime: "09:00", endTime: "17:00", breakMins: 0 },
    ],
  };

  const initialEmployees: EmployeeRecord[] = [
    {
      id: "emp-1",
      firstName: "Sarah",
      lastName: "Jenkins",
      department: "Engineering",
      jobPosition: "Staff Software Engineer",
      status: "ACTIVE",
      managerId: null,
      scheduleId: defaultScheduleId,
      createdAt: new Date().toISOString(),
    },
    {
      id: "emp-2",
      firstName: "David",
      lastName: "Chen",
      department: "Engineering",
      jobPosition: "Frontend Developer",
      status: "ACTIVE",
      managerId: "emp-1",
      scheduleId: defaultScheduleId,
      createdAt: new Date().toISOString(),
    },
    {
      id: "emp-3",
      firstName: "Elena",
      lastName: "Rostova",
      department: "Product",
      jobPosition: "Product Lead",
      status: "ACTIVE",
      managerId: null,
      scheduleId: defaultScheduleId,
      createdAt: new Date().toISOString(),
    },
    {
      id: "emp-4",
      firstName: "Marcus",
      lastName: "Vance",
      department: "Human Resources",
      jobPosition: "HR Business Partner",
      status: "INACTIVE",
      managerId: null,
      scheduleId: defaultScheduleId,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialContracts: ContractRecord[] = [
    {
      id: "cont-1",
      employeeId: "emp-1",
      startDate: "2024-01-01",
      endDate: "2025-12-31",
      wage: 145000,
      department: "Engineering",
      jobPosition: "Staff Software Engineer",
      structureId: "struct-1",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
    {
      id: "cont-2",
      employeeId: "emp-2",
      startDate: "2024-03-15",
      endDate: "2025-03-14",
      wage: 95000,
      department: "Engineering",
      jobPosition: "Frontend Developer",
      structureId: "struct-1",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
    {
      id: "cont-3",
      employeeId: "emp-3",
      startDate: "2023-06-01",
      endDate: null,
      wage: 130000,
      department: "Product",
      jobPosition: "Product Lead",
      structureId: "struct-1",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
  ];

  const initialAttendances: AttendanceRecord[] = [
    {
      id: "att-1",
      employeeId: "emp-1",
      checkIn: "2026-09-05T09:00:00.000Z",
      checkOut: "2026-09-05T17:00:00.000Z",
      workedHours: 8,
      status: "PRESENT",
      createdAt: new Date().toISOString(),
    } as AttendanceRecord,
    {
      id: "att-2",
      employeeId: "emp-2",
      checkIn: "2026-09-05T09:25:00.000Z",
      checkOut: "2026-09-05T17:30:00.000Z",
      workedHours: 8.08,
      status: "LATE",
      createdAt: new Date().toISOString(),
    } as AttendanceRecord,
  ];

  globalStore.__peoplePayStore = {
    employees: initialEmployees,
    contracts: initialContracts,
    schedules: [defaultSchedule],
    attendances: initialAttendances,
  };
}

export const memoryStore = globalStore.__peoplePayStore;
