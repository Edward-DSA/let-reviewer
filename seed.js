const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // 1. Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {}, // Do nothing if it exists
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN'
    }
  });
  console.log(`Admin user seeded: ${adminUser.username} / admin123`);

  // 2. Create Categories
  const categories = [
    { name: 'General Education', description: 'Core subjects and foundational knowledge.' },
    { name: 'Professional Education', description: 'Pedagogy, child development, and teaching principles.' },
    { name: 'Major/Specialization', description: 'Specific subject area expertise.' }
  ];

  for (const cat of categories) {
    const exists = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!exists) {
      await prisma.category.create({ data: cat });
      console.log(`Created category: ${cat.name}`);
    } else {
      console.log(`Category already exists: ${cat.name}`);
    }
  }

  console.log('Database seeding complete!');
}

main()
  .catch(e => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
