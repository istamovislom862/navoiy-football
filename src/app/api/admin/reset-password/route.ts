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
      return NextResponse.json({ error: 'Unauthorized: Please log in as an administrator.' }, { status: 401 });
    }

    const requesterRole = (session.user as { role?: string }).role;
    if (requesterRole !== 'ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Administrator privileges required.' }, { status: 403 });
    }

    // 2. Parse and validate body
    const body = await req.json();
    const userId = body.userId?.trim();
    const newPassword = (body.newPassword || body.password)?.trim();

    if (!userId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: 'Missing required field: newPassword' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    // 3. Check if target user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update password in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password successfully updated for ${updatedUser.name || updatedUser.username || updatedUser.email}!`,
      user: updatedUser,
      plainPasswordPreview: newPassword,
    });
  } catch (error: unknown) {
    console.error('Error in /api/admin/reset-password:', error);
    const message = error instanceof Error ? error.message : 'Internal server error while updating password.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
