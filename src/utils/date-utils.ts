export const calculateDateSum = (date: Date): number => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  return reduceToSingleDigit(day + month + year);
};

export const reduceToSingleDigit = (num: number): number => {
  while (num > 9) {
    num = Array.from(String(num), Number).reduce((a, b) => a + b, 0);
  }
  return num;
};

export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
}; 