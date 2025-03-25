"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = require("../services/user.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const userService = new user_service_1.UserService();
// Register new user
router.post('/register', async (req, res) => {
    try {
        const input = {
            email: req.body.email,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName
        };
        const result = await userService.register(input);
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({
                error: 'Registration failed',
                details: error.message
            });
        }
        else {
            res.status(500).json({
                error: 'Registration failed',
                details: 'An unexpected error occurred'
            });
        }
    }
});
// Login user
router.post('/login', async (req, res) => {
    try {
        const input = {
            email: req.body.email,
            password: req.body.password
        };
        const result = await userService.login(input);
        res.json(result);
    }
    catch (error) {
        res.status(401).json({
            error: 'Authentication failed',
            details: 'Invalid email or password'
        });
    }
});
// Get current user profile
router.get('/profile', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const user = await userService.getUser(req.user.userId);
        res.json(user);
    }
    catch (error) {
        res.status(404).json({
            error: 'User not found',
            details: 'User profile could not be retrieved'
        });
    }
});
// Update user profile
router.put('/profile', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const input = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        };
        const updatedUser = await userService.updateUser(req.user.userId, input);
        res.json(updatedUser);
    }
    catch (error) {
        res.status(400).json({
            error: 'Update failed',
            details: error instanceof Error ? error.message : 'Failed to update profile'
        });
    }
});
// Update password
router.put('/password', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const input = {
            currentPassword: req.body.currentPassword,
            newPassword: req.body.newPassword
        };
        await userService.updatePassword(req.user.userId, input);
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        res.status(400).json({
            error: 'Password update failed',
            details: error instanceof Error ? error.message : 'Failed to update password'
        });
    }
});
// Admin only: Get all users
router.get('/users', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['admin']), async (_req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve users',
            details: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
    }
});
exports.default = router;
