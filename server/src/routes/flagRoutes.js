const express = require("express");

const {
  createFlag,
  deleteFlag,
  getFlags,
  toggleFlag,
  updateFlag,
} = require("../controllers/flagController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createFlag);
router.get("/", authMiddleware, getFlags);
router.put("/:id", authMiddleware, updateFlag);
router.delete("/:id", authMiddleware, deleteFlag);
router.patch("/:id/toggle", authMiddleware, toggleFlag);

module.exports = router;
