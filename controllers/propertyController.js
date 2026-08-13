const pool = require("../db/conn");


// GET /api/properties
const getProperties = async (req, res) => {

  const {
    city,
    locality,
    listing_type,
    property_type,
    bhk,
    min_price,
    max_price
  } = req.query;


  try {

    let query = `
      SELECT
        p.id,
        p.title,
        p.description,

        p.property_type,
        p.bhk,
        p.bedrooms,
        p.bathrooms,

        p.carpet_area_sqft,
        p.built_up_area_sqft,

        p.floor_number,
        p.total_floors,

        p.facing,

        p.price,
        p.maintenance_amount,

        p.parking_spaces,

        p.furnishing_status,
        p.availability_status,

        p.created_at,
        p.updated_at,

        pr.id AS project_id,
        pr.name AS project_name,
        pr.description AS project_description,

        pr.property_type AS project_property_type,
        pr.listing_type,

        pr.address,
        pr.locality,
        pr.city,
        pr.state,
        pr.pincode,

        pr.latitude,
        pr.longitude,

        pr.total_units,
        pr.total_towers,

        pr.possession_date,
        pr.rera_number,
        pr.status AS project_status,

        b.id AS builder_id,
        b.name AS builder_name

      FROM properties p

      JOIN projects pr
        ON p.project_id = pr.id

      JOIN builders b
        ON pr.builder_id = b.id

      WHERE 1 = 1
    `;


    const values = [];
    let parameterIndex = 1;


    // --------------------------------
    // Location - City
    // --------------------------------

    if (city) {

      query += `
        AND LOWER(pr.city) = LOWER($${parameterIndex})
      `;

      values.push(city);
      parameterIndex++;
    }


    // --------------------------------
    // Location - Locality
    // --------------------------------

    if (locality) {

      query += `
        AND LOWER(pr.locality) = LOWER($${parameterIndex})
      `;

      values.push(locality);
      parameterIndex++;
    }


    // --------------------------------
    // Buy / Rent
    // --------------------------------

    if (listing_type) {

      query += `
        AND pr.listing_type = $${parameterIndex}
      `;

      values.push(listing_type);
      parameterIndex++;
    }


    // --------------------------------
    // Property Type
    // --------------------------------

    if (property_type) {

      query += `
        AND pr.property_type = $${parameterIndex}
      `;

      values.push(property_type);
      parameterIndex++;
    }


    // --------------------------------
    // BHK
    // --------------------------------

    if (bhk) {

      query += `
        AND p.bhk = $${parameterIndex}
      `;

      values.push(bhk);
      parameterIndex++;
    }


    // --------------------------------
    // Minimum Price
    // --------------------------------

    if (min_price) {

      query += `
        AND p.price >= $${parameterIndex}
      `;

      values.push(min_price);
      parameterIndex++;
    }


    // --------------------------------
    // Maximum Price
    // --------------------------------

    if (max_price) {

      query += `
        AND p.price <= $${parameterIndex}
      `;

      values.push(max_price);
      parameterIndex++;
    }


    // --------------------------------
    // Sort
    // --------------------------------

    query += `
      ORDER BY p.created_at DESC
    `;


    const result = await pool.query(
      query,
      values
    );


    res.status(200).json({
      count: result.rows.length,
      properties: result.rows
    });


  } catch (error) {

    console.error(
      "Get properties error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch properties"
    });
  }
};




