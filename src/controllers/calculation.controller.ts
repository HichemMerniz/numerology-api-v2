// src/controllers/calculation.controller.ts
import express, { Request, Response } from 'express';
import { NumerologyInput, NumerologyResult } from '../types/numerology-types';
import { CalculationService } from '../services/calculation.service';
import { StorageService } from '../services/storage.service';
import { authenticateToken } from '../middleware/auth.middleware';

interface CalculateRequestBody {
  lastName: string;
  firstName: string;
  middleNames?: string[];
  birthDate: string;
  maritalName?: string;
  usedFirstName?: string;
  carriedNameFor25Years?: string;
}

interface ResultParams {
  id: string;
}

interface HistoryQueryParams {
  page?: string;
  limit?: string;
}

const router = express.Router();
const calculationService = new CalculationService();
const storageService = StorageService.getInstance();

router.post('/calculate', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const input: NumerologyInput = {
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
    await storageService.saveCalculation(
      resultId, 
      result,
      req.user!.userId,
      {
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: input.birthDate
      }
    );

    res.json({
      resultId,
      ...result
    });
    
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to perform calculation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/history', authenticateToken, async (req: Request<{}, {}, {}, HistoryQueryParams>, res: Response): Promise<void> => {
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

    const history = await storageService.getCalculationHistory(req.user!.userId, page, limit);
    res.json(history);
  } catch (error) {
    console.error('Error retrieving calculation history:', error);
    res.status(500).json({
      error: 'Failed to retrieve calculation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/result/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Error retrieving result:', error);
    res.status(500).json({
      error: 'Failed to retrieve result',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/result/:id/pdf', authenticateToken, async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Error retrieving PDF:', error);
    res.status(500).json({
      error: 'Failed to retrieve PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/all', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await storageService.getAllCalculations();
    res.json(result);
  } catch (error) {
    console.error('Error retrieving all calculations:', error);
    res.status(500).json({
      error: 'Failed to retrieve all calculations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;