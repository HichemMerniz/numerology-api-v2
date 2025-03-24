// src/controllers/calculation.controller.ts
import { Request, Response, Router } from 'express';
import { NumerologyInput, NumerologyResult } from '../types/numerology-types';
import { CalculationService } from '../services/calculation.service';

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

const router = Router();
const calculationService = new CalculationService();

// In-memory storage for demonstration
const resultsStorage = new Map<string, NumerologyResult>();

router.post('/calculate', async (req: Request<{}, any, CalculateRequestBody>, res: Response): Promise<void> => {
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
    
    // Store result
    const resultId = Date.now().toString();
    resultsStorage.set(resultId, result);

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

router.get('/result/:id', (req: Request<ResultParams>, res: Response): void => {
  const result = resultsStorage.get(req.params.id);
  if (!result) {
    res.status(404).json({ 
      error: 'Result not found',
      details: `No calculation result found for ID: ${req.params.id}`
    });
    return;
  }
  res.json(result);
});

export default router;