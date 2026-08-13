const pool = require("../db/conn");


// POST /api/inquiries
// Public API
const createInquiry = async (req, res) => {
  const {
    property_id,
    name,
    phone,
    email,
    message
  } = req.body;

  // Basic validation
  if (!property_id || !name || (!phone && !email)) {
    return res.status(400).json({
      message: "Property ID, name and phone or email are required"
    });
  }

  try {

    // Check whether property exists
    const propertyResult = await pool.query(
      `
      SELECT id
      FROM properties
      WHERE id = $1
      `,
      [property_id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }


    // Create inquiry
    const result = await pool.query(
      `
      INSERT INTO property_inquiries
      (
        property_id,
        name,
        phone,
        email,
        message
      )
      VALUES
      ($1, $2, $3, $4, $5)
      RETURNING
        id,
        property_id,
        name,
        phone,
        email,
        message,
        status,
        created_at
      `,
      [
        property_id,
        name,
        phone || null,
        email || null,
        message || null
      ]
    );


    res.status(201).json({
      message: "Your enquiry has been submitted successfully",
      inquiry: result.rows[0]
    });

  } catch (error) {

    console.error("Create inquiry error:", error);

    res.status(500).json({
      message: "Failed to submit enquiry"
    });
  }
};


// GET /api/inquiries
// Admin API
const getInquiries = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        i.id,
        i.name,
        i.phone,
        i.email,
        i.message,
        i.status,
        i.admin_notes,
        i.created_at,
        i.updated_at,

        p.id AS property_id,
        p.title AS property_title,
        p.price AS property_price,

        pr.id AS project_id,
        pr.name AS project_name,

        b.id AS builder_id,
        b.name AS builder_name

      FROM property_inquiries i

      JOIN properties p
        ON i.property_id = p.id

      JOIN projects pr
        ON p.project_id = pr.id

      JOIN builders b
        ON pr.builder_id = b.id

      ORDER BY i.created_at DESC
    `);


    res.status(200).json(result.rows);

  } catch (error) {

    console.error("Get inquiries error:", error);

    res.status(500).json({
      message: "Failed to fetch enquiries"
    });
  }
};


// GET /api/inquiries/:id
// Admin API
const getInquiryById = async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT
        i.id,
        i.name,
        i.phone,
        i.email,
        i.message,
        i.status,
        i.admin_notes,
        i.created_at,
        i.updated_at,

        p.id AS property_id,
        p.title AS property_title,
        p.price AS property_price,

        pr.id AS project_id,
        pr.name AS project_name,

        b.id AS builder_id,
        b.name AS builder_name

      FROM property_inquiries i

      JOIN properties p
        ON i.property_id = p.id

      JOIN projects pr
        ON p.project_id = pr.id

      JOIN builders b
        ON pr.builder_id = b.id

      WHERE i.id = $1
      `,
      [id]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Inquiry not found"
      });
    }


    res.status(200).json(result.rows[0]);

  } catch (error) {

    console.error("Get inquiry error:", error);

    res.status(500).json({
      message: "Failed to fetch inquiry"
    });
  }
};


// PUT /api/inquiries/:id
// Admin API
const updateInquiry = async (req, res) => {

  const { id } = req.params;

  const {
    status,
    admin_notes
  } = req.body;


  const allowedStatuses = [
    "new",
    "contacted",
    "follow_up",
    "closed"
  ];


  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid inquiry status"
    });
  }


  try {

    const result = await pool.query(
      `
      UPDATE property_inquiries

      SET
        status = COALESCE($1, status),
        admin_notes = COALESCE($2, admin_notes),
        updated_at = NOW()

      WHERE id = $3

      RETURNING *
      `,
      [
        status || null,
        admin_notes || null,
        id
      ]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Inquiry not found"
      });
    }


    res.status(200).json({
      message: "Inquiry updated successfully",
      inquiry: result.rows[0]
    });

  } catch (error) {

    console.error("Update inquiry error:", error);

    res.status(500).json({
      message: "Failed to update inquiry"
    });
  }
};


// DELETE /api/inquiries/:id
// Admin API
const deleteInquiry = async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      `
      DELETE FROM property_inquiries
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Inquiry not found"
      });
    }


    res.status(200).json({
      message: "Inquiry deleted successfully"
    });

  } catch (error) {

    console.error("Delete inquiry error:", error);

    res.status(500).json({
      message: "Failed to delete inquiry"
    });
  }
};


module.exports = {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry
};