import { Router } from "express";
import pkg from "bcryptjs";
import webtoken from "jsonwebtoken";
import pool from "../../db.js";
import generatePlaceholders from "../util.js";

const { hash, compare } = pkg;
const router = Router();
const { sign } = webtoken;

const SECRET_KEY = "randomhash";

router.get("/users", async (req, res) => {
  try {
    const query = `select * from SARUsers`;
    const result = await pool.query(query);

    res.status(200).json({
      users: result.rows,
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const query = "SELECT password FROM SARUsers WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
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

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  const { password, email, firstName, lastName, admin } = req.body;
  if (!password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const fields = ["email", "password", "first_name", "last_name", "admin"];
  const placeholders = generatePlaceholders(fields.length);

  try {
    const hashedPassword = await hash(password, 10);
    const query = `INSERT INTO SARUsers (${fields.join(
      ", "
    )}) VALUES (${placeholders}) RETURNING id`;
    const result = await pool.query(query, [
      email,
      hashedPassword,
      firstName,
      lastName,
      admin,
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

router.delete("/user/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const query = `DELETE FROM SARUsers WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User deleted successfully",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
