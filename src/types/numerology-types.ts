// src/types/numerology-types.ts
export interface NumerologyInput {
  lastName: string;
  firstName: string;
  middleNames: string[];
  birthDate: string; // DD/MM/YYYY
  maritalName?: string;
  usedFirstName?: string;
  carriedNameFor25Years?: string;
}

export interface NameCalculation {
  letters: string[];
  values: number[];
  consonants: number[];
  vowels: number[];
  total: number;
  consonantSum: number;
  vowelSum: number;
}

export interface NumerologyResult {
  lifePath: number;
  expression: number;
  intimate: number;
  realization: number;
  health: number;
  sentiment: number;
  heredity: number;
  karmicDebts: number[];
  inclusionGrid: {
    grid: Record<number, number>;
    pillars: {
      physical: number[];
      emotional: number[];
      mental: number[];
      intuitive: number[];
    };
    legend: string[];
  };
  birthDate: string;
  cycles: {
    formatif: { number: number; years: string };    // Cycle Formatif
    productif: { number: number; years: string };   // Cycle Productif
    "de la Moisson": { number: number; years: string };     // Cycle de la Moisson
  };
  realizations: {
    Première: number;
    deuxième: number;
    troisième: number;
    quatrième: number;
  };
  challenges: {
    premierMinor: number;
    deuxièmeMinor: number;
    major: number;
  };
  personalityTraits: {
    "Sur le plan intime": string;
    "Sur le plan social et professionnel": string;
  };
  nameAnalysis: {
    lastName: NameCalculation;
    firstName: NameCalculation;
    middleNames: NameCalculation[];
    maritalName?: NameCalculation;
  };
  vibration: number[];
  heredityNumber: {
    value: number;
    description: string;
  };
  letterAnalysis: {
    vowels: { letter: string; value: number; count: number }[];
    consonants: { letter: string; value: number; count: number }[];
    totalVowels: number;
    totalConsonants: number;
    interpretation: string;
  };
}

export interface NumerologyCoreNumber {
  value: number;
  intensity: string;
  traits: string[];
}