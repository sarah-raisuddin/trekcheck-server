import nodemailer from "nodemailer";
import pool from "./db.js";

const transporter = nodemailer.createTransport({
  service: "Outlook",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const createNotificationMessage = ({ name, checkpoint, time }) => {
  const message = `${name} reached checkpoint: ${checkpoint} at ${time}`;
  return message;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendEmail = async (to, subject, text) => {
  console.log(process.env.EMAIL_USER);

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER, // Sender address
      to,
      subject: "TrekCheck Notification",
      text,
    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendNotificationEmail = async (rfid_tag_uid, pole_id, time) => {
  const emailNotificationQuery = `SELECT emergency_contact_email FROM TripPlans WHERE rfid_tag_uid = $1`;
  const checkpointNameQuery = `SELECT name FROM Checkpoints WHERE pole_id = $1`;
  const nameQuery = `
    SELECT u.first_name
    FROM TripPlans tp
    JOIN Users u ON tp.user_id = u.id
    WHERE tp.rfid_tag_uid = $1
  `;

  try {
    const nameQueryResult = await pool.query(nameQuery, [rfid_tag_uid]);
    const name = nameQueryResult.rows[0]?.first_name;

    if (!name) {
      console.error("No name found");
      return;
    }

    const emailQueryResult = await pool.query(emailNotificationQuery, [
      rfid_tag_uid,
    ]);
    const email = emailQueryResult.rows[0]?.emergency_contact_email;

    if (!email) {
      console.error("No email found");
      return;
    }

    // Retrieve the checkpoint name
    const checkpointResult = await pool.query(checkpointNameQuery, [pole_id]);
    const checkpointName = checkpointResult.rows[0]?.name;
    console.log(checkpointResult.rows[0]);

    if (!checkpointName) {
      console.error("No checkpoint found for the given pole ID.");
      return;
    }

    // Send the email
    const subject = "Checkpoint Notification";
    const text = `${name} reached checkpoint: ${checkpointName} at ${time}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "sraisudd@sfu.ca",
      subject,
      text,
    });

    console.log(`Email sent to ${email} for checkpoint ${checkpointName}`);
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};
