// server.js
const http = require('http');
const app = require('./app');
const { connect } = require('./db');
const validateEnv = require('./config/envValidator');
const { Server } = require('socket.io');
const { setIO } = require('./socketInstance');
const { initCronJobs } = require('./utils/cronJobs');
const checkServerTimeZone = require('./utils/timeChecker');

const PORT = process.env.PORT || 3000;
let server;
let io;

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Function to find available port
async function findAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const testServer = http.createServer();
        
        testServer.listen(startPort, () => {
            const port = testServer.address().port;
            testServer.close(() => {
                resolve(port);
            });
        });
        
        testServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                // Try next port
                findAvailablePort(startPort + 1).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
    });
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

// Improved graceful shutdown
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

        // Force close after 10 seconds
        setTimeout(() => {
            console.log('⏰ Could not close connections in time, forcing shutdown');
            process.exit(1);
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