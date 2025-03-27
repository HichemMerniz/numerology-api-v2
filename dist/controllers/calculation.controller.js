"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/controllers/calculation.controller.ts
const express_1 = __importDefault(require("express"));
const calculation_service_1 = require("../services/calculation.service");
const storage_service_1 = require("../services/storage.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const calculationService = new calculation_service_1.CalculationService();
const storageService = storage_service_1.StorageService.getInstance();
router.post('/calculate', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const input = {
            lastName: req.body.lastName,
            firstName: req.body.firstName,
            middleNames: req.body.middleNames || [],
            birthDate: req.body.birthDate,
            maritalName: req.body.maritalName,
            usedFirstName: req.body.usedFirstName,
            carriedNameFor25Years: req.body.carriedNameFor25Years
        };
        // Validate input
        if (!input.lastName || !input.firstName || !input.birthDate) {
            res.status(400).json({
                error: 'Missing required fields',
                details: {
                    lastName: !input.lastName ? 'Last name is required' : null,
                    firstName: !input.firstName ? 'First name is required' : null,
                    birthDate: !input.birthDate ? 'Birth date is required' : null
                }
            });
            return;
        }
        // Validate birth date format (DD/MM/YYYY)
        const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
        if (!dateRegex.test(input.birthDate)) {
            res.status(400).json({
                error: 'Invalid birth date format',
                details: 'Birth date must be in DD/MM/YYYY format'
            });
            return;
        }
        // Perform calculation
        const result = calculationService.calculate(input);
        // Generate unique ID and save result
        const resultId = Date.now().toString();
        await storageService.saveCalculation(resultId, result, req.user.userId, {
            firstName: input.firstName,
            lastName: input.lastName,
            birthDate: input.birthDate
        });
        res.json({
            resultId,
            ...result
        });
    }
    catch (error) {
        console.error('Calculation error:', error);
        res.status(500).json({
            error: 'Failed to perform calculation',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/history', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        // Validate pagination parameters
        if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
            res.status(400).json({
                error: 'Invalid pagination parameters',
                details: 'Page must be a positive number and limit must be between 1 and 100'
            });
            return;
        }
        const history = await storageService.getCalculationHistory(req.user.userId, page, limit);
        res.json(history);
    }
    catch (error) {
        console.error('Error retrieving calculation history:', error);
        res.status(500).json({
            error: 'Failed to retrieve calculation history',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/result/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const result = await storageService.getCalculation(req.params.id);
        if (!result) {
            res.status(404).json({
                error: 'Result not found',
                details: `No calculation result found for ID: ${req.params.id}`
            });
            return;
        }
        res.json(result);
    }
    catch (error) {
        console.error('Error retrieving result:', error);
        res.status(500).json({
            error: 'Failed to retrieve result',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/result/:id/pdf', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const pdfBuffer = await storageService.getPDF(req.params.id);
        if (!pdfBuffer) {
            res.status(404).json({
                error: 'PDF not found',
                details: `No PDF found for calculation ID: ${req.params.id}`
            });
            return;
        }
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=numerology-report-${req.params.id}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);
        // Send the PDF
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Error retrieving PDF:', error);
        res.status(500).json({
            error: 'Failed to retrieve PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/all', auth_middleware_1.authenticateToken, async (_req, res) => {
    try {
        const result = await storageService.getAllCalculations();
        res.json(result);
    }
    catch (error) {
        console.error('Error retrieving all calculations:', error);
        res.status(500).json({
            error: 'Failed to retrieve all calculations',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
