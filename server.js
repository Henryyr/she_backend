// server.js
const app = require('./app');
const { connect } = require('./db');

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
        await connect();
        server = app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
        
        // Add timeout handling
        server.timeout = 30000; // 30 seconds timeout
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

async function gracefulShutdown() {
    console.log('Received shutdown signal...');
    
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
    
    process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer().catch(console.error);
