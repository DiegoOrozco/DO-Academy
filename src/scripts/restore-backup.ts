const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreDatabase() {
    console.log("⚠️ STARTING EMERGENCY DATABASE RESTORATION ⚠️");

    // Check if filename is provided
    const filepath = process.argv[2];

    if (!filepath) {
        console.error("❌ Please provide the backup JSON file path.");
        console.log("Usage: npx ts-node src/scripts/restore-backup.ts path/to/backup.json");
        process.exit(1);
    }

    try {
        const fileContent = fs.readFileSync(filepath, 'utf8');
        const backup = JSON.parse(fileContent);

        if (!backup.data) {
            throw new Error("Invalid backup format. Missing 'data' object.");
        }

        console.log(`✅ Loaded backup from ${backup.timestamp} (v${backup.version})`);

        // 1. CLEAR CURRENT DATABASE (In reverse dependency order)
        console.log("🧹 Wiping current database records...");
        await prisma.consoleOutput.deleteMany({});
        await prisma.testResult.deleteMany({});
        await prisma.enrollment.deleteMany({});
        await prisma.preloadedFile.deleteMany({});
        await prisma.codeFile.deleteMany({});
        await prisma.day.deleteMany({});
        await prisma.week.deleteMany({});
        await prisma.course.deleteMany({});
        await prisma.siteConfig.deleteMany({});
        await prisma.user.deleteMany({});

        // 2. RESTORE DATA (In dependency order)
        console.log("📥 Restoring foundation records (Users, Configs, Courses)...");
        if (backup.data.users.length) await prisma.user.createMany({ data: backup.data.users });
        if (backup.data.siteConfigs.length) await prisma.siteConfig.createMany({ data: backup.data.siteConfigs });
        if (backup.data.courses.length) await prisma.course.createMany({ data: backup.data.courses });

        console.log("📥 Restoring curriculum records (Weeks, Days)...");
        if (backup.data.weeks.length) await prisma.week.createMany({ data: backup.data.weeks });
        if (backup.data.days.length) await prisma.day.createMany({ data: backup.data.days });

        console.log("📥 Restoring system files (CodeFiles, PreloadedFiles)...");
        if (backup.data.codeFiles.length) await prisma.codeFile.createMany({ data: backup.data.codeFiles });
        if (backup.data.preloadedFiles.length) await prisma.preloadedFile.createMany({ data: backup.data.preloadedFiles });

        console.log("📥 Restoring student data (Enrollments, Progress, Console)...");
        if (backup.data.enrollments.length) await prisma.enrollment.createMany({ data: backup.data.enrollments });
        if (backup.data.testResults.length) await prisma.testResult.createMany({ data: backup.data.testResults });
        if (backup.data.consoleOutputs.length) await prisma.consoleOutput.createMany({ data: backup.data.consoleOutputs });

        console.log(`🎉 RESTORATION COMPLETE!`);
        console.log(`Successfully hydrated database from ${backup.timestamp}`);
    } catch (e) {
        console.error("❌ Restoration failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

restoreDatabase();
