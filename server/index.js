import express, { query } from "express";
import bp from "body-parser";
import cors from "cors";
import "dotenv/config";

const { json } = bp;

const app = express();
app.use(json());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://sardash.trekcheck.ca",
  "https://hikerportal.trekcheck.ca",
  "https://hikerportal.azurewebsites.net",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// PostgreSQL connection setup
import userRoutes from "./routes/hiker_portal/users.js";
import sarUserRoutes from "./routes/sar_dashboard/users.js";
import trailRoutes from "./routes/sar_dashboard/trails.js";
import checkpointRoutes from "./routes/sar_dashboard/checkpoints.js";
import tripPlanRoutes from "./routes/hiker_portal/trip_plans.js";
import progressRoutes from "./routes/hiker_portal/progress.js";
import bugRoutes from "./routes/hiker_portal/bugs.js";
import pool from "./db.js";

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello, Azure! This is a Node.js application.");
});

app.get("/verify-db", async (req, res) => {
  try {
    // Verify database connection
    const client = await pool.connect();
    console.log("Connected to the database successfully!");

    // Query to list tables in the "trekcheck" schema
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'trekcheck'; 
    `);

    // Return the list of table names
    res.status(200).json({
      message: "Database connected and tables listed.",
      tables: result.rows,
    });

    client.release(); // Release the client back to the pool
  } catch (error) {
    console.error("Error connecting to the database:", error);
    res.status(500).json({
      message: "Failed to connect to the database",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// Mount routes
app.use("/hiker_portal", [
  userRoutes,
  tripPlanRoutes,
  progressRoutes,
  bugRoutes,
]); // Prefix all routes in userRoutes with '/hiker_portal'
app.use("/sar_dashboard", [trailRoutes, sarUserRoutes, checkpointRoutes]);
