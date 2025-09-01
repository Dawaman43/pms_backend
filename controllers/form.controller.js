const EvaluationForm = require("../models/evaluationForm.model");

const safeParseJSON = (value, defaultValue = []) => {
  if (!value) return defaultValue;
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

// Create a new form
const createForm = (req, res, next) => {
  if (!["admin", "team_manager"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to create forms" });
  }

  const {
    title,
    description,
    formType,
    targetEvaluator,
    weight,
    sections,
    ratingScale,
  } = req.body;

  if (!title || !formType || !targetEvaluator || !weight || !sections) {
    return res
      .status(400)
      .json({ message: "All required fields must be provided" });
  }

  const formData = {
    title,
    description: description || "",
    formType,
    targetEvaluator,
    weight,
    sections: JSON.stringify(sections),
    ratingScale: ratingScale ? JSON.stringify(ratingScale) : JSON.stringify([]),
    created_by: req.userId,
    lastModified: new Date().toISOString().split("T")[0],
    status: "active",
    usageCount: 0,
  };

  EvaluationForm.create(formData, (err, result) => {
    if (err) return next(new Error("Error creating form"));
    res.json({ message: "Form created successfully", formId: result.insertId });
  });
};

// Get all forms (anyone can view)
const getAllForms = (req, res, next) => {
  EvaluationForm.findAll((err, results) => {
    if (err) return next(new Error("Error fetching forms"));

    const forms = results.map((form) => ({
      ...form,
      sections: safeParseJSON(form.sections),
      ratingScale: safeParseJSON(form.ratingScale),
    }));

    res.json(forms);
  });
};

// Get a single form by ID
const getFormById = (req, res, next) => {
  EvaluationForm.findById(req.params.id, (err, results) => {
    if (err) return next(new Error("Error fetching form"));
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Form not found" });
    }

    const form = {
      ...results[0],
      sections: safeParseJSON(results[0].sections),
      ratingScale: safeParseJSON(results[0].ratingScale),
    };

    res.json(form);
  });
};

// Update a form (only admin / manager who created it)
const updateForm = (req, res, next) => {
  if (!["admin", "team_manager"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to update forms" });
  }

  const formData = {
    ...req.body,
    lastModified: new Date().toISOString().split("T")[0],
  };

  if (formData.sections) formData.sections = JSON.stringify(formData.sections);
  if (formData.ratingScale)
    formData.ratingScale = JSON.stringify(formData.ratingScale);

  EvaluationForm.update(req.params.id, formData, (err) => {
    if (err) return next(new Error("Error updating form"));
    res.json({ message: "Form updated successfully" });
  });
};

// Delete a form (only admin / manager)
const deleteForm = (req, res, next) => {
  if (!["admin", "team_manager"].includes(req.userRole)) {
    return res.status(403).json({ message: "Not authorized to delete forms" });
  }

  EvaluationForm.delete(req.params.id, (err) => {
    if (err) return next(new Error("Error deleting form"));
    res.json({ message: "Form deleted successfully" });
  });
};

module.exports = {
  createForm,
  getAllForms,
  getFormById,
  updateForm,
  deleteForm,
};
