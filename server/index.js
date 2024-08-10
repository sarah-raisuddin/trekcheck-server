import express from "express";
import bp from "body-parser";
import cors from "cors";
import "dotenv/config";

const { json } = bp;

const app = express();
app.use(json());

const allowedOrigins = ["http://localhost:3001", "http://localhost:3002"];

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

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello, Azure! This is a Node.js application.");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// Mount routes
app.use("/hiker_portal", [userRoutes, tripPlanRoutes, progressRoutes]); // Prefix all routes in userRoutes with '/hiker_portal'
app.use("/sar_dashboard", [trailRoutes, sarUserRoutes, checkpointRoutes]);
