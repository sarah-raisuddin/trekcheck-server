import { Router } from "express";
const router = Router();
import pool from "../../db.js";
import generatePlaceholders from "../util.js";

router.get("/trails", async (req, res) => {
  try {
    const query = `select * from trails`;
    const result = await pool.query(query);

    res.status(200).json({
      trails: result.rows,
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/trail", async (req, res) => {
  const fields = ["name", "address"];
  const values = fields.map((field) => req.body[field]);

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const placeholders = generatePlaceholders(fields.length);
    const query = `INSERT INTO trails (${fields.join(
      ", "
    )}) VALUES (${placeholders}) RETURNING id`;
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Trail registered",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/checkpoints", async (req, res) => {
  const { trail_id } = req.query;
  if (!trail_id) {
    return res.status(400).json({ message: "trail_id is required" });
  }

  try {
    const query = `SELECT * FROM checkpoints WHERE trail_id = $1`;
    const result = await pool.query(query, [trail_id]);

    res.status(200).json({
      checkpoints: result.rows,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/checkpoints", async (req, res) => {
  const fields = ["checkpoint_order", "trail_id", "latitude", "longitude"];
  const values = fields.map((field) => req.body[field]);

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const placeholders = generatePlaceholders(fields.length);
    const query = `INSERT INTO checkpoints (${fields.join(
      ", "
    )}) VALUES (${placeholders}) RETURNING id`;
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "checkpoint added",
      checkpointId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/checkpoints/:id", async (req, res) => {
  const fields = [
    "checkpoint_order",
    "trail_id",
    "latitude",
    "longitude",
    "checkpoint_name",
  ];
  const values = fields.map((field) => req.body[field]);
  const { id } = req.params;

  // Validate required fields
  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Additional validation (e.g., checking types) can be added here

  try {
    // Generate SET clause for the update query
    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const query = `UPDATE checkpoints SET ${setClause} WHERE id = $${
      fields.length + 1
    }`;

    // Include the ID as the last value
    const result = await pool.query(query, [...values, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Checkpoint not found" });
    }

    res.status(200).json({
      message: "Checkpoint updated successfully",
    });
  } catch (error) {
    console.error("Error updating checkpoint:", error); // Improved error message
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
