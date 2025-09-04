const Report = require("../models/report.model");

// Generate full performance report (admin / team leader only)
const generatePerformanceReport = (req, res, next) => {
  if (!["admin", "team_leader"].includes(req.userRole)) {
    return res
      .status(403)
      .json({ message: "Not authorized to generate full report" });
  }

  Report.generatePerformanceReport((err, results) => {
    if (err) {
      console.error("💥 Performance report SQL error:", err);
      return res.status(500).json({ message: err.sqlMessage || err.message });
    }

    const reports = results.map((r) => ({
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      jobTitle: r.jobTitle,
      department: r.department || "N/A",
      totalEvaluations: r.totalEvaluations || 0,
      peerScores: r.peerScores || [],
      selfScores: r.selfScores || [],
    }));

    res.json(reports);
  });
};

// Generate individual employee report
const generateEmployeeReport = (req, res, next) => {
  const employeeId = req.params.id;

  if (!employeeId) {
    return res.status(400).json({ message: "Employee ID required" });
  }

  // Staff can only access their own report
  if (req.userRole === "staff" && req.userId != employeeId) {
    return res
      .status(403)
      .json({ message: "Not authorized to view this report" });
  }

  Report.generateEmployeeReport(employeeId, (err, results) => {
    if (err) {
      console.error(`💥 Employee report SQL error for ID ${employeeId}:`, err);
      return res.status(500).json({ message: err.sqlMessage || err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = results[0];

    res.json([
      {
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        jobTitle: employee.jobTitle,
        department: employee.department || "N/A",
        totalEvaluations: employee.totalEvaluations || 0,
        peerScores: employee.peerScores || [],
        selfScores: employee.selfScores || [],
      },
    ]);
  });
};

module.exports = { generatePerformanceReport, generateEmployeeReport };
