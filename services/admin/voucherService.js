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
    // 1. Ambil semua data voucher dari database
    const [vouchers] = await pool.query(
        `SELECT * FROM vouchers ORDER BY created_at DESC`
    );

    const now = new Date(); // Waktu server saat ini

    const vouchersWithStatus = vouchers.map(voucher => {
        let status = 'Inactive'; // Default status jika tidak aktif

        if (voucher.is_active) {
            const validFrom = new Date(voucher.valid_from);
            const validUntil = new Date(voucher.valid_until);

            if (now < validFrom) {
                status = 'Scheduled';
            } else if (now > validUntil) {
                status = 'Expired';
            } else {
                status = 'Active';
            }
        }

        return {
            ...voucher,
            status: status
        };
    });

    return vouchersWithStatus;
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
