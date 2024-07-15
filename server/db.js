const { Pool } = require("pg");

const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "please_db",
  password: "admin",
  port: 15432,
  options: "-c search_path=trekcheck",
});

module.exports = pool;
