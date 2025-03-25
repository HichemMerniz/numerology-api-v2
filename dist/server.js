"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3000;
let server;
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    // Let the process exit so that the container/process manager can restart it
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Let the process exit so that the container/process manager can restart it
    process.exit(1);
});
const startServer = async () => {
    try {
        server = app_1.default.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('API Documentation available at: /');
        });
        // Handle graceful shutdown
        const signals = ['SIGTERM', 'SIGINT'];
        signals.forEach(signal => {
            process.on(signal, () => {
                console.log(`Received ${signal}, shutting down gracefully...`);
                server.close(() => {
                    console.log('HTTP server closed');
                    process.exit(0);
                });
                // Force shutdown after 5 seconds
                setTimeout(() => {
                    console.error('Could not close connections in time, forcefully shutting down');
                    process.exit(1);
                }, 5000);
            });
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer().catch(error => {
    console.error('Server startup error:', error);
    process.exit(1);
});
