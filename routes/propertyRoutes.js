const express = require("express");

const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
} = require("../controllers/propertyController");

const tokenValidation = require('../middlewares/tokenValidation');

const router = express.Router();

router.get("/", getProperties);

router.get("/:id", getPropertyById);

router.post("/", tokenValidation, createProperty);

router.put("/:id", tokenValidation, updateProperty);

router.delete("/:id", tokenValidation, deleteProperty);

module.exports = router;