"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const apiController_1 = require("./controller/apiController");
const bookingService_1 = require("./service/bookingService");
const bookingRepository_1 = require("./repository/bookingRepository");
function createApp(db) {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    const repo = new bookingRepository_1.BookingRepository(db);
    const service = new bookingService_1.BookingService(repo);
    const controller = new apiController_1.ApiController(service);
    app.get('/api/rooms', (req, res, next) => controller.getAllRooms(req, res, next));
    app.get('/api/bookings', (req, res, next) => controller.getBookings(req, res, next));
    app.post('/api/bookings', (req, res, next) => controller.createBooking(req, res, next));
    app.delete('/api/bookings/:id', (req, res, next) => controller.cancelBooking(req, res, next));
    app.get('/api/availability', (req, res, next) => controller.getAvailability(req, res, next));
    app.use(apiController_1.errorHandler);
    return app;
}
