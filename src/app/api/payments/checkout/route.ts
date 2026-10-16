import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PayUz } from "@/lib/pay-uz";

const prisma = new PrismaClient();

// Configure PayUz with merchant credentials
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

export async function POST(req: Request) {
  try {
    const { bookingId, amount, provider } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Amount should be in tiyins (cents) for most Uzb gateways
    const amountInTiyin = amount * 100;

    // Generate redirect URL based on the provider
    let redirectUrl = "";
    if (provider === "PAYME") {
      redirectUrl = payUz.payme.createInitializationUrl({
        amount: amountInTiyin,
        orderId: bookingId,
        returnUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
      });
    } else if (provider === "CLICK") {
      redirectUrl = payUz.click.createInitializationUrl({
        amount: amount,
        orderId: bookingId,
        returnUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
      });
    } else {
      throw new Error("Unsupported payment provider");
    }

    // Save pending payment record
    await prisma.payment.create({
      data: {
        bookingId: bookingId,
        amount: amount,
        provider: provider,
        status: "PENDING"
      }
    });

    return NextResponse.json({ url: redirectUrl }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
