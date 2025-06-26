// src/services/calculation.service.ts
import { NumerologyInput, NumerologyResult, NameCalculation } from '../types/numerology-types';
import { numerologyData } from '../config/numerology-data';
import { parse, format } from 'date-fns';

export class CalculationService {
  calculate(input: NumerologyInput): NumerologyResult {
    // Name calculations
    const lastNameCalc = this.calculateName(input.lastName);
    const firstNameCalc = this.calculateName(input.firstName);
    const middleNamesCalc = input.middleNames.map(name => this.calculateName(name));
    const maritalNameCalc = input.maritalName ? this.calculateName(input.maritalName) : undefined;

    const allCalculations = [
      lastNameCalc,
      firstNameCalc,
      ...middleNamesCalc,
      ...(maritalNameCalc ? [maritalNameCalc] : [])
    ];

    // Life Path calculation
    const lifePath = this.calculateLifePath(input.birthDate);

    // Core numbers
    const expression = this.checkSpecialNumber(lastNameCalc.total + firstNameCalc.total);
    const intimate = this.checkSpecialNumber(lastNameCalc.vowelSum + firstNameCalc.vowelSum);
    const realization = this.checkSpecialNumber(lastNameCalc.consonantSum + firstNameCalc.consonantSum);

    // Health, Sentiment, Heredity
    const health = this.checkSpecialNumber(firstNameCalc.total);
    const sentiment = this.checkSpecialNumber(
      middleNamesCalc.reduce((sum, calc) => sum + calc.total, 0)
    );
    const heredity = this.checkSpecialNumber(lastNameCalc.total);

    // Enhanced calculations
    const heredityNumber = this.calculateHeredityNumber(lastNameCalc);
    const inclusionGrid = this.calculateEnhancedInclusionGrid(allCalculations);
    const letterAnalysis = this.analyzeLetters(allCalculations);

    // Karmic debts
    const karmicDebts = this.calculateKarmicDebts(allCalculations)
      .filter(num => [13, 14, 16, 19].includes(num));

    // Cycles
    const cycles = this.calculateCycles(input.birthDate);

    // Realizations
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
      heredityNumber,
      karmicDebts,
      inclusionGrid,
      letterAnalysis,
      cycles,
      realizations,
      challenges,
      personalityTraits: {
        "Sur le plan intime": firstNameCalc.letters[0] || '',
        "Sur le plan social et professionnel": lastNameCalc.letters[0] || ''
      },
      nameAnalysis: {
        lastName: lastNameCalc,
        firstName: firstNameCalc,
        middleNames: middleNamesCalc,
        maritalName: maritalNameCalc
      },
      vibration: numerologyData.validPillars,
      birthDate: input.birthDate
    };
  }

  private calculateName(name: string): NameCalculation {
    const letters = name.toUpperCase().split('').filter(c => c !== ' ');
    const values: number[] = [];
    const consonants: number[] = [];
    const vowels: number[] = [];

    for (const letter of letters) {
      const letterData = numerologyData.letterValues[letter as keyof typeof numerologyData.letterValues];
      if (letterData) {
        values.push(letterData.value);
        if (letterData.type === 'C') {
          consonants.push(letterData.value);
          vowels.push(0);
        } else {
          consonants.push(0);
          vowels.push(letterData.value);
        }
      } else {
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

  private calculateLifePath(birthDate: string): number {
    const [day, month, year] = birthDate.split('/').map(Number);
    const daySum = this.reduceNumber(day);
    const monthSum = this.reduceNumber(month);
    const yearSum = this.reduceNumber(year);
    
    return this.reduceNumber(daySum + monthSum + yearSum);
  }

  private calculateCycles(birthDate: string): NumerologyResult['cycles'] {
    const [day, month, year] = birthDate.split('/').map(Number);
    const lifePath = this.calculateLifePath(birthDate);
    const cycleData = numerologyData.cycleYears[lifePath as keyof typeof numerologyData.cycleYears];

    if (!cycleData) {
      return {
        formatif: { number: 0, years: '0-27' },
        productif: { number: 0, years: '28-54' },
        "de la Moisson": { number: 0, years: '55+' }
      };
    }

    return {
      formatif: {
        number: this.reduceNumber(month),
        years: `0-${cycleData.formative}`
      },
      productif: {
        number: this.reduceNumber(day),
        years: `${cycleData.formative + 1}-${cycleData.productive}`
      },
      "de la Moisson": {
        number: this.reduceNumber(year),
        years: `${cycleData.productive + 1}+`
      }
    };
  }

  private reduceRealizationNumber(num: number): number {
    if ([11, 22].includes(num)) {
      return num;
    }
    
    let reduced = this.reduceNumber(num);
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(reduced) ? reduced : this.reduceNumber(reduced);
  }

  private calculateRealizations(lifePath: number): NumerologyResult['realizations'] {
    const realizationData = numerologyData.realizationPeriods[lifePath as keyof typeof numerologyData.realizationPeriods];
    
    if (!realizationData) {
      return {
        Première: 0,
        deuxième: 0,
        troisième: 0,
        quatrième: 0
      };
    }

    return {
      Première: this.reduceRealizationNumber(realizationData.premier),
      deuxième: this.reduceRealizationNumber(realizationData.deuxième),
      troisième: this.reduceRealizationNumber(realizationData.troisième),
      quatrième: this.reduceRealizationNumber(realizationData.quatrième)
    };
  }

  private calculateChallenges(birthDate: string): NumerologyResult['challenges'] {
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

  private calculateKarmicDebts(calculations: NameCalculation[]): number[] {
    const allValues = calculations.flatMap(c => c.values);
    const uniqueValues = new Set(allValues);
    
    return Object.keys(numerologyData.karmicDebts)
      .map(Number)
      .filter(n => !uniqueValues.has(n))
      .filter(n => ![3, 5, 7].includes(n));
  }

  private calculateEnhancedInclusionGrid(calculations: NameCalculation[]): NumerologyResult['inclusionGrid'] {
    const grid: Record<number, number> = {};
    const allValues = calculations.flatMap(c => c.values);
    
    // Calculate basic grid
    for (let i = 1; i <= 9; i++) {
      grid[i] = allValues.filter(v => v === i).length;
    }

    // Calculate pillars
    const pillars = {
      physical: [4, 5, 6],    // Earth numbers
      emotional: [2, 3, 6],   // Water numbers
      mental: [1, 7, 8],      // Air numbers
      intuitive: [3, 7, 9]    // Fire numbers
    };

    // Generate legends based on pillar strengths
    const legend = Object.entries(pillars).map(([type, numbers]) => {
      const strength = numbers.reduce((sum, num) => sum + (grid[num] || 0), 0);
      return `${type.charAt(0).toUpperCase() + type.slice(1)}: ${this.getPillarStrength(strength)}`;
    });

    return {
      grid,
      pillars,
      legend
    };
  }

  private getPillarStrength(value: number): string {
    if (value === 0) return 'Absent';
    if (value <= 2) return 'Faible';
    if (value <= 4) return 'Modéré';
    if (value <= 6) return 'Fort';
    return 'Très Fort';
  }

  private analyzeLetters(calculations: NameCalculation[]): NumerologyResult['letterAnalysis'] {
    const letterCounts = new Map<string, { type: 'V' | 'C', value: number, count: number }>();
    
    calculations.forEach(calc => {
      calc.letters.forEach((letter, i) => {
        const letterData = numerologyData.letterValues[letter as keyof typeof numerologyData.letterValues];
        if (letterData && (letterData.type === 'V' || letterData.type === 'C')) {
          const existing = letterCounts.get(letter) || { type: letterData.type as 'V' | 'C', value: letterData.value, count: 0 };
          letterCounts.set(letter, { ...existing, count: existing.count + 1 });
        }
      });
    });

    const vowels = Array.from(letterCounts.entries())
      .filter(([_, data]) => data.type === 'V')
      .map(([letter, data]) => ({ letter, value: data.value, count: data.count }));

    const consonants = Array.from(letterCounts.entries())
      .filter(([_, data]) => data.type === 'C')
      .map(([letter, data]) => ({ letter, value: data.value, count: data.count }));

    const totalVowels = vowels.reduce((sum, v) => sum + v.count, 0);
    const totalConsonants = consonants.reduce((sum, c) => sum + c.count, 0);

    return {
      vowels,
      consonants,
      totalVowels,
      totalConsonants,
      interpretation: this.interpretLetterRatio(totalVowels, totalConsonants)
    };
  }

  private interpretLetterRatio(vowels: number, consonants: number): string {
    const ratio = vowels / consonants;
    if (ratio > 1.5) return 'Dominance émotionnelle et intuitive';
    if (ratio < 0.5) return 'Dominance rationnelle et pratique';
    return 'Équilibre entre émotion et raison';
  }

  private calculateHeredityNumber(lastNameCalc: NameCalculation): NumerologyResult['heredityNumber'] {
    const value = this.reduceNumber(lastNameCalc.total);
    return {
      value,
      description: numerologyData.heredityMeanings[value as keyof typeof numerologyData.heredityMeanings] || 'Description not available'
    };
  }

  private reduceNumber(num: number): number {
    if (numerologyData.specialNumbers.includes(num)) {
      return num;
    }
    
    while (num > 9) {
      num = Array.from(String(num), Number).reduce((a, b) => a + b, 0);
    }
    return num;
  }

  private checkSpecialNumber(num: number): number {
    if ([11, 22, 33].includes(num)) {
      return num;
    }
    return this.reduceNumber(num);
  }
}