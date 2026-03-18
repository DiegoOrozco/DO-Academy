// @ts-nocheck
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const backupUrl = searchParams.get('backupUrl');
  const targetModel = searchParams.get('table');

  const destUrl = process.env.DATABASE_URL;

  if (!destUrl) {
    return new Response('Error: DATABASE_URL not set in environment.', { status: 500 });
  }

  if (!backupUrl) {
    return new Response('Usa ?backupUrl=... para empezar la restauración.', { status: 200 });
  }

  const dest = new PrismaClient();
  const logs: string[] = [];
  
  try {
    logs.push(`--- Fetching Backup from ${backupUrl} ---`);
    const response = await fetch(backupUrl);
    if (!response.ok) throw new Error(`Failed to fetch backup: ${response.statusText}`);
    
    const backup = await response.json();
    const data = backup.data;

    if (!data) throw new Error('Invalid backup format: Missing "data" object.');

    const allModels = [
      'user', 'siteConfig', 'course', 'week', 'day', 'resource',
      'enrollment', 'submission', 'post', 'reply', 'videoProgress',
      'communication', 'attendanceSession'
    ];

    const modelsToMigrate = targetModel ? [targetModel] : allModels;

    for (const model of modelsToMigrate) {
      if (!allModels.includes(model)) continue;

      const items = data[model] || (model === 'siteConfig' ? data.siteConfigs : data[`${model}s`]);
      if (!items) {
        logs.push(`⚠️ Skipping ${model}: No data found in backup.`);
        continue;
      }

      logs.push(`Restoring ${model} (${items.length} records)...`);
      
      for (const item of items) {
        let where: any = { id: item.id };
        if (model === 'enrollment') where = { userId_courseId: { userId: item.userId, courseId: item.courseId } };
        if (model === 'videoProgress') where = { userId_dayId: { userId: item.userId, dayId: item.dayId } };
        if (model === 'siteConfig') where = { key: item.key };
        if (model === 'submission') where = { userId_dayId: { userId: item.userId, dayId: item.dayId } };

        await (dest as any)[model].upsert({
          where,
          update: item,
          create: item,
        });
      }
      logs.push(`✅ ${model} restored.`);
    }

    return new Response(`🎉 RESTAURACIÓN COMPLETADA!\n\n${logs.join('\n')}`, { status: 200 });
  } catch (error: any) {
    return new Response(`❌ ERROR: ${error.message}\n\nLogs:\n${logs.join('\n')}`, { status: 500 });
  } finally {
    await dest.$disconnect();
  }
}
