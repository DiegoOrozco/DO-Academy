import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function restoreDatabase() {
    console.log("⚠️ STARTING EMERGENCY DATABASE RESTORATION ⚠️");

    const filepath = process.argv[2];
    const databaseUrl = process.env.DATABASE_URL;

    if (!filepath) {
        console.error("❌ Please provide the backup JSON file path.");
        process.exit(1);
    }

    if (!databaseUrl) {
        console.error("❌ DATABASE_URL environment variable is required.");
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        const fileContent = fs.readFileSync(filepath, 'utf8');
        const backup = JSON.parse(fileContent);

        if (!backup.data) {
            throw new Error("Invalid backup format. Missing 'data' object.");
        }

        console.log(`✅ Loaded backup from ${backup.timestamp}`);

        // 1. CLEAR CURRENT DATABASE (In reverse dependency order)
        console.log("🧹 Wiping current database records...");
        const models = [
            'attendanceLog', 'attendanceSession', 'deadlineException', 'communication',
            'videoProgress', 'reply', 'post', 'submission', 'enrollment',
            'resource', 'day', 'week', 'course', 'siteConfig', 'user'
        ];

        for (const model of models) {
            try {
                await (prisma as any)[model].deleteMany({});
            } catch (err) {
                console.warn(`Could not wipe ${model}, might not exist or empty.`);
            }
        }

        // 2. RESTORE DATA (In dependency order)
        const dataMap = backup.data;
        
        console.log("📥 Restoring foundation records...");
        if (dataMap.users?.length) await prisma.user.createMany({ data: dataMap.users });
        if (dataMap.siteConfigs?.length) await prisma.siteConfig.createMany({ data: dataMap.siteConfigs });
        if (dataMap.courses?.length) await prisma.course.createMany({ data: dataMap.courses });

        console.log("📥 Restoring curriculum records...");
        if (dataMap.weeks?.length) await prisma.week.createMany({ data: dataMap.weeks });
        if (dataMap.days?.length) await prisma.day.createMany({ data: dataMap.days });

        console.log("📥 Restoring system files...");
        if (dataMap.resources?.length) await prisma.resource.createMany({ data: dataMap.resources });

        console.log("📥 Restoring student engagement...");
        if (dataMap.enrollments?.length) await prisma.enrollment.createMany({ data: dataMap.enrollments });
        if (dataMap.submissions?.length) await prisma.submission.createMany({ data: dataMap.submissions });
        if (dataMap.posts?.length) await prisma.post.createMany({ data: dataMap.posts });
        if (dataMap.replies?.length) await prisma.reply.createMany({ data: dataMap.replies });
        if (dataMap.videoProgresses?.length) await prisma.videoProgress.createMany({ data: dataMap.videoProgresses });

        console.log("📥 Restoring metadata...");
        if (dataMap.communications?.length) await prisma.communication.createMany({ data: dataMap.communications });
        if (dataMap.attendanceSessions?.length) await prisma.attendanceSession.createMany({ data: dataMap.attendanceSessions });

        console.log(`🎉 RESTORATION COMPLETE!`);
    } catch (e) {
        console.error("❌ Restoration failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

restoreDatabase();
