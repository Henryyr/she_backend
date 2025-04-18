// server.js
const app = require('./app');
const { connect } = require('./db');
const validateEnv = require('./config/envValidator');

const PORT = process.env.PORT || 3000;
let server;

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

async function startServer() {
    try {
        // Validate environment variables first
        if (!validateEnv()) {
            process.exit(1);
        }

        await connect();
        server = app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
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
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Improved graceful shutdown
async function gracefulShutdown(signal) {
    console.log(`Received ${signal}, shutting down...`);
    
    if (server) {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
            console.log('Could not close connections in time, forcing shutdown');
            process.exit(1);
        }, 10000);
    }
}

process.on('SIGTERM', (signal) => gracefulShutdown(signal));
process.on('SIGINT', (signal) => gracefulShutdown(signal));

startServer().catch(console.error);
