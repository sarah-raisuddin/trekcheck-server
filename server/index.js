import express from "express";
import bp from "body-parser";
import cors from "cors";
const { json } = bp;

const app = express();
app.use(json());
const port = 3000;

app.use(
  cors({
    origin: "http://localhost:3001", // Replace with your frontend URL
  })
);

// PostgreSQL connection setup
import userRoutes from "./routes/hiker_portal/users.js";
import sarUserRoutes from "./routes/sar_dashboard/users.js";
import trailRoutes from "./routes/sar_dashboard/trails.js";
import tripPlanRoutes from "./routes/hiker_portal/trip_plans.js";
import progressRoutes from "./routes/hiker_portal/progress.js";

// Mount routes
app.use("/hiker_portal", [userRoutes, tripPlanRoutes, progressRoutes]); // Prefix all routes in userRoutes with '/hiker_portal'
app.use("/sar_dashboard", [trailRoutes, sarUserRoutes]);
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
