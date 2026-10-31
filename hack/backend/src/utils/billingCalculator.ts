export const roundMoney = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateNextBillingDate = (fromDate: Date, frequency: string): Date => {
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

export const generateDocNumber = (prefix: 'SUB' | 'INV' | 'PAY' | 'QUO' | 'CUST'): string => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${randomSuffix}`;
};

export interface CalculatedLine {
  productId: string;
  variantId?: string | null;
  planId?: string | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g. 18 for 18%
  discountRate: number; // e.g. 10 for 10%
  lineSubtotal: number;
  taxAmount: number;
  discountAmount: number;
  lineTotal: number;
}

export const calculateTotals = (lines: {
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discountRate?: number;
}[]) => {
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
    subtotal: roundMoney(subtotal),
    discountAmount: roundMoney(discountAmount),
    taxAmount: roundMoney(taxAmount),
    totalAmount: roundMoney(totalAmount),
  };
};
