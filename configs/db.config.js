const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  multipleStatements: true,
  charset: "utf8mb4",
  typeCast: function (field, next) {
    const type = field.type;
    const name = field.name;

    if (
      type === "JSON" ||
      name === "sections" ||
      name === "ratingScale" ||
      name === "scores" ||
      name === "criteria" ||
      name === "data"
    ) {
      const val = field.string("utf8");
      return val ? JSON.parse(val) : null;
    }

    return next();
  },
});

connection.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection error:", err);
  } else {
    console.log("✅ Connected to MySQL database:", process.env.DB_NAME);
  }
});

module.exports = connection;
