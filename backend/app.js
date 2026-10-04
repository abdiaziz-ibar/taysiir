const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const parentRoutes = require("./routes/parents");
const academicYearRoutes = require("./routes/academicYears");
const feeRoutes = require("./routes/fees");
const paymentRoutes = require("./routes/payments");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");
const parentPortalRoutes = require("./routes/parentPortal");
const paymentProofRoutes = require("./routes/paymentProofs");
const employeeRoutes = require("./routes/employees");
const salaryRoutes = require("./routes/salaries");
const expenseRoutes = require("./routes/expenses");
const financeRoutes = require("./routes/finance");
const financeAuthRoutes = require("./routes/financeAuth");
const financeUserRoutes = require("./routes/financeUsers");

const app = express();

// CORS - allow the configured client origin(s)
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS-ka lama oggola origin-kan."));
      }
    },
    credentials: true,
  })
);

// 2mb: the mobile app can send a (resized) screenshot as base64 JSON.
app.use(express.json({ limit: "2mb" }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Also under /api: the production nginx only forwards /api to this server, so
// /uploads/... there returns the web app's HTML instead of the image.
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));
app.use("/api/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.json({ message: "School Fee Parent Debt Management System API is running." });
});
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/academic-years", academicYearRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/parent-portal", parentPortalRoutes);
app.use("/api/payment-proofs", paymentProofRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/finance-auth", financeAuthRoutes);
app.use("/api/finance-users", financeUserRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
