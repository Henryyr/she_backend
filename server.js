// server.js
const http = require('http');
const app = require('./app');
const { connect } = require('./db');
const validateEnv = require('./config/envValidator');
const { Server } = require('socket.io');
const { setIO } = require('./socketInstance');
const { initCronJobs } = require('./utils/cronJobs');
const checkServerTimeZone = require('./utils/timeChecker');

const PORT = Number(process.env.PORT) || 3000;

let server;
let io;

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

async function findAvailablePort(startPort) {
    let port = startPort;
    while (true) {
        try {
            const available = await new Promise((resolve, reject) => {
                const testServer = http.createServer();
                testServer.once('error', err => {
                    testServer.close();
                    if (err.code === 'EADDRINUSE') resolve(false);
                    else reject(err);
                });
                testServer.listen(port, () => {
                    testServer.close(() => resolve(true));
                });
            });
            if (available) return port;
        } catch (err) {
            throw err;
        }
        port++;
    }
}

async function startServer() {
    try {
        if (!validateEnv()) {
            console.error('❌ Environment variables validation failed.');
            process.exit(1);
        }

        await connect();

        server = http.createServer(app);

        io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        setIO(io);

        // Socket.IO connection handler with join-admin-room
        io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Tambahan: Handler untuk admin join room khusus admin
    socket.on('join-admin-room', () => {
        socket.join('admin-room');
        console.log(`Admin ${socket.id} joined admin-room`);
        socket.emit('admin-room-joined', {
            message: 'Berhasil join admin room',
            socketId: socket.id
        });
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', socket.id, 'reason:', reason);
    });
});

        io.on('error', (err) => {
            console.error('Socket.IO error:', err);
        });

        console.log(`🔎 Looking for available port starting from ${PORT}...`);
        const availablePort = await findAvailablePort(PORT);

        server.listen(availablePort, () => {
            console.log(`🚀 Server running on http://localhost:${availablePort}`);
            if (availablePort !== PORT) {
                console.warn(`⚠️ Originally tried port ${PORT}, but it was busy. Using port ${availablePort} instead.`);
            }
            initCronJobs();
            checkServerTimeZone();
        });

        // Security and performance timeouts
        server.timeout = 10000; // 10 sec
        server.keepAliveTimeout = 5000;
        server.headersTimeout = 6000;
        server.maxConnections = 100;

        server.on('connection', (socket) => {
            socket.setKeepAlive(true, 60000); // keep alive 60 sec
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${error.port} is already in use.`);
                console.log('💡 Commands to free the port:');
                console.log(`   lsof -ti:${error.port} | xargs kill -9`);
                console.log(`   pkill -f node`);
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

async function gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
    if (server) {
        console.log('📡 Closing Socket.IO connections...');
        if (io) io.close();
        console.log('🔌 Closing HTTP server...');
        server.close(() => {
            console.log('✅ Server closed successfully');
            process.exit(0);
        });
        let forced = false;
        setTimeout(() => {
            if (!forced) {
                forced = true;
                console.log('⏰ Could not close connections in time, forcing shutdown');
                process.exit(1);
            }
        }, 10000);
    } else {
        console.log('ℹ️ No server instance to close.');
        process.exit(0);
    }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});

startServer().catch((error) => {
    console.error('❌ Critical startup error:', error);
    process.exit(1);
});
