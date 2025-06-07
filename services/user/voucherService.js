const { pool } = require("../../db");

const validateVoucher = async (code) => {
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

  return {
    code: voucher.code,
    description: voucher.description,
    discount_type: voucher.discount_type,
    discount_value: voucher.discount_value,
    valid_from: voucher.valid_from,
    valid_until: voucher.valid_until,
  };
};

module.exports = {
  validateVoucher,
};
