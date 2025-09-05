const db = require("../configs/db.config");

// ==================== UTILITIES ====================
const safeParseJSON = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  if (Buffer.isBuffer(value)) value = value.toString("utf8");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return Array.isArray(value) ? value : defaultValue;
};

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });

// ==================== CREATE FORM ====================
const createForm = async (req, res) => {
  try {
    if (!["admin", "team_manager"].includes(req.userRole))
      return res
        .status(403)
        .json({ message: "Not authorized to create forms" });

    const {
      title,
      description = "",
      formType,
      targetEvaluator,
      sections,
      ratingScale,
      team_id = null,
      period,
    } = req.body;

    if (!title || !formType || !targetEvaluator || !sections || !period)
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });

    // --- Ensure total weight of all criteria = 100 ---
    let totalWeight = 0;
    sections.forEach((section) => {
      if (!section.criteria || section.criteria.length === 0)
        return res
          .status(400)
          .json({ message: "Each section must have at least one criterion" });

      section.criteria.forEach((c) => {
        totalWeight += parseFloat(c.weight || 0);
      });
    });
    if (totalWeight !== 100)
      return res
        .status(400)
        .json({
          message: `Total criteria weight must equal 100%. Currently: ${totalWeight}%`,
        });

    const sql = `
      INSERT INTO evaluation_forms
      (title, description, formType, targetEvaluator, weight, sections, ratingScale, team_id, created_by, lastModified, status, usageCount, period)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, ?)
    `;
    const params = [
      title,
      description,
      formType,
      targetEvaluator,
      100, // form weight always 100%
      JSON.stringify(sections),
      JSON.stringify(ratingScale || []),
      team_id,
      req.userId,
      new Date().toISOString().split("T")[0],
      period,
    ];

    const result = await queryAsync(sql, params);
    res
      .status(201)
      .json({ message: "Form created successfully", formId: result.insertId });
  } catch (err) {
    console.error("Error creating form:", err);
    res.status(500).json({ message: err.message || "Error creating form" });
  }
};

// ==================== GET ALL FORMS ====================
const getAllForms = async (req, res) => {
  try {
    const sql = "SELECT * FROM evaluation_forms WHERE status = 'active'";
    const results = await queryAsync(sql);
    const forms = results.map((f) => ({
      ...f,
      sections: safeParseJSON(f.sections),
      ratingScale: safeParseJSON(f.ratingScale),
    }));
    res.json(forms);
  } catch (err) {
    console.error("Error fetching forms:", err);
    res.status(500).json({ message: err.message || "Error fetching forms" });
  }
};

// ==================== GET FORM BY ID ====================
const getFormById = async (req, res) => {
  try {
    const sql =
      "SELECT * FROM evaluation_forms WHERE id = ? AND status = 'active'";
    const results = await queryAsync(sql, [req.params.id]);
    if (!results.length)
      return res.status(404).json({ message: "Form not found" });

    const form = {
      ...results[0],
      sections: safeParseJSON(results[0].sections),
      ratingScale: safeParseJSON(results[0].ratingScale),
    };
    res.json(form);
  } catch (err) {
    console.error("Error fetching form by ID:", err);
    res.status(500).json({ message: err.message || "Error fetching form" });
  }
};

// ==================== GET FORMS BY TEAM ID ====================
const getFormsByTeamId = async (req, res) => {
  const numericTeamId = parseInt(req.params.teamId, 10);
  if (isNaN(numericTeamId))
    return res.status(400).json({ message: "Invalid team ID" });

  try {
    const sql =
      "SELECT * FROM evaluation_forms WHERE (team_id IS NULL OR team_id = ?) AND status = 'active'";
    const results = await queryAsync(sql, [numericTeamId]);
    const forms = results.map((f) => ({
      ...f,
      sections: safeParseJSON(f.sections),
      ratingScale: safeParseJSON(f.ratingScale),
    }));
    res.json(forms);
  } catch (err) {
    console.error("Error fetching forms by team ID:", err);
    res.status(500).json({ message: err.message || "Error fetching forms" });
  }
};

// ==================== UPDATE FORM ====================
const updateForm = async (req, res) => {
  try {
    if (!["admin", "team_manager"].includes(req.userRole))
      return res
        .status(403)
        .json({ message: "Not authorized to update forms" });

    const { sections, ratingScale, ...rest } = req.body;
    const updateFields = {
      ...rest,
      lastModified: new Date().toISOString().split("T")[0],
    };

    if (sections) {
      let totalWeight = 0;
      sections.forEach((section) => {
        if (!section.criteria || section.criteria.length === 0)
          return res
            .status(400)
            .json({ message: "Each section must have at least one criterion" });
        section.criteria.forEach(
          (c) => (totalWeight += parseFloat(c.weight || 0))
        );
      });
      if (totalWeight !== 100)
        return res
          .status(400)
          .json({
            message: `Total criteria weight must equal 100%. Currently: ${totalWeight}%`,
          });

      updateFields.sections = JSON.stringify(sections);
    }

    if (ratingScale) updateFields.ratingScale = JSON.stringify(ratingScale);

    const setClause = Object.keys(updateFields)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateFields);

    const sql = `UPDATE evaluation_forms SET ${setClause} WHERE id = ?`;
    const result = await queryAsync(sql, [...values, req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Form not found" });

    res.json({ message: "Form updated successfully" });
  } catch (err) {
    console.error("Error updating form:", err);
    res.status(500).json({ message: err.message || "Error updating form" });
  }
};

// ==================== DELETE FORM ====================
const deleteForm = async (req, res) => {
  try {
    if (!["admin", "team_manager"].includes(req.userRole))
      return res
        .status(403)
        .json({ message: "Not authorized to delete forms" });

    const sql = "UPDATE evaluation_forms SET status = 'inactive' WHERE id = ?";
    const result = await queryAsync(sql, [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Form not found" });

    res.json({ message: "Form deleted successfully (soft delete)" });
  } catch (err) {
    console.error("Error deleting form:", err);
    res.status(500).json({ message: err.message || "Error deleting form" });
  }
};

// ==================== GET ALL PEER EVALUATION FORMS ====================
const getAllPeerEvaluationForms = async (req, res) => {
  try {
    const sql =
      "SELECT * FROM evaluation_forms WHERE formType = 'peer_evaluation' AND status = 'active'";
    const results = await queryAsync(sql);
    const forms = results.map((f) => ({
      ...f,
      sections: safeParseJSON(f.sections),
      ratingScale: safeParseJSON(f.ratingScale),
    }));
    res.json(forms);
  } catch (err) {
    console.error("Error fetching peer evaluation forms:", err);
    res.status(500).json({ message: "Failed to fetch peer evaluation forms" });
  }
};

module.exports = {
  createForm,
  getAllForms,
  getFormById,
  getFormsByTeamId,
  updateForm,
  deleteForm,
  getAllPeerEvaluationForms,
};
