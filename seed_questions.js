const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample questions...');

  const categories = await prisma.category.findMany();
  
  const genEd = categories.find(c => c.name === 'General Education');
  const profEd = categories.find(c => c.name === 'Professional Education');
  const major = categories.find(c => c.name === 'Major/Specialization');

  if (genEd) {
    const qCount = await prisma.question.count({ where: { categoryId: genEd.id } });
    if (qCount === 0) {
      await prisma.question.createMany({
        data: [
          {
            categoryId: genEd.id,
            text: "Which of the following is considered the smallest unit of life?",
            options: JSON.stringify(["Atom", "Cell", "Molecule", "Organ"]),
            correctAnswer: "1", // Index of "Cell"
            explanation: "The cell is the basic structural, functional, and biological unit of all known organisms. It is the smallest unit of life."
          },
          {
            categoryId: genEd.id,
            text: "Who wrote the famous Philippine novel 'Noli Me Tangere'?",
            options: JSON.stringify(["Andres Bonifacio", "Emilio Aguinaldo", "Jose Rizal", "Apolinario Mabini"]),
            correctAnswer: "2",
            explanation: "Jose Rizal wrote Noli Me Tangere, published in 1887, which played a crucial role in the political history of the Philippines."
          },
          {
            categoryId: genEd.id,
            text: "What is the capital city of the Philippines?",
            options: JSON.stringify(["Cebu City", "Davao City", "Manila", "Quezon City"]),
            correctAnswer: "2",
            explanation: "Manila is the capital city of the Philippines."
          }
        ]
      });
      console.log('Seeded General Education questions.');
    }
  }

  if (profEd) {
    const qCount = await prisma.question.count({ where: { categoryId: profEd.id } });
    if (qCount === 0) {
      await prisma.question.createMany({
        data: [
          {
            categoryId: profEd.id,
            text: "According to Piaget's theory of cognitive development, during which stage do children begin to think logically about concrete events?",
            options: JSON.stringify(["Sensorimotor stage", "Preoperational stage", "Concrete operational stage", "Formal operational stage"]),
            correctAnswer: "2",
            explanation: "The concrete operational stage (7-11 years) is characterized by the development of organized and rational thinking."
          },
          {
            categoryId: profEd.id,
            text: "What is the primary purpose of formative assessment?",
            options: JSON.stringify(["To grade students at the end of a unit", "To monitor student learning and provide ongoing feedback", "To compare students against a national standard", "To evaluate teacher performance"]),
            correctAnswer: "1",
            explanation: "Formative assessment aims to monitor student learning to provide ongoing feedback that can be used by instructors to improve their teaching."
          }
        ]
      });
      console.log('Seeded Professional Education questions.');
    }
  }

  if (major) {
    const qCount = await prisma.question.count({ where: { categoryId: major.id } });
    if (qCount === 0) {
      await prisma.question.createMany({
        data: [
          {
            categoryId: major.id,
            text: "In mathematics, what is the value of Pi (π) up to two decimal places?",
            options: JSON.stringify(["3.12", "3.14", "3.16", "3.18"]),
            correctAnswer: "1",
            explanation: "Pi is approximately equal to 3.14159, so it is 3.14 up to two decimal places."
          }
        ]
      });
      console.log('Seeded Major/Specialization questions.');
    }
  }

  console.log('Done adding sample questions!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
