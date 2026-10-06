# Meeting Room Booking System

## Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

## Commands to Install, Run, and Test
1. **Install Dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Run the Application:**
   The database automatically seeds `INITIAL_ROOMS` on the first startup.
   In one terminal (Backend):
   ```bash
   cd backend
   npm run dev
   ```
   In another terminal (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```
   Visit `http://localhost:3000` in your browser.

3. **Test the Application:**
   ```bash
   cd backend
   npm test
   ```

## Architecture and Data Model
**Architecture:** 
The application follows a standard React SPA + Node.js/Express REST API architecture. 
- The **Frontend** uses Vite, React, and Vanilla CSS with an enterprise-grade dark theme utilizing glassmorphism and 3D transforms. API requests are proxied via Vite to avoid CORS issues locally.
- The **Backend** follows a layered architecture (Controller -> Service -> Repository) to separate HTTP concerns from business logic and database access. `domain/rules.ts` contains pure, testable functions for validating the business rules.

**Data Model (SQLite):**
- `rooms`: `id` (PK), `name`, `capacity`, `floor`, `amenities` (JSON string).
- `bookings`: `id` (PK), `roomId` (FK), `title`, `organizerEmail`, `attendees`, `start` (ISO 8601), `end` (ISO 8601), `status` ('confirmed' or 'cancelled'), `createdAt`.

## Decisions and Trade-offs
**Concurrency Approach (Important):**
Since Node.js operates on a single thread and we are using `better-sqlite3` (which is synchronous), race conditions are avoided by utilizing SQLite's atomic transactions with `BEGIN IMMEDIATE`. 
In `bookingRepository.ts`, `atomicCreateBooking` opens a transaction, checks for overlapping active bookings, and inserts the new booking. Because it runs sequentially and lock the database `IMMEDIATE`ly, no two requests can interleavely check and insert into the same room simultaneously, ensuring strong consistency without needing a standalone Redis mutex lock. 
*Trade-off*: A database lock blocks the event loop momentarily, but SQLite is exceptionally fast so this remains highly performant for this scale.

## Assumptions Made
- Assumed `minCapacity` for availability queries means strictly `>=`.
- Assumed "15-minute boundaries" applies exactly to the seconds and milliseconds being 0.
- Assumed we don't need a dedicated UI view for finding a room since the day-view schedule implicitly shows availability per room.

## What was left out / Next Steps
- **UI Availability Search (F4)**: The API `GET /api/availability` is fully implemented and tested, but a dedicated form component in the frontend to search for it was skipped in favor of the schedule grid.
- **Next Steps**: Introduce caching for room queries, build out F4 UI, and migrate from SQLite to PostgreSQL if scaling horizontally across multiple Node instances is required.


## Sources
- React documentation
- Express JS documentation
- SQLite / `better-sqlite3` documentation