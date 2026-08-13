const pool = require("../db/conn");
const supabase = require("../config/supabase");


// POST /api/properties/:propertyId/images
const uploadPropertyImage = async (req, res) => {

  const { propertyId } = req.params;

  if (!req.file) {
    return res.status(400).json({
      message: "Image is required"
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
      [propertyId]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }


    // Generate unique file name
    const fileName =
      `${Date.now()}-${Math.round(Math.random() * 1000000000)}`;

    const filePath = `${propertyId}/${fileName}`;


    // Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(
        filePath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          upsert: false
        }
      );


    if (uploadError) {
      console.error(
        "Supabase upload error:",
        uploadError
      );

      return res.status(500).json({
        message: "Failed to upload image"
      });
    }


    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("property-images")
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;


    // Get next display order
    const orderResult = await pool.query(
      `
      SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order
      FROM property_images
      WHERE property_id = $1
      `,
      [propertyId]
    );

    const displayOrder =
      orderResult.rows[0].next_order;


    // First image becomes primary automatically
    const isPrimary = displayOrder === 0;


    // Save image in database
    const result = await pool.query(
      `
      INSERT INTO property_images
      (
        property_id,
        image_url,
        display_order,
        is_primary
      )
      VALUES
      ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        propertyId,
        imageUrl,
        displayOrder,
        isPrimary
      ]
    );


    res.status(201).json({
      message: "Image uploaded successfully",
      image: result.rows[0]
    });

  } catch (error) {

    console.error(
      "Upload property image error:",
      error
    );

    res.status(500).json({
      message: "Failed to upload property image"
    });
  }
};



// GET /api/properties/:propertyId/images
const getPropertyImages = async (req, res) => {

  const { propertyId } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT
        id,
        property_id,
        image_url,
        display_order,
        is_primary,
        created_at
      FROM property_images
      WHERE property_id = $1
      ORDER BY display_order ASC
      `,
      [propertyId]
    );


    res.status(200).json({
      images: result.rows
    });

  } catch (error) {

    console.error(
      "Get property images error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch property images"
    });
  }
};



// PUT /api/properties/:propertyId/images/:imageId
const updatePropertyImage = async (req, res) => {

  const {
    propertyId,
    imageId
  } = req.params;

  const {
    display_order,
    is_primary
  } = req.body;


  try {

    // Check image exists for this property
    const imageResult = await pool.query(
      `
      SELECT id
      FROM property_images
      WHERE id = $1
      AND property_id = $2
      `,
      [
        imageId,
        propertyId
      ]
    );


    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        message: "Image not found"
      });
    }


    // If this image becomes primary,
    // remove primary from all other images
    if (is_primary === true) {

      await pool.query(
        `
        UPDATE property_images
        SET is_primary = FALSE
        WHERE property_id = $1
        `,
        [propertyId]
      );
    }


    const result = await pool.query(
      `
      UPDATE property_images
      SET
        display_order = COALESCE($1, display_order),
        is_primary = COALESCE($2, is_primary)
      WHERE id = $3
      AND property_id = $4
      RETURNING *
      `,
      [
        display_order ?? null,
        is_primary ?? null,
        imageId,
        propertyId
      ]
    );


    res.status(200).json({
      message: "Image updated successfully",
      image: result.rows[0]
    });

  } catch (error) {

    console.error(
      "Update property image error:",
      error
    );

    res.status(500).json({
      message: "Failed to update property image"
    });
  }
};



// DELETE /api/properties/:propertyId/images/:imageId
const deletePropertyImage = async (req, res) => {

  const {
    propertyId,
    imageId
  } = req.params;


  try {

    // Get image URL
    const imageResult = await pool.query(
      `
      SELECT image_url
      FROM property_images
      WHERE id = $1
      AND property_id = $2
      `,
      [
        imageId,
        propertyId
      ]
    );


    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        message: "Image not found"
      });
    }


    const imageUrl =
      imageResult.rows[0].image_url;


    // Extract Supabase storage path
    const marker =
      "/storage/v1/object/public/property-images/";


    const markerIndex =
      imageUrl.indexOf(marker);


    if (markerIndex === -1) {
      return res.status(500).json({
        message: "Invalid image URL"
      });
    }


    const filePath =
      imageUrl.substring(
        markerIndex + marker.length
      );


    // Delete from Supabase Storage
    const { error: storageError } =
      await supabase.storage
        .from("property-images")
        .remove([filePath]);


    if (storageError) {

      console.error(
        "Supabase delete error:",
        storageError
      );

      return res.status(500).json({
        message: "Failed to delete image from storage"
      });
    }


    // Delete from PostgreSQL
    await pool.query(
      `
      DELETE FROM property_images
      WHERE id = $1
      AND property_id = $2
      `,
      [
        imageId,
        propertyId
      ]
    );


    res.status(200).json({
      message: "Image deleted successfully"
    });

  } catch (error) {

    console.error(
      "Delete property image error:",
      error
    );

    res.status(500).json({
      message: "Failed to delete property image"
    });
  }
};


module.exports = {
  uploadPropertyImage,
  getPropertyImages,
  updatePropertyImage,
  deletePropertyImage
};