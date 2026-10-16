import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import StadiumsClient from './StadiumsClient';

export const dynamic = 'force-dynamic';

export default async function AdminStadiums() {
  const prisma = new PrismaClient();

  const stadiums = await prisma.stadium.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
          username: true,
        }
      },
      _count: {
        select: {
          bookings: true,
        }
      }
    }
  });

  async function createStadiumAction(formData: FormData) {
    'use server';
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return { error: 'Unauthorized' };
      }

      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const address = formData.get('address') as string;
      const hourlyPrice = parseFloat(formData.get('hourlyPrice') as string);
      const openingTime = formData.get('openingTime') as string;
      const closingTime = formData.get('closingTime') as string;
      const lat = parseFloat(formData.get('lat') as string);
      const lng = parseFloat(formData.get('lng') as string);

      if (!name || !address || isNaN(hourlyPrice) || !openingTime || !closingTime || isNaN(lat) || isNaN(lng)) {
        return { error: 'Please fill in all required fields properly.' };
      }

      const prisma = new PrismaClient();
      const adminId = (session.user as any).id;

      // Find valid owner or use current admin
      let ownerId = adminId;
      if (!ownerId) {
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (adminUser) ownerId = adminUser.id;
      }

      await prisma.stadium.create({
        data: {
          name,
          description: description || null,
          address,
          hourlyPrice,
          openingTime,
          closingTime,
          lat,
          lng,
          ownerId,
        }
      });

      revalidatePath('/admin/stadiums');
      revalidatePath('/admin');
      revalidatePath('/dashboard');
      revalidatePath('/');
      return { success: true };
    } catch (err: any) {
      console.error('Error creating stadium:', err);
      return { error: err.message || 'Failed to create stadium' };
    }
  }

  async function deleteStadiumAction(id: string) {
    'use server';
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return { error: 'Unauthorized' };
      }

      const prisma = new PrismaClient();

      // Safely delete cascade in a transaction
      await prisma.$transaction([
        prisma.payment.deleteMany({
          where: {
            booking: {
              stadiumId: id,
            }
          }
        }),
        prisma.booking.deleteMany({
          where: {
            stadiumId: id,
          }
        }),
        prisma.stadium.delete({
          where: { id }
        })
      ]);

      revalidatePath('/admin/stadiums');
      revalidatePath('/admin');
      revalidatePath('/dashboard');
      revalidatePath('/');
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting stadium:', err);
      return { error: err.message || 'Failed to delete stadium' };
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <StadiumsClient 
        stadiums={stadiums as any} 
        createStadiumAction={createStadiumAction} 
        deleteStadiumAction={deleteStadiumAction} 
      />
    </div>
  );
}
