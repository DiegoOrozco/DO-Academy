const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const days = await prisma.day.findMany({
    select: { title: true, isDeliveryDay: true, assignmentType: true, dueDate: true }
  });
  console.log(JSON.stringify(days, null, 2));
}
main();
