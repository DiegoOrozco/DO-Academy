// @ts-nocheck
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sourceUrl = 'postgres://9de4b14967f7bb8ff2a53a7e79fc866df02c0005f602dd2d35d26c1a426a0981:sk_deU_eiwpYv4ypObAOgTjv@db.prisma.io:5432/postgres?sslmode=require';
  const destUrl = process.env.DATABASE_URL;

  if (!destUrl) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
  }

  // Use specialized connection overrides to bypass schema-only constraints in Prisma 7
  const source = new PrismaClient({
    datasourceUrl: sourceUrl,
  });

  const dest = new PrismaClient({
    datasourceUrl: destUrl,
  });

  const logs: string[] = [];
  logs.push('--- Starting Vercel-Side Data Migration ---');

  try {
    const models = [
      'user', 'course', 'week', 'day', 'enrollment', 'resource',
      'post', 'reply', 'videoProgress', 'siteConfig', 'submission',
      'communication', 'attendanceSession', 'deadlineException', 'attendanceLog'
    ];

    for (const model of models) {
      logs.push(`Migrating ${model}...`);
      const items = await (source as any)[model].findMany();
      
      for (const item of items) {
        // Build the unique where clause based on the model
        let where: any = { id: item.id };
        if (model === 'enrollment') where = { userId_courseId: { userId: item.userId, courseId: item.courseId } };
        if (model === 'videoProgress') where = { userId_dayId: { userId: item.userId, dayId: item.dayId } };
        if (model === 'siteConfig') where = { key: item.key };
        if (model === 'submission') where = { userId_dayId: { userId: item.userId, dayId: item.dayId } };
        if (model === 'deadlineException') where = { userId_dayId: { userId: item.userId, dayId: item.dayId } };
        if (model === 'attendanceLog') where = { userId_dateText_sheetName: { userId: item.userId, dateText: item.dateText, sheetName: item.sheetName } };

        await (dest as any)[model].upsert({
          where,
          update: item,
          create: item,
        });
      }
      logs.push(`Migrated ${items.length} records for ${model}.`);
    }

    logs.push('--- Migration Completed Successfully ---');
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    logs.push(`Migration failed: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
  } finally {
    await source.$disconnect();
    await dest.$disconnect();
  }
}
