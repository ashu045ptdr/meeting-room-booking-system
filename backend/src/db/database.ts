import Database from 'better-sqlite3';
import {INITIAL_ROOMS} from './seedData';

export function createDatabase(dbPath: string): Database.Database {
    const db = new Database(dbPath);

    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');

    db.exec(`
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            floor INTEGER NOT NULL,
            amenities TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roomId INTEGER NOT NULL,
            title TEXT NOT NULL,
            organizerEmail TEXT NOT NULL,
            attendees INTEGER NOT NULL,
            start TEXT NOT NULL,
            end TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('confirmed', 'cancelled')),
            createdAt TEXT NOT NULL,
            FOREIGN KEY (roomId) REFERENCES rooms(id)
        );

        CREATE INDEX IF NOT EXISTS idx_bookings_room_status_dates ON bookings(roomId, status, start, end);
        CREATE INDEX IF NOT EXISTS idx_bookings_organizer_dates ON bookings(organizerEmail, start, end);
    `);

    const insertRoom = db.prepare(`
        INSERT INTO rooms (name, capacity, floor, amenities)
        VALUES (?, ?, ?, ?)
    `);

    for (const room of INITIAL_ROOMS) {
        insertRoom.run(room.name, room.capacity, room.floor, JSON.stringify(room.amenities));
    }
    return db;
}
