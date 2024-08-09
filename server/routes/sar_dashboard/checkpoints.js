import { Router } from "express";
const router = Router();
import pool from "../../db.js";
import generatePlaceholders from "../util.js";

const errMsg500 = "oops";
const handleError = (res, msg) => {
  res.status(500).json({ message: msg });
};

// validation to keep order of checkpoints consistent for new updates
const updateCheckpointOrders = async (newOrder, trailId) => {
  const query = `
      UPDATE checkpoints
      SET checkpoint_order = checkpoint_order + 1
      WHERE trail_id = $1 AND checkpoint_order >= $2
    `;
  await pool.query(query, [trailId, newOrder]);
};

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
    handleError(res, errMsg500);
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
    handleError(res, errMsg500);
  }
});

router.put("/checkpoints/:id", async (req, res) => {
  const fields = [
    "checkpoint_order",
    "trail_id",
    "latitude",
    "longitude",
    "name",
  ];
  const values = fields.map((field) => req.body[field]);
  const { id } = req.params;

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    if (checkpointOrder !== null) {
      await updateCheckpointOrders(checkpointOrder, trailId);
    }
    const setStatement = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const query = `UPDATE checkpoints SET ${setStatement} WHERE id = $${
      fields.length + 1
    }`;

    const result = await pool.query(query, [...values, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Checkpoint not found" });
    }

    res.status(200).json({
      message: "Checkpoint updated successfully",
    });
  } catch (error) {
    handleError(res, errMsg500);
  }
});

export default router;
