const db = require("../configs/db.config");

const Report = {
  generatePerformanceReport: (callback) => {
    const query = `
      SELECT
        u.id AS employeeId,
        u.name AS employeeName,
        u.jobTitle,
        u.department,
        COALESCE((
          SELECT JSON_ARRAYAGG(e.score)
          FROM evaluations e
          JOIN evaluation_forms f ON e.form_id = f.id
          WHERE e.user_id = u.id
            AND f.formType = 'peer_evaluation'
            AND e.score IS NOT NULL
        ), JSON_ARRAY()) AS peerScores,
        COALESCE((
          SELECT JSON_ARRAYAGG(e.score)
          FROM evaluations e
          JOIN evaluation_forms f ON e.form_id = f.id
          WHERE e.user_id = u.id
            AND f.formType = 'self_assessment'
            AND e.score IS NOT NULL
        ), JSON_ARRAY()) AS selfScores,
        (SELECT COUNT(*) FROM evaluations ev WHERE ev.user_id = u.id) AS totalEvaluations
      FROM users u
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
        u.department,
        COALESCE((
          SELECT JSON_ARRAYAGG(e.score)
          FROM evaluations e
          JOIN evaluation_forms f ON e.form_id = f.id
          WHERE e.user_id = u.id
            AND f.formType = 'peer_evaluation'
            AND e.score IS NOT NULL
        ), JSON_ARRAY()) AS peerScores,
        COALESCE((
          SELECT JSON_ARRAYAGG(e.score)
          FROM evaluations e
          JOIN evaluation_forms f ON e.form_id = f.id
          WHERE e.user_id = u.id
            AND f.formType = 'self_assessment'
            AND e.score IS NOT NULL
        ), JSON_ARRAY()) AS selfScores,
        (SELECT COUNT(*) FROM evaluations ev WHERE ev.user_id = u.id) AS totalEvaluations
      FROM users u
      WHERE u.id = ?
    `;
    db.query(query, [employeeId], callback);
  },
};

module.exports = Report;
