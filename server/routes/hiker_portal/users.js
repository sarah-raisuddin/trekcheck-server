const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../../db");
const generatePlaceholders = require("../util");

SECRET_KEY = "randomhash";

router.post("/register", async (req, res) => {
  const { password, email, firstName, lastName, number, address } = req.body;
  if (!password || !email || !firstName || !lastName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  fields = ["email", "first_name", "last_name", "password"];
  number && fields.push("number");
  address && fields.push("address");
  placeholders = generatePlaceholders(fields.length);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
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
    const query = "SELECT password FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
