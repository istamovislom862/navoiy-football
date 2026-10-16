const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst();
  if (!admin) {
    console.log("No users found. Please register a user first.");
    return;
  }

  await prisma.stadium.create({
    data: {
      name: 'Navoiy Arena',
      description: 'Premium pitch with artificial turf.',
      address: 'Navoiy City Center',
      lat: 40.0844,
      lng: 65.3792,
      hourlyPrice: 150000,
      openingTime: '16:00',
      closingTime: '23:00',
      ownerId: admin.id,
    }
  });

  await prisma.stadium.create({
    data: {
      name: 'Yoshlik Sport Majmuasi',
      description: 'Classic indoor futsal court.',
      address: 'Xatirchi tumani',
      lat: 40.1,
      lng: 65.4,
      hourlyPrice: 120000,
      openingTime: '10:00',
      closingTime: '22:00',
      ownerId: admin.id,
    }
  });
  console.log("Seeded successfully");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
