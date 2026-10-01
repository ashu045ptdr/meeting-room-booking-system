import express from 'express';
import cors from 'cors';
import {Database} from './database';
import {ApiController, errorHandler} from './controller/apiController';
import {BookingService} from './services/bookingService';
import {BookingRepository} from './repository/bookingRepository';

export function createApp(db: Database): express.Application {
    const app = express();
    app.use(cors());
    app.use(express.json());

    const repo = new BookingRepository(db);
    const service = new BookingService(repo);
    const controller = new ApiController(service);

    app.get('/api/rooms', (req, res, next) => controller.getAllRooms(req, res, next));
    app.get('/api/bookings', (req, res, next) => controller.getBookings(req, res, next));
    app.post('/api/bookings', (req, res, next) => controller.createBooking(req, res, next));
    app.delete('/api/bookings/:id', (req, res, next) => controller.cancelBooking(req, res, next));
    app.get('/api/availability', (req, res, next) => controller.getAvailability(req, res, next));