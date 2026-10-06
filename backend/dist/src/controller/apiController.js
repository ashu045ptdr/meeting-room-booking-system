"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiController = void 0;
exports.errorHandler = errorHandler;
const rules_1 = require("../domain/rules");
class ApiController {
    bookingService;
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    getAllRooms(req, res, next) {
        try {
            const rooms = this.bookingService.getAllRooms();
            res.status(200).json(rooms);
        }
        catch (error) {
            next(error);
        }
    }
    getBookings(req, res, next) {
        try {
            const date = req.query.date;
            const roomIdStr = req.query.roomId;
            if (!date) {
                res.status(400).json({ error: { message: 'Missing required query parameter: date' } });
                return;
            }
            const roomId = roomIdStr ? parseInt(roomIdStr, 10) : undefined;
            const bookings = this.bookingService.getBookings(date, roomId);
            res.status(200).json(bookings);
        }
        catch (error) {
            next(error);
        }
    }
    ;
    createBooking(req, res, next) {
        try {
            const booking = this.bookingService.createBooking(req.body);
            res.status(201).json(booking);
        }
        catch (error) {
            next(error);
        }
    }
    ;
    cancelBooking(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                res.status(400).json({ error: { message: 'Invalid booking ID' } });
                return;
            }
            this.bookingService.cancelBooking(id);
            res.status(200).json({ message: 'Booking cancelled successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    ;
    getAvailability(req, res, next) {
        try {
            const date = req.query.date;
            const start = req.query.start;
            const end = req.query.end;
            const minCapacityStr = req.query.minCapacity;
            if (!date || !start || !end || !minCapacityStr) {
                res.status(400).json({
                    error: { message: 'Missing required query parameters: date, start, end, or minCapacity' }
                });
                return;
            }
            const minCapacity = parseInt(minCapacityStr, 10);
            const rooms = this.bookingService.findAvailableRooms(date, start, end, minCapacity);
            res.status(200).json(rooms);
        }
        catch (error) {
            next(error);
        }
    }
    ;
}
exports.ApiController = ApiController;
function errorHandler(err, req, res, next) {
    if (err instanceof rules_1.BookingRuleViolation) {
        res.status(err.status).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details || {}
            }
        });
        return;
    }
    console.error('Unexpected error:', err);
    res.status(500).json({
        error: {
            code: 500,
            message: 'Internal Server Error',
            details: {}
        }
    });
}
