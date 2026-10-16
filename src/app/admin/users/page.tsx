import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
          stadiums: true,
        }
      }
    }
  });

  async function updateRoleAction(userId: string, newRole: string) {
    'use server';
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
        return { error: 'Unauthorized' };
      }

      if (!['PLAYER', 'OWNER', 'ADMIN'].includes(newRole)) {
        return { error: 'Invalid role' };
      }

      await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
      });

      revalidatePath('/admin/users');
      revalidatePath('/admin');
      return { success: true };
    } catch (err: unknown) {
      console.error('Error updating role:', err);
      const message = err instanceof Error ? err.message : 'Failed to update user role';
      return { error: message };
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <UsersClient 
        users={users} 
        updateRoleAction={updateRoleAction} 
      />
    </div>
  );
}
