"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rules_1 = require("../src/domain/rules");
describe('Booking Rules (Unit Tests)', () => {
    const mockRoom = { id: 1, name: 'Atlas', capacity: 4, floor: 1, amenities: [] };
    const now = new Date('2030-05-14T09:00:00Z'); // 9 AM UTC
    describe('R1: End must be after start', () => {
        it('rejects end before start', () => {
            const dto = { roomId: 1, title: 'T', organizerEmail: 'a@a.com', attendees: 2, start: '2030-05-14T11:00:00Z', end: '2030-05-14T10:00:00Z' };
            expect(() => (0, rules_1.validateBookingRules)(dto, mockRoom, now)).toThrow(rules_1.BookingRuleViolation);
        });
    });
    describe('R2: 15-minute boundaries', () => {
        it('rejects 10:05', () => {
            const dto = { roomId: 1, title: 'T', organizerEmail: 'a@a.com', attendees: 2, start: '2030-05-14T10:05:00Z', end: '2030-05-14T11:00:00Z' };
            expect(() => (0, rules_1.validateBookingRules)(dto, mockRoom, now)).toThrow(rules_1.BookingRuleViolation);
        });
        it('accepts 10:15', () => {
            const dto = { roomId: 1, title: 'T', organizerEmail: 'a@a.com', attendees: 2, start: '2030-05-14T10:15:00Z', end: '2030-05-14T11:00:00Z' };
            expect(() => (0, rules_1.validateBookingRules)(dto, mockRoom, now)).not.toThrow();
        });
    });
    describe('R3: Duration limits', () => {
        it('rejects less than 15 mins', () => {
            const dto = { roomId: 1, title: 'T', organizerEmail: 'a@a.com', attendees: 2, start: '2030-05-14T10:00:00Z', end: '2030-05-14T10:00:00Z' };
            expect(() => (0, rules_1.validateBookingRules)(dto, mockRoom, now)).toThrow();
        });
        it('rejects more than 4 hours', () => {
            const dto = { roomId: 1, title: 'T', organizerEmail: 'a@a.com', attendees: 2, start: '2030-05-14T10:00:00Z', end: '2030-05-14T15:00:00Z' };
            expect(() => (0, rules_1.validateBookingRules)(dto, mockRoom, now)).toThrow();
        });
    });
    describe('R4: Business hours & same day', () => {
        it('rejects multi-day', () => {
            const dto = { roomId: 1, title: 'T', organizerEmail: 'a@a.com', attendees: 2, start: '2030-05-14T18:00:00Z', end: '2030-05-15T09:00:00Z' };
            expect(() => (0, rules_1.validateBookingRules)(dto, mockRoom, now)).toThrow();
        });
        it('rejects outside 08:00-20:00', () => {
            const dto = { roomId: 1, title: 'T', organizerEmail: 'a@a.com', attendees: 2, start: '2030-05-14T07:00:00Z', end: '2030-05-14T08:00:00Z' };
            expect(() => (0, rules_1.validateBookingRules)(dto, mockRoom, now)).toThrow();
        });
    });
    describe('R6: Capacity', () => {
        it('rejects 5 attendees for capacity 4', () => {
            const dto = { roomId: 1, title: 'T', organizerEmail: 'a@a.com', attendees: 5, start: '2030-05-14T10:00:00Z', end: '2030-05-14T11:00:00Z' };
            expect(() => (0, rules_1.validateBookingRules)(dto, mockRoom, now)).toThrow();
        });
    });
    describe('Overlap Reference Cases', () => {
        // Base existing booking: 10:00 to 11:00
        const bStart = '2030-05-14T10:00:00Z';
        const bEnd = '2030-05-14T11:00:00Z';
        it('09:00 to 10:00 - Allowed (Ends exactly when existing starts)', () => {
            expect((0, rules_1.intervalsOverlap)('2030-05-14T09:00:00Z', '2030-05-14T10:00:00Z', bStart, bEnd)).toBe(false);
        });
        it('11:00 to 12:00 - Allowed (Starts exactly when existing ends)', () => {
            expect((0, rules_1.intervalsOverlap)('2030-05-14T11:00:00Z', '2030-05-14T12:00:00Z', bStart, bEnd)).toBe(false);
        });
        it('09:30 to 10:30 - Rejected (Overlaps the start)', () => {
            expect((0, rules_1.intervalsOverlap)('2030-05-14T09:30:00Z', '2030-05-14T10:30:00Z', bStart, bEnd)).toBe(true);
        });
        it('10:30 to 11:30 - Rejected (Overlaps the end)', () => {
            expect((0, rules_1.intervalsOverlap)('2030-05-14T10:30:00Z', '2030-05-14T11:30:00Z', bStart, bEnd)).toBe(true);
        });
        it('10:15 to 10:45 - Rejected (Fully inside)', () => {
            expect((0, rules_1.intervalsOverlap)('2030-05-14T10:15:00Z', '2030-05-14T10:45:00Z', bStart, bEnd)).toBe(true);
        });
        it('09:00 to 12:00 - Rejected (Fully contains)', () => {
            expect((0, rules_1.intervalsOverlap)('2030-05-14T09:00:00Z', '2030-05-14T12:00:00Z', bStart, bEnd)).toBe(true);
        });
        it('10:00 to 11:00 - Rejected (Identical)', () => {
            expect((0, rules_1.intervalsOverlap)('2030-05-14T10:00:00Z', '2030-05-14T11:00:00Z', bStart, bEnd)).toBe(true);
        });
    });
});
