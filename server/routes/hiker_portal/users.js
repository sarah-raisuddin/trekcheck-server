import { Router } from "express";
import pkg from "bcryptjs";
import webtoken from "jsonwebtoken";
import pool from "../../db.js";
import { generatePlaceholders } from "../util.js";

const { hash, compare } = pkg;
const router = Router();
const { sign } = webtoken;

const SECRET_KEY = "randomhash";

router.post("/register", async (req, res) => {
  const { password, email, firstName, lastName, number, address } = req.body;
  if (!password || !email || !firstName || !lastName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const fields = ["email", "first_name", "last_name", "password"];
  number && fields.push("number");
  address && fields.push("address");
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
      { userId: user.id, username: user.username },
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

export default router;
