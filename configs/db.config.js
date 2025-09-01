const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  multipleStatements: true,
  typeCast: function (field, next) {
    const type = field.type;
    const name = field.name;

    if (
      type === "JSON" ||
      name === "sections" ||
      name === "ratingScale" ||
      name === "score" ||
      name === "data"
    ) {
      const val = field.string();
      return val ? JSON.parse(val) : null;
    }

    return next();
  },
});

module.exports = connection;
