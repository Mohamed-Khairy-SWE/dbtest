import { Pool } from 'pg';

// Ideally, put these in .env.local
// DATABASE_URL=postgresql://user:password@localhost:5432/library_db
const pool = new Pool({
  user: 'postgres',      // Replace with your DB user
  host: 'localhost',
  database: 'library_db', // Replace with your DB name
  password: 'password',   // Replace with your DB password
  port: 5432,
});

export default pool;