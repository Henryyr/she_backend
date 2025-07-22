const app = require('./app');
const { connect } = require('./db');
const { Server } = require('socket.io');
const { setIO } = require('./socketInstance');
const { initCronJobs } = require('./utils/cronJobs');
const checkServerTimeZone = require('./utils/timeChecker');

const PORT = Number(process.env.PORT) || 3000;

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

let server;
let io;

async function startServer () {
  try {
    // envValidator sudah tidak diperlukan, Bun menanganinya secara otomatis.
    await connect();

    // Jalankan Express langsung
    server = app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${server.address().port}`);
      // Initialize cron jobs after server is ready
      initCronJobs();
      checkServerTimeZone();
    });

    // Pasang Socket.IO ke server Express
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    setIO(io);

    io.on('connection', (socket) => {
      console.log('Socket terhubung:', socket.id);

      // Handle admin joining room
      socket.on('join-admin-room', () => {
        socket.join('admin-room');
        console.log(`Admin ${socket.id} joined admin-room`);
        socket.emit('admin-room-joined', {
          message: 'Successfully joined admin room',
          socketId: socket.id
        });
      });

      socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} (${socket.id}) joined user room`);
      });

      socket.on('test-admin-notification', () => {
        io.to('admin-room').emit('test-event', {
          message: 'Test notification from admin',
          timestamp: new Date().toISOString()
        });
        console.log('Test event sent to admin room');
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', socket.id, 'reason:', reason);
      });
    });

    io.on('error', (err) => {
      console.error('Socket.IO error:', err);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try these commands to free up the port:');
        console.log(`   lsof -ti:${PORT} | xargs kill -9`);
        console.log('   Or: pkill -f node');
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Gagal memulai server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown (signal) {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
  if (server) {
    if (io) io.close();
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
    setTimeout(() => {
      console.log('⏰ Could not close connections in time, forcing shutdown');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});

startServer();
