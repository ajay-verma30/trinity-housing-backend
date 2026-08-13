const express = require("express");

const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry
} = require("../controllers/inquiryController");
const tokenValidation = require("../middlewares/tokenValidation");

const router = express.Router();


// Public
router.post("/", createInquiry);


// Admin
router.get("/", tokenValidation, getInquiries);

router.get("/:id", tokenValidation, getInquiryById);

router.put("/:id", tokenValidation, updateInquiry);

router.delete("/:id", tokenValidation, deleteInquiry);


module.exports = router;