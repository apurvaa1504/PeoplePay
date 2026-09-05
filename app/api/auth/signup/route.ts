import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, role, firstName, lastName, department, jobPosition } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const existing = await db.orm.public.User.where({ email }).first();
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await db.orm.public.User
    .select('id', 'email', 'role')
    .create({
      email,
      passwordHash,
      role: role ?? 'EMPLOYEE',
    });

  // If registering as EMPLOYEE, connect to existing Employee profile or create one
  if ((role ?? 'EMPLOYEE') === 'EMPLOYEE') {
    try {
      let fName = firstName?.trim();
      let lName = lastName?.trim();

      if (!fName) {
        const emailPrefix = email.split('@')[0];
        const parts = emailPrefix.split(/[._-]/);
        fName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Employee';
        lName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
      }

      // Check all existing employees to find a match by Name or Unlinked profile
      const allEmployees = await db.orm.public.Employee.all();

      // Look for match by first name & last name, or first name only if last name was not provided
      let matchedEmp = allEmployees.find((e: any) => {
        const empFirst = e.firstName?.trim().toLowerCase();
        const empLast = e.lastName?.trim().toLowerCase();
        const inputFirst = fName.toLowerCase();
        const inputLast = lName?.toLowerCase();

        // Exact full name match
        if (empFirst === inputFirst && inputLast && empLast === inputLast) return true;

        // Match first name if last name wasn't provided or matches
        if (empFirst === inputFirst && (!inputLast || !empLast || empLast === inputLast)) return true;

        // Match combined full name string
        const empFull = `${empFirst} ${empLast}`.trim();
        const inputFull = `${inputFirst} ${inputLast || ''}`.trim();
        if (empFull === inputFull || empFull.includes(inputFirst)) return true;

        return false;
      });

      // If matched by name, link the employee to this new user account!
      if (matchedEmp) {
        await db.orm.public.Employee.where({ id: matchedEmp.id }).update({
          userId: user.id,
        });
        const token = signToken({ userId: user.id, role: user.role });
        return NextResponse.json(
          {
            token,
            user: { ...user, employeeId: matchedEmp.id },
          },
          { status: 201 }
        );
      }

      // If no existing employee matched, create the employee profile
      const schedule = await db.orm.public.WorkingSchedule.first();
      const createdEmp = await db.orm.public.Employee.create({
        userId: user.id,
        firstName: fName,
        lastName: lName || 'Staff',
        department: department || 'Engineering',
        jobPosition: jobPosition || 'Software Engineer',
        status: 'ACTIVE',
        scheduleId: schedule?.id ?? null,
      });

      const token = signToken({ userId: user.id, role: user.role });
      return NextResponse.json(
        {
          token,
          user: { ...user, employeeId: createdEmp?.id },
        },
        { status: 201 }
      );
    } catch (e) {
      console.error('Failed to link or create employee profile:', e);
    }
  }

  const token = signToken({ userId: user.id, role: user.role });
  return NextResponse.json({ token, user }, { status: 201 });
}