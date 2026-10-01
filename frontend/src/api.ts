import ( Room, Booking, ApiErrorResponse ) from './types';

async function handleApiResponse(response: Response): Promise<any> {
    if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error.message);
    }
    return response.json();
}

export async function fetchRooms(): Promise<Room[]> {
    const response = await fetch('/api/rooms');
    return handleApiResponse<Room[]>(response);
}

export async function fetchBookings(date: string, roomId: number): Promise<Booking[]> {
    const url = roomId ? `/api/bookings?date=${date}&roomId=${roomId}` : `/api/bookings?date=${date}`;
    const response = await fetch(url);
    return handleApiResponse<Booking[]>(response);
}

export async function createBooking(data: {
    roomId: number;
    title: string;
    organizerEmail: string;
    attendees: number;
    start: string;
    end: string;
}): Promise<Booking> {
    const res = await fetch('api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    return handleResponse<Booking>(res);
}

export async function cancelBooking(id: number): Promise<void> {
    const res = await fetch(`/api/bookings/${id}`, {method: 'DELETE'});
    await handleResponse<{success: boolean } >(res);
}

export async function searchAvailability(params: {
    date: string;
    start: string;
    end: string;
    minCapacity: number;
}): Promise<Room[]> {
    const query = new URLSearchParams({
        date: params.date,
        start: params.start,
        end: params.end,
        minCapacity: params.minCapacity.toString()
    });

    const res = await fetch(`/api/availability?${query.toString()}`);
    return handleResponse<Room[]>(res);
}