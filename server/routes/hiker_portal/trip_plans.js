import { Router } from "express";
import pool from "../../db.js";

const router = Router();

router.get("/trip_plans", async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }
  try {
    const query = `select * from TripPlans where user_id = $1`;
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
  const fields = [
    "user_id",
    "start_date",
    "end_date",
    "entry_point",
    "exit_point",
    "emergency_contact_name",
    "emergency_contact_number",
    "rfid_tag_uid",
    "progress_tracking_link",
  ];

  const values = fields.map((field) => req.body[field]);

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const placeholders = generatePlaceholders(fields.length);
    const query = `INSERT INTO TripPlans (${fields.join(
      ", "
    )}) VALUES (${placeholders}) RETURNING id`;
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "trip plan added",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
