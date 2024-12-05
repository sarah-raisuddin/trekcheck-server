import { Router } from "express";
import pool from "../../db.js";
import { decodeSatelliteData, generatePlaceholders } from "../util.js";
import { sendEmail, sendNotificationEmail } from "../../emailer.js";

const router = Router();

router.post("/progress", async (req, res) => {
  if (!req.body.data) {
    return res.status(400).json({ message: "Satellite data is missing" });
  }

  const hexString = req.body.data;
  const decodedData = decodeSatelliteData(hexString);

  // Filter out entries with tag_id equal to 0
  const entries = decodedData.entries;
  const filteredEntries = entries.filter((entry) => entry.tag_id !== 0);

  const fields = ["pole_id", "time", "tag_id"];
  const values = [];
  const numFields = fields.length;
  const numRows = filteredEntries.length;

  // get poleId from first entry
  const pole_id = entries[0].pole_id;
  const battery_percentage = decodedData.batteryPercentage;

  const placeholders = Array(numRows)
    .fill(0)
    .map(
      (_, rowIndex) =>
        `(${fields
          .map((_, colIndex) => `$${rowIndex * numFields + colIndex + 1}`)
          .join(", ")})`
    )
    .join(", ");

  // Process entries asynchronously
  const processEntries = filteredEntries.map(async (entry) => {
    const time = entry.time || "00:00"; // Default to "00:00" if time is not provided
    const dateStr = entry.date || new Date().toISOString().split("T")[0]; // Use today's date if not provided
    const formattedDate = dateStr.split("-").reverse().join("-");

    // Ensure the time is in a valid format (HH:mm)
    const [hours, minutes] = time.split(":").map((num) => parseInt(num, 10));

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      console.error(`Invalid time value: ${time}`);
      return; // Skip this entry if the time is invalid
    }

    // Fix invalid time (e.g., 65 minutes)
    const date = new Date(`${formattedDate}T${time}:00`);
    let validMinutes = date.getMinutes();

    // If minutes exceed 59, adjust
    if (validMinutes >= 60) {
      date.setMinutes(0);
      date.setHours(date.getHours() + 1); // Increment the hour
    }

    // Format the corrected time
    const fixedTime = date.toISOString().split("T")[1].slice(0, 5);
    const formattedTimestamp = `${formattedDate} ${fixedTime}:00`;

    values.push(entry.pole_id, formattedTimestamp, entry.tag_id);

    // Optionally send email in the background (if needed)
    try {
      // You can move this to background processing if necessary
      await sendNotificationEmail(entry.tag_id, entry.pole_id, entry.time);
    } catch (error) {
      console.error(`Error sending email for tag ${entry.tag_id}:`, error);
    }
  });

  // Use Promise.all to wait for all entries to be processed
  await Promise.all(processEntries);

  const query = `INSERT INTO CheckpointEntries (${fields.join(", ")})
    VALUES ${placeholders}`;

  const updateCheckpointQuery = `UPDATE Checkpoints
  SET battery_percentage = $1 
  WHERE pole_id = $2`;

  try {
    // Execute database queries efficiently
    await pool.query(query, values);
    console.log("this is what we're sending in" + query + values);

    // Update the checkpoint info
    await pool.query(updateCheckpointQuery, [battery_percentage, pole_id]);

    // Send a response immediately
    res.status(200).json({
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
    const query = `WITH rfid_cte AS (
      SELECT u.rfid_tag_uid
      FROM trekcheck.TripPlans tp
      JOIN trekcheck.Users u ON tp.user_id = u.id
      WHERE tp.progress_tracking_link = $1
      LIMIT 1
    )
    SELECT 
        tp.*,  
        ce.*,  
        u.first_name  
    FROM trekcheck.TripPlans tp
    LEFT JOIN trekcheck.CheckpointEntries ce
        ON ce.tag_id = (SELECT rfid_tag_uid FROM rfid_cte)
    LEFT JOIN trekcheck.Checkpoints cp
        ON ce.pole_id = cp.pole_id
        AND cp.trail_id = tp.trail_id
    JOIN trekcheck.Users u 
        ON tp.user_id = u.id
    WHERE tp.progress_tracking_link = $1;
`;

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
