import { reduceToSingleDigit } from './date-utils';

export const calculateNameNumber = (name: string): number => {
  const normalizedName = name.toLowerCase().replace(/[^a-z]/g, '');
  const numericValue = Array.from(normalizedName)
    .map(char => getLetterValue(char))
    .reduce((a, b) => a + b, 0);
  
  return reduceToSingleDigit(numericValue);
};

export const getLetterValue = (letter: string): number => {
  const letterValues: { [key: string]: number } = {
    'a': 1, 'j': 1, 's': 1,
    'b': 2, 'k': 2, 't': 2,
    'c': 3, 'l': 3, 'u': 3,
    'd': 4, 'm': 4, 'v': 4,
    'e': 5, 'n': 5, 'w': 5,
    'f': 6, 'o': 6, 'x': 6,
    'g': 7, 'p': 7, 'y': 7,
    'h': 8, 'q': 8, 'z': 8,
    'i': 9, 'r': 9
  };
  
  return letterValues[letter] || 0;
}; 