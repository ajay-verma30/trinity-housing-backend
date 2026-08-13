const pool = require("../db/conn");


// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        b.name AS builder_name
      FROM projects p
      JOIN builders b
        ON p.builder_id = b.id
      ORDER BY p.created_at DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      message: "Failed to fetch projects"
    });
  }
};


// GET /api/projects/:id
const getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        p.*,
        b.name AS builder_name
      FROM projects p
      JOIN builders b
        ON p.builder_id = b.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      message: "Failed to fetch project"
    });
  }
};


// POST /api/projects
const createProject = async (req, res) => {
  const {
    builder_id,
    name,
    description,
    property_type,
    listing_type,
    address,
    locality,
    city,
    state,
    pincode,
    latitude,
    longitude,
    total_units,
    total_towers,
    possession_date,
    rera_number
  } = req.body;

  if (!builder_id || !name || !property_type || !listing_type ||
      !address || !city || !state || !pincode) {
    return res.status(400).json({
      message: "Required project details are missing"
    });
  }

  try {

    // First verify that the builder exists
    const builder = await pool.query(
      `
      SELECT id
      FROM builders
      WHERE id = $1
      `,
      [builder_id]
    );

    if (builder.rows.length === 0) {
      return res.status(404).json({
        message: "Builder not found"
      });
    }


    const result = await pool.query(
      `
      INSERT INTO projects
      (
        builder_id,
        name,
        description,
        property_type,
        listing_type,
        address,
        locality,
        city,
        state,
        pincode,
        latitude,
        longitude,
        total_units,
        total_towers,
        possession_date,
        rera_number
      )
      VALUES
      (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16
      )
      RETURNING *
      `,
      [
        builder_id,
        name,
        description,
        property_type,
        listing_type,
        address,
        locality,
        city,
        state,
        pincode,
        latitude,
        longitude,
        total_units,
        total_towers,
        possession_date,
        rera_number
      ]
    );


    res.status(201).json({
      message: "Project created successfully",
      project: result.rows[0]
    });

  } catch (error) {

    console.error("Create project error:", error);

    res.status(500).json({
      message: "Failed to create project"
    });
  }
};


// PUT /api/projects/:id
const updateProject = async (req, res) => {
  const { id } = req.params;

  const {
    builder_id,
    name,
    description,
    property_type,
    listing_type,
    address,
    locality,
    city,
    state,
    pincode,
    latitude,
    longitude,
    total_units,
    total_towers,
    possession_date,
    rera_number,
    status
  } = req.body;


  try {

    const result = await pool.query(
      `
      UPDATE projects
      SET
        builder_id = $1,
        name = $2,
        description = $3,
        property_type = $4,
        listing_type = $5,
        address = $6,
        locality = $7,
        city = $8,
        state = $9,
        pincode = $10,
        latitude = $11,
        longitude = $12,
        total_units = $13,
        total_towers = $14,
        possession_date = $15,
        rera_number = $16,
        status = $17,
        updated_at = NOW()
      WHERE id = $18
      RETURNING *
      `,
      [
        builder_id,
        name,
        description,
        property_type,
        listing_type,
        address,
        locality,
        city,
        state,
        pincode,
        latitude,
        longitude,
        total_units,
        total_towers,
        possession_date,
        rera_number,
        status,
        id
      ]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }


    res.status(200).json({
      message: "Project updated successfully",
      project: result.rows[0]
    });

  } catch (error) {

    console.error("Update project error:", error);

    res.status(500).json({
      message: "Failed to update project"
    });
  }
};


// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {

    const result = await pool.query(
      `
      DELETE FROM projects
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }


    res.status(200).json({
      message: "Project deleted successfully"
    });

  } catch (error) {

    console.error("Delete project error:", error);

    res.status(500).json({
      message: "Failed to delete project"
    });
  }
};


module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};