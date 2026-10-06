"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const rules_1 = require("../domain/rules");
class BookingService {
    bookingRepository;
    constructor(bookingRepository) {
        this.bookingRepository = bookingRepository;
    }
    getAllRooms() {
        return this.bookingRepository.getAllRooms();
    }
    getBookings(date, roomId) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new rules_1.BookingRuleViolation(400, 'Invalid date format. Expected YYYY-MM-DD', 400);
        }
        return this.bookingRepository.getBookingsByDay(date, roomId);
    }
    createBooking(dto) {
        (0, rules_1.validateInputTypes)(dto);
        const room = this.bookingRepository.getRoomById(dto.roomId);
        if (!room) {
            throw new rules_1.BookingRuleViolation(404, 'Room not found', 404);
        }
        const now = new Date();
        const { startDate, endDate } = (0, rules_1.validateBookingRules)(dto, room, now);
        const dayPrefix = startDate.toISOString().split('T')[0];
        const organizerDayBookings = this.bookingRepository.getOrganizerBookingsByDay(dayPrefix, dto.organizerEmail);
        (0, rules_1.checkOrganizerDailyLimit)(organizerDayBookings);
        const recordToInsert = {
            roomId: dto.roomId,
            title: dto.title.trim(),
            organizerEmail: dto.organizerEmail.trim(),
            attendees: dto.attendees,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            status: 'confirmed',
            createdAt: now.toISOString()
        };
        return this.bookingRepository.atomicCreateBooking(recordToInsert, (activeBookings) => {
            (0, rules_1.checkOverlapConflict)(startDate, endDate, activeBookings);
        });
    }
    cancelBooking(id, now = new Date()) {
        const booking = this.bookingRepository.getBookingById(id);
        if (!booking) {
            throw new rules_1.BookingRuleViolation(404, 'Booking not found', 404);
        }
        if (booking.status === 'cancelled') {
            return; // Already cancelled, no action needed
        }
        const startTime = new Date(booking.start);
        if (startTime.getTime() <= now.getTime()) {
            throw new rules_1.BookingRuleViolation(409, 'Cannot cancel a booking that has already started or passed', 409);
        }
        this.bookingRepository.cancelBooking(id);
    }
    findAvailableRooms(date, startTime, endTime, minCapacity) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new rules_1.BookingRuleViolation(400, 'Invalid date format. Expected YYYY-MM-DD', 400);
        }
        if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
            throw new rules_1.BookingRuleViolation(400, 'Invalid time format. Expected HH:MM', 400);
        }
        if (isNaN(minCapacity) || minCapacity < 1) {
            throw new rules_1.BookingRuleViolation(400, 'Invalid minimum capacity. Expected a positive integer', 400);
        }
        const startISO = `${date}T${startTime}:00Z`;
        const endISO = `${date}T${endTime}:00Z`;
        const dummyRoom = {
            id: -1,
            name: 'Dummy Room',
            capacity: minCapacity,
            floor: 0,
            amenities: []
        };
        const { startDate, endDate } = (0, rules_1.validateBookingRules)({
            roomId: dummyRoom.id,
            title: 'Dummy',
            organizerEmail: 'check@test.com',
            attendees: minCapacity,
            start: startISO,
            end: endISO
        }, dummyRoom, new Date());
        const allRooms = this.bookingRepository.getAllRooms();
        const candidateRooms = allRooms.filter(room => room.capacity >= minCapacity);
        const availableRooms = [];
        for (const room of candidateRooms) {
            const activeBookings = this.bookingRepository.getConfirmedBookingsForRoom(room.id);
            let conflict = false;
            for (const b of activeBookings) {
                if ((0, rules_1.intervalsOverlap)(startDate.toISOString(), endDate.toISOString(), b.start, b.end)) {
                    conflict = true;
                    break;
                }
            }
            if (!conflict) {
                availableRooms.push(room);
            }
        }
        return availableRooms.sort((a, b) => a.capacity - b.capacity);
    }
}
exports.BookingService = BookingService;
