// server.js
const http = require('http');
const app = require('./app');
const { connect } = require('./db');
const validateEnv = require('./config/envValidator');
const { Server } = require('socket.io');
const { setIO } = require('./socketInstance');
const { initCronJobs } = require('./utils/cronJobs');
const checkServerTimeZone = require('./utils/timeChecker');

const PORT = Number(process.env.PORT) || 3000; // Pastikan PORT bertipe number
let server;
let io;

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Improved: findAvailablePort menggunakan loop, bukan rekursi
async function findAvailablePort(startPort) {
    let port = startPort;
    while (true) {
        try {
            await new Promise((resolve, reject) => {
                const testServer = http.createServer();
                testServer.once('error', err => {
                    testServer.close();
                    if (err.code === 'EADDRINUSE') {
                        resolve(false);
                    } else {
                        reject(err);
                    }
                });
                testServer.listen(port, () => {
                    testServer.close(() => resolve(true));
                });
            });
            return port;
        } catch (err) {
            throw err;
        }
        port++;
    }
}

async function startServer() {
    try {
        // Validate environment variables first
        if (!validateEnv()) {
            process.exit(1);
        }

        await connect();

        server = http.createServer(app);

        io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "*", // Use env variable
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        setIO(io);

        io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Handle admin joining room
    socket.on('join-admin-room', () => {
        socket.join('admin-room');
        console.log(`Admin ${socket.id} joined admin-room`);
        
        // Send confirmation
        socket.emit('admin-room-joined', {
            message: 'Successfully joined admin room',
            socketId: socket.id
        });
    });

    // Handle user joining room (optional)
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} (${socket.id}) joined user room`);
    });

    // Test event untuk debugging
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

        // Log port yang akan dicoba
        console.log(`🔎 Looking for available port starting from ${PORT}...`);
        // Find available port
        let availablePort;
        try {
            availablePort = await findAvailablePort(PORT);
        } catch (error) {
            console.error('❌ Failed to find available port:', error);
            process.exit(1);
        }

        server.listen(availablePort, () => {
            console.log(`🚀 Server running on http://localhost:${availablePort}`);
            if (availablePort !== PORT) {
                console.log(`⚠️  Originally tried port ${PORT}, but it was busy. Using port ${availablePort} instead.`);
            }

            // Initialize cron jobs after server is ready
            initCronJobs();
            checkServerTimeZone();
        });

        // Improved security timeouts
        server.timeout = 10000; // 10 seconds
        server.keepAliveTimeout = 5000;
        server.headersTimeout = 6000;
        
        // Limit max connections
        server.maxConnections = 100;
        
        // Enable TCP Keep Alive
        server.on('connection', socket => {
            socket.setKeepAlive(true, 60000); // 60 seconds
        });

        // Socket connection logging
        io.on('connection', (socket) => {
            console.log('Socket connected:', socket.id);
            
            socket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', socket.id, 'reason:', reason);
            });
        });

        // Tambahkan error handler untuk socket.io
        io.on('error', (err) => {
            console.error('Socket.IO error:', err);
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${error.port} is already in use`);
                console.log('💡 Try these commands to free up the port:');
                console.log(`   lsof -ti:${error.port} | xargs kill -9`);
                console.log(`   Or: pkill -f node`);
            } else {
                console.error('❌ Server error:', error);
            }
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Improved graceful shutdown: tunggu semua koneksi close
async function gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
    if (server) {
        console.log('📡 Closing Socket.IO connections...');
        if (io) {
            io.close();
        }
        console.log('🔌 Closing HTTP server...');
        server.close(() => {
            console.log('✅ Server closed successfully');
            process.exit(0);
        });
        // Cek koneksi aktif, paksa shutdown jika masih ada setelah timeout
        let forced = false;
        setTimeout(() => {
            if (!forced) {
                forced = true;
                console.log('⏰ Could not close connections in time, forcing shutdown');
                process.exit(1);
            }
        }, 10000);
    } else {
        console.log('ℹ️  No server instance to close.');
        process.exit(0);
    }
}

// Handle graceful shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Add process cleanup on exit
process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});

startServer().catch((error) => {
    console.error('❌ Critical startup error:', error);
    process.exit(1);
});