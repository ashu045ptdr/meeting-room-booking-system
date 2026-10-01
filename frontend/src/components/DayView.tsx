import React from "react";
import {Room, Booking} from '../types';

interface DayViewProps{
    date: string;
    rooms: Room[];
    bookings: Bookings[];
    onSelectedBookingToCancel:(booking: Booking) => void;
}

export const DayView: React.FC<DayViewProps> = ({ rooms, bookings, onSelectBookingToCancel}) => {
    return (
        <div className="dat-view-container" aria-label="Day schedule grid">
            <div className="rooms-grid">
                {rooms.map((room) => {
                    const roomBookings = bookings.filter((b) => b.roomId === room.id);

                    return (
                        <section key={room.id} className="room-card" aria-labelledby={`room-title-${room.id}`}>
                            <div className="rooms-grid">
                                <h3 id={`room-title-${room.id}`}>{room.name}</h3>
                                <span className="room-meta">
                                    Floor {room.floor} | Cap: {room.capacity}
                                </span>
                                <div className="room-amenities">
                                    {room.amenities.length > 0 ? room.amenities.join(', ') : 'No amenities'}
                                </div>
                            </div>

                            <div className="schedule-slots">
                                <div className="slot-hours-label">Business Hours: 08:00 - 20:00 UTC</div>
                                {roomBookings.length === 0 ? (
                                    <p className="no-booking-text">No booking confiremd for this day.</p>
                ):(
                    <ul className="booking-list">
                        {roomBookings.map((b) => {
                            const startTime = b.start.subString(11, 16);
                            const endTime = b.end.subString(11, 16);

                            return (
                                <li key={b.id} className="booking-item">
                                    <div className="booking info">
                                        <strong>{b.title}</strong>
                                        <span className="time-badge">
                                            {startTime} - {endTime} UTC
                                        </span>
                                        <span className="organizer-bedge">{b.organizerEmail} ({b.attendees} att.)</span>
                                    </div>
                                    <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => onSelectBookingToCancel(b)}
                                    aria-label={`Cancel booking ${b.title}`}>
                                        Cancel
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )};
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
};