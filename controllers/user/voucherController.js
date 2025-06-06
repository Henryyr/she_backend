const voucherService = require("../../services/user/voucherService");

const validateVoucher = async (req, res) => {
  try {
    const { code, originalPrice } = req.body;
    const result = await voucherService.validateVoucher(code, originalPrice);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  validateVoucher,
};
