const express = require("express");

const {
  getBuilders,
  getBuilderById,
  createBuilder,
  updateBuilder,
  deleteBuilder
} = require("../controllers/builderController");

const tokenValidation = require('../middlewares/tokenValidation');

const router = express.Router();

router.get("/", getBuilders);

router.get("/:id", getBuilderById);

router.post("/", tokenValidation, createBuilder);

router.put("/:id", tokenValidation, updateBuilder);

router.delete("/:id", tokenValidation, deleteBuilder);

module.exports = router;