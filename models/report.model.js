const db = require("../configs/db.config");

const Report = {
  generatePerformanceReport: (callback) => {
    const query = `
      SELECT
        u.id AS employeeId,
        u.name AS employeeName,
        u.jobTitle,
        d.name AS department,
        COALESCE((
          SELECT JSON_ARRAYAGG(e.scores)
          FROM evaluations e
          JOIN evaluation_forms f ON e.form_id = f.id
          WHERE e.user_id = u.id 
            AND f.formType = 'peer_evaluation' 
            AND e.scores IS NOT NULL
        ), JSON_ARRAY()) AS peerScores,
        COALESCE((
          SELECT JSON_ARRAYAGG(e.scores)
          FROM evaluations e
          JOIN evaluation_forms f ON e.form_id = f.id
          WHERE e.user_id = u.id 
            AND f.formType = 'self_assessment' 
            AND e.scores IS NOT NULL
        ), JSON_ARRAY()) AS selfScores,
        (SELECT COUNT(*) FROM evaluations ev WHERE ev.user_id = u.id) AS totalEvaluations
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.name ASC;
    `;
    db.query(query, callback);
  },

  generateEmployeeReport: (employeeId, callback) => {
    const query = `
      SELECT
        u.id AS employeeId,
        u.name AS employeeName,
        u.jobTitle,
        d.name AS department,
        COALESCE((
          SELECT JSON_ARRAYAGG(e.scores)
          FROM evaluations e
          JOIN evaluation_forms f ON e.form_id = f.id
          WHERE e.user_id = u.id 
            AND f.formType = 'peer_evaluation' 
            AND e.scores IS NOT NULL
        ), JSON_ARRAY()) AS peerScores,
        COALESCE((
          SELECT JSON_ARRAYAGG(e.scores)
          FROM evaluations e
          JOIN evaluation_forms f ON e.form_id = f.id
          WHERE e.user_id = u.id 
            AND f.formType = 'self_assessment' 
            AND e.scores IS NOT NULL
        ), JSON_ARRAY()) AS selfScores,
        (SELECT COUNT(*) FROM evaluations ev WHERE ev.user_id = u.id) AS totalEvaluations
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?;
    `;
    db.query(query, [employeeId], callback);
  },

  generateQuarterlyReport: (employeeId, callback) => {
    const sql = `
      SELECT quarter, 
             ROUND(AVG(JSON_EXTRACT(scores, '$[*].value')), 1) AS avgScore
      FROM evaluations
      WHERE user_id = ?
      GROUP BY quarter
      ORDER BY FIELD(quarter, 'Q1','Q2','Q3','Q4')
    `;
    db.query(sql, [employeeId], callback);
  },

  generateReportByPeriod: (employeeId, periodId, callback) => {
    const sql = `
      SELECT *
      FROM evaluations
      WHERE user_id = ? AND period_id = ?
      ORDER BY submitted_at DESC
    `;
    db.query(sql, [employeeId, periodId], callback);
  },
};

module.exports = Report;
