const express = require("express");

const {
  createFlag,
  deleteFlag,
  getFlags,
  toggleFlag,
  updateFlag,
} = require("../controllers/flagController");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.post("/", authMiddleware, authorize("owner", "admin"), createFlag);
router.get("/", authMiddleware, getFlags);
router.put("/:id", authMiddleware, authorize("owner", "admin"), updateFlag);
router.delete("/:id", authMiddleware, authorize("owner", "admin"), deleteFlag);
router.patch(
  "/:id/toggle",
  authMiddleware,
  authorize("owner", "admin"),
  toggleFlag
);

module.exports = router;
