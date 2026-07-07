const express = require("express");

const { login, refresh, register } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

module.exports = router;
