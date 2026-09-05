import { Client } from 'pg';
import 'dotenv/config';
import { randomUUID } from 'crypto';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const userRes = await client.query("SELECT id FROM users WHERE email = 'test2@test.com';");
  const userId = userRes.rows[0].id;

  const employeeId = randomUUID();
  await client.query(
    `INSERT INTO employees (id, "userId", "firstName", "lastName", status, "createdAt")
     VALUES ($1, $2, $3, $4, $5, now())`,
    [employeeId, userId, 'Test', 'Employee', 'ACTIVE']
  );

  console.log('Created employee:', employeeId);
  await client.end();
}

main();