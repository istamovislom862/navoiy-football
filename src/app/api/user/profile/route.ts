import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const userId = (session.user as any).id;

    // Filter to only allow certain fields to be updated
    const { avatar, telegram, instagram, age, height, weight } = data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: avatar || null,
        telegram: telegram || null,
        instagram: instagram || null,
        age: age ? parseInt(age) : null,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
      }
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
