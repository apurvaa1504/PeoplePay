#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract';
import startContract from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6cdc588cf539de8257f06f664b1724e43f7c421a0da205fe384cccb5ebf723aa/contract';
import endContract from '../../snapshots/6cdc588cf539de8257f06f664b1724e43f7c421a0da205fe384cccb5ebf723aa/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'post' }),
      this.dropTable({ schema: 'public', table: 'user' }),
      this.createTable({
        schema: 'public',
        table: 'allocations',
        columns: [
          col('allocated', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('employeeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('taken', 'float8', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/float8@1' },
          }),
          col('timeOffTypeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('validFrom', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('validTo', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'attendances',
        columns: [
          col('checkIn', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('checkOut', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('correctedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('correctedBy', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('employeeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PRESENT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('workedHours', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'attendances_status_check_74a29b6f',
            "\"status\" IN ('PRESENT', 'LATE', 'ABSENT', 'OVERTIME', 'MANUAL_CORRECTION')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'contracts',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('department', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('employeeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('endDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('jobPosition', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('structureId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('wage', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'contracts_status_check_109c26c6',
            "\"status\" IN ('DRAFT', 'ACTIVE', 'EXPIRED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'employees',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('department', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('firstName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('jobPosition', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lastName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('managerId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('scheduleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('userId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'employees_status_check_ee520df2',
            "\"status\" IN ('ACTIVE', 'INACTIVE')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'payruns',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('periodEnd', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('periodStart', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('structureId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'payruns_status_check_8dad9e44',
            "\"status\" IN ('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'payslip_lines',
        columns: [
          col('amount', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('category', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('payslipId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ruleId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sequence', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'payslip_lines_category_check_3d248fbd',
            "\"category\" IN ('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'payslips',
        columns: [
          col('contractId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('employeeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('netSalary', 'float8', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/float8@1' },
          }),
          col('payrunId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('warnings', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('workedDays', 'float8', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/float8@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'salary_rules',
        columns: [
          col('category', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('computationMethod', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fixedAmount', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('formula', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('percentage', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'salary_rules_category_check_3d248fbd',
            "\"category\" IN ('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET')",
          ),
          checkExpression(
            'salary_rules_computationMethod_check_62f8c0a2',
            "\"computationMethod\" IN ('FIXED', 'PERCENTAGE', 'FORMULA')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'salary_structure_rules',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ruleId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sequence', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('structureId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'salary_structures',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'schedule_lines',
        columns: [
          col('breakMins', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('day', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('endTime', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('scheduleId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startTime', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'time_off_requests',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('decidedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('decidedBy', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('duration', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('employeeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('endDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('timeOffTypeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'time_off_requests_status_check_510c7a8c',
            "\"status\" IN ('PENDING', 'APPROVED', 'REFUSED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'time_off_types',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('payrollIntegration', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('requiresAllocation', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('requiresApproval', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('unit', 'text', {
            notNull: true,
            default: lit('DAYS'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('time_off_types_unit_check_1fe1674b', "\"unit\" IN ('DAYS', 'HOURS')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('EMPLOYEE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'users_role_check_442cfa5f',
            "\"role\" IN ('EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'working_schedules',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('weeklyHours', 'float8', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/float8@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'employees',
        constraint: 'employees_userId_key',
        columns: ['userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'salary_rules',
        constraint: 'salary_rules_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'allocations',
        index: 'allocations_employeeId_idx_087dd4a6',
        columns: ['employeeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'allocations',
        index: 'allocations_timeOffTypeId_idx_3512d8f4',
        columns: ['timeOffTypeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'attendances',
        index: 'attendances_employeeId_idx_087dd4a6',
        columns: ['employeeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'contracts',
        index: 'contracts_employeeId_idx_087dd4a6',
        columns: ['employeeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'contracts',
        index: 'contracts_structureId_idx_e6bb5662',
        columns: ['structureId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'employees',
        index: 'employees_managerId_idx_f8369ba6',
        columns: ['managerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'employees',
        index: 'employees_scheduleId_idx_5a3bfbcb',
        columns: ['scheduleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payruns',
        index: 'payruns_structureId_idx_e6bb5662',
        columns: ['structureId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payslip_lines',
        index: 'payslip_lines_payslipId_idx_a0500224',
        columns: ['payslipId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payslip_lines',
        index: 'payslip_lines_ruleId_idx_05e770f7',
        columns: ['ruleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payslips',
        index: 'payslips_payrunId_idx_8618ecfd',
        columns: ['payrunId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salary_structure_rules',
        index: 'salary_structure_rules_ruleId_idx_05e770f7',
        columns: ['ruleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salary_structure_rules',
        index: 'salary_structure_rules_structureId_idx_e6bb5662',
        columns: ['structureId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'schedule_lines',
        index: 'schedule_lines_scheduleId_idx_5a3bfbcb',
        columns: ['scheduleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'time_off_requests',
        index: 'time_off_requests_employeeId_idx_087dd4a6',
        columns: ['employeeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'time_off_requests',
        index: 'time_off_requests_timeOffTypeId_idx_3512d8f4',
        columns: ['timeOffTypeId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'allocations',
        foreignKey: {
          name: 'allocations_employeeId_fkey',
          columns: ['employeeId'],
          references: { schema: 'public', table: 'employees', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'allocations',
        foreignKey: {
          name: 'allocations_timeOffTypeId_fkey',
          columns: ['timeOffTypeId'],
          references: { schema: 'public', table: 'time_off_types', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'attendances',
        foreignKey: {
          name: 'attendances_employeeId_fkey',
          columns: ['employeeId'],
          references: { schema: 'public', table: 'employees', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'contracts',
        foreignKey: {
          name: 'contracts_employeeId_fkey',
          columns: ['employeeId'],
          references: { schema: 'public', table: 'employees', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'contracts',
        foreignKey: {
          name: 'contracts_structureId_fkey',
          columns: ['structureId'],
          references: { schema: 'public', table: 'salary_structures', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'employees',
        foreignKey: {
          name: 'employees_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'employees',
        foreignKey: {
          name: 'employees_managerId_fkey',
          columns: ['managerId'],
          references: { schema: 'public', table: 'employees', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'employees',
        foreignKey: {
          name: 'employees_scheduleId_fkey',
          columns: ['scheduleId'],
          references: { schema: 'public', table: 'working_schedules', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payruns',
        foreignKey: {
          name: 'payruns_structureId_fkey',
          columns: ['structureId'],
          references: { schema: 'public', table: 'salary_structures', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payslip_lines',
        foreignKey: {
          name: 'payslip_lines_payslipId_fkey',
          columns: ['payslipId'],
          references: { schema: 'public', table: 'payslips', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payslip_lines',
        foreignKey: {
          name: 'payslip_lines_ruleId_fkey',
          columns: ['ruleId'],
          references: { schema: 'public', table: 'salary_rules', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payslips',
        foreignKey: {
          name: 'payslips_payrunId_fkey',
          columns: ['payrunId'],
          references: { schema: 'public', table: 'payruns', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'salary_structure_rules',
        foreignKey: {
          name: 'salary_structure_rules_structureId_fkey',
          columns: ['structureId'],
          references: { schema: 'public', table: 'salary_structures', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'salary_structure_rules',
        foreignKey: {
          name: 'salary_structure_rules_ruleId_fkey',
          columns: ['ruleId'],
          references: { schema: 'public', table: 'salary_rules', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'schedule_lines',
        foreignKey: {
          name: 'schedule_lines_scheduleId_fkey',
          columns: ['scheduleId'],
          references: { schema: 'public', table: 'working_schedules', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'time_off_requests',
        foreignKey: {
          name: 'time_off_requests_employeeId_fkey',
          columns: ['employeeId'],
          references: { schema: 'public', table: 'employees', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'time_off_requests',
        foreignKey: {
          name: 'time_off_requests_timeOffTypeId_fkey',
          columns: ['timeOffTypeId'],
          references: { schema: 'public', table: 'time_off_types', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
