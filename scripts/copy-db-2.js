const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

console.log("STARTING SCRIPT...");

const prodDbUrl = "postgres://9de4b14967f7bb8ff2a53a7e79fc866df02c0005f602dd2d35d26c1a426a0981:sk_deU_eiwpYv4ypObAOgTjv@db.prisma.io:5432/postgres?sslmode=require";
const devDbUrl = process.env.DATABASE_URL;

console.log("DEV URL:", devDbUrl);

const prodPrisma = new PrismaClient({ datasources: { db: { url: prodDbUrl } } });
const devPrisma = new PrismaClient({ datasources: { db: { url: devDbUrl } } });

async function main() {
    console.log("Connecting to databases...");
    try {
        const prodCourses = await prodPrisma.course.findMany({
            include: { weeks: { include: { days: true } } }
        });

        console.log(`Found ${prodCourses.length} courses in PROD. Copying to DEV...`);

        for (const course of prodCourses) {
            console.log(`Copying course: ${course.title}`);

            await devPrisma.course.create({
                data: {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    image: course.image,
                    duration: course.duration,
                    lessonsCount: course.lessonsCount,
                    category: course.category,
                    status: course.status,
                    createdAt: course.createdAt,
                    updatedAt: course.updatedAt,
                }
            });

            for (const week of course.weeks) {
                await devPrisma.week.create({
                    data: {
                        id: week.id,
                        title: week.title,
                        description: week.description,
                        courseId: course.id,
                        orderIndex: week.orderIndex,
                        isVisible: week.isVisible,
                        createdAt: week.createdAt,
                        updatedAt: week.updatedAt,
                    }
                });

                for (const day of week.days) {
                    await devPrisma.day.create({
                        data: {
                            id: day.id,
                            title: day.title,
                            description: day.description,
                            assignmentType: day.assignmentType,
                            assignmentPrompt: day.assignmentPrompt,
                            exerciseDescription: day.exerciseDescription,
                            videoId: day.videoId,
                            videoCompleted: day.videoCompleted,
                            resources: day.resources,
                            isDeliveryDay: day.isDeliveryDay,
                            dueDate: day.dueDate,
                            rubric: day.rubric,
                            materialUrl: day.materialUrl,
                            summaryUrl: day.summaryUrl,
                            weekId: week.id,
                            orderIndex: day.orderIndex,
                            isVisible: day.isVisible,
                            createdAt: day.createdAt,
                            updatedAt: day.updatedAt,
                        }
                    });
                }
            }
        }
        console.log("Database copy completed successfully.");
    } catch (error) {
        console.error("FATAL ERROR:", error);
    } finally {
        await prodPrisma.$disconnect();
        await devPrisma.$disconnect();
    }
}

main().then(() => console.log("Done")).catch(e => console.error(e));
