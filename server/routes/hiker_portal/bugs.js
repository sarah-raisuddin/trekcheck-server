import { Router } from "express";
import pool from "../../db.js";
import { generatePlaceholders } from "../util.js";

const router = Router();

router.post("/bug", async (req, res) => {
  const fields = ["submittedDate", "bugDescription"];
  const values = [new Date().toISOString(), req.body.bugDescription];

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const placeholders = generatePlaceholders(fields.length);
    const query = `INSERT INTO Bugs (${fields.join(
      ", "
    )}) VALUES (${placeholders}) RETURNING reportID`;
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Bug report added",
      reportID: result.rows[0].reportID,
    });
  } catch (error) {
    console.error("Error submitting bug report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
