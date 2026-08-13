const express = require("express");

const {
    createAdmin,
  loginAdmin,
  refreshAdminToken
} = require("../controllers/adminController");

const router = express.Router();

router.post("/create", createAdmin);
router.post("/login", loginAdmin);
router.post("/refresh", refreshAdminToken);

module.exports = router;