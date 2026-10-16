import { PrismaClient } from '@prisma/client';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const prisma = new PrismaClient();

  // Fetch Live Metrics and Users simultaneously
  const [
    totalBookings, 
    confirmedBookings,
    activeStadiums, 
    totalUsers,
    completedPayments,
    allPayments,
    recentTransactions,
    users
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] } } }),
    prisma.stadium.count(),
    prisma.user.count(),
    prisma.payment.findMany({ where: { status: 'COMPLETED' } }),
    prisma.payment.findMany(),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        booking: {
          include: {
            stadium: true,
            user: true
          }
        }
      }
    }),
    prisma.user.findMany({
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
    })
  ]);

  const completedRevenue = completedPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalVolume = allPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const platformCommission = completedRevenue * 0.10; // 10% commission

  const metrics = {
    completedRevenue,
    totalVolume,
    platformCommission,
    activeStadiums,
    totalBookings,
    confirmedBookings,
    totalUsers,
  };

  return (
    <AdminDashboardClient
      metrics={metrics}
      users={users as any}
      recentTransactions={recentTransactions as any}
    />
  );
}
