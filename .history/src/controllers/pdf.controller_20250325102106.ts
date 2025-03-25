import { Request, Response } from 'express';
// import { PDFService } from '../services/pdf.service';
import { CalculationService } from '../services/calculation.service';
import { isValidDate } from '../utils/date-utils';

export class PDFController {
  // private pdfService: PDFService;
  private calculationService: CalculationService;

  constructor() {
    this.pdfService = new PDFService();
    this.calculationService = new CalculationService();
  }

  public generatePDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const { birthDate, fullName, includeDetails, language } = req.body;

      if (!birthDate || !fullName) {
        res.status(400).json({ error: 'Birth date and full name are required' });
        return;
      }

      const parsedDate = new Date(birthDate);
      if (!isValidDate(parsedDate)) {
        res.status(400).json({ error: 'Invalid birth date format' });
        return;
      }

      const numerologyResult = this.calculationService.calculateNumerology({
        birthDate: parsedDate,
        fullName
      });

      const pdfBuffer = await this.pdfService.generatePDF(numerologyResult, {
        includeDetails: includeDetails ?? true,
        language: language ?? 'en'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=numerology-report.pdf');
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
} 