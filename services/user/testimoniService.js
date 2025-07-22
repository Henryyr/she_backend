const { pool } = require('../../db');

const createTestimoni = async (data) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO testimoni (user_id, layanan_id, rating, comment, image_url) VALUES (?, ?, ?, ?, ?)',
      [data.user_id, data.layanan_id, data.rating, data.comment, data.image_url]
    );
    return result;
  } catch (error) {
    console.error('Error creating testimonial:', error);
    throw error;
  }
};

const createTestimoniWithConn = async (conn, data) => {
  try {
    const [result] = await conn.query(
      'INSERT INTO testimoni (user_id, rating, comment, image_url) VALUES (?, ?, ?, ?)',
      [data.user_id, data.rating, data.comment, data.image_url]
    );
    return result;
  } catch (error) {
    console.error('Error creating testimonial:', error);
    throw error;
  }
};

const getPublic = async () => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM testimoni WHERE status = "approved" ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    console.error('Error getting public testimonials:', error);
    throw error;
  }
};

module.exports = {
  createTestimoni,
  createTestimoniWithConn,
  getPublic
};
