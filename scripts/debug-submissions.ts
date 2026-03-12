
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const days = await prisma.day.findMany({
    where: { isDeliveryDay: true },
    select: { id: true, title: true }
  })

  console.log("--- DAYS WITH DELIVERIES ---")
  for (const day of days) {
    const count = await prisma.submission.count({ where: { dayId: day.id } })
    const pending = await prisma.submission.count({ where: { dayId: day.id, status: 'PENDING' } })
    console.log(`Day: ${day.title} (${day.id}) | Total: ${count} | Pending: ${pending}`)
  }

  // Check oldest pending globally
  const oldest = await prisma.submission.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, dayId: true, status: true, fileName: true, userId: true }
  })
  console.log("\n--- OLDEST GLOBAL PENDING ---")
  console.log(oldest || "None")
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
