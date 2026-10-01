export interface Room{
    id: number;
    name: string;
    capacity: number;
    floor: number;
    amenities: string[];
}

export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
    id: number;
    roomId: number;
    title: string;
    organizerEmail: string;
    attendees: number;
    start: string;
    end: string;
    status: BookingStatus;
    createdAt: string;
}

export interface CreateBookingDTO {
    roomId: number;
    title: string;
    organizerEmail: string;
    attendees: number;
    start: string;
    end: string;
}

export interface DomainError {
    status: number;
    message: string;
    code: number;
    details?: Record<string, unknown>;
}