import { PrismaClient } from '@prisma/client';

const prodDbUrl = "postgres://9de4b14967f7bb8ff2a53a7e79fc866df02c0005f602dd2d35d26c1a426a0981:sk_deU_eiwpYv4ypObAOgTjv@db.prisma.io:5432/postgres?sslmode=require";
const devDbUrl = process.env.DATABASE_URL;

const prodPrisma = new PrismaClient({ datasourceUrl: prodDbUrl });
const devPrisma = new PrismaClient({ datasourceUrl: devDbUrl });

async function main() {
    console.log("Fixing Admin roles in DEV...");
    // 1. Promote all users to ADMIN in DEV
    const updateRes = await devPrisma.user.updateMany({
        data: { role: 'ADMIN' }
    });
    console.log(`Promoted ${updateRes.count} users to ADMIN in DEV.`);

    console.log("Attempting to copy courses...");

    const prodCourses = await prodPrisma.course.findMany({
        include: {
            weeks: {
                include: { days: true }
            }
        }
    });

    console.log(`Found ${prodCourses.length} courses in PROD.`);

    for (const course of prodCourses) {
        try {
            const exists = await devPrisma.course.findUnique({ where: { id: course.id } });
            if (!exists) {
                console.log(`Creating course: ${course.title}`);
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
            } else {
                console.log(`Course ${course.title} already exists in DEV.`);
            }
        } catch (e) {
            console.error(`Error copying course ${course.title}:`, e);
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prodPrisma.$disconnect();
        await devPrisma.$disconnect();
        console.log("Done.");
    });
