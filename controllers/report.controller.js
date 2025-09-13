const Report = require("../models/report.model");
const Evaluation = require("../models/evaluation.model");
const EvaluationForm = require("../models/evaluationForm.model");

const generatePerformanceReport = async (req, res, next) => {
  try {
    if (!["admin", "team_leader"].includes(req.userRole)) {
      return res
        .status(403)
        .json({ message: "Not authorized to generate full report" });
    }

    Report.generatePerformanceReport(async (err, results) => {
      if (err) {
        console.error("💥 Performance report SQL error:", err);
        return res.status(500).json({ message: err.sqlMessage || err.message });
      }

      const reports = await Promise.all(
        results.map(async (r) => {
          const peerEvals = await Evaluation.findAllByUserAndFormType(
            r.employeeId,
            "peer_evaluation"
          );
          const selfEvals = await Evaluation.findAllByUserAndFormType(
            r.employeeId,
            "self_evaluation"
          );

          const peerScores = peerEvals.map((e) => e.totalScore || 0);
          const selfScores = selfEvals.map((e) => e.totalScore || 0);

          return {
            employeeId: r.employeeId,
            employeeName: r.employeeName,
            jobTitle: r.jobTitle,
            department: r.department || "N/A",
            totalEvaluations: peerScores.length + selfScores.length,
            peerScores,
            selfScores,
            averageScore: parseFloat(
              (
                (peerScores.reduce((a, b) => a + b, 0) +
                  selfScores.reduce((a, b) => a + b, 0)) /
                (peerScores.length + selfScores.length || 1)
              ).toFixed(2)
            ),
          };
        })
      );

      res.json(reports);
    });
  } catch (error) {
    console.error("Unexpected error generating full report:", error);
    next(error);
  }
};

const generateEmployeeReport = async (req, res, next) => {
  try {
    const employeeId = parseInt(req.params.id);
    if (!employeeId)
      return res.status(400).json({ message: "Employee ID required" });

    if (req.userRole === "staff" && req.userId !== employeeId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this report" });
    }

    const employeeResults = await Report.generateEmployeeReport(employeeId);
    if (!employeeResults || employeeResults.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = employeeResults[0];

    const peerEvals = await Evaluation.findAllByUserAndFormType(
      employeeId,
      "peer_evaluation"
    );
    const selfEvals = await Evaluation.findAllByUserAndFormType(
      employeeId,
      "self_evaluation"
    );

    const peerScores = peerEvals.map((e) => e.totalScore || 0);
    const selfScores = selfEvals.map((e) => e.totalScore || 0);

    const totalEvaluations = peerScores.length + selfScores.length;
    const averageScore = parseFloat(
      (
        (peerScores.reduce((a, b) => a + b, 0) +
          selfScores.reduce((a, b) => a + b, 0)) /
        (totalEvaluations || 1)
      ).toFixed(2)
    );

    res.json([
      {
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        jobTitle: employee.jobTitle,
        department: employee.department || "N/A",
        totalEvaluations,
        peerScores,
        selfScores,
        averageScore,
      },
    ]);
  } catch (error) {
    console.error(
      `Unexpected error generating report for employee ${req.params.id}:`,
      error
    );
    next(error);
  }
};

module.exports = { generatePerformanceReport, generateEmployeeReport };
