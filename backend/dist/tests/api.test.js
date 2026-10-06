"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const database_1 = require("../src/db/database");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
(0, globals_1.describe)('Meeting Room API', () => {
    let app;
    let db;
    const testDbPath = path_1.default.join(__dirname, 'test.db');
    (0, globals_1.beforeAll)(() => {
        if (fs_1.default.existsSync(testDbPath))
            fs_1.default.unlinkSync(testDbPath);
        db = (0, database_1.createDatabase)(testDbPath);
        app = (0, app_1.createApp)(db);
    });
    (0, globals_1.afterAll)(() => {
        db.close();
        if (fs_1.default.existsSync(testDbPath))
            fs_1.default.unlinkSync(testDbPath);
    });
    (0, globals_1.it)('should create a booking and reject a conflicting booking with 409', async () => {
        const bookingData = {
            roomId: 1,
            title: 'Test Booking',
            organizerEmail: 'test@example.com',
            attendees: 4,
            start: '2030-05-14T10:00:00Z',
            end: '2030-05-14T11:00:00Z'
        };
        const res1 = await (0, supertest_1.default)(app).post('/api/bookings').send(bookingData);
        (0, globals_1.expect)(res1.status).toBe(201);
        (0, globals_1.expect)(res1.body).toHaveProperty('id');
        const res2 = await (0, supertest_1.default)(app).post('/api/bookings').send({
            ...bookingData,
            title: 'Conflict Booking'
        });
        (0, globals_1.expect)(res2.status).toBe(409);
        (0, globals_1.expect)(res2.body.error).toHaveProperty('code', 409);
    });
});
