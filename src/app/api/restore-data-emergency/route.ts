// @ts-nocheck
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetModel = searchParams.get('table');

  const sourceUrl = 'postgres://9de4b14967f7bb8ff2a53a7e79fc866df02c0005f602dd2d35d26c1a426a0981:sk_deU_eiwpYv4ypObAOgTjv@db.prisma.io:5432/postgres?sslmode=require';
  const destUrl = process.env.DATABASE_URL;

  if (!destUrl) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
  }

  const source = new PrismaClient({ datasourceUrl: sourceUrl });
  const dest = new PrismaClient({ datasourceUrl: destUrl });

  const logs: string[] = [];
  
  try {
    const allModels = [
      'user', 'course', 'week', 'day', 'enrollment', 'resource',
      'post', 'reply', 'videoProgress', 'siteConfig', 'submission',
      'communication', 'attendanceSession', 'deadlineException', 'attendanceLog'
    ];

    const modelsToMigrate = targetModel ? [targetModel] : allModels;

    for (const model of modelsToMigrate) {
      if (!allModels.includes(model)) continue;

      console.log(`Migrating ${model}...`);
      const items = await (source as any)[model].findMany();
      
      let count = 0;
      for (const item of items) {
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
        count++;
      }
      logs.push(`Migrated ${count} records for ${model}.`);
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
  } finally {
    await source.$disconnect();
    await dest.$disconnect();
  }
}
