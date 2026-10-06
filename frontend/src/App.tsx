import { useState, useEffect } from 'react';
import './App.css';
import { fetchRooms, fetchBookings, createBooking, cancelBooking, searchAvailability } from './api';
import { Room, Booking } from './types';

function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    title: '',
    organizerEmail: '',
    attendees: 1,
    start: '10:00',
    end: '11:00'
  });

  useEffect(() => {
    loadData();
  }, [date]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [roomsData, bookingsData] = await Promise.all([
        fetchRooms(),
        fetchBookings(date)
      ]);
      setRooms(roomsData);
      setBookings(bookingsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      await createBooking({
        roomId: parseInt(bookingForm.roomId),
        title: bookingForm.title,
        organizerEmail: bookingForm.organizerEmail,
        attendees: bookingForm.attendees,
        start: `${date}T${bookingForm.start}:00Z`,
        end: `${date}T${bookingForm.end}:00Z`
      });
      await loadData();
      alert('Booking created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    }
  }

  async function handleCancelBooking(id: number) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setError(null);
      await cancelBooking(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
    }
  }

  return (
    <div className="container">
      <h1>Meeting Room Booking System</h1>
      
      {error && <div className="error-banner">{error}</div>}
      
      <div className="controls">
        <label>Date (UTC): </label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        {loading && <span> Loading...</span>}
      </div>

      <div className="layout">
        <div className="schedule-view">
          <h2>Schedule for {date}</h2>
          {rooms.map(room => {
            const roomBookings = bookings.filter(b => b.roomId === room.id);
            return (
              <div key={room.id} className="room-card">
                <h3>{room.name} (Capacity: {room.capacity})</h3>
                <div className="bookings-list">
                  {roomBookings.length === 0 ? <p>No bookings</p> : 
                    roomBookings.map(b => (
                      <div key={b.id} className="booking-item">
                        <span>{new Date(b.start).getUTCHours()}:{new Date(b.start).getUTCMinutes().toString().padStart(2, '0')} - {new Date(b.end).getUTCHours()}:{new Date(b.end).getUTCMinutes().toString().padStart(2, '0')} UTC</span>
                        <span> | {b.title} ({b.organizerEmail})</span>
                        <button onClick={() => handleCancelBooking(b.id)}>Cancel</button>
                      </div>
                    ))
                  }
                </div>
              </div>
            );
          })}
        </div>

        <div className="booking-form">
          <h2>Create Booking</h2>
          <form onSubmit={handleCreateBooking}>
            <div className="form-group">
              <label>Room</label>
              <select value={bookingForm.roomId} onChange={e => setBookingForm({...bookingForm, roomId: e.target.value})} required>
                <option value="">Select a room</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={bookingForm.title} onChange={e => setBookingForm({...bookingForm, title: e.target.value})} required maxLength={100}/>
            </div>
            <div className="form-group">
              <label>Organizer Email</label>
              <input type="email" value={bookingForm.organizerEmail} onChange={e => setBookingForm({...bookingForm, organizerEmail: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Attendees</label>
              <input type="number" min="1" value={bookingForm.attendees} onChange={e => setBookingForm({...bookingForm, attendees: parseInt(e.target.value)})} required />
            </div>
            <div className="form-group">
              <label>Start Time (UTC HH:MM)</label>
              <input type="time" value={bookingForm.start} onChange={e => setBookingForm({...bookingForm, start: e.target.value})} required step="900" />
            </div>
            <div className="form-group">
              <label>End Time (UTC HH:MM)</label>
              <input type="time" value={bookingForm.end} onChange={e => setBookingForm({...bookingForm, end: e.target.value})} required step="900" />
            </div>
            <button type="submit" disabled={loading}>Book Room</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
