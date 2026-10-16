import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import SettingsClient from "./SettingsClient";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  if (!userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
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
      emailVerified: true,
    }
  });

  if (!user) {
    redirect('/login');
  }

  return <SettingsClient user={user} />;
}
