"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidDate = exports.reduceToSingleDigit = exports.calculateDateSum = void 0;
const calculateDateSum = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return (0, exports.reduceToSingleDigit)(day + month + year);
};
exports.calculateDateSum = calculateDateSum;
const reduceToSingleDigit = (num) => {
    while (num > 9) {
        num = Array.from(String(num), Number).reduce((a, b) => a + b, 0);
    }
    return num;
};
exports.reduceToSingleDigit = reduceToSingleDigit;
const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
};
exports.isValidDate = isValidDate;
