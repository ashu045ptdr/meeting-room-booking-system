"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRuleViolation = void 0;
exports.validateInputTypes = validateInputTypes;
exports.intervalsOverlap = intervalsOverlap;
exports.validateBookingRules = validateBookingRules;
exports.checkOverlapConflict = checkOverlapConflict;
exports.checkOrganizerDailyLimit = checkOrganizerDailyLimit;
class BookingRuleViolation extends Error {
    status;
    message;
    code;
    details;
    constructor(status, message, code, details) {
        super(message);
        this.status = status;
        this.message = message;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, BookingRuleViolation.prototype);
    }
}
exports.BookingRuleViolation = BookingRuleViolation;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateInputTypes(dto) {
    if (typeof dto.roomId !== 'number' ||
        typeof dto.title !== 'string' ||
        typeof dto.organizerEmail !== 'string' ||
        typeof dto.attendees !== 'number' ||
        typeof dto.start !== 'string' ||
        typeof dto.end !== 'string') {
        throw new BookingRuleViolation(400, 'Invalid input types', 400);
    }
    const trimmedTitle = dto.title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
        throw new BookingRuleViolation(400, 'Title must be between 1 and 100 characters', 400);
    }
    if (!EMAIL_REGEX.test(dto.organizerEmail)) {
        throw new BookingRuleViolation(400, 'Invalid email format', 400);
    }
    if (!Number.isInteger(dto.attendees) || dto.attendees < 1) {
        throw new BookingRuleViolation(400, 'Attendees must be at least 1', 400);
    }
}
function intervalsOverlap(start1, end1, start2, end2) {
    const startA = new Date(start1).getTime();
    const endA = new Date(end1).getTime();
    const startB = new Date(start2).getTime();
    const endB = new Date(end2).getTime();
    return startA < endB && startB < endA;
}
function validateBookingRules(dto, room, now = new Date()) {
    const startDate = new Date(dto.start);
    const endDate = new Date(dto.end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BookingRuleViolation(400, 'Invalid date format', 'INVALID_FORMAT');
    }
    // R1
    if (endDate.getTime() <= startDate.getTime()) {
        throw new BookingRuleViolation(400, 'End date must be after start date', 'R1_INVALID_TIME');
    }
    // R2
    const validMinutes = [0, 15, 30, 45];
    const startSec = startDate.getUTCSeconds() === 0 && startDate.getUTCMilliseconds() === 0;
    const endSec = endDate.getUTCSeconds() === 0 && endDate.getUTCMilliseconds() === 0;
    if (!validMinutes.includes(startDate.getUTCMinutes()) || !validMinutes.includes(endDate.getUTCMinutes()) || !startSec || !endSec) {
        throw new BookingRuleViolation(400, 'Start and end times must fall on 15-minute boundaries', 'R2_BOUNDARY');
    }
    // R3
    const durationInMs = endDate.getTime() - startDate.getTime();
    const minMs = 15 * 60 * 1000;
    const maxMs = 4 * 60 * 60 * 1000;
    if (durationInMs < minMs || durationInMs > maxMs) {
        throw new BookingRuleViolation(400, 'Booking duration must be between 15 minutes and 4 hours', 'R3_DURATION');
    }
    // R4
    const sameDay = startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
        startDate.getUTCMonth() === endDate.getUTCMonth() &&
        startDate.getUTCDate() === endDate.getUTCDate();
    if (!sameDay) {
        throw new BookingRuleViolation(400, 'Booking must start and end on the same UTC day', 'R4_SAME_DAY');
    }
    const startHourDec = startDate.getUTCHours() + startDate.getUTCMinutes() / 60;
    const endHourDec = endDate.getUTCHours() + endDate.getUTCMinutes() / 60;
    if (startHourDec < 8 || endHourDec > 20) {
        throw new BookingRuleViolation(400, 'Booking must be within business hours (08:00 to 20:00 UTC)', 'R4_BUSINESS_HOURS');
    }
    // R5
    if (startDate.getTime() < now.getTime()) {
        throw new BookingRuleViolation(400, 'Booking cannot start in the past', 'R5_PAST');
    }
    // R6
    if (dto.attendees > room.capacity) {
        throw new BookingRuleViolation(400, 'Attendees cannot exceed room capacity', 'R6_CAPACITY');
    }
    return { startDate, endDate };
}
function checkOverlapConflict(newStart, newEnd, existingBookings) {
    for (const b of existingBookings) {
        if (b.status === "cancelled")
            continue;
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        if (intervalsOverlap(newStart.toISOString(), newEnd.toISOString(), bStart.toISOString(), bEnd.toISOString())) {
            throw new BookingRuleViolation(409, 'Room is already booked for this time', 'BOOKING_CONFLICT', { conflictingBookingId: b.id });
        }
    }
}
function checkOrganizerDailyLimit(organizerBookingsOnDay, maxLimit = 3) {
    const confirmedBookings = organizerBookingsOnDay.filter(b => b.status === 'confirmed');
    if (confirmedBookings.length >= maxLimit) {
        throw new BookingRuleViolation(409, 'An organizer cannot hold more than 3 confirmed bookings that start on the same day', 'R9_DAILY_LIMIT');
    }
}
