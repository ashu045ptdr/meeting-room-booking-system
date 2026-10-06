import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db/database';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

describe('Meeting Room API', () => {
    let app: any;
    let db: Database.Database;
    const testDbPath = path.join(__dirname, 'test.db');

    beforeAll(() => {
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
        db = createDatabase(testDbPath);
        app = createApp(db) as any;
    });

    afterAll(() => {
        db.close();
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    });

    it('should create a booking and reject a conflicting booking with 409', async () => {
        const bookingData = {
            roomId: 1,
            title: 'Test Booking',
            organizerEmail: 'test@example.com',
            attendees: 4,
            start: '2030-05-14T10:00:00Z',
            end: '2030-05-14T11:00:00Z'
        };

        const res1 = await request(app).post('/api/bookings').send(bookingData);
        expect(res1.status).toBe(201);
        expect(res1.body).toHaveProperty('id');

        const res2 = await request(app).post('/api/bookings').send({
            ...bookingData,
            title: 'Conflict Booking'
        });
        
        expect(res2.status).toBe(409);
        expect(res2.body.error).toHaveProperty('code', 409);
    });
});
