import { Router } from "express";
import pool from "../../db.js";
import { generatePlaceholders } from "../util.js";
import { v4 as uuidv4 } from "uuid";
import webtoken from "jsonwebtoken";

const SECRET_KEY = "randomhash";

const router = Router();

router.get("/trip_plans", async (req, res) => {
  // check auth token
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    console.log("bunked at auth header");
    return res.status(401).json({ message: "Authorization header not found" });
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    console.log("bunked at auth token");
    return res.status(401).json({ message: "Authorization token not found" });
  }

  // TODO: remove userID from request params
  try {
    const decodedToken = webtoken.verify(token, SECRET_KEY);
    const user_id = decodedToken.userId;
    console.log("userID: ", user_id);

    const query = `
      SELECT tp.*, t.name AS trail_name
      FROM TripPlans tp
      LEFT JOIN Trails t ON tp.trail_id = t.id
      WHERE tp.user_id = $1;
    `;

    const result = await pool.query(query, [user_id]);

    res.status(200).json({
      trails: result.rows,
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/trip_plans", async (req, res) => {
  // check auth token
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    console.log("bunked at auth header");
    return res.status(401).json({ message: "Authorization header not found" });
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    console.log("bunked at auth token");
    return res.status(401).json({ message: "Authorization token not found" });
  }

  let decoded;
  try {
    decoded = webtoken.verify(token, SECRET_KEY);
  } catch (error) {
    console.log("Invalid token", error);
    return res.status(401).json({ message: "Invalid token" });
  }

  const userId = decoded.userId;

  const fields = [
    "user_id",
    "start_date",
    "end_date",
    "trail_id",
    "entry_point",
    "exit_point",
    "emergency_contact_name",
    "emergency_contact_number",
    "additional_notes",
  ];

  const values = [
    userId,
    req.body.start_date,
    req.body.end_date,
    req.body.trail_id,
    req.body.entry_point,
    req.body.exit_point,
    req.body.emergency_contact_name,
    req.body.emergency_contact_number,
    req.body.additional_notes,
  ];

  console.log(values);

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const trackingLink = uuidv4();
  fields.push("progress_tracking_link");
  values.push(trackingLink);

  try {
    const placeholders = generatePlaceholders(fields.length);
    const query = `INSERT INTO TripPlans (${fields.join(
      ", "
    )}) VALUES (${placeholders}) RETURNING id`;
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "trip plan added",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// get all info for user's trip plan
router.get("/trip_plan/:trip_id", async (req, res) => {
  // check auth token
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    console.log("bunked at auth header");
    return res.status(401).json({ message: "Authorization header not found" });
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    console.log("bunked at auth token");
    return res.status(401).json({ message: "Authorization token not found" });
  }

  let decoded;
  try {
    decoded = webtoken.verify(token, SECRET_KEY);
  } catch (error) {
    console.log("Invalid token", error);
    return res.status(401).json({ message: "Invalid token" });
  }

  const userId = decoded.userId;
  const tripId = parseInt(req.params.trip_id, 10);

  if (isNaN(userId) || isNaN(tripId)) {
    return res.status(400).json({ error: "Invalid user ID or trip ID" });
  }

  try {
    const tripPlanQuery = `
      SELECT tp.*, t.name AS trail_name
      FROM TripPlans tp
      LEFT JOIN Trails t ON tp.trail_id = t.id
      WHERE tp.user_id = $1 AND tp.id = $2;
    `;

    const tripPlanResult = await pool.query(tripPlanQuery, [userId, tripId]);

    if (tripPlanResult.rows.length === 0) {
      return res.status(404).json({ error: "Trip plan not found" });
    }

    const tripPlanTrailId = tripPlanResult.rows[0].trail_id;
    const tripPlanStartPointId = tripPlanResult.rows[0].entry_point;
    const tripPlanEndPointId = tripPlanResult.rows[0].exit_point;

    const checkpointNameQuery = `SELECT name FROM checkpoints WHERE trail_id = $1 AND id = $2`;
    const startPointNameResult = await pool.query(checkpointNameQuery, [
      tripPlanTrailId,
      tripPlanStartPointId,
    ]);
    const endPointNameResult = await pool.query(checkpointNameQuery, [
      tripPlanTrailId,
      tripPlanEndPointId,
    ]);

    res.status(200).json({
      trail: tripPlanResult.rows[0],
      startPointName: startPointNameResult.rows[0].name,
      endPointName: endPointNameResult.rows[0].name,
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/trip_plan/:trip_id", async (req, res) => {
  // check auth token
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    console.log("bunked at auth header");
    return res.status(401).json({ message: "Authorization header not found" });
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    console.log("bunked at auth token");
    return res.status(401).json({ message: "Authorization token not found" });
  }

  let decoded;
  try {
    decoded = webtoken.verify(token, SECRET_KEY);
  } catch (error) {
    console.log("Invalid token", error);
    return res.status(401).json({ message: "Invalid token" });
  }
  const userId = decoded.userId;

  const fields = [
    "entry_point",
    "exit_point",
    "start_date",
    "end_date",
    "emergency_contact_name",
    "emergency_contact_number",
    "additional_notes",
  ];
  const values = fields.map((field) => req.body[field]);

  const tripId = parseInt(req.params.trip_id, 10);

  if (isNaN(userId) || isNaN(tripId)) {
    return res.status(400).json({ error: "Invalid user ID or trip ID" });
  }

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const setStatement = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const query = `UPDATE tripplans SET ${setStatement} WHERE id = $${
      fields.length + 1
    } AND user_id = $${fields.length + 2}`;

    const result = await pool.query(query, [...values, tripId, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "trip plan not found" });
    }

    res.status(200).json({
      message: "user updated successfully",
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/add_emergency_contact/:trip_id", async (req, res) => {
  const tripId = parseInt(req.params.trip_id, 10);
  const emergency_email = req.body["emergency_contact_email"];

  console.log(emergency_email);

  try {
    const query = `
      UPDATE TripPlans
      SET emergency_contact_email = $1
      WHERE id = $2;
    `;

    const result = await pool.query(query, [emergency_email, tripId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Trip plan not found" });
    }

    res.status(200).json({ message: "Trip plan updated successfully" });
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/archive_trip_plan", async (req, res) => {
  // check auth token
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    console.log("bunked at auth header");
    return res.status(401).json({ message: "Authorization header not found" });
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    console.log("bunked at auth token");
    return res.status(401).json({ message: "Authorization token not found" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "id is required" });
  }

  try {
    const query = `
      UPDATE TripPlans
      SET archived = true
      WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Trip plan not found" });
    }

    res.status(200).json({ message: "Trip plan archived successfully" });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
