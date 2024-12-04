import { Router } from "express";
const router = Router();
import pool from "../../db.js";
import { generatePlaceholders } from "../util.js";
import { sendTrailUpdateEmail } from "../../emailer.js";

const errMsg500 = "oops";
const handleError = (res, msg) => {
  res.status(500).json({ message: msg });
};

router.get("/trails", async (req, res) => {
  try {
    const query = `
      SELECT t.*, json_agg(c) AS checkpoints
      FROM trails t
      LEFT JOIN checkpoints c ON c.trail_id = t.id
      GROUP BY t.id;
    `;
    const result = await pool.query(query);

    res.status(200).json({
      trails: result.rows,
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/trailInfo/:id", async (req, res) => {
  const trailId = parseInt(req.params.id, 10);

  if (isNaN(trailId)) {
    return res.status(400).json({ error: "Invalid trail ID" });
  }

  try {
    const trailQuery = `SELECT * FROM trails WHERE id = $1`;
    const trailResult = await pool.query(trailQuery, [trailId]);

    if (trailResult.rows.length === 0) {
      return res.status(404).json({ error: "Trail not found" });
    }

    const checkpointsQuery = `SELECT * FROM checkpoints WHERE trail_id = $1 ORDER BY checkpoint_order ASC`;
    const checkpointsResult = await pool.query(checkpointsQuery, [trailId]);

    res.status(200).json({
      trail: trailResult.rows[0],
      checkpoints: checkpointsResult.rows,
    });
  } catch (error) {
    console.log(error);
    handleError(res, errMsg500);
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
    handleError(res, errMsg500);
  }
});

router.put("/trails/:id", async (req, res) => {
  const fields = ["name", "address"];
  const values = fields.map((field) => req.body[field]);
  const { id } = req.params;

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const setStatement = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const query = `UPDATE trails SET ${setStatement} WHERE id = $${
      fields.length + 1
    }`;

    const result = await pool.query(query, [...values, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "trail not found" });
    }

    res.status(200).json({
      message: "trail updated successfully",
    });
  } catch (error) {
    handleError(res, errMsg500);
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
    handleError(res, errMsg500);
  }
});

router.post("/checkpoints", async (req, res) => {
  const fields = [
    "checkpoint_order",
    "name",
    "trail_id",
    "latitude",
    "longitude",
    "pole_id",
  ];
  const values = fields.map((field) => req.body[field]);

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // const placeholders = generatePlaceholders(fields.length);
    // const query = `INSERT INTO checkpoints (${fields.join(
    //   ", "
    // )}) VALUES (${placeholders}) RETURNING id`;
    // const result = await pool.query(query, values);
    // res.status(201).json({
    //   message: "checkpoint added",
    //   checkpointId: result.rows[0].id,
    // });
  } catch (error) {
    handleError(res, errMsg500);
  }
});

router.put("/checkpoints/:id", async (req, res) => {
  console.log("in the checkpoints");
  const fields = [
    "checkpoint_order",
    "trail_id",
    "latitude",
    "longitude",
    "name",
    "pole_id",
  ];
  // const values = fields.map((field) => req.body[field]);
  // const { id } = req.params;

  // if (values.includes(undefined) || values.includes(null)) {
  //   return res.status(400).json({ message: "All fields are required" });
  // }

  console.log(req.body["trail_id"]);

  try {
    // const setStatement = fields
    //   .map((field, index) => `${field} = $${index + 1}`)
    //   .join(", ");
    // const query = `UPDATE checkpoints SET ${setStatement} WHERE id = $${
    //   fields.length + 1
    // }`;

    // const result = await pool.query(query, [...values, id]);
    // if (result.rowCount === 0) {
    //   return res.status(404).json({ message: "Checkpoint not found" });
    // }

    await sendTrailUpdateEmail(req.body["trail_id"]);

    res.status(200).json({
      message: "Checkpoint updated successfully",
    });
  } catch (error) {
    handleError(res, errMsg500);
  }
});

export default router;
