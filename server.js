const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const db = require("./configs/db.config");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const teamRoutes = require("./routes/team.routes");
const formRoutes = require("./routes/form.routes");
const departmentRoutes = require("./routes/department.routes");
const evaluationRoutes = require("./routes/evaluation.routes");
const reportRoutes = require("./routes/report.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL database");

  const schemaPath = path.join(__dirname, "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  db.query(schema, (err) => {
    if (err) {
      console.error("❌ Error initializing database schema:", err);
    } else {
      console.log(
        "✅ Database schema initialized (tables created if not exist)."
      );
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/departments", departmentRoutes);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
