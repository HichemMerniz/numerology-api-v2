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
  inclusionGrid: Record<number, number>;
  cycles: {
    formative: { number: number; years: string };  // Cycle formatif
    productive: { number: number; years: string }; // Cycle productif
    harvest: { number: number; years: string };    // Cycle de moisson
  };
  realizations: {
    premier: number;
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
    intimate: string;
    social: string;
  };
  nameAnalysis: {
    lastName: NameCalculation;
    firstName: NameCalculation;
    middleNames: NameCalculation[];
    maritalName?: NameCalculation;
  };
  vibration: number[];
}

export interface NumerologyCoreNumber {
  value: number;
  intensity: string;
  traits: string[];
}