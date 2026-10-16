import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import DashboardClient from "./DashboardClient";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  let user = null;

  if (session?.user) {
    const role = (session.user as any).role;
    if (role === 'ADMIN') {
      redirect('/admin');
    }

    const userId = (session.user as any).id;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          telegram: true,
          instagram: true,
          age: true,
          height: true,
          weight: true,
          footcoins: true,
          stadiums: {
            orderBy: { createdAt: 'desc' },
          }
        }
      });
    }
  }

  // If not logged in, provide a guest profile so the dashboard is publicly viewable like in the reference design
  if (!user) {
    user = {
      id: 'guest',
      name: 'Guest Player',
      email: null,
      role: 'PLAYER',
      avatar: null,
      telegram: null,
      instagram: null,
      age: null,
      height: null,
      weight: null,
      footcoins: 50,
      stadiums: []
    };
  }

  // Fetch all stadiums for the catalog
  const stadiums = await prisma.stadium.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      bookings: {
        where: {
          startTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)) // Only future bookings
          }
        },
        select: {
          startTime: true,
          status: true
        }
      }
    }
  });

  return <DashboardClient user={user} stadiums={stadiums} />;
}
