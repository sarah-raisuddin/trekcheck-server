import { Router } from "express";
import pool from "../../db.js";
import { decodeSatelliteData, generatePlaceholders } from "../util.js";
import SendmailTransport from "nodemailer/lib/sendmail-transport/index.js";
import { sendEmail, sendNotificationEmail } from "../../emailer.js";

const router = Router();

router.post("/progress", async (req, res) => {
  if (!req.body.data) {
    return res.status(400).json({ message: "Satellite data is missing" });
  }

  // Decode binary data
  const hexString = req.body.data;
  const entries = decodeSatelliteData(hexString);

  if (entries.length === 0) {
    return res.status(400).json({ message: "No valid entries found" });
  }

  // Extract the date from the first entry
  const firstEntry = entries[0];
  const date = firstEntry ? firstEntry.date : null;

  // Filter out entries with tag_id equal to 0
  const filteredEntries = entries.filter((entry) => entry.tag_id !== 0);

  const fields = ["pole_id", "time", "tag_id"];
  const values = [];
  const numFields = fields.length;
  const numRows = filteredEntries.length;

  const placeholders = Array(numRows)
    .fill(0)
    .map(
      (_, rowIndex) =>
        `(${fields
          .map((_, colIndex) => `$${rowIndex * numFields + colIndex + 1}`)
          .join(", ")})`
    )
    .join(", ");

  filteredEntries.forEach(async (entry) => {
    const time = entry.time || "00:00";
    const dateStr = date || new Date().toISOString().split("T")[0];
    const formattedDate = dateStr.split("-").reverse().join("-");
    const formattedTimestamp = `${formattedDate} ${time.padEnd(5, "0")}:00`;
    values.push(entry.pole_id, formattedTimestamp, entry.tag_id);

    try {
      await sendNotificationEmail(entry.tag_id, entry.pole_id, entry.time);
    } catch (error) {
      console.error(`Error sending email for tag ${entry.tag_id}:`, error);
    }
  });

  const query = `INSERT INTO CheckpointEntries (${fields.join(", ")})
    VALUES ${placeholders}`;
  console.log(query);

  try {
    await pool.query(query, values);
    res.status(201).json({
      message: "Checkpoint entries added successfully",
    });
  } catch (error) {
    console.error("Error adding checkpoints entries:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/emailTest", async (req, res) => {
  console.log("blooding sending it");
  await sendEmail();
});

router.get("/progress", async (req, res) => {
  const { uid } = req.query;
  console.log(uid);
  if (!uid) {
    return res.status(400).json({ message: "unique_link is required" });
  }
  try {
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

    const result = await pool.query(query, [uid]);

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
