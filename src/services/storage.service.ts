import fs from 'fs-extra';
import path from 'path';
import PDFDocument from 'pdfkit';
import { NumerologyResult } from '../types/numerology-types';

interface CalculationHistory {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  createdAt: Date;
  userId: string;
}

interface CalculationsData {
  [key: string]: NumerologyResult;
}

export class StorageService {
  private static instance: StorageService;
  private readonly storageDir: string;
  private readonly calculations: Map<string, NumerologyResult>;
  private readonly history: Map<string, CalculationHistory>;
  private readonly calculationsFilePath: string;

  private constructor() {
    // Create storage directory if it doesn't exist
    this.storageDir = path.join(process.cwd(), 'storage');
    this.calculations = new Map();
    this.history = new Map();
    this.calculationsFilePath = path.join(this.storageDir, 'calculations.json');
    this.initializeStorage();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.ensureDir(this.storageDir);
      await fs.ensureDir(path.join(this.storageDir, 'pdfs'));
      await fs.ensureDir(path.join(this.storageDir, 'history'));

      // Load existing calculations
      await this.loadCalculations();
      // Load existing history
      await this.loadHistory();
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw new Error('Storage initialization failed');
    }
  }

  private async loadCalculations(): Promise<void> {
    try {
      if (await fs.pathExists(this.calculationsFilePath)) {
        const data: CalculationsData = await fs.readJson(this.calculationsFilePath);
        Object.entries(data).forEach(([id, calculation]) => {
          this.calculations.set(id, calculation);
        });
      }
    } catch (error) {
      console.error('Failed to load calculations:', error);
    }
  }

  private async saveCalculations(): Promise<void> {
    try {
      const data: CalculationsData = {};
      this.calculations.forEach((calculation, id) => {
        data[id] = calculation;
      });
      await fs.writeJson(this.calculationsFilePath, data, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save calculations:', error);
      throw new Error('Failed to save calculations');
    }
  }

  private async loadHistory(): Promise<void> {
    try {
      const historyDir = path.join(this.storageDir, 'history');
      const files = await fs.readdir(historyDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const historyData = await fs.readJson(path.join(historyDir, file));
          this.history.set(historyData.id, historyData);
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  public async saveCalculation(id: string, result: NumerologyResult, userId: string, input: { firstName: string; lastName: string; birthDate: string }): Promise<void> {
    try {
      // Save calculation data
      this.calculations.set(id, result);
      await this.saveCalculations();

      // Save to history
      const historyEntry: CalculationHistory = {
        id,
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: input.birthDate,
        createdAt: new Date(),
        userId
      };

      this.history.set(id, historyEntry);
      await fs.writeJson(
        path.join(this.storageDir, 'history', `${id}.json`),
        historyEntry,
        { spaces: 2 }
      );

      // Generate and save PDF
      await this.generatePDF(id, result);
    } catch (error) {
      console.error('Failed to save calculation:', error);
      throw new Error('Failed to save calculation');
    }
  }

  public async getCalculationHistory(userId: string, page: number = 1, limit: number = 10): Promise<{
    calculations: CalculationHistory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Filter history by userId and sort by createdAt
      const userHistory = Array.from(this.history.values())
        .filter(entry => entry.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = userHistory.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedHistory = userHistory.slice(startIndex, endIndex);

      return {
        calculations: paginatedHistory,
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Failed to get calculation history:', error);
      throw new Error('Failed to get calculation history');
    }
  }

  public async getCalculation(id: string): Promise<NumerologyResult | null> {
    try {
      // Try to get from memory first
      const calculation = this.calculations.get(id);
      if (calculation) {
        return calculation;
      }

      // If not in memory, try to load from file
      if (await fs.pathExists(this.calculationsFilePath)) {
        const data: CalculationsData = await fs.readJson(this.calculationsFilePath);
        if (data[id]) {
          this.calculations.set(id, data[id]);
          return data[id];
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get calculation:', error);
      throw new Error('Failed to get calculation');
    }
  }

  public async getPDF(id: string): Promise<Buffer | null> {
    try {
      const pdfPath = path.join(this.storageDir, 'pdfs', `${id}.pdf`);
      if (await fs.pathExists(pdfPath)) {
        return await fs.readFile(pdfPath);
      }
      return null;
    } catch (error) {
      console.error('Failed to get PDF:', error);
      throw new Error('Failed to get PDF');
    }
  }


  // ? this function is responsible for generating the PDF report
  // ? it takes the id of the calculation and the result object as parameters
  // ? it uses the pdfkit library to create a PDF document
  // ? the PDF document is saved in the storage directory under the pdfs folder
  // ? the function returns a promise that resolves when the PDF is generated
  // ? the function also handles errors and rejects the promise if any error occurs
  // ? the PDF document contains various sections such as Life Path Number, Expression Number, Intimate Number, etc.
  // ? each section displays the corresponding number and its description
  // ? the PDF document is styled with different font sizes and alignments
  private async generatePDF(id: string, result: NumerologyResult): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const pdfPath = path.join(this.storageDir, 'pdfs', `${id}.pdf`);
        const writeStream = fs.createWriteStream(pdfPath);

        doc.pipe(writeStream);

        // Add content to PDF
        doc.fontSize(20).text('Numerology Report', { align: 'center' });
        doc.moveDown();

        doc.fontSize(16).text('Personal Information');

        // Helper for aligned key-value
        function printKeyValue(key: string, value: string) {
          doc.font('Helvetica').fontSize(12).text(key, { underline: true, continued: true });
          doc.font('Helvetica-Bold').fontSize(12).text(` ${value}`, { underline: false });
        }

        // First Name
        printKeyValue('First Name:', ` ${result.nameAnalysis.firstName.letters.join('')}`);

        // Middle Names
        printKeyValue('Middle Names:', ` ${result.nameAnalysis.middleNames.map(name => name.letters.join('')).join(', ')}`);

        // Marital Name (uncomment if needed)
        // printKeyValue('Marital Name:', ` ${result.nameAnalysis.maritalName ? result.nameAnalysis.maritalName.letters.join('') : 'N/A'}`);

        // Last Name
        printKeyValue('Last Name:', ` ${result.nameAnalysis.lastName.letters.join('')}`);

        // Birth Date
        printKeyValue('Birth Date:', ` ${result.birthDate}`);

        // ------------------------------------------------------------
        // Life Path Number
        doc.fontSize(16).text('Life Path Number');
        doc.fontSize(16).text('VOTRE CHEMIN DE VIE');
        doc.fontSize(12).text(`Number: ${result.lifePath}`);
        doc.moveDown();

        // Expression Number
        doc.fontSize(16).text('Expression Number');
        doc.fontSize(12).text(`Number: ${result.expression}`);
        doc.moveDown();

        // Intimate Number
        doc.fontSize(16).text('Intimate Number');
        doc.fontSize(12).text(`Number: ${result.intimate}`);
        doc.moveDown();

        // Realization Number
        doc.fontSize(16).text('Realization Number');
        doc.fontSize(12).text(`Number: ${result.realization}`);
        doc.moveDown();

        // Health Number
        doc.fontSize(16).text('Health Number');
        doc.fontSize(12).text(`Number: ${result.health}`);
        doc.moveDown();

        // Sentiment Number
        doc.fontSize(16).text('Sentiment Number');
        doc.fontSize(12).text(`Number: ${result.sentiment}`);
        doc.moveDown();

        // Heredity Number
        doc.fontSize(16).text('Nombre d\'Hérédité');
        doc.fontSize(12).text(`Nombre: ${result.heredityNumber.value}`);
        doc.fontSize(12).text(`Description: ${result.heredityNumber.description}`);
        doc.moveDown();

        // Karmic Debts
        doc.fontSize(16).text('Karmic Debts');
        doc.fontSize(12).text(result.karmicDebts.join(', '));
        doc.moveDown();

        // Inclusion Grid
        doc.fontSize(16).text('Grille d\'inclusion');
        Object.entries(result.inclusionGrid.grid).forEach(([number, count]) => {
          doc.fontSize(12).text(`Nombre ${number}: ${count}`);
        });
        
        // Pillar Legends
        doc.fontSize(14).text('Légendes des Piliers');
        result.inclusionGrid.legend.forEach(legend => {
          doc.fontSize(12).text(legend);
        });
        doc.moveDown();

        // Letter Analysis
        doc.fontSize(16).text('Étude des Lettres');
        
        doc.fontSize(14).text('Voyelles:');
        result.letterAnalysis.vowels.forEach(v => {
          doc.fontSize(12).text(`${v.letter}: ${v.value} (${v.count} fois)`);
        });
        
        doc.fontSize(14).text('Consonnes:');
        result.letterAnalysis.consonants.forEach(c => {
          doc.fontSize(12).text(`${c.letter}: ${c.value} (${c.count} fois)`);
        });
        
        doc.fontSize(12).text(`Total Voyelles: ${result.letterAnalysis.totalVowels}`);
        doc.fontSize(12).text(`Total Consonnes: ${result.letterAnalysis.totalConsonants}`);
        doc.fontSize(12).text(`Interprétation: ${result.letterAnalysis.interpretation}`);
        doc.moveDown();

        // Cycles
        doc.fontSize(16).text('Cycles de Vie');
        doc.fontSize(12).text(`Cycle Formatif: ${result.cycles.formatif.number}`);
        doc.fontSize(12).text(`Cycle Productif: ${result.cycles.productif.number}`);
        doc.fontSize(12).text(`Cycle de la Moisson: ${result.cycles["de la Moisson"].number}`);
        doc.moveDown();

        // Personality Traits
        doc.fontSize(16).text('Traits de Personnalité');
        doc.fontSize(12).text(`Sur le plan intime: ${result.personalityTraits["Sur le plan intime"]}`);
        doc.fontSize(12).text(`Sur le plan social et professionnel: ${result.personalityTraits["Sur le plan social et professionnel"]}`);
        doc.moveDown();

        // Realizations
        doc.fontSize(16).text('Realizations');
        doc.fontSize(12).text('Première:', result.realizations.Première);
        doc.fontSize(12).text('Deuxième:', result.realizations.deuxième);
        doc.fontSize(12).text('Troisième:', result.realizations.troisième);
        doc.fontSize(12).text('Quatrième:', result.realizations.quatrième);
        doc.moveDown();

        // Challenges
        doc.fontSize(16).text('Challenges');
        doc.fontSize(12).text('Premier Minor:', result.challenges.premierMinor);
        doc.fontSize(12).text('Deuxième Minor:', result.challenges.deuxièmeMinor);
        doc.fontSize(12).text('Major:', result.challenges.major);

        // Finalize PDF
        doc.end();

        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  public async getAllCalculations(): Promise<{
    calculations: Array<{
      id: string;
      data: NumerologyResult;
    }>;
    total: number;
  }> {
    try {
      const calculationsDir = path.join(this.storageDir, 'calculations');
      if (!await fs.pathExists(calculationsDir)) {
        return {
          calculations: [],
          total: 0
        };
      }

      const files = await fs.readdir(calculationsDir);
      const calculations = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            const id = file.replace('.json', '');
            const data = await fs.readJson(path.join(calculationsDir, file));
            return {
              id,
              data
            };
          })
      );

      return {
        calculations,
        total: calculations.length
      };
    } catch (error) {
      console.error('Failed to get all calculations:', error);
      throw new Error('Failed to get all calculations');
    }
  }
}