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
    // Updated SQL query to fetch both trip plan and checkpoint entries
    const query = `
      WITH rfid_cte AS (
        SELECT rfid_tag_uid
        FROM trekcheck.tripPlans
        WHERE progress_tracking_link = $1
        LIMIT 1
      )
      SELECT 
        tp.*,  
        ce.*  
      FROM trekcheck.tripPlans tp
      LEFT JOIN trekcheck.CheckpointEntries ce
        ON ce.tag_id = (SELECT rfid_tag_uid FROM rfid_cte)
      WHERE tp.progress_tracking_link = $1;`;

    const result = await pool.query(query, [unique_link]);

    const tripPlan = result.rows.length > 0 ? result.rows[0] : null;
    const checkpointEntries = result.rows.filter((row) => row.tag_id); // Adjust based on your data structure

    res.status(200).json({
      tripPlan,
      checkpointEntries,
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export const fetchProgress = async ({ uniqueLink }) => {
  // Replace with your API endpoint
  const apiEndpoint = `/progress?unique_link=${encodeURIComponent(uniqueLink)}`;

  try {
    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Successfully retrieved progress", data);
      return data.trails;
    } else {
      console.error(
        "Error response from server:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error during progress fetch:", error);
  }
};

export default router;
