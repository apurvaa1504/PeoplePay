import { Client } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const client = new Client({ connectionString: process.env.DATABASE_URL });

const FIRST_NAMES = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Reyansh','Krishna','Ishaan','Rohan','Kabir',
  'Ananya','Diya','Saanvi','Aadhya','Myra','Pari','Anika','Navya','Kiara','Riya','Sara','Zoya','Ira','Meera'];
const LAST_NAMES = ['Sharma','Verma','Gupta','Patel','Reddy','Iyer','Nair','Menon','Rao','Kapoor',
  'Malhotra','Chopra','Bose','Mukherjee','Desai','Joshi','Kulkarni','Pillai','Shah','Agarwal'];
const DEPARTMENTS = ['Engineering','Sales','Marketing','Finance','Human Resources','Operations','Support'];
const POSITIONS = ['Associate','Senior Associate','Manager','Analyst','Specialist','Lead','Coordinator'];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

const EMPLOYEE_COUNT = 200;
const SCHEDULE_COUNT = 5;
const STRUCTURE_COUNT = 3;
const RULE_COUNT = 10;
const PAYRUN_COUNT = 6;

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndDate(y1, y2) {
  const start = new Date(`${y1}-01-01`).getTime();
  const end = new Date(`${y2}-12-31`).getTime();
  return new Date(start + Math.random() * (end - start));
}

async function bulkInsert(table, columns, rowBuilder, count) {
  if (count === 0) return;
  const values = [];
  const rows = [];
  let p = 1;
  for (let i = 0; i < count; i++) {
    const row = rowBuilder(i);
    rows.push(`(${row.map(() => `$${p++}`).join(', ')})`);
    values.push(...row);
  }
  const sql = `INSERT INTO ${table} (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${rows.join(', ')}`;
  await client.query(sql, values);
  console.log(`  ${table}: inserted ${count} rows`);
}

