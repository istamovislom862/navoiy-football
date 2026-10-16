import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (!userId || (role !== 'OWNER' && role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Only owners and admins can create stadiums.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, address, lat, lng, hourlyPrice, openingTime, closingTime } = body;

    if (!name || !address || !lat || !lng || !hourlyPrice || !openingTime || !closingTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stadium = await prisma.stadium.create({
      data: {
        name,
        description,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        hourlyPrice: parseFloat(hourlyPrice),
        openingTime,
        closingTime,
        ownerId: userId
      }
    });

    return NextResponse.json({ success: true, stadium }, { status: 201 });
  } catch (error: any) {
    console.error('Stadium creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
