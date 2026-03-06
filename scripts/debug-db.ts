import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- DB DIAGNOSTICS ---");
    const submissions = await prisma.submission.findMany({
        include: {
            user: { select: { email: true, name: true } }
        }
    });

    console.log(`Total submissions: ${submissions.length}`);
    submissions.forEach(s => {
        console.log(`- Day: ${s.dayId}, User: ${s.user.email}, Content: ${s.content?.substring(0, 50)}...`);
    });

    const days = await prisma.day.findMany({
        where: { enablePlagiarism: true },
        select: { id: true, title: true }
    });
    console.log(`Days with plagiarism enabled: ${days.length}`);
    days.forEach(d => console.log(`- ${d.id}: ${d.title}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
