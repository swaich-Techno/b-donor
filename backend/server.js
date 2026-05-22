const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const connectDB = require("./config/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

connectDB().catch((error) => {
  console.error("MongoDB connection failed:", error.message);
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS."));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    name: "B Donor API",
    status: "ok",
    tagline: "Every Life Matters"
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/donors", require("./routes/donorRoutes"));
app.use("/api/blood-requests", require("./routes/bloodRequestRoutes"));
app.use("/api/donor-alerts", require("./routes/donorAlertRoutes"));
app.use("/api/tracking", require("./routes/trackingRoutes"));
app.use("/api/donation-consents", require("./routes/donationConsentRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));
app.use("/api/certificates", require("./routes/certificateRoutes"));
app.use("/api/donor-coin", require("./routes/donorCoinRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/hospitals", require("./routes/hospitalRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/prescriptions", require("./routes/prescriptionRoutes"));
app.use("/api/medbot", require("./routes/medbotRoutes"));
app.use("/api/medical-reports", require("./routes/medicalReportRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/api/csr", require("./routes/csrRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || "Server error."
  });
});

app.listen(PORT, () => {
  console.log(`B Donor API running on port ${PORT}`);
});
