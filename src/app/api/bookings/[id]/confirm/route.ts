import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This simulates the Payme/Click webhook completing the transaction
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update booking status to COMPLETED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' }
    });

    // Update payment status
    await prisma.payment.update({
      where: { bookingId },
      data: { status: 'COMPLETED', transactionId: `SIMULATED_${Date.now()}` }
    });

    return NextResponse.json({ success: true, status: 'COMPLETED' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
