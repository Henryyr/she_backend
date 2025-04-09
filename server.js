// server.js
const app = require('./app');
const db = require('./db');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await db.connect();
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Gagal menghubungkan ke database:', error);
  }
});
