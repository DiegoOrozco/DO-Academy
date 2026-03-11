import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

console.log("Starting reliable DB copy with pg adapter...");

const prodPool = new Pool({ connectionString: "postgres://9de4b14967f7bb8ff2a53a7e79fc866df02c0005f602dd2d35d26c1a426a0981:sk_deU_eiwpYv4ypObAOgTjv@db.prisma.io:5432/postgres?sslmode=require" });
const devPool = new Pool({ connectionString: "postgres://97a982d770ae311d5832a697c52d058a8fa190f67e8043b33e2b648c28c30bf8:sk_fOxVXEdibqiu4yNUVx131@db.prisma.io:5432/postgres?sslmode=require" });

const prodAdapter = new PrismaPg(prodPool);
const devAdapter = new PrismaPg(devPool);

const prodPrisma = new PrismaClient({ adapter: prodAdapter });
const devPrisma = new PrismaClient({ adapter: devAdapter });

async function main() {
    console.log("Fetching Prod Courses...");
    const courses = await prodPrisma.course.findMany();
    console.log(`Found ${courses.length} courses.`);

    for (const c of courses) {
        const exists = await devPrisma.course.findUnique({ where: { id: c.id } });
        if (!exists) {
            console.log(`Creating DEV Course: ${c.title}...`);
            await devPrisma.course.create({ data: c });
        } else {
            console.log(`SKIPPED: DEV Course: ${c.title} already exists.`);
        }
    }

    const weeks = await prodPrisma.week.findMany();
    for (const w of weeks) {
        const exists = await devPrisma.week.findUnique({ where: { id: w.id } });
        if (!exists) {
            await devPrisma.week.create({ data: w });
        }
    }

    const days = await prodPrisma.day.findMany();
    for (const d of days) {
        const exists = await devPrisma.day.findUnique({ where: { id: d.id } });
        if (!exists) {
            await devPrisma.day.create({ data: d });
        }
    }

    // Fix permissions: promote any user to ADMIN
    await devPrisma.user.updateMany({
        data: { role: 'ADMIN' }
    });
    console.log("DONE SEEDING DEV AND GRANTING ADMIN PERMISSIONS.");
}

main().catch(console.error).finally(() => {
    prodPrisma.$disconnect();
    devPrisma.$disconnect();
});
