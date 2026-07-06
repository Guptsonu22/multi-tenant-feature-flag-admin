const express = require("express");

const {
  createTenant,
  deleteTenant,
  getAllTenants,
  updateTenant,
} = require("../controllers/tenantController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createTenant);
router.get("/", authMiddleware, getAllTenants);
router.put("/:id", authMiddleware, updateTenant);
router.delete("/:id", authMiddleware, deleteTenant);

module.exports = router;
