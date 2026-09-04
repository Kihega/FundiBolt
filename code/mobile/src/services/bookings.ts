// Customer's booking history for the Bookings tab.
//
// GET /api/bookings is a real backend endpoint now (see
// code/backend/src/controllers/booking.controller.ts). A booking starts
// "pending" until the technician responds to the tender, becomes
// "active" if they accept it, or "rejected" if they decline (see
// respondToBooking on the backend - not called by this customer app,
// since accepting/rejecting is the technician's action).

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export type BookingStatus = "active" | "pending" | "rejected";

export type Booking = {
  id: string;
  technicianName: string;
  technicianAvatarUrl?: string | null;
  service: string;
  /** ISO 8601 timestamp of the scheduled/requested job. */
  scheduledFor: string;
  status: BookingStatus;
};

export async function fetchBookings(token: string): Promise<Booking[]> {
  try {
    const res = await fetch(`${API_URL}/api/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data.bookings) ? data.bookings : [];
  } catch (err) {
    console.log("fetchBookings: backend unreachable, falling back to empty list", err);
    return [];
  }
}
