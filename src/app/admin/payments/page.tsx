import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import PaymentsClient from './PaymentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPayments() {
  const prisma = new PrismaClient();

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      booking: {
        include: {
          stadium: {
            select: {
              name: true,
            }
          },
          user: {
            select: {
              name: true,
              username: true,
              email: true,
            }
          }
        }
      }
    }
  });

  async function updatePaymentStatusAction(paymentId: string, newStatus: string) {
    'use server';
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return { error: 'Unauthorized' };
      }

      if (!['PENDING', 'COMPLETED', 'FAILED'].includes(newStatus)) {
        return { error: 'Invalid payment status' };
      }

      const prisma = new PrismaClient();
      
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true }
      });

      if (!payment) {
        return { error: 'Payment not found' };
      }

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: { status: newStatus }
        }),
        prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: newStatus === 'COMPLETED' ? 'CONFIRMED' : newStatus === 'FAILED' ? 'CANCELLED' : 'PENDING'
          }
        })
      ]);

      revalidatePath('/admin/payments');
      revalidatePath('/admin');
      revalidatePath('/dashboard');
      return { success: true };
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      return { error: err.message || 'Failed to update payment status' };
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <PaymentsClient 
        payments={payments as any} 
        updatePaymentStatusAction={updatePaymentStatusAction} 
      />
    </div>
  );
}
