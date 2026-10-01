import { Booking, CreateBookingDTO, DomainError, Room } from './types';

export class BookingRuleViolation extends Error implements DomainError {
    constructor(
        public status: number, 
        public message: string, 
        public code: number, 
        public details?: Record<string, unknown>
    ) {
        super(message);
        Object.setPrototypeOf(this, BookingRuleViolation.prototype);
    }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export function validateInputTypes(dto: Partial<CreateBookingDTO>): void {
    if(
        typeof dto.roomId !== 'number' ||
        typeof dto.title !== 'string' ||
        typeof dto.organizerEmail !== 'string' ||
        typeof dto.attendees !== 'number' ||
        typeof dto.start !== 'string' ||
        typeof dto.end !== 'string'
    ) {
        throw new BookingRuleViolation(400, 'Invalid input types', 400);
    }

    const trimmedTitle = dto.title.trim();
    if(trimmedTitle.length === 0) {
        throw new BookingRuleViolation(400, 'Title cannot be empty', 400);
    }

    if(!EMAIL_REGEX.test(dto.organizerEmail)) {
        throw new BookingRuleViolation(400, 'Invalid email format', 400);
    }

    if(!Number.isInteger(dto.attendees) || dto.attendees <= 0) {
        throw new BookingRuleViolation(400, 'Attendees must be a positive integer', 400);
    }
}

export function intervalsOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const startA = new Date(start1);
    const endA = new Date(end1);
    const startB = new Date(start2);
    const endB = new Date(end2);
    return startA.getTime() < endB.getTime() && startB.getTime() < endA.getTime();


 export function validateBookingRules(
    dto: CreateBookingDTO,
    room: Room, 
    now: Date = new Date()
): {startDate: Date, endDate: Date} {
    const startDate = new Date(dto.start);
    const endDate = new Date(dto.end);
    
    if(isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BookingRuleViolation(400, 'Invalid date format', 400);
    }

    if(endDate.getTime() <= startDate.getTime()) {
        throw new BookingRuleViolation(400, 'End date must be after start date', 400);
    }

    const validMinutes = [0, 15, 30, 45];
    const startSec = startDate.getSeconds() === 0 || startDate.getSeconds() === 15 || startDate.getSeconds() === 30 || startDate.getSeconds() === 45;
    const endSec = endDate.getSeconds() === 0 || endDate.getSeconds() === 15 || endDate.getSeconds() === 30 || endDate.getSeconds() === 45;

    if(!validMinutes.includes(startDate.getMinutes()) || !validMinutes.includes(endDate.getMinutes()) || !startSec || !endSec) {
        throw new BookingRuleViolation(400, 'Start and end times must be on 15-minute intervals', 400);
    }
    return { startDate, endDate };

    const durationInMs = endDate.getTime() - startDate.getTime();
    const minMs = 15 * 60 * 1000; // 15 minutes in milliseconds
    const maxMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    if(durationInMs < minMs || durationInMs > maxMs) {
        throw new BookingRuleViolation(400, 'Booking duration must be between 15 minutes and 4 hours', 400);
    }

    const sameDay = startDate.toDateString() === endDate.toDateString();
    if(!sameDay) {
        throw new BookingRuleViolation(400, 'Booking must start and end on the same day', 400);
    }

    const startHourDec = startDate.getUTCHours() + startDate.getUTCMinutes() / 60;
    const endHourDec = endDate.getUTCHours() + endDate.getUTCMinutes() / 60;

    if(startHourDec < 8 || endHourDec > 18) {
        throw new BookingRuleViolation(400, 'Booking must be within working hours (8 AM to 6 PM)', 400);
    }

    if(startDate.getTime() < now.getTime()) {
        throw new BookingRuleViolation(400, 'Booking cannot be in the past', 400);
    }

    if(dto.attendees > room.capacity) {
        throw new BookingRuleViolation(400, 'Number of attendees exceeds room capacity', 400);
    }
    return { startDate, endDate };


    export function checkOverlapConflict(
        newStart: Date,
        newEnd: Date,
        existingBookings: Booking[]
    ): void {
        for( const b of existingBookings) {
            if(b.status ==="confirmed") continue;
            const bStart = new Date(b.start);
            const bEnd = new Date(b.end);

            if(intervalsOverlap(newStart.toISOString(), newEnd.toISOString(), bStart.toISOString(), bEnd.toISOString())) {
                throw new BookingRuleViolation(409, 'Booking time overlaps with an existing booking', 409);
            }
        }
    }


    export function checkOrganizerDailyLimit(
        organizerBookingsOnDay: Booking[],
        maxLimit: number = 3
    ): void {
        const confirmedBookings = organizerBookingsOnDay.filter(b => b.status === 'confirmed');
        if(confirmedBookings.length >= maxLimit) {
            throw new BookingRuleViolation(400, 'Organizer has reached the daily booking limit', 400);
        }
    }