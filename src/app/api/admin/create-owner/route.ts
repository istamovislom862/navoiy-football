import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';


export async function POST(req: Request) {
  try {
    // 1. Verify Admin Session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in.' }, { status: 401 });
    }

    const requesterRole = (session.user as { role?: string }).role;
    if (requesterRole !== 'ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    // 2. Parse and Validate Request Body
    const body = await req.json();
    const { name, username, password } = body;

    const trimmedName = name?.trim();
    const trimmedUsername = username?.trim().toLowerCase();

    if (!trimmedName || !trimmedUsername || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: Full Name, Username, and Password are all required.' },
        { status: 400 }
      );
    }

    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 3. Check for existing user with same username
    const existingUser = await prisma.user.findFirst({
      where: {
        username: trimmedUsername,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `A user with username "${trimmedUsername}" already exists.` },
        { status: 400 }
      );
    }

    // 4. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create new Stadium Owner account
    const newOwner = await prisma.user.create({
      data: {
        name: trimmedName,
        username: trimmedUsername,
        password: hashedPassword,
        role: 'OWNER',
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Stadium Owner account created successfully for "${newOwner.name}" (@${newOwner.username})!`,
        owner: newOwner,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating stadium owner:', error);
    const message = error instanceof Error ? error.message : 'Internal server error while creating stadium owner.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
