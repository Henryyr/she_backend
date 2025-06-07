const { pool } = require("../../db");

const validateVoucher = async (code, originalPrice) => {
  const [vouchers] = await pool.query(
    `SELECT * FROM vouchers WHERE code = ? AND is_active = 1`,
    [code]
  );
  if (vouchers.length === 0) throw new Error("Voucher tidak valid");
  const voucher = vouchers[0];

  const now = new Date();
  if (voucher.valid_from && now < new Date(voucher.valid_from))
    throw new Error("Voucher belum berlaku");
  if (voucher.valid_until && now > new Date(voucher.valid_until))
    throw new Error("Voucher sudah kedaluwarsa");
  if (voucher.usage_limit !== null && voucher.used_count >= voucher.usage_limit)
    throw new Error("Voucher sudah habis digunakan");

  let discount = 0;
  if (voucher.discount_type === "percentage") {
    discount = Math.round((originalPrice * voucher.discount_value) / 100);
  } else {
    discount = Math.round(voucher.discount_value);
  }

  const finalPrice = Math.max(0, originalPrice - discount);
  return { discount, finalPrice, voucherId: voucher.id };
};

module.exports = {
  validateVoucher,
};
