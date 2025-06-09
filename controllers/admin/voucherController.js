const voucherService = require("../../services/admin/voucherService");

const createVoucher = async (req, res) => {
  try {
    const voucher = await voucherService.createVoucher(req.body);
    res
      .status(201)
      .json({
        success: true,
        message: "Voucher berhasil dibuat",
        data: voucher,
      });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal membuat voucher",
        error: err.message,
      });
  }
};

const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await voucherService.getAllVouchers();
    res.json({ success: true, data: vouchers });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil voucher",
        error: err.message,
      });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await voucherService.deleteVoucherByVoucherId(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Voucher tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Voucher berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus voucher",
      error: err.message,
    });
  }
};


module.exports = {
  createVoucher,
  getAllVouchers,
  deleteVoucher
};
