import { Router } from "express";
import pool from "../../db.js";
import generatePlaceholders from "../util.js";

const router = Router();

router.post("/progress", async (req, res) => {
  if (!req.body.checkpoints) {
    return res.status(400).json({ message: "Checkpoints data is missing" });
  }

  const checkpoints = req.body.checkpoints;
  const values = [];
  const fields = ["checkpoint_id", "time", "tag_id"];

  checkpoints.forEach((checkpoint) => {
    const entryValues = [
      checkpoint.checkpoint_id,
      checkpoint.time,
      checkpoint.tag_id,
    ];

    if (entryValues.includes(undefined) || entryValues.includes(null)) {
      console.log("Skipping incomplete entry");
    } else {
      values.push(...entryValues);
    }
  });

  if (values.length === 0) {
    return res.status(400).json({ message: "No valid checkpoints provided" });
  }

  const numFields = fields.length;
  const numRows = values.length / numFields;
  const placeholders = Array(numRows)
    .fill(0)
    .map(
      (_, rowIndex) =>
        `(${fields
          .map((_, colIndex) => `$${rowIndex * numFields + colIndex + 1}`)
          .join(", ")})`
    )
    .join(", ");

  const query = `INSERT INTO CheckpointEntries (${fields.join(", ")})
      VALUES ${placeholders}`;

  try {
    const result = await pool.query(query, values);
    res.status(201).json({
      message: "Checkpoints added",
    });
  } catch (error) {
    console.error("Error adding checkpoints:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/progress", async (req, res) => {
  const { unique_link } = req.query;
  if (!unique_link) {
    return res.status(400).json({ message: "unique_link is required" });
  }
  try {
    // select * from checkpoint entries
    const query = `-- Use the WITH clause to make the query more readable
                WITH rfid_cte AS (
                    SELECT rfid_tag
                    FROM trip_plan
                    WHERE unique_tracking_link = $1
                )
                SELECT *
                FROM checkpoint_entries
                WHERE rfid_tag = (SELECT rfid_tag FROM rfid_cte);`;

    const result = await pool.query(query, [unique_link]);

    res.status(200).json({
      trails: result.rows,
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
