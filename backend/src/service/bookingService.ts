import { BookingRepository } from '../repository/bookingRepository';
import { CreateBookingDTO, Booking, Room, BookingStatus } from '../domain/types';
import { validateInputTypes, validateBookingRules, BookingRuleViolation } from '../domain/rules';

export class BookingService {
    constructor(private bookingRepository: BookingRepository) {}

    getAllRooms(): Room[] {
        return this.bookingRepository.getAllRooms();
    }

    getBookings(date: string, roomId?: number): Booking[] {
        if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new BookingRuleViolation(400, 'Invalid date format. Expected YYYY-MM-DD', 400);
        }
        return this.bookingRepository.getBookingsByDay(date, roomId);
    }

    createBooking(dto: CreateBookingDTO): Booking {
        validateInputTypes(dto);

        const room = this.bookingRepository.getRoomById(dto.roomId);
        if(!room) {
            throw new BookingRuleViolation(404, 'Room not found', 404);
        }

        const { startDate, endDate } = validateBookingRules(dto, room, now);
        const dayPrefix = startDate.toISOString().split('T')[0];
        const organizerDayBookings = this.bookingRepository.getOrganizerBookingsByDay(dayPrefix, dto.organizerEmail);
        checkOrganizerDayLimit(organizerDayBookings, startDate, endDate);

        const recordToInsert = {
            roomId: dto.roomId,
            title: dto.title.trim(),
            organizerEmail: dto.organizerEmail.trim(),
            attendees: dto.attendees,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            status: 'confirmed' as BookingStatus,
            createdAt: new Date().toISOString()
        };

        return this.bookingRepository.atomicCreateBooking(recordToInsert, (activeBookings) => {
            checkOverLappConflict(startDate, endDate, activeBookings);
        });
    }

    cancelBookings(id: number, now: Date = new Date()): void {
        const booking = this.bookingRepository.getBookingById(id);
        if(!booking) {
            throw new BookingRuleViolation(404, 'Booking not found', 404);
        }

        if(booking.status === 'cancelled') {
            return; // Already cancelled, no action needed
        }

        const startTime = new Date(booking.start);
        if(startTime <= now) {
            throw new BookingRuleViolation(400, 'Cannot cancel a booking that has already started or passed', 400);
        }
        this.bookingRepository.cancelBooking(id);
    }

    findAvailableRooms(date: string, startTime: string, endTime: string): Room[] {
        if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new BookingRuleViolation(400, 'Invalid date format. Expected YYYY-MM-DD', 400);
        }
        if(!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
            throw new BookingRuleViolation(400, 'Invalid time format. Expected HH:MM', 400);
        }
        if(isNaN(minCapacity) || minCapacity < 1) {
            throw new BookingRuleViolation(400, 'Invalid minimum capacity. Expected a positive integer', 400);
        }

        const startISO = `${date}T${startTime}:00Z`;
        const endISO = `${date}T${endTime}:00Z`;

        const dumyRoom: Room = {
            id: -1,
            name: 'Dummy Room',
            capacity: minCapacity,
            floor: 0,
            amenities: []
        };
        const { startDate, endDate } = validateBookingRules({
            roomId: dumyRoom.id,
            title: 'Dummy',
            organizerEmail: 'check@test.com',
            attendees: minCapacity,
            start: startISO,
            end: endISO
        }, dumyRoom, new Date());

        const allRooms = this.bookingRepository.getAllRooms();
        const candidateRooms = allRooms.filter(room => room.capacity >= minCapacity);
        const availableRooms: Room[] = [];

        for(const room of candidateRooms) {
            const activeBookings = this.bookingRepository.getConfirmedBookingsForRoom(room.id);
            let conflict = false;

            for(const b of activeBookings) {
                if(intervalsOverlap(startDate.toISOString(), endDate.toISOString(), b.start, b.end)) {
                    conflict = true;
                    break;
                }
            }
            if(!conflict) {
                availableRooms.push(room);
            }
        }
        return availableRooms.sort((a, b) => a.capacity - b.capacity);
    }
}