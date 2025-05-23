"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculationService = void 0;
const numerology_data_1 = require("../config/numerology-data");
class CalculationService {
    calculate(input) {
        // Name calculations
        const lastNameCalc = this.calculateName(input.lastName);
        const firstNameCalc = this.calculateName(input.firstName);
        const middleNamesCalc = input.middleNames.map(name => this.calculateName(name));
        const maritalNameCalc = input.maritalName ? this.calculateName(input.maritalName) : undefined;
        // Life Path calculation
        const lifePath = this.calculateLifePath(input.birthDate);
        // Core numbers - check for special numbers (11, 22, 33)
        const expression = this.checkSpecialNumber(lastNameCalc.total + firstNameCalc.total);
        const intimate = this.checkSpecialNumber(lastNameCalc.vowelSum + firstNameCalc.vowelSum);
        const realization = this.checkSpecialNumber(lastNameCalc.consonantSum + firstNameCalc.consonantSum);
        // Health, Sentiment, Heredity - using special numbers check
        const health = this.checkSpecialNumber(firstNameCalc.total);
        const sentiment = this.checkSpecialNumber(middleNamesCalc.reduce((sum, calc) => sum + calc.total, 0));
        const heredity = this.checkSpecialNumber(lastNameCalc.total);
        // Karmic debts - only keep 13, 14, 16, 19
        const karmicDebts = this.calculateKarmicDebts([
            lastNameCalc,
            firstNameCalc,
            ...middleNamesCalc,
            ...(maritalNameCalc ? [maritalNameCalc] : [])
        ]).filter(num => [13, 14, 16, 19].includes(num));
        // Inclusion grid with proper counting
        const inclusionGrid = this.calculateInclusionGrid([
            lastNameCalc,
            firstNameCalc,
            ...middleNamesCalc,
            ...(maritalNameCalc ? [maritalNameCalc] : [])
        ]);
        // Cycles with proper naming (formatif, productif, moisson)
        const cycles = this.calculateCycles(input.birthDate);
        // Realizations with special numbers check
        const realizations = this.calculateRealizations(lifePath);
        // Challenges
        const challenges = this.calculateChallenges(input.birthDate);
        return {
            lifePath: this.checkSpecialNumber(lifePath),
            expression,
            intimate,
            realization,
            health,
            sentiment,
            heredity,
            karmicDebts,
            inclusionGrid,
            cycles,
            realizations,
            challenges,
            personalityTraits: {
                intimate: firstNameCalc.letters[0] || '', // First letter of first name
                social: lastNameCalc.letters[0] || '' // First letter of last name
            },
            nameAnalysis: {
                lastName: lastNameCalc,
                firstName: firstNameCalc,
                middleNames: middleNamesCalc,
                maritalName: maritalNameCalc
            },
            vibration: numerology_data_1.numerologyData.validPillars, // Using validPillars instead of 1-9 range
            //@ts-ignore
            fundamentalNumbers: Array.from({ length: 9 }, (_, i) => i + 1).map(num => ({
                value: num,
                intensity: this.getNumberIntensity(inclusionGrid[num]),
                //@ts-ignore
                traits: numerology_data_1.numerologyData.meanings[num] || [],
                //@ts-ignore
                description: numerology_data_1.numerologyData.inclusionGridMeanings[num] || ''
            }))
        };
    }
    calculateName(name) {
        const letters = name.toUpperCase().split('').filter(c => c !== ' ');
        const values = [];
        const consonants = [];
        const vowels = [];
        for (const letter of letters) {
            const letterData = numerology_data_1.numerologyData.letterValues[letter];
            if (letterData) {
                values.push(letterData.value);
                if (letterData.type === 'C') {
                    consonants.push(letterData.value);
                    vowels.push(0);
                }
                else {
                    consonants.push(0);
                    vowels.push(letterData.value);
                }
            }
            else {
                values.push(0);
                consonants.push(0);
                vowels.push(0);
            }
        }
        return {
            letters,
            values,
            consonants,
            vowels,
            total: this.reduceNumber(values.reduce((a, b) => a + b, 0)),
            consonantSum: this.reduceNumber(consonants.reduce((a, b) => a + b, 0)),
            vowelSum: this.reduceNumber(vowels.reduce((a, b) => a + b, 0))
        };
    }
    calculateLifePath(birthDate) {
        const [day, month, year] = birthDate.split('/').map(Number);
        const daySum = this.reduceNumber(day);
        const monthSum = this.reduceNumber(month);
        const yearSum = this.reduceNumber(year);
        return this.reduceNumber(daySum + monthSum + yearSum);
    }
    calculateCycles(birthDate) {
        const [day, month, year] = birthDate.split('/').map(Number);
        const lifePath = this.calculateLifePath(birthDate);
        const cycleData = numerology_data_1.numerologyData.cycleYears[lifePath];
        if (!cycleData) {
            return {
                formative: { number: 0, years: '0-27' },
                productive: { number: 0, years: '28-54' },
                harvest: { number: 0, years: '55+' }
            };
        }
        return {
            formative: {
                number: this.reduceNumber(month),
                years: `0-${cycleData.formative}`
            },
            productive: {
                number: this.reduceNumber(day),
                years: `${cycleData.formative + 1}-${cycleData.productive}`
            },
            harvest: {
                number: this.reduceNumber(year),
                years: `${cycleData.productive + 1}+`
            }
        };
    }
    reduceRealizationNumber(num) {
        if ([11, 22].includes(num)) {
            return num;
        }
        let reduced = this.reduceNumber(num);
        return [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(reduced) ? reduced : this.reduceNumber(reduced);
    }
    calculateRealizations(lifePath) {
        const realizationData = numerology_data_1.numerologyData.realizationPeriods[lifePath];
        if (!realizationData) {
            return {
                premier: 0,
                deuxième: 0,
                troisième: 0,
                quatrième: 0
            };
        }
        return {
            premier: this.reduceRealizationNumber(realizationData.premier),
            deuxième: this.reduceRealizationNumber(realizationData.deuxième),
            troisième: this.reduceRealizationNumber(realizationData.troisième),
            quatrième: this.reduceRealizationNumber(realizationData.quatrième)
        };
    }
    calculateChallenges(birthDate) {
        const [day, month, year] = birthDate.split('/').map(Number);
        const premierMinor = Math.abs(this.reduceNumber(month) - this.reduceNumber(day));
        const deuxièmeMinor = Math.abs(this.reduceNumber(year) - this.reduceNumber(day));
        const major = Math.abs(premierMinor - deuxièmeMinor);
        return {
            premierMinor,
            deuxièmeMinor,
            major
        };
    }
    calculateKarmicDebts(calculations) {
        const allValues = calculations.flatMap(c => c.values);
        const uniqueValues = new Set(allValues);
        return Object.keys(numerology_data_1.numerologyData.karmicDebts)
            .map(Number)
            .filter(n => !uniqueValues.has(n))
            .filter(n => ![3, 5, 7].includes(n));
    }
    calculateInclusionGrid(calculations) {
        const grid = {};
        const allValues = calculations.flatMap(c => c.values);
        for (let i = 1; i <= 9; i++) {
            grid[i] = allValues.filter(v => v === i).length;
        }
        return grid;
    }
    reduceNumber(num) {
        if (numerology_data_1.numerologyData.specialNumbers.includes(num)) {
            return num;
        }
        while (num > 9) {
            num = Array.from(String(num), Number).reduce((a, b) => a + b, 0);
        }
        return num;
    }
    getNumberIntensity(count) {
        if (count === 0)
            return 'Absente';
        if (count === 1)
            return 'Normale';
        if (count === 2)
            return 'Renforcée';
        if (count === 3)
            return 'Intensifiée';
        return 'Excessive';
    }
    checkSpecialNumber(num) {
        if ([11, 22, 33].includes(num)) {
            return num;
        }
        return this.reduceNumber(num);
    }
}
exports.CalculationService = CalculationService;