// GET /api/properties/:id
const getPropertyById = async (req, res) => {
  const { id } = req.params;

  try {
    const propertyResult = await pool.query(
      `
      SELECT
        p.*,

        pr.id AS project_id,
        pr.name AS project_name,
        pr.description AS project_description,
        pr.locality,
        pr.city,
        pr.state,
        pr.pincode,
        pr.latitude,
        pr.longitude,
        pr.possession_date,
        pr.rera_number,

        b.id AS builder_id,
        b.name AS builder_name,
        b.description AS builder_description

      FROM properties p

      JOIN projects pr
        ON p.project_id = pr.id

      JOIN builders b
        ON pr.builder_id = b.id

      WHERE p.id = $1
      `,
      [id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    const property = propertyResult.rows[0];


    // Get property images
    const imageResult = await pool.query(
      `
      SELECT
        id,
        image_url,
        display_order,
        is_primary
      FROM property_images
      WHERE property_id = $1
      ORDER BY display_order ASC
      `,
      [id]
    );


    // Structure the response
    res.status(200).json({
      id: property.id,

      title: property.title,
      description: property.description,

      property_type: property.property_type,

      bhk: property.bhk,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,

      carpet_area_sqft: property.carpet_area_sqft,
      built_up_area_sqft: property.built_up_area_sqft,

      floor_number: property.floor_number,
      total_floors: property.total_floors,

      facing: property.facing,

      price: property.price,
      maintenance_amount: property.maintenance_amount,

      parking_spaces: property.parking_spaces,

      furnishing_status: property.furnishing_status,

      availability_status: property.availability_status,

      project: {
        id: property.project_id,
        name: property.project_name,
        description: property.project_description,

        locality: property.locality,
        city: property.city,
        state: property.state,
        pincode: property.pincode,

        latitude: property.latitude,
        longitude: property.longitude,

        possession_date: property.possession_date,
        rera_number: property.rera_number
      },

      builder: {
        id: property.builder_id,
        name: property.builder_name,
        description: property.builder_description
      },

      images: imageResult.rows
    });

  } catch (error) {
    console.error("Get property error:", error);

    res.status(500).json({
      message: "Failed to fetch property"
    });
  }
};


// POST /api/properties

const createProperty = async (req, res) => {

  const {
    project_id,
    title,
    description,
    property_type,
    bhk,
    bedrooms,
    bathrooms,
    carpet_area_sqft,
    built_up_area_sqft,
    floor_number,
    total_floors,
    facing,
    price,
    maintenance_amount,
    parking_spaces,
    furnishing_status,
    availability_status,
    is_featured
  } = req.body;


  if (
    !project_id ||
    !title ||
    !property_type ||
    !price
  ) {
    return res.status(400).json({
      message: "Required property details are missing"
    });
  }


  try {

    // Verify project exists
    const projectResult = await pool.query(
      `
      SELECT id
      FROM projects
      WHERE id = $1
      `,
      [project_id]
    );


    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }


    const result = await pool.query(
      `
      INSERT INTO properties
      (
        project_id,
        title,
        description,
        property_type,
        bhk,
        bedrooms,
        bathrooms,
        carpet_area_sqft,
        built_up_area_sqft,
        floor_number,
        total_floors,
        facing,
        price,
        maintenance_amount,
        parking_spaces,
        furnishing_status,
        availability_status,
        is_featured
      )

      VALUES
      (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,
        $16,$17,$18
      )

      RETURNING *
      `,
      [
        project_id,
        title,
        description,
        property_type,
        bhk,
        bedrooms,
        bathrooms,
        carpet_area_sqft,
        built_up_area_sqft,
        floor_number,
        total_floors,
        facing,
        price,
        maintenance_amount,
        parking_spaces,
        furnishing_status,
        availability_status || "available",
        is_featured ?? false
      ]
    );


    res.status(201).json({
      message: "Property created successfully",
      property: result.rows[0]
    });

  } catch (error) {

    console.error("Create property error:", error);

    res.status(500).json({
      message: "Failed to create property"
    });
  }
};


// PUT /api/properties/:id
const updateProperty = async (req, res) => {

  const { id } = req.params;

  const {
    project_id,
    title,
    description,
    property_type,
    bhk,
    bedrooms,
    bathrooms,
    carpet_area_sqft,
    built_up_area_sqft,
    floor_number,
    total_floors,
    facing,
    price,
    maintenance_amount,
    parking_spaces,
    furnishing_status,
    availability_status,
    is_featured
  } = req.body;


  try {

    const result = await pool.query(
      `
      UPDATE properties

      SET
        project_id = $1,
        title = $2,
        description = $3,
        property_type = $4,
        bhk = $5,
        bedrooms = $6,
        bathrooms = $7,
        carpet_area_sqft = $8,
        built_up_area_sqft = $9,
        floor_number = $10,
        total_floors = $11,
        facing = $12,
        price = $13,
        maintenance_amount = $14,
        parking_spaces = $15,
        furnishing_status = $16,
        availability_status = $17,
        is_featured = $18,
        updated_at = NOW()

      WHERE id = $19

      RETURNING *
      `,
      [
        project_id,
        title,
        description,
        property_type,
        bhk,
        bedrooms,
        bathrooms,
        carpet_area_sqft,
        built_up_area_sqft,
        floor_number,
        total_floors,
        facing,
        price,
        maintenance_amount,
        parking_spaces,
        furnishing_status,
        availability_status,
        is_featured ?? false,
        id
      ]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }


    res.status(200).json({
      message: "Property updated successfully",
      property: result.rows[0]
    });

  } catch (error) {

    console.error("Update property error:", error);

    res.status(500).json({
      message: "Failed to update property"
    });
  }
};


// DELETE /api/properties/:id
const deleteProperty = async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      `
      DELETE FROM properties
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }


    res.status(200).json({
      message: "Property deleted successfully"
    });

  } catch (error) {

    console.error("Delete property error:", error);

    res.status(500).json({
      message: "Failed to delete property"
    });
  }
};


module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
};