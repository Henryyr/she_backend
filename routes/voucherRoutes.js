const express = require("express");
const { authenticate } = require("../middleware/auth");
const voucherController = require("../controllers/user/voucherController");

const router = express.Router();

router.post("/validate", authenticate, voucherController.validateVoucher);

module.exports = router;
