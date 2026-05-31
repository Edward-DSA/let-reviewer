import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin
  const hashedPassword = await bcrypt.hash('password', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created Admin: ${admin.username}`);

  // Create Category
  const genEdCategory = await prisma.category.create({
    data: {
      name: 'General Education',
      description: 'Test your knowledge on general education topics commonly found in the LET exam.',
    },
  });

  console.log(`Created Category: ${genEdCategory.name}`);

  // Create Questions
  const questions = [
    {
      categoryId: genEdCategory.id,
      text: 'Which of the following is the lowest rank of coal and is otherwise called brown coal?',
      options: JSON.stringify(['Charcoal', 'Anthracite', 'Bituminous', 'Lignite']),
      correctAnswer: '3', // Lignite
      explanation: 'Lignite, often referred to as brown coal, is the lowest rank of coal and used almost exclusively as fuel for electric power generation.',
    },
    {
      categoryId: genEdCategory.id,
      text: 'Who was the Spanish governor-general who ordered the deportation of Jose Rizal to Dapitan?',
      options: JSON.stringify(['Gov. Gen. Eulogio Despujol', 'Gov. Gen. Carlos Maria de la Torre', 'Gov. Gen. Camilo de Polavieja', 'Gov. Gen. Rafael de Izquierdo']),
      correctAnswer: '0', // Despujol
      explanation: 'Governor-General Eulogio Despujol ordered Rizal\'s exile to Dapitan in July 1892.',
    },
    {
      categoryId: genEdCategory.id,
      text: 'What is the exact date when the Philippines gained its independence from the United States?',
      options: JSON.stringify(['June 12, 1898', 'July 4, 1946', 'August 21, 1983', 'February 25, 1986']),
      correctAnswer: '1', // July 4, 1946
      explanation: 'The US granted independence to the Philippines on July 4, 1946 through the Treaty of Manila.',
    },
    {
      categoryId: genEdCategory.id,
      text: 'In mathematics, what do you call an angle that is greater than 90 degrees but less than 180 degrees?',
      options: JSON.stringify(['Acute Angle', 'Right Angle', 'Obtuse Angle', 'Straight Angle']),
      correctAnswer: '2', // Obtuse Angle
      explanation: 'An obtuse angle is an angle which is greater than 90° and strictly less than 180°.',
    },
    {
      categoryId: genEdCategory.id,
      text: 'Which of the following elements has the chemical symbol "Fe"?',
      options: JSON.stringify(['Fluorine', 'Iron', 'Francium', 'Fermium']),
      correctAnswer: '1', // Iron
      explanation: 'Fe comes from the Latin word "ferrum," which means iron.',
    }
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log(`Successfully added ${questions.length} questions to the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
