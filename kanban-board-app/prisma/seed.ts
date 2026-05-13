import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.column.count();
  if (count > 0) {
    console.log('Columns already seeded — skipping.');
    return;
  }

  await prisma.column.createMany({
    data: [
      { name: 'Open', position: 0 },
      { name: 'In Progress', position: 1 },
      { name: 'Completed', position: 2 },
    ],
  });

  console.log('Seeded 3 default columns.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
