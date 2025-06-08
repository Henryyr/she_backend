const { pool } = require("../../db");

const createVoucher = async (data) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    usage_limit,
    valid_from,
    valid_until,
    is_active,
  } = data;
  const [result] = await pool.query(
    `INSERT INTO vouchers (code, description, discount_type, discount_value, usage_limit, valid_from, valid_until, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      description,
      discount_type,
      discount_value,
      usage_limit,
      valid_from,
      valid_until,
      is_active,
    ]
  );
  return { id: result.insertId, ...data };
};

const getAllVouchers = async () => {
  const [vouchers] = await pool.query(
    `SELECT * FROM vouchers ORDER BY created_at DESC`
  );
  return vouchers;
};

const deleteVoucherByVoucherId = async (id) => {
  const [result] = await pool.query(
    `DELETE FROM vouchers WHERE id = ?`,
    [id]
  );

  return result.affectedRows > 0;
};



module.exports = {
  createVoucher,
  getAllVouchers,
  deleteVoucherByVoucherId
};
