import { Client } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const client = new Client({ connectionString: process.env.DATABASE_URL });

// Fixed IDs so re-running the seed always produces identical data
const IDS = {
  adminUser: '00000000-0000-0000-0000-000000000001',
  hrUser: '00000000-0000-0000-0000-000000000002',
  empUser: '00000000-0000-0000-0000-000000000003',
  hrPayrollUser: '00000000-0000-0000-0000-000000000004',
  hrPayrollManager: '00000000-0000-0000-0000-000000000005',
  schedule: '00000000-0000-0000-0000-000000000010',
  emp1: '00000000-0000-0000-0000-000000000020',
  emp2: '00000000-0000-0000-0000-000000000021',
  emp3: '00000000-0000-0000-0000-000000000022',
  emp4: '00000000-0000-0000-0000-000000000023',
  emp5: '00000000-0000-0000-0000-000000000024',
  structure: '00000000-0000-0000-0000-000000000030',
  ruleBasic: '00000000-0000-0000-0000-000000000031',
  ruleHRA: '00000000-0000-0000-0000-000000000032',
  timeOffCasual: '00000000-0000-0000-0000-000000000040',
  timeOffSick: '00000000-0000-0000-0000-000000000041',
};

async function main() {
  await client.connect();
  console.log('Connected. Clearing existing data...');

  // Delete in child-to-parent order to respect foreign keys
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

  console.log('Seeding fresh data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  await client.query(
    `INSERT INTO users (id, email, "passwordHash", role, "createdAt") VALUES
     ($1, 'admin@peoplepay360.com', $6, 'ADMIN', now()),
     ($2, 'hr@peoplepay360.com', $6, 'HR_MANAGER', now()),
     ($3, 'employee@peoplepay360.com', $6, 'EMPLOYEE', now()),
     ($4, 'payroll@peoplepay360.com', $6, 'HR_PAYROLL_USER', now()),
     ($5, 'payroll_manager@peoplepay360.com', $6, 'HR_PAYROLL_MANAGER', now())`,
    [IDS.adminUser, IDS.hrUser, IDS.empUser, IDS.hrPayrollUser, IDS.hrPayrollManager, passwordHash]
  );

  // Working schedule + lines
  await client.query(
    `INSERT INTO working_schedules (id, name, "weeklyHours") VALUES ($1, 'Standard 40h', 40)`,
    [IDS.schedule]
  );
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  for (const day of days) {
    await client.query(
      `INSERT INTO schedule_lines (id, "scheduleId", day, "startTime", "endTime", "breakMins")
       VALUES ($1, $2, $3, '09:00', '17:00', 30)`,
      [randomUUID(), IDS.schedule, day]
    );
  }

  // Salary structure + rules
  await client.query(
    `INSERT INTO salary_structures (id, name, active) VALUES ($1, 'Regular Salary', true)`,
    [IDS.structure]
  );
  await client.query(
    `INSERT INTO salary_rules (id, name, code, category, "computationMethod", "fixedAmount") VALUES
     ($1, 'Basic Pay', 'BASIC', 'BASIC', 'FIXED', 50000),
     ($2, 'HRA', 'HRA', 'ALLOWANCE', 'PERCENTAGE', NULL)`,
    [IDS.ruleBasic, IDS.ruleHRA]
  );
  await client.query(
    `UPDATE salary_rules SET percentage = 40 WHERE id = $1`,
    [IDS.ruleHRA]
  );
  await client.query(
    `INSERT INTO salary_structure_rules (id, "structureId", "ruleId", sequence) VALUES
     ($1, $3, $4, 1),
     ($2, $3, $5, 2)`,
    [randomUUID(), randomUUID(), IDS.structure, IDS.ruleBasic, IDS.ruleHRA]
  );

  // Employees
  await client.query(
    `INSERT INTO employees (id, "userId", "firstName", "lastName", department, "jobPosition", status, "scheduleId", "createdAt") VALUES
     ($1, $6, 'Ananya', 'Admin', 'Human Resources', 'Administrator', 'ACTIVE', $11, now()),
     ($2, $7, 'Priya', 'Sharma', 'Human Resources', 'HR Manager', 'ACTIVE', $11, now()),
     ($3, $8, 'Rahul', 'Verma', 'Engineering', 'Software Engineer', 'ACTIVE', $11, now()),
     ($4, $9, 'Neha', 'Patel', 'Finance', 'Payroll Specialist', 'ACTIVE', $11, now()),
     ($5, $10, 'Vikram', 'Singh', 'Finance', 'Payroll Manager', 'ACTIVE', $11, now())`,
    [IDS.emp1, IDS.emp2, IDS.emp3, IDS.emp4, IDS.emp5, IDS.adminUser, IDS.hrUser, IDS.empUser, IDS.hrPayrollUser, IDS.hrPayrollManager, IDS.schedule]
  );

  // Contracts
  await client.query(
    `INSERT INTO contracts (id, "employeeId", "startDate", wage, department, "jobPosition", "structureId", status, "createdAt")
     VALUES ($1, $2, '2025-01-01', 60000, 'Engineering', 'Software Engineer', $3, 'ACTIVE', now())`,
    [randomUUID(), IDS.emp3, IDS.structure]
  );

  // Time Off Types
  await client.query(
    `INSERT INTO time_off_types (id, name, unit, "requiresAllocation", "requiresApproval", "payrollIntegration") VALUES
     ($1, 'Casual Leave', 'DAYS', true, true, false),
     ($2, 'Sick Leave', 'DAYS', true, true, false)`,
    [IDS.timeOffCasual, IDS.timeOffSick]
  );

  // Allocations for the Engineer employee
  await client.query(
    `INSERT INTO allocations (id, "employeeId", "timeOffTypeId", allocated, taken, "validFrom", "validTo", "createdAt") VALUES
     ($1, $3, $4, 20, 0, '2026-01-01', '2026-12-31', now()),
     ($2, $3, $5, 10, 0, '2026-01-01', '2026-12-31', now())`,
    [randomUUID(), randomUUID(), IDS.emp3, IDS.timeOffCasual, IDS.timeOffSick]
  );

  console.log('Seed complete.');
  console.log('Login credentials for all seeded users — password: password123');
  console.log('  admin@peoplepay360.com (ADMIN)');
  console.log('  hr@peoplepay360.com (HR_MANAGER)');
  console.log('  employee@peoplepay360.com (EMPLOYEE)');
  console.log('  payroll@peoplepay360.com (HR_PAYROLL_USER)');
  console.log('  payroll_manager@peoplepay360.com (HR_PAYROLL_MANAGER)');

  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});