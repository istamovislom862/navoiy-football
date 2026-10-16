import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = body.email;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    console.log("====================================");
    console.log("🔐 DEVELOPMENT OTP: ", verificationCode);
    console.log("====================================");

    // Update the user with the new code and email
    await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        verificationCode,
        codeExpiry,
      }
    });

    // Send the OTP via Resend
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email, 
      subject: 'Footcoins - Tasdiqlash kodi',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Footcoins platformasiga xush kelibsiz!</h2>
          <p>Sizning tasdiqlash kodingiz:</p>
          <h1 style="color: #4F46E5; letter-spacing: 5px;">${verificationCode}</h1>
          <p>Bu kod 15 daqiqa davomida amal qiladi. Iltimos, uni hech kimga bermang!</p>
        </div>
      `
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Verification code sent to your email." }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
