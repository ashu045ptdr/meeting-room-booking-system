import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/bookingService';
import { BookingRuleViolation } from '../errors/bookingRuleViolation';

export class ApiController {
    constructor(private bookingService: BookingService) {}

    getAllRooms(req: Request, res: Response, next: NextFunction): void {
        try {
            const rooms = this.bookingService.getAllRooms();
            res.status(200).json(rooms);
        } catch (error) {
            next(error);
        }
    }

    getBookings(req: Request, res: Response, next: NextFunction): void {
        try{
            const date = req.query.date as string;
            const roomIdStr = req.query.roomId as string | undefined;

            if(!date) {
                return res.status(400).json({
                    error: 'Missing required query parameter: date'
                })
        }

        const roomId = roomIdStr ? parseInt(roomIdStr, 10) : undefined;
        const bookings = this.bookingService.getBookings(date, roomId);
        res.status(200).json(bookings);
        } catch (error) {
            next(error);
        }
    };

        createBooking(req: Request, res: Response, next: NextFunction): void {
            try {
                const booking = this.bookingService.createBooking(req.body);
                res.status(201).json(booking);
            } catch (error) {
                next(error);
            }
        };

        cancelBooking(req: Request, res: Response, next: NextFunction): void {
            try {
                const id = parseInt(req.params.id, 10);
                if (isNaN(id)) {
                    return res.status(400).json({
                        error: 'Invalid booking ID'
                    });
                }
                this.bookingService.cancelBookings(id);
                res.status(200).json({ message: 'Booking cancelled successfully' });
            } catch (error) {
                next(error);
            }
        };

        getAvailability = (req: Request, res: Response, next: NextFunction): void => {
            try {
                const date = req.query.date as string;
                const startTime = req.query.startTime as string;
                const endTime = req.query.endTime as string;
                const minCapacityStr = req.query.minCapacity as string | undefined;

                if (!date || !startTime || !endTime || minCapacityStr) {
                    return res.status(400).json({
                        error: 'Missing required query parameters: date, startTime, endTime, or minCapacity'
                    });
                }

                const minCapacity = parseInt(minCapacityStr, 10);
                const rooms = this.bookingService.findAvailableRooms(date, startTime, endTime, minCapacity);
                res.status(200).json(rooms);
            } catch (error) {
                next(error);
            }
        };
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
    if (err instanceof BookingRuleViolation) {
        res.status(err.status).json({
            error: err.message,
            code: err.code,
            details: err.details || {}
        });
    }

    console.error('Unexpected error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        code: 500,
        details: {}
    });
}