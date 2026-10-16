import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const dateStr = url.searchParams.get("date"); // YYYY-MM-DD
    
    if (!dateStr) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all active bookings (PENDING or CONFIRMED) for this stadium on this day
    const bookings = await prisma.booking.findMany({
      where: {
        stadiumId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      }
    });

    // Map booked slots into string formats like "18:00 - 19:00"
    const bookedSlots = bookings.map(b => {
      const startHr = b.startTime.getHours().toString().padStart(2, '0');
      const endHr = b.endTime.getHours().toString().padStart(2, '0');
      return `${startHr}:00 - ${endHr}:00`;
    });

    return NextResponse.json({ bookedSlots }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
