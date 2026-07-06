const express = require("express");

const {
  createTenant,
  deleteTenant,
  getAllTenants,
  updateTenant,
} = require("../controllers/tenantController");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.post("/", authMiddleware, authorize("owner", "admin"), createTenant);
router.get("/", authMiddleware, authorize("owner", "admin"), getAllTenants);
router.put("/:id", authMiddleware, authorize("owner", "admin"), updateTenant);
router.delete(
  "/:id",
  authMiddleware,
  authorize("owner", "admin"),
  deleteTenant
);

module.exports = router;