async function main() {
  await client.connect();
  console.log('Connected. Clearing existing data...');

  await client.query('DELETE FROM payslip_lines');
  await client.query('DELETE FROM payslips');
  await client.query('DELETE FROM payruns');
  await client.query('DELETE FROM salary_structure_rules');
  await client.query('DELETE FROM salary_rules');
  await client.query('DELETE FROM allocations');
  await client.query('DELETE FROM time_off_requests');
  await client.query('DELETE FROM time_off_types');
  await client.query('DELETE FROM schedule_lines');
  await client.query('DELETE FROM attendances');
  await client.query('DELETE FROM contracts');
  await client.query('DELETE FROM employees');
  await client.query('DELETE FROM working_schedules');
  await client.query('DELETE FROM salary_structures');
  await client.query('DELETE FROM users');

  console.log('Seeding realistic demo data...\n');

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- Fixed demo login accounts ---
  const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
  const HR_ID = '00000000-0000-0000-0000-000000000002';
  const EMP_ID = '00000000-0000-0000-0000-000000000003';

  await client.query(
    `INSERT INTO users (id, email, "passwordHash", role, "createdAt") VALUES
     ($1, 'admin@peoplepay360.com', $4, 'ADMIN', now()),
     ($2, 'hr@peoplepay360.com', $4, 'HR_MANAGER', now()),
     ($3, 'employee@peoplepay360.com', $4, 'EMPLOYEE', now())`,
    [ADMIN_ID, HR_ID, EMP_ID, passwordHash]
  );
  console.log('  users: inserted 3 demo accounts (admin/hr/employee@peoplepay360.com)');

  // --- Working Schedules (5 — a handful of standard shift patterns) ---
  const scheduleIds = Array.from({ length: SCHEDULE_COUNT }, () => randomUUID());
  const scheduleNames = ['Standard 40h', 'Part-Time 20h', 'Compressed 4-Day', 'Early Shift', 'Late Shift'];
  await bulkInsert('working_schedules', ['id', 'name', 'weeklyHours'], (i) => [
    scheduleIds[i], scheduleNames[i], [40, 20, 40, 40, 40][i],
  ], SCHEDULE_COUNT);

  for (let i = 0; i < SCHEDULE_COUNT; i++) {
    for (const day of DAYS) {
      await client.query(
        `INSERT INTO schedule_lines (id, "scheduleId", day, "startTime", "endTime", "breakMins") VALUES ($1, $2, $3, '09:00', '17:00', 30)`,
        [randomUUID(), scheduleIds[i], day]
      );
    }
  }
  console.log(`  schedule_lines: inserted ${SCHEDULE_COUNT * DAYS.length} rows`);

  // --- Salary Structures (3) + Rules (10) ---
  const structureIds = Array.from({ length: STRUCTURE_COUNT }, () => randomUUID());
  await bulkInsert('salary_structures', ['id', 'name', 'active'], (i) => [
    structureIds[i], ['Regular Salary', 'Contractor Pay', 'Executive Package'][i], true,
  ], STRUCTURE_COUNT);

  const ruleIds = Array.from({ length: RULE_COUNT }, () => randomUUID());
  const ruleDefs = [
    ['Basic Pay', 'BASIC', 'BASIC', 'FIXED', 50000, null],
    ['HRA', 'HRA', 'ALLOWANCE', 'PERCENTAGE', null, 40],
    ['Conveyance', 'CONV', 'ALLOWANCE', 'FIXED', 2000, null],
    ['Medical Allowance', 'MED', 'ALLOWANCE', 'FIXED', 1500, null],
    ['Special Allowance', 'SPEC', 'ALLOWANCE', 'PERCENTAGE', null, 10],
    ['Provident Fund', 'PF', 'DEDUCTION', 'PERCENTAGE', null, 12],
    ['Professional Tax', 'PT', 'DEDUCTION', 'FIXED', 200, null],
    ['Gross Salary', 'GROSS', 'GROSS', 'FORMULA', null, null],
    ['Income Tax', 'TAX', 'DEDUCTION', 'PERCENTAGE', null, 10],
    ['Net Salary', 'NET', 'NET', 'FORMULA', null, null],
  ];
  await bulkInsert('salary_rules', ['id', 'name', 'code', 'category', 'computationMethod', 'fixedAmount', 'percentage'], (i) => [
    ruleIds[i], ruleDefs[i][0], ruleDefs[i][1], ruleDefs[i][2], ruleDefs[i][3], ruleDefs[i][4], ruleDefs[i][5],
  ], RULE_COUNT);

  for (let s = 0; s < STRUCTURE_COUNT; s++) {
    for (let r = 0; r < RULE_COUNT; r++) {
      await client.query(
        `INSERT INTO salary_structure_rules (id, "structureId", "ruleId", sequence) VALUES ($1, $2, $3, $4)`,
        [randomUUID(), structureIds[s], ruleIds[r], r + 1]
      );
    }
  }
  console.log(`  salary_structure_rules: inserted ${STRUCTURE_COUNT * RULE_COUNT} rows`);

  // --- Time Off Types (6 — a realistic small policy set) ---
  const TIME_OFF_TYPES = [
    { name: 'Casual Leave', unit: 'DAYS', requiresAllocation: true, requiresApproval: true, payrollIntegration: false },
    { name: 'Sick Leave', unit: 'DAYS', requiresAllocation: true, requiresApproval: true, payrollIntegration: false },
    { name: 'Earned Leave', unit: 'DAYS', requiresAllocation: true, requiresApproval: true, payrollIntegration: true },
    { name: 'Maternity Leave', unit: 'DAYS', requiresAllocation: true, requiresApproval: true, payrollIntegration: true },
    { name: 'Unpaid Leave', unit: 'DAYS', requiresAllocation: false, requiresApproval: true, payrollIntegration: true },
    { name: 'Work From Home', unit: 'DAYS', requiresAllocation: false, requiresApproval: false, payrollIntegration: false },
  ];
  const typeIds = TIME_OFF_TYPES.map(() => randomUUID());
  await bulkInsert('time_off_types', ['id', 'name', 'unit', 'requiresAllocation', 'requiresApproval', 'payrollIntegration'], (i) => [
    typeIds[i], TIME_OFF_TYPES[i].name, TIME_OFF_TYPES[i].unit, TIME_OFF_TYPES[i].requiresAllocation,
    TIME_OFF_TYPES[i].requiresApproval, TIME_OFF_TYPES[i].payrollIntegration,
  ], TIME_OFF_TYPES.length);

  const allocatableTypeIds = typeIds.filter((_, i) => TIME_OFF_TYPES[i].requiresAllocation);

  // --- Employees (200) ---
  const employeeIds = Array.from({ length: EMPLOYEE_COUNT }, () => randomUUID());
  await bulkInsert('employees', ['id', 'firstName', 'lastName', 'department', 'jobPosition', 'status', 'scheduleId'], (i) => [
    employeeIds[i], rnd(FIRST_NAMES), rnd(LAST_NAMES), rnd(DEPARTMENTS), rnd(POSITIONS), 'ACTIVE', rnd(scheduleIds),
  ], EMPLOYEE_COUNT);

  // Give the seeded HR/EMPLOYEE login accounts real employee records too
  await client.query(
    `INSERT INTO employees (id, "userId", "firstName", "lastName", department, "jobPosition", status, "createdAt") VALUES
     ($1, $3, 'Priya', 'Sharma', 'Human Resources', 'HR Manager', 'ACTIVE', now()),
     ($2, $4, 'Rahul', 'Verma', 'Engineering', 'Software Engineer', 'ACTIVE', now())`,
    [randomUUID(), randomUUID(), HR_ID, EMP_ID]
  );
  console.log('  employees: inserted 200 + 2 linked to demo login accounts');

  // --- Contracts (1 per employee) ---
  await bulkInsert('contracts', ['id', 'employeeId', 'startDate', 'wage', 'department', 'jobPosition', 'structureId', 'status'], (i) => [
    randomUUID(), employeeIds[i], '2025-01-01', rndInt(30000, 150000), rnd(DEPARTMENTS), rnd(POSITIONS), rnd(structureIds), 'ACTIVE',
  ], EMPLOYEE_COUNT);

  // --- Attendances (2 per employee — a bit of recent history) ---
  const attendanceRows = [];
  for (const empId of employeeIds) {
    for (let d = 0; d < 2; d++) {
      const day = rndDate(2026, 2026);
      const checkIn = new Date(day); checkIn.setHours(9, rndInt(0, 30), 0);
      const checkOut = new Date(day); checkOut.setHours(17, rndInt(0, 30), 0);
      attendanceRows.push([randomUUID(), empId, checkIn.toISOString(), checkOut.toISOString(), 8, rnd(['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'OVERTIME'])]);
    }
  }
  await bulkInsert('attendances', ['id', 'employeeId', 'checkIn', 'checkOut', 'workedHours', 'status'], (i) => attendanceRows[i], attendanceRows.length);

  // --- Allocations (1-2 per employee, only for types that require one) ---
  const allocationRows = [];
  for (const empId of employeeIds) {
    const numAllocs = rndInt(1, 2);
    const chosenTypes = [...allocatableTypeIds].sort(() => 0.5 - Math.random()).slice(0, numAllocs);
    for (const typeId of chosenTypes) {
      const allocated = rnd([10, 12, 15, 20, 25]);
      const taken = rndInt(0, Math.floor(allocated * 0.4));
      allocationRows.push([randomUUID(), empId, typeId, allocated, taken, '2026-01-01', '2026-12-31']);
    }
  }
  await bulkInsert('allocations', ['id', 'employeeId', 'timeOffTypeId', 'allocated', 'taken', 'validFrom', 'validTo'], (i) => allocationRows[i], allocationRows.length);

  // --- Time Off Requests (1-3 per employee, mixed status) ---
  const requestRows = [];
  for (const empId of employeeIds) {
    const numRequests = rndInt(1, 3);
    for (let i = 0; i < numRequests; i++) {
      const typeId = rnd(typeIds);
      const duration = rndInt(1, 4);
      const start = rndDate(2026, 2026);
      const end = new Date(start.getTime() + duration * 86400000);
      const status = rnd(['PENDING', 'APPROVED', 'APPROVED', 'REFUSED']);
      requestRows.push([randomUUID(), empId, typeId, start.toISOString(), end.toISOString(), duration, status]);
    }
  }
  await bulkInsert('time_off_requests', ['id', 'employeeId', 'timeOffTypeId', 'startDate', 'endDate', 'duration', 'status'], (i) => requestRows[i], requestRows.length);

  // --- Payruns (6 months of history) ---
  const payrunIds = Array.from({ length: PAYRUN_COUNT }, () => randomUUID());
  await bulkInsert('payruns', ['id', 'name', 'structureId', 'periodStart', 'periodEnd', 'status'], (i) => [
    payrunIds[i], `Payrun - Month ${i + 1}`, rnd(structureIds), '2026-01-01', '2026-01-31', i < 4 ? 'PAID' : 'DRAFT',
  ], PAYRUN_COUNT);

  // --- Payslips (1 per employee, on the latest payrun) ---
  const latestPayrun = payrunIds[payrunIds.length - 1];
  await bulkInsert('payslips', ['id', 'payrunId', 'employeeId', 'contractId', 'netSalary', 'workedDays'], (i) => [
    randomUUID(), latestPayrun, employeeIds[i], randomUUID(), rndInt(30000, 150000), rndInt(18, 22),
  ], EMPLOYEE_COUNT);

  console.log('\nSeed complete. Realistic dataset:');
  const tables = ['users','employees','contracts','working_schedules','schedule_lines','attendances',
    'time_off_types','allocations','time_off_requests','salary_structures','salary_rules',
    'salary_structure_rules','payruns','payslips'];
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) FROM ${t}`);
    console.log(`  ${t}: ${res.rows[0].count}`);
  }

  console.log('\nLogin credentials — password: password123');
  console.log('  admin@peoplepay360.com (ADMIN)');
  console.log('  hr@peoplepay360.com (HR_MANAGER, linked to employee Priya Sharma)');
  console.log('  employee@peoplepay360.com (EMPLOYEE, linked to employee Rahul Verma)');

  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});