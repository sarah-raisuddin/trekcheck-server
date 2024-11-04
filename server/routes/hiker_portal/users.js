import { Router } from "express";
import pkg from "bcryptjs";
import webtoken from "jsonwebtoken";
import pool from "../../db.js";
import { generatePlaceholders } from "../util.js";

const { hash, compare } = pkg;
const router = Router();
const { sign } = webtoken;

const SECRET_KEY = "randomhash";

const errMsg500 = "oops";
const handleError = (res, msg) => {
  res.status(500).json({ message: msg });
};

router.post("/register", async (req, res) => {
  const { password, email, firstName, lastName, tagId } = req.body;

  console.log(req.body);
  if (!password || !email || !firstName || !lastName || !tagId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const fields = [
    "email",
    "first_name",
    "last_name",
    "password",
    "rfid_tag_uid",
  ];
  const placeholders = generatePlaceholders(fields.length);

  try {
    const hashedPassword = await hash(password, 10);
    const query = `INSERT INTO users (${fields.join(
      ", "
    )}) VALUES (${placeholders}) RETURNING id`;
    const result = await pool.query(query, [
      email,
      firstName,
      lastName,
      hashedPassword,
      tagId,
    ]);

    res.status(201).json({
      message: "User registered successfully",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET endpoint to fetch data from the database
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const query = "SELECT first_name, id, password FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email" });
    }

    const user = result.rows[0];
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT
    const token = sign(
      { userId: user.id, username: user.username, firstName: user.first_name },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Pass back the user ID for now until end point is defined for grabbing user id from token
    const userId = user.id;
    const firstName = user.first_name;

    res.json({ message: "Login successful", token, userId, firstName });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Return user account details for edit account display
router.get("/accountDetails", async (req, res) => {
  // check auth token
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    console.log("bunked at auth header");
    return res.status(401).json({ message: "Authorization header not found" });
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    console.log("bunked at auth token");
    return res.status(401).json({ message: "Authorization token not found" });
  }

  try {
    const decodedToken = webtoken.verify(token, SECRET_KEY);
    const userId = decodedToken.userId;
    console.log("userID: ", userId);

    const userQuery = `SELECT * FROM users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      email: userResult.rows[0].email,
      first_name: userResult.rows[0].first_name,
      last_name: userResult.rows[0].last_name,
      tag_id: userResult.rows[0].rfid_tag_uid,
    });
  } catch (error) {
    console.log(error);
    handleError(res, errMsg500);
  }
});

// updates user first name and last name
router.put("/updateAccount", async (req, res) => {
  // check auth token
  const authorizationHeader = req.headers["authorization"];
  if (!authorizationHeader) {
    console.log("bunked at auth header");
    return res.status(401).json({ message: "Authorization header not found" });
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    console.log("bunked at auth token");
    return res.status(401).json({ message: "Authorization token not found" });
  }

  const decoded = webtoken.verify(token, SECRET_KEY);
  const userId = decoded.userId;

  const fields = ["first_name", "last_name"];
  const values = fields.map((field) => req.body[field]);

  if (values.includes(undefined) || values.includes(null)) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const setStatement = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const query = `UPDATE users SET ${setStatement} WHERE id = $${
      fields.length + 1
    }`;

    const result = await pool.query(query, [...values, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "user not found" });
    }

    res.status(200).json({
      message: "user updated successfully",
    });
  } catch (error) {
    handleError(res, errMsg500);
  }
});

// Checks if a tag is already linked to a user
router.post("/check-tag", async (req, res) => {
  const { rfid_tag_uid } = req.body;

  if (!rfid_tag_uid) {
    return res.status(400).json({ message: "RFID tag ID is required" });
  }

  try {
    const query = "SELECT id FROM users WHERE rfid_tag_uid = $1";
    const result = await pool.query(query, [rfid_tag_uid]);

    if (result.rows.length > 0) {
      res.status(200).json({ isLinked: true });
    } else {
      res.status(200).json({ isLinked: false });
    }
  } catch (error) {
    console.error("Error checking RFID tag:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Checks if an email is already in use
router.post("/check-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const query = "SELECT id FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length > 0) {
      res.status(200).json({ isEmailLinked: true });
    } else {
      res.status(200).json({ isEmailLinked: false });
    }
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
