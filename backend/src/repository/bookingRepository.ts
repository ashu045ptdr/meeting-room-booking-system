import Database from 'better-sqlite3';
import { Booking, Room } from '../domain/types';

export class BookingRepository {
    constructor(private db: Database.Database) {}

    getAllRooms(): Room[] {
        const rows = this.db.prepare('SELECT * FROM rooms').all();
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            capacity: row.capacity,
            floor: row.floor,
            amenities: JSON.parse(row.amenities)
        }));
    }

    getRoomById(roomId: number): Room | null {
        const row = this.db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
        if (!row) return null;
        return {
            id: row.id,
            name: row.name,
            capacity: row.capacity,
            floor: row.floor,
            amenities: JSON.parse(row.amenities)
        };
    }

    getConfirmedBookingsForRoom(roomId: number): Booking[] {
        return this.db.prepare(`
            SELECT * FROM bookings 
            WHERE roomId = ? AND status = 'confirmed'
        `).all(roomId);
    }

    getBookingsByDay(utcDayString: string, roomId: number): Booking[] {
        const startWindow = `${utcDayString}T00:00:00Z`;
        const endWindow = `${utcDayString}T23:59:59Z`;

        if (roomId) {
            return this.db.prepare(`
                SELECT * FROM bookings 
                WHERE roomId = ? AND status = 'confirmed' 
                AND start >= ? AND end <= ?
            `).all(roomId, startWindow, endWindow) as Booking[];
        }

        return this.db.prepare(`
            SELECT * FROM bookings 
            WHERE status = 'confirmed' 
            AND start >= ? AND end <= ?
        `).all(startWindow, endWindow) as Booking[];
    }

    getOrganizerBookingsByDay(utcDayString: string, organizerEmail: string): Booking[] {
        const datStart = `${dayPrefix}T00:00:00Z`;
        const datEnd = `${dayPrefix}T23:59:59Z`;

        return this.db.prepare(`
            SELECT * FROM bookings 
            WHERE organizerEmail = ? AND status = 'confirmed' 
            AND start >= ? AND end <= ?
        `).all(organizerEmail, datStart, datEnd) as Booking[];
    }

    getBookingById(bookingId: number): Booking | null {
        const row = this.db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as Booking | undefined;
        return row ?? null;
    }

    atomicCreateBooking(
        bookingData: {
            roomId: number;
            title: string;
            organizerEmail: string;
            attendees: number;
            start: string;
            end: string;
            status: 'confirmed';
            createdAt: string;
        }
        validateConflictFn: (existingConfirmed: Bookings[]) => void
    ): Booking {
        const runTransaction = this.db.transaction(() => {
            const activeBookings = this.db.prepare(`
                SELECT * FROM bookings 
                WHERE roomId = ? AND status = 'confirmed'
            `).all(bookingData.roomId) as Booking[];

            validateConflictFn(activeBookings);

            const info = this.db.prepare(`
                INSERT INTO bookings (roomId, title, organizerEmail, attendees, start, end, status, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                bookingData.roomId,
                bookingData.title,
                bookingData.organizerEmail,
                bookingData.attendees,
                bookingData.start,
                bookingData.end,
                bookingData.status,
                bookingData.createdAt
            );

            return {
                id: Number(info.lastInsertRowid),
                ...bookingData
            };
            });

        return runTransaction.immediate();
    }

    cancelBooking(id: number): void {
        this.db.prepare(`
            UPDATE bookings
            SET status = 'cancelled'
            WHERE id = ?
        `).run(id);
    }
}