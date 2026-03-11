const { PrismaClient } = require('@prisma/client');
console.log("Starting direct seed script...");

const prodPrisma = new PrismaClient({ datasources: { db: { url: "postgres://9de4b14967f7bb8ff2a53a7e79fc866df02c0005f602dd2d35d26c1a426a0981:sk_deU_eiwpYv4ypObAOgTjv@db.prisma.io:5432/postgres?sslmode=require" } } });
const devPrisma = new PrismaClient({ datasources: { db: { url: "postgres://97a982d770ae311d5832a697c52d058a8fa190f67e8043b33e2b648c28c30bf8:sk_fOxVXEdibqiu4yNUVx131@db.prisma.io:5432/postgres?sslmode=require" } } });

async function seed() {
    console.log("Fetching Prod Courses...");
    const courses = await prodPrisma.course.findMany();
    console.log(`Found ${courses.length} courses.`);

    for (const c of courses) {
        console.log(`Creating DEV Course: ${c.title}...`);
        const exists = await devPrisma.course.findUnique({ where: { id: c.id } });
        if (!exists) {
            await devPrisma.course.create({ data: c });
        }
    }

    console.log("Fetching Prod Weeks...");
    const weeks = await prodPrisma.week.findMany();
    console.log(`Found ${weeks.length} weeks.`);

    for (const w of weeks) {
        console.log(`Creating DEV Week: ${w.title}...`);
        const exists = await devPrisma.week.findUnique({ where: { id: w.id } });
        if (!exists) {
            await devPrisma.week.create({ data: w });
        }
    }

    console.log("Fetching Prod Days...");
    const days = await prodPrisma.day.findMany();
    console.log(`Found ${days.length} days.`);

    for (const d of days) {
        const exists = await devPrisma.day.findUnique({ where: { id: d.id } });
        if (!exists) {
            await devPrisma.day.create({ data: d });
        }
    }

    console.log("DONE SEEDING DEV.");
    process.exit(0);
}

seed().catch(console.error);
