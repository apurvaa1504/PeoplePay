import { Client } from 'pg';
import 'dotenv/config';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  const res = await client.query('SELECT email, role FROM users;');
  console.log(res.rows);
  await client.end();
}

main();