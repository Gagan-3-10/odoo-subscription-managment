"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotals = exports.generateDocNumber = exports.calculateNextBillingDate = exports.roundMoney = void 0;
const roundMoney = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};
exports.roundMoney = roundMoney;
const calculateNextBillingDate = (fromDate, frequency) => {
    const next = new Date(fromDate);
    switch (frequency.toUpperCase()) {
        case 'DAILY':
            next.setDate(next.getDate() + 1);
            break;
        case 'WEEKLY':
            next.setDate(next.getDate() + 7);
            break;
        case 'YEARLY':
            next.setFullYear(next.getFullYear() + 1);
            break;
        case 'MONTHLY':
        default:
            next.setMonth(next.getMonth() + 1);
            break;
    }
    return next;
};
exports.calculateNextBillingDate = calculateNextBillingDate;
const generateDocNumber = (prefix) => {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${randomSuffix}`;
};
exports.generateDocNumber = generateDocNumber;
const calculateTotals = (lines) => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;
    lines.forEach(line => {
        const qty = Number(line.quantity) || 1;
        const price = Number(line.unitPrice) || 0;
        const taxRate = Number(line.taxRate) || 0;
        const discountRate = Number(line.discountRate) || 0;
        const baseAmount = qty * price;
        const disc = baseAmount * (discountRate / 100);
        const taxableAmount = Math.max(0, baseAmount - disc);
        const tax = taxableAmount * (taxRate / 100);
        subtotal += baseAmount;
        discountAmount += disc;
        taxAmount += tax;
    });
    const totalAmount = subtotal - discountAmount + taxAmount;
    return {
        subtotal: (0, exports.roundMoney)(subtotal),
        discountAmount: (0, exports.roundMoney)(discountAmount),
        taxAmount: (0, exports.roundMoney)(taxAmount),
        totalAmount: (0, exports.roundMoney)(totalAmount),
    };
};
exports.calculateTotals = calculateTotals;
