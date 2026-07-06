const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const tenantRoutes = require("./routes/tenantRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);

app.get("/", (req, res) => {
  res.send("Feature Flag API is Running...");
});

module.exports = app;
