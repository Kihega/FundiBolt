import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

// Shape the mobile app's BookingsScreen expects (see mobile:
// services/bookings.ts) - flattened rather than nested customer/technician
// objects, so the client doesn't need to know about the relational shape.
function toBookingResponse(booking: {
  id: string;
  service: string;
  status: string;
  scheduledFor: Date;
  technician: { fullName: string; avatarUrl: string | null };
}) {
  return {
    id: booking.id,
    technicianName: booking.technician.fullName,
    technicianAvatarUrl: booking.technician.avatarUrl,
    service: booking.service,
    scheduledFor: booking.scheduledFor.toISOString(),
    status: booking.status,
  };
}

// Customers see bookings they made; technicians see tenders sent to them.
// Powers BookingsScreen's Active/Pending/Rejected list.
export async function listBookings(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: req.user.role === "fundi" ? { technicianId: req.user.userId } : { customerId: req.user.userId },
      include: { technician: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { scheduledFor: "desc" },
    });

    return res.status(200).json({ bookings: bookings.map(toBookingResponse) });
  } catch (err) {
    console.error("List bookings error:", err);
    return res.status(500).json({ message: "Could not load bookings." });
  }
}

// A customer sends a tender to a technician - starts out "pending" until
// the technician responds (see respondToBooking below). Not called by the
// mobile app's current UI yet (booking a technician from the map isn't
// wired up), but included so the endpoint exists once that flow lands,
// rather than needing a second backend patch just for this.
export async function createBooking(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Only customers can create bookings." });
  }

  const { technicianId, service, scheduledFor } = req.body;
  if (!technicianId || !service || !scheduledFor) {
    return res.status(400).json({ message: "technicianId, service, and scheduledFor are required." });
  }

  try {
    const technician = await prisma.user.findUnique({ where: { id: technicianId } });
    if (!technician || technician.role !== "fundi") {
      return res.status(404).json({ message: "Technician not found." });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.userId,
        technicianId,
        service,
        scheduledFor: new Date(scheduledFor),
      },
      include: { technician: { select: { fullName: true, avatarUrl: true } } },
    });

    return res.status(201).json({ booking: toBookingResponse(booking) });
  } catch (err) {
    console.error("Create booking error:", err);
    return res.status(500).json({ message: "Could not create the booking." });
  }
}

// The technician's side of the tender: accept (-> active) or decline
// (-> rejected). Not called by the customer mobile app - this belongs to
// the (not-yet-built) technician app - but included now so the schema and
// status lifecycle described in the product requirements ("technician
// will have an option to accept the tender... or reject it") are actually
// backed by a real endpoint.
export async function respondToBooking(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }
  if (req.user.role !== "fundi") {
    return res.status(403).json({ message: "Only the assigned technician can respond to a booking." });
  }

  const { id } = req.params;
  const { accept } = req.body;
  if (typeof accept !== "boolean") {
    return res.status(400).json({ message: "accept (boolean) is required." });
  }

  try {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing || existing.technicianId !== req.user.userId) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: accept ? "active" : "rejected" },
      include: { technician: { select: { fullName: true, avatarUrl: true } } },
    });

    return res.status(200).json({ booking: toBookingResponse(booking) });
  } catch (err) {
    console.error("Respond to booking error:", err);
    return res.status(500).json({ message: "Could not update the booking." });
  }
}
