import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
    const prodPool = new Pool({ connectionString: "postgres://9de4b14967f7bb8ff2a53a7e79fc866df02c0005f602dd2d35d26c1a426a0981:sk_deU_eiwpYv4ypObAOgTjv@db.prisma.io:5432/postgres?sslmode=require" });
    const devPool = new Pool({ connectionString: "postgres://97a982d770ae311d5832a697c52d058a8fa190f67e8043b33e2b648c28c30bf8:sk_fOxVXEdibqiu4yNUVx131@db.prisma.io:5432/postgres?sslmode=require" });

    try {
        const fetchRes = await prodPool.query('SELECT id, title, description, image, duration, "lessonsCount", category, status, "createdAt", "updatedAt" FROM "Course"');
        const courses = fetchRes.rows;
        let inserted = 0;

        for (const c of courses) {
            try {
                await devPool.query(
                    `INSERT INTO "Course" (id, title, description, image, duration, "lessonsCount", category, status, "createdAt", "updatedAt") 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
                    [c.id, c.title, c.description, c.image, c.duration, c.lessonsCount, c.category, c.status, c.createdAt, c.updatedAt]
                );
                inserted++;
            } catch (err: any) {
                console.log("Error inserting", c.title, err.message);
            }
        }

        // Let's also get Weeks
        const fetchWeeks = await prodPool.query('SELECT id, title, description, "courseId", "orderIndex", "isVisible", "createdAt", "updatedAt" FROM "Week"');
        const weeks = fetchWeeks.rows;
        let weeksInserted = 0;

        for (const w of weeks) {
            try {
                await devPool.query(
                    `INSERT INTO "Week" (id, title, description, "courseId", "orderIndex", "isVisible", "createdAt", "updatedAt") 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
                    [w.id, w.title, w.description, w.courseId, w.orderIndex, w.isVisible, w.createdAt, w.updatedAt]
                );
                weeksInserted++;
            } catch (e) { }
        }

        // Let's get Days
        const fetchDays = await prodPool.query('SELECT id, title, description, "assignmentType", "assignmentPrompt", "exerciseDescription", "videoId", "videoCompleted", resources, "isDeliveryDay", "dueDate", rubric, "materialUrl", "summaryUrl", "weekId", "orderIndex", "isVisible", "createdAt", "updatedAt" FROM "Day"');
        const days = fetchDays.rows;
        let daysInserted = 0;

        for (const d of days) {
            try {
                await devPool.query(
                    `INSERT INTO "Day" (id, title, description, "assignmentType", "assignmentPrompt", "exerciseDescription", "videoId", "videoCompleted", resources, "isDeliveryDay", "dueDate", rubric, "materialUrl", "summaryUrl", "weekId", "orderIndex", "isVisible", "createdAt", "updatedAt") 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) ON CONFLICT (id) DO NOTHING`,
                    [d.id, d.title, d.description, d.assignmentType, d.assignmentPrompt, d.exerciseDescription, d.videoId, d.videoCompleted, d.resources, d.isDeliveryDay, d.dueDate, d.rubric, d.materialUrl, d.summaryUrl, d.weekId, d.orderIndex, d.isVisible, d.createdAt, d.updatedAt]
                );
                daysInserted++;
            } catch (e) { }
        }

        return NextResponse.json({ success: true, courses: inserted, weeks: weeksInserted, days: daysInserted });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
    } finally {
        await prodPool.end();
        await devPool.end();
    }
}
