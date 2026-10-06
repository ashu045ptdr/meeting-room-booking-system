"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRepository = void 0;
class BookingRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getAllRooms() {
        const rows = this.db.prepare('SELECT * FROM rooms').all();
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            capacity: row.capacity,
            floor: row.floor,
            amenities: JSON.parse(row.amenities)
        }));
    }
    getRoomById(roomId) {
        const row = this.db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
        if (!row)
            return null;
        return {
            id: row.id,
            name: row.name,
            capacity: row.capacity,
            floor: row.floor,
            amenities: JSON.parse(row.amenities)
        };
    }
    getConfirmedBookingsForRoom(roomId) {
        return this.db.prepare(`
            SELECT * FROM bookings 
            WHERE roomId = ? AND status = 'confirmed'
        `).all(roomId);
    }
    getBookingsByDay(utcDayString, roomId) {
        // e.g. utcDayString is YYYY-MM-DD
        const startWindow = `${utcDayString}T00:00:00.000Z`;
        const endWindow = `${utcDayString}T23:59:59.999Z`;
        if (roomId) {
            return this.db.prepare(`
                SELECT * FROM bookings 
                WHERE roomId = ? AND status = 'confirmed' 
                AND start >= ? AND start <= ?
            `).all(roomId, startWindow, endWindow);
        }
        return this.db.prepare(`
            SELECT * FROM bookings 
            WHERE status = 'confirmed' 
            AND start >= ? AND start <= ?
        `).all(startWindow, endWindow);
    }
    getOrganizerBookingsByDay(utcDayString, organizerEmail) {
        const datStart = `${utcDayString}T00:00:00.000Z`;
        const datEnd = `${utcDayString}T23:59:59.999Z`;
        return this.db.prepare(`
            SELECT * FROM bookings 
            WHERE organizerEmail = ? AND status = 'confirmed' 
            AND start >= ? AND start <= ?
        `).all(organizerEmail, datStart, datEnd);
    }
    getBookingById(bookingId) {
        const row = this.db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
        return row ?? null;
    }
    atomicCreateBooking(bookingData, validateConflictFn) {
        const runTransaction = this.db.transaction(() => {
            const activeBookings = this.db.prepare(`
                SELECT * FROM bookings 
                WHERE roomId = ? AND status = 'confirmed'
            `).all(bookingData.roomId);
            validateConflictFn(activeBookings);
            const info = this.db.prepare(`
                INSERT INTO bookings (roomId, title, organizerEmail, attendees, start, end, status, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(bookingData.roomId, bookingData.title, bookingData.organizerEmail, bookingData.attendees, bookingData.start, bookingData.end, bookingData.status, bookingData.createdAt);
            return {
                id: Number(info.lastInsertRowid),
                ...bookingData
            };
        });
        return runTransaction.immediate();
    }
    cancelBooking(id) {
        this.db.prepare(`
            UPDATE bookings
            SET status = 'cancelled'
            WHERE id = ?
        `).run(id);
    }
}
exports.BookingRepository = BookingRepository;
