import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PayUz } from "@/lib/pay-uz";

const prisma = new PrismaClient();

const payUz = new PayUz({
  payme: {
    merchantId: process.env.PAYME_MERCHANT_ID || 'mock_merchant_id',
    secretKey: process.env.PAYME_SECRET_KEY || 'mock_secret_key',
  },
  click: {
    serviceId: process.env.CLICK_SERVICE_ID || 'mock_service_id',
    merchantId: process.env.CLICK_MERCHANT_ID || 'mock_merchant_id',
    secretKey: process.env.CLICK_SECRET_KEY || 'mock_secret_key',
  }
});

// Configure the handler for successful transactions
payUz.onSuccess(async (transaction: any) => {
  const { orderId, transactionId, amount } = transaction;

  // Transactionally update the booking and payment
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: orderId }
    });

    if (booking && booking.status === 'PENDING') {
      await tx.booking.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' }
      });
      
      await tx.payment.update({
        where: { bookingId: orderId },
        data: {
          status: 'COMPLETED',
          transactionId: transactionId
        }
      });
    }
  });
});

payUz.onCancel(async (transaction: any) => {
  const { orderId } = transaction;
  await prisma.payment.update({
    where: { bookingId: orderId },
    data: { status: 'FAILED' }
  });
});

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider: rawProvider } = await params;
    const provider = rawProvider.toLowerCase();
    
    // Parse the incoming request for Payme or Click format
    const body = await req.json();

    // Use pay-uz to handle the webhook request logic and security checks
    let response;
    if (provider === 'payme') {
      response = await payUz.payme.handleWebhook(body);
    } else if (provider === 'click') {
      response = await payUz.click.handleWebhook(body);
    } else {
      return NextResponse.json({ error: "Provider not supported" }, { status: 400 });
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
