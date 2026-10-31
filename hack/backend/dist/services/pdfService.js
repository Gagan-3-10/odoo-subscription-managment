"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
class PDFService {
    static generateInvoicePDF(invoice, res) {
        const doc = new pdfkit_1.default({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        doc.pipe(res);
        // Header
        doc.fillColor('#4338ca').fontSize(24).font('Helvetica-Bold').text('BRIGHTLOOP', 40, 40);
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Subscription Management & Revenue Cloud', 40, 68);
        doc.text('GSTIN: 27AABCB1234F1Z5 | contact@brightloop.io | www.brightloop.io', 40, 80);
        // Invoice Title & Status
        doc.fillColor('#0f172a').fontSize(18).font('Helvetica-Bold').text('INVOICE', 400, 40, { align: 'right' });
        doc.fillColor('#6366f1').fontSize(11).font('Helvetica-Bold').text(`# ${invoice.invoiceNumber}`, 400, 62, { align: 'right' });
        doc.fillColor(invoice.status === 'PAID' ? '#16a34a' : invoice.status === 'OVERDUE' ? '#dc2626' : '#d97706')
            .fontSize(10).font('Helvetica-Bold').text(`STATUS: ${invoice.status}`, 400, 78, { align: 'right' });
        doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#e2e8f0').stroke();
        // Bill To & Invoice Info Columns
        const topY = 115;
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('BILLED TO:', 40, topY);
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(invoice.customer.companyName || invoice.customer.contactName, 40, topY + 14);
        doc.fillColor('#475569').fontSize(9).font('Helvetica')
            .text(`Contact: ${invoice.customer.contactName}`, 40, topY + 28)
            .text(`Email: ${invoice.customer.email}`, 40, topY + 40)
            .text(`Phone: ${invoice.customer.phone}`, 40, topY + 52)
            .text(`Tax ID (GSTIN): ${invoice.customer.taxId || 'N/A'}`, 40, topY + 64)
            .text(`Address: ${invoice.customer.billingAddress}`, 40, topY + 76, { width: 220 });
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('INVOICE DETAILS:', 340, topY);
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica')
            .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 340, topY + 14)
            .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 340, topY + 28)
            .text(`Subscription: ${invoice.subscription ? invoice.subscription.subscriptionNumber : 'Direct'}`, 340, topY + 42)
            .text(`Currency: ${invoice.currency}`, 340, topY + 56);
        // Line items table
        const tableTop = 225;
        doc.rect(40, tableTop, 515, 22).fill('#f1f5f9');
        doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
        doc.text('ITEM / DESCRIPTION', 48, tableTop + 6);
        doc.text('QTY', 290, tableTop + 6, { width: 40, align: 'right' });
        doc.text('PRICE', 335, tableTop + 6, { width: 60, align: 'right' });
        doc.text('TAX %', 400, tableTop + 6, { width: 45, align: 'right' });
        doc.text('TOTAL', 450, tableTop + 6, { width: 95, align: 'right' });
        let currentY = tableTop + 28;
        invoice.lines.forEach((line) => {
            const title = line.description || line.product?.name || 'Subscription Line';
            const variantText = line.variant ? ` (${line.variant.name})` : '';
            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(`${title}${variantText}`, 48, currentY);
            doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`Code: ${line.product?.code || 'PRD'}`, 48, currentY + 11);
            doc.fontSize(9).font('Helvetica');
            doc.text(String(line.quantity), 290, currentY, { width: 40, align: 'right' });
            doc.text(`₹${Number(line.unitPrice).toFixed(2)}`, 335, currentY, { width: 60, align: 'right' });
            doc.text(`${line.taxRate}%`, 400, currentY, { width: 45, align: 'right' });
            doc.font('Helvetica-Bold').text(`₹${Number(line.lineTotal).toFixed(2)}`, 450, currentY, { width: 95, align: 'right' });
            currentY += 28;
        });
        doc.moveTo(40, currentY + 5).lineTo(555, currentY + 5).strokeColor('#e2e8f0').stroke();
        // Summary calculation box
        const summaryY = currentY + 15;
        const rightLabelX = 350;
        const rightValX = 450;
        const colWidth = 95;
        doc.fillColor('#475569').fontSize(9).font('Helvetica');
        doc.text('Subtotal:', rightLabelX, summaryY);
        doc.text(`₹${Number(invoice.subtotal).toFixed(2)}`, rightValX, summaryY, { width: colWidth, align: 'right' });
        doc.text('Discount:', rightLabelX, summaryY + 14);
        doc.text(`- ₹${Number(invoice.discountAmount).toFixed(2)}`, rightValX, summaryY + 14, { width: colWidth, align: 'right' });
        doc.text('Taxes (GST/IGST):', rightLabelX, summaryY + 28);
        doc.text(`+ ₹${Number(invoice.taxAmount).toFixed(2)}`, rightValX, summaryY + 28, { width: colWidth, align: 'right' });
        doc.rect(340, summaryY + 44, 215, 26).fill('#f8fafc');
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Total Amount:', rightLabelX, summaryY + 52);
        doc.fillColor('#4338ca').fontSize(11).text(`₹${Number(invoice.totalAmount).toFixed(2)}`, rightValX, summaryY + 52, { width: colWidth, align: 'right' });
        doc.fillColor('#16a34a').fontSize(9).font('Helvetica').text('Amount Paid:', rightLabelX, summaryY + 76);
        doc.text(`₹${Number(invoice.amountPaid).toFixed(2)}`, rightValX, summaryY + 76, { width: colWidth, align: 'right' });
        doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold').text('Balance Due:', rightLabelX, summaryY + 92);
        doc.text(`₹${Number(invoice.balanceDue).toFixed(2)}`, rightValX, summaryY + 92, { width: colWidth, align: 'right' });
        // Notes and terms
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('PAYMENT INSTRUCTIONS & TERMS:', 40, summaryY + 10);
        doc.font('Helvetica').fontSize(8)
            .text('Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234', 40, summaryY + 22)
            .text('UPI ID: brightloop@hdfcbank', 40, summaryY + 34)
            .text(invoice.terms || 'Payment is due within agreed terms. Late payments accrue 1.5% interest/mo.', 40, summaryY + 46, { width: 280 });
        // Footer
        doc.fontSize(8).fillColor('#94a3b8').text('Thank you for choosing Brightloop. This is a computer-generated tax invoice.', 40, 780, { align: 'center', width: 515 });
        doc.end();
    }
}
exports.PDFService = PDFService;
