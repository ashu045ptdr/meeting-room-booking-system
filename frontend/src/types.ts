export interface Room {
    id: number;
    name: string;
    capacity: number;
    floor: number;
    amenities: string[];
}

export interface Booking {
    id: number;
    roomId: number;
    title: string;
    organizerEmail: string;
    attendees: number;
    start: string;
    end: string;
    status: 'confirmed' | 'cancelled';
    createdAt: string;
}

export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}