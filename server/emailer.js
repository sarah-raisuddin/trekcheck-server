import pool from "./db.js";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.EMAIL_KEY);

export const createNotificationMessage = ({ name, checkpoint, time }) => {
  const message = `${name} reached checkpoint: ${checkpoint} at ${time}`;
  return message;
};

export const sendEmail = async (to, subject, text) => {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_EMAIL,
      subject,
      text,
    };

    const response = await sgMail.send(msg);
    console.log("Email sent:", response[0].statusCode, response[0].headers);
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response ? error.response.body : error.message
    );
  }
};

export const sendNotificationEmail = async (rfid_tag_uid, pole_id, time) => {
  const emailNotificationQuery = `
    SELECT tp.emergency_contact_email
    FROM trekcheck.TripPlans tp
    JOIN trekcheck.Users u ON tp.user_id = u.id
    WHERE u.rfid_tag_uid = $1
    AND tp.archived = FALSE
    AND tp.trail_id = (
        SELECT cp.trail_id
        FROM trekcheck.Checkpoints cp
        WHERE cp.pole_id = $2
    );
`;

  const checkpointNameQuery = `
  SELECT cp.name
  FROM trekcheck.Checkpoints cp
  WHERE cp.pole_id = $1
`;

  const nameQuery = `
  SELECT u.first_name
  FROM trekcheck.TripPlans tp
  JOIN trekcheck.Users u ON tp.user_id = u.id
  WHERE u.rfid_tag_uid = $1
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
      pole_id,
    ]);
    const email = emailQueryResult.rows[0]?.emergency_contact_email;
    console.log(email);

    if (!email) {
      console.error("No email found");
      return;
    }

    // Retrieve the checkpoint name
    const checkpointResult = await pool.query(checkpointNameQuery, [pole_id]);
    const checkpointName = checkpointResult.rows[0]?.name;

    if (!checkpointName) {
      console.error("No checkpoint found for the given pole ID.");
      return;
    }

    // Send the email
    const subject = "TrekCheck: Checkpoint Notification";
    const text = `Hiker ${name} reached checkpoint: ${checkpointName} at ${time}.`;

    console.log("im sending to this emaillll" + email);

    await sgMail.send({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
    });

    console.log(`Email sent to ${email} for checkpoint ${checkpointName}`);
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};

export const sendTrailUpdateEmail = async (trail_id, trail_name) => {
  console.log("in the trail update function");
  const emailQuery = `
   SELECT u.email
    FROM trekcheck.TripPlans tp
    JOIN trekcheck.Users u ON tp.user_id = u.id
    WHERE tp.trail_id = $1
    AND tp.archived = FALSE;
`;

  try {
    const result = await pool.query(emailQuery, [trail_id]);
    // Send the email
    const subject = "TrekCheck: Trail Updated";
    const text = `Updates have been made to the ${trail_name} trail. Please review your trip plan accordingly.`;

    await Promise.all(
      result.rows.map((res) => {
        sgMail.send({
          from: process.env.EMAIL_USER,
          to: res.email,
          subject,
          text,
        });
      })
    );
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};
