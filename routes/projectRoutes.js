const express = require("express");

const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require("../controllers/projectController");

const tokenValidation = require('../middlewares/tokenValidation');

const router = express.Router();

router.get("/", getProjects);

router.get("/:id", getProjectById);

router.post("/", tokenValidation, createProject);

router.put("/:id", tokenValidation, updateProject);

router.delete("/:id", tokenValidation, deleteProject);

module.exports = router;