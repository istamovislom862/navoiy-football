import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stadiumId, startTime, endTime, paymentMethod } = await req.json();

    if (!stadiumId || !startTime || !endTime || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    
    let bookedStadiumName = '';
    let bookedPrice = 0;

    // Prevent double booking logic using a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Check for overlapping bookings
      const overlapping = await tx.booking.findFirst({
        where: {
          stadiumId,
          status: { in: ['CONFIRMED', 'PENDING', 'COMPLETED'] },
          OR: [
            {
              startTime: { lt: end },
              endTime: { gt: start },
            }
          ]
        }
      });

      // 2. If overlap exists, and it's PENDING but not expired, fail.
      if (overlapping) {
        if (overlapping.status === 'CONFIRMED' || overlapping.status === 'COMPLETED' || overlapping.expiresAt > new Date()) {
          throw new Error('Slot already booked or currently reserved.');
        } else {
          // Clear expired pending booking so this slot can be taken
          await tx.booking.update({
            where: { id: overlapping.id },
            data: { status: 'CANCELLED' }
          });
        }
      }

      // 3. Get stadium price
      const stadium = await tx.stadium.findUnique({ where: { id: stadiumId }});
      if (!stadium) throw new Error("Stadium not found");
      
      bookedStadiumName = stadium.name;
      bookedPrice = stadium.hourlyPrice;

      // 4. Create the pending booking with a 10 min expiration
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes lock
      const isCash = paymentMethod.toLowerCase() === 'cash';
      
      const newBooking = await tx.booking.create({
        data: {
          stadiumId,
          userId,
          startTime: start,
          endTime: end,
          status: isCash ? 'CONFIRMED' : 'PENDING',
          expiresAt,
          payment: {
            create: {
              amount: stadium.hourlyPrice,
              provider: paymentMethod,
              status: 'PENDING',
            }
          }
        }
      });

      return newBooking;
    });

    // Send Telegram Notification asynchronously
    const dateStr = start.toLocaleDateString('uz-UZ');
    const timeSlot = `${dateStr}, ${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
    
    const isCashPayment = paymentMethod.toLowerCase() === 'cash';

    const paymentUz = isCashPayment ? 'Naqd pul (CASH)' : paymentMethod.toUpperCase();
    const paymentRu = isCashPayment ? 'Наличные (CASH)' : paymentMethod.toUpperCase();

    const warningUz = isCashPayment ? '\n⚠️ <b>DIQQAT:</b> Mijoz to\'lovni stadionga kelganda naqd pulda amalga oshiradi. Pulni olishni unutmang!' : '';
    const warningRu = isCashPayment ? '\n⚠️ <b>ВНИМАНИЕ:</b> Клиент оплатит наличными на месте. Не забудьте принять оплату!' : '';

    const message = `🏟 <b>YANGI BRON / НОВОЕ БРОНИРОВАНИЕ</b>

🇺🇿 <b>O'zbekcha:</b>
👤 Mijoz: ${session.user.email}
📍 Stadion: ${bookedStadiumName}
⏰ Vaqt: ${timeSlot}
💰 Narx: ${bookedPrice.toLocaleString()} UZS
💳 To'lov usuli: ${paymentUz}${warningUz}

➖➖➖➖➖➖➖➖➖➖

🇷🇺 <b>Русский:</b>
👤 Клиент: ${session.user.email}
📍 Стадион: ${bookedStadiumName}
⏰ Время: ${timeSlot}
💰 Цена: ${bookedPrice.toLocaleString()} UZS
💳 Способ оплаты: ${paymentRu}${warningRu}`;
    
    sendTelegramNotification(message).catch(console.error);

    return NextResponse.json({ success: true, bookingId: booking.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
