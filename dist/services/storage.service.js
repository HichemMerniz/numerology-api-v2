"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
class StorageService {
    constructor() {
        // Create storage directory if it doesn't exist
        this.storageDir = path_1.default.join(process.cwd(), 'storage');
        this.calculations = new Map();
        this.history = new Map();
        this.calculationsFilePath = path_1.default.join(this.storageDir, 'calculations.json');
        this.initializeStorage();
    }
    static getInstance() {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }
    async initializeStorage() {
        try {
            await fs_extra_1.default.ensureDir(this.storageDir);
            await fs_extra_1.default.ensureDir(path_1.default.join(this.storageDir, 'pdfs'));
            await fs_extra_1.default.ensureDir(path_1.default.join(this.storageDir, 'history'));
            // Load existing calculations
            await this.loadCalculations();
            // Load existing history
            await this.loadHistory();
        }
        catch (error) {
            console.error('Failed to initialize storage:', error);
            throw new Error('Storage initialization failed');
        }
    }
    async loadCalculations() {
        try {
            if (await fs_extra_1.default.pathExists(this.calculationsFilePath)) {
                const data = await fs_extra_1.default.readJson(this.calculationsFilePath);
                Object.entries(data).forEach(([id, calculation]) => {
                    this.calculations.set(id, calculation);
                });
            }
        }
        catch (error) {
            console.error('Failed to load calculations:', error);
        }
    }
    async saveCalculations() {
        try {
            const data = {};
            this.calculations.forEach((calculation, id) => {
                data[id] = calculation;
            });
            await fs_extra_1.default.writeJson(this.calculationsFilePath, data, { spaces: 2 });
        }
        catch (error) {
            console.error('Failed to save calculations:', error);
            throw new Error('Failed to save calculations');
        }
    }
    async loadHistory() {
        try {
            const historyDir = path_1.default.join(this.storageDir, 'history');
            const files = await fs_extra_1.default.readdir(historyDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const historyData = await fs_extra_1.default.readJson(path_1.default.join(historyDir, file));
                    this.history.set(historyData.id, historyData);
                }
            }
        }
        catch (error) {
            console.error('Failed to load history:', error);
        }
    }
    async saveCalculation(id, result, userId, input) {
        try {
            // Save calculation data
            this.calculations.set(id, result);
            await this.saveCalculations();
            // Save to history
            const historyEntry = {
                id,
                firstName: input.firstName,
                lastName: input.lastName,
                birthDate: input.birthDate,
                createdAt: new Date(),
                userId
            };
            this.history.set(id, historyEntry);
            await fs_extra_1.default.writeJson(path_1.default.join(this.storageDir, 'history', `${id}.json`), historyEntry, { spaces: 2 });
            // Generate and save PDF
            await this.generatePDF(id, result);
        }
        catch (error) {
            console.error('Failed to save calculation:', error);
            throw new Error('Failed to save calculation');
        }
    }
    async getCalculationHistory(userId, page = 1, limit = 10) {
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
        }
        catch (error) {
            console.error('Failed to get calculation history:', error);
            throw new Error('Failed to get calculation history');
        }
    }
    async getCalculation(id) {
        try {
            // Try to get from memory first
            const calculation = this.calculations.get(id);
            if (calculation) {
                return calculation;
            }
            // If not in memory, try to load from file
            if (await fs_extra_1.default.pathExists(this.calculationsFilePath)) {
                const data = await fs_extra_1.default.readJson(this.calculationsFilePath);
                if (data[id]) {
                    this.calculations.set(id, data[id]);
                    return data[id];
                }
            }
            return null;
        }
        catch (error) {
            console.error('Failed to get calculation:', error);
            throw new Error('Failed to get calculation');
        }
    }
    async getPDF(id) {
        try {
            const pdfPath = path_1.default.join(this.storageDir, 'pdfs', `${id}.pdf`);
            if (await fs_extra_1.default.pathExists(pdfPath)) {
                return await fs_extra_1.default.readFile(pdfPath);
            }
            return null;
        }
        catch (error) {
            console.error('Failed to get PDF:', error);
            throw new Error('Failed to get PDF');
        }
    }
    async generatePDF(id, result) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default();
                const pdfPath = path_1.default.join(this.storageDir, 'pdfs', `${id}.pdf`);
                const writeStream = fs_extra_1.default.createWriteStream(pdfPath);
                doc.pipe(writeStream);
                // Add content to PDF
                doc.fontSize(20).text('Numerology Report', { align: 'center' });
                doc.moveDown();
                // Life Path Number
                doc.fontSize(16).text('Life Path Number');
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
                doc.fontSize(16).text('Heredity Number');
                doc.fontSize(12).text(`Number: ${result.heredity}`);
                doc.moveDown();
                // Karmic Debts
                doc.fontSize(16).text('Karmic Debts');
                doc.fontSize(12).text(result.karmicDebts.join(', '));
                doc.moveDown();
                // Inclusion Grid
                doc.fontSize(16).text('Inclusion Grid');
                Object.entries(result.inclusionGrid).forEach(([number, count]) => {
                    doc.fontSize(12).text(`Number ${number}: ${count}`);
                });
                doc.moveDown();
                // Cycles
                doc.fontSize(16).text('Cycles');
                doc.fontSize(12).text('Formative:', result.cycles.formative.number);
                doc.fontSize(12).text('Productive:', result.cycles.productive.number);
                doc.fontSize(12).text('Harvest:', result.cycles.harvest.number);
                doc.moveDown();
                // Realizations
                doc.fontSize(16).text('Realizations');
                doc.fontSize(12).text('First:', result.realizations.first);
                doc.fontSize(12).text('Second:', result.realizations.second);
                doc.fontSize(12).text('Third:', result.realizations.third);
                doc.fontSize(12).text('Fourth:', result.realizations.fourth);
                doc.moveDown();
                // Challenges
                doc.fontSize(16).text('Challenges');
                doc.fontSize(12).text('First Minor:', result.challenges.firstMinor);
                doc.fontSize(12).text('Second Minor:', result.challenges.secondMinor);
                doc.fontSize(12).text('Major:', result.challenges.major);
                // Finalize PDF
                doc.end();
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async getAllCalculations() {
        try {
            const calculationsDir = path_1.default.join(this.storageDir, 'calculations');
            if (!await fs_extra_1.default.pathExists(calculationsDir)) {
                return {
                    calculations: [],
                    total: 0
                };
            }
            const files = await fs_extra_1.default.readdir(calculationsDir);
            const calculations = await Promise.all(files
                .filter(file => file.endsWith('.json'))
                .map(async (file) => {
                const id = file.replace('.json', '');
                const data = await fs_extra_1.default.readJson(path_1.default.join(calculationsDir, file));
                return {
                    id,
                    data
                };
            }));
            return {
                calculations,
                total: calculations.length
            };
        }
        catch (error) {
            console.error('Failed to get all calculations:', error);
            throw new Error('Failed to get all calculations');
        }
    }
}
exports.StorageService = StorageService;
