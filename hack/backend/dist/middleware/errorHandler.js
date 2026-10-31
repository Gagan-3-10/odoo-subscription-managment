"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err);
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    // Handle Prisma unique constraint error
    if (err.code === 'P2002') {
        const target = err.meta?.target ? ` (${err.meta.target})` : '';
        res.status(409).json({
            success: false,
            message: `A record with this unique value already exists${target}.`,
        });
        return;
    }
    // Handle Prisma record not found
    if (err.code === 'P2025') {
        res.status(404).json({
            success: false,
            message: 'The requested record was not found.',
        });
        return;
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error occurred',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
