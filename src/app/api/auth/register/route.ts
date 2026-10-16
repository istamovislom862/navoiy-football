import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, username, password, role } = await req.json();

    if (!name || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Password Policy Validation: 8 chars, 1 uppercase, 1 special character
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*\-_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json({ 
        error: "Password must be at least 8 characters long, contain at least 1 uppercase letter, and 1 special character." 
      }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const validRole = (role === "OWNER" || role === "PLAYER") ? role : "PLAYER";

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: validRole,
        emailVerified: null, 
      }
    });

    return NextResponse.json({ message: "Registration successful.", username: user.username }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
