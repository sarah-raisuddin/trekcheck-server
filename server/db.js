import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "please_db",
  password: "admin",
  port: 15432,
  options: "-c search_path=trekcheck",
});

export default pool;
