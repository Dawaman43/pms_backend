const Report = require("../models/report.model");

// Generate full performance report (admin / team leader only)
const generatePerformanceReport = (req, res, next) => {
  if (!["admin", "team_leader"].includes(req.userRole)) {
    return res
      .status(403)
      .json({ message: "Not authorized to generate full report" });
  }

  Report.generatePerformanceReport((err, results) => {
    if (err) return next(new Error("Error generating report"));

    const reports = results.map((r) => ({
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      jobTitle: r.jobTitle,
      department: r.department,
      totalEvaluations: r.totalEvaluations,
      peerScores: r.peerScores || [],
      selfScores: r.selfScores || [],
    }));

    res.json(reports);
  });
};

// Generate individual employee report
const generateEmployeeReport = (req, res, next) => {
  const employeeId = req.params.id;

  // Staff can only access their own report
  if (req.userRole === "staff" && req.userId != employeeId) {
    return res
      .status(403)
      .json({ message: "Not authorized to view this report" });
  }

  Report.generateEmployeeReport(employeeId, (err, results) => {
    if (err) return next(new Error("Error generating employee report"));

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = results[0];

    res.json([
      {
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        jobTitle: employee.jobTitle,
        department: employee.department,
        totalEvaluations: employee.totalEvaluations,
        peerScores: employee.peerScores || [],
        selfScores: employee.selfScores || [],
      },
    ]);
  });
};

module.exports = { generatePerformanceReport, generateEmployeeReport };
