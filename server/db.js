import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "wandersafe", // Your server admin login name
  host: "trekcheck-db.postgres.database.azure.com", // Your server name
  database: "postgres", // Replace with the name of your database
  password: "Test123!", // Replace with your admin password
  port: 5432, // Default PostgreSQL port
  ssl: {
    rejectUnauthorized: false, // Azure PostgreSQL requires SSL
  },
});

pool.on("connect", (client) => {
  client.query("SET search_path TO trekcheck");
});

export default pool;
