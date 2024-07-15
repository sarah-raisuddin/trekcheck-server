const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
const port = 3000;

// PostgreSQL connection setup

const registerRoutes = require("./routes/hiker_portal/users");

// Mount routes
app.use("/hiker_portal", registerRoutes); // Prefix all routes in registerRoutes with '/hiker_portal'

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
