const voucherService = require('../../services/user/voucherService');

const validateVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) throw new Error('Kode voucher wajib diisi');

    const result = await voucherService.validateVoucher(code, req.user.id); // Pass user id
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  validateVoucher
};
