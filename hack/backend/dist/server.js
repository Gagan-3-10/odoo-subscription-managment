"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const scheduler_1 = require("./jobs/scheduler");
const prisma_1 = __importDefault(require("./config/prisma"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Brightloop Subscription & Billing API',
        timestamp: new Date().toISOString(),
    });
});
// Mount API routes
app.use('/api', routes_1.default);
// Centralized Error Handler
app.use(errorHandler_1.errorHandler);
const startServer = async () => {
    try {
        await prisma_1.default.$connect();
        console.log('✔ Connected to SQLite database with Prisma');
        // Start background billing scheduler
        scheduler_1.BackgroundScheduler.start(60000); // Check every 60 seconds
        app.listen(PORT, () => {
            console.log(`🚀 Brightloop backend running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
