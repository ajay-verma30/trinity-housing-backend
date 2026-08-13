const pool = require("../db/conn");

const getBuilders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM builders
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get builders error:", error);

    res.status(500).json({
      message: "Failed to fetch builders"
    });
  }
};


const getBuilderById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM builders
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Builder not found"
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Get builder error:", error);

    res.status(500).json({
      message: "Failed to fetch builder"
    });
  }
};


const createBuilder = async (req, res) => {
  const {
    name,
    description,
    phone,
    email,
    website,
    address,
    city,
    state,
    pincode
  } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Builder name is required"
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO builders
      (
        name,
        description,
        phone,
        email,
        website,
        address,
        city,
        state,
        pincode
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        name,
        description,
        phone,
        email,
        website,
        address,
        city,
        state,
        pincode
      ]
    );

    res.status(201).json({
      message: "Builder created successfully",
      builder: result.rows[0]
    });

  } catch (error) {
    console.error("Create builder error:", error);

    res.status(500).json({
      message: "Failed to create builder"
    });
  }
};


const updateBuilder = async (req, res) => {
  const { id } = req.params;

  const {
    name,
    description,
    phone,
    email,
    website,
    address,
    city,
    state,
    pincode
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE builders
      SET
        name = $1,
        description = $2,
        phone = $3,
        email = $4,
        website = $5,
        address = $6,
        city = $7,
        state = $8,
        pincode = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
      `,
      [
        name,
        description,
        phone,
        email,
        website,
        address,
        city,
        state,
        pincode,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Builder not found"
      });
    }

    res.status(200).json({
      message: "Builder updated successfully",
      builder: result.rows[0]
    });

  } catch (error) {
    console.error("Update builder error:", error);

    res.status(500).json({
      message: "Failed to update builder"
    });
  }
};


const deleteBuilder = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM builders
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Builder not found"
      });
    }

    res.status(200).json({
      message: "Builder deleted successfully"
    });

  } catch (error) {
    console.error("Delete builder error:", error);

    res.status(500).json({
      message: "Failed to delete builder"
    });
  }
};


module.exports = {
  getBuilders,
  getBuilderById,
  createBuilder,
  updateBuilder,
  deleteBuilder
};