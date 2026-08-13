const express = require("express");

const {
  uploadPropertyImage,
  getPropertyImages,
  updatePropertyImage,
  deletePropertyImage
} = require("../controllers/propertyImageController");

const tokenValidation = require("../middlewares/tokenValidation");
const { adminUploadLimiter } = require("../middlewares/rateLimiter");
const upload = require("../middlewares/upload");

const router = express.Router();


// Public
router.get(
  "/:propertyId/images",
  getPropertyImages
);


// Admin only
router.post(
  "/:propertyId/images",
  tokenValidation,
  adminUploadLimiter,
  upload.single("image"),
  uploadPropertyImage
);


router.put(
  "/:propertyId/images/:imageId",
  tokenValidation,
  updatePropertyImage
);


router.delete(
  "/:propertyId/images/:imageId",
  tokenValidation,
  deletePropertyImage
);


module.exports = router;