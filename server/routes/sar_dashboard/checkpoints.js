import { Router } from "express";
const router = Router();
import pool from "../../db.js";
import { generatePlaceholders } from "../util.js";

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

//
router.get("/checkpointEntries", async (req, res) => {
  try {
    const query = `SELECT
    ce.entry_id,
    ce.pole_id,
    ce.time,
    ce.tag_id,
    c.name AS checkpoint_name,
    t.name AS trail_name,
    tp.start_date,
    tp.end_date,
    u.first_name,
    u.last_name
FROM
    trekcheck.CheckpointEntries ce
JOIN
    trekcheck.Checkpoints c ON ce.pole_id = c.pole_id
JOIN
    trekcheck.Trails t ON c.trail_id = t.id
JOIN
    trekcheck.Users u ON ce.tag_id = u.rfid_tag_uid
JOIN
    trekcheck.TripPlans tp ON tp.user_id = u.id;
`;

    const result = await pool.query(query);

    res.status(200).json({
      checkpointsEntries: result.rows,
    });
  } catch (error) {
    console.log(error);
    handleError(res, errMsg500);
  }
});

export default router;
