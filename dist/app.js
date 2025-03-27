"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const calculation_controller_1 = __importDefault(require("./controllers/calculation.controller"));
const user_controller_1 = __importDefault(require("./controllers/user.controller"));
// Load environment variables
dotenv_1.default.config();
// Validate required environment variables
// if (!process.env.JWT_SECRET) {
//   throw new Error('JWT_SECRET environment variable is required');
// }
// Create Express application
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.get('/', (_req, res) => {
    res.json({
        message: 'Welcome to Numerology API',
        version: '2.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile',
                updateProfile: 'PUT /api/auth/profile',
                updatePassword: 'PUT /api/auth/password',
                users: 'GET /api/auth/users (Admin only)'
            },
            numerology: {
                calculate: 'POST /api/calculations/calculate',
                getResult: 'GET /api/calculations/result/:id',
                history: 'GET /api/calculations/history'
            }
        }
    });
});
// API Routes
app.use('/api/auth', user_controller_1.default);
app.use('/api/calculations', calculation_controller_1.default);
// 404 Handler
app.use((_req, res) => {
    res.status(404).json({
        error: 'Not Found',
        details: 'The requested resource was not found'
    });
});
// Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
});
exports.default = app;
