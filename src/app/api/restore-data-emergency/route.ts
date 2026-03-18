// @ts-nocheck
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const sourceUrl = 'postgres://9de4b14967f7bb8ff2a53a7e79fc866df02c0005f602dd2d35d26c1a426a0981:sk_deU_eiwpYv4ypObAOgTjv@db.prisma.io:5432/postgres?sslmode=require';
  const destUrl = process.env.DATABASE_URL;

  if (!destUrl) {
    return new Response('Error: DATABASE_URL not set in environment.', { status: 500 });
  }

  if (!table) {
    return new Response('Prueba de Conexión exitosa. Usa ?table=user para empezar.', { status: 200 });
  }

  const source = new PrismaClient({ datasourceUrl: sourceUrl });
  const dest = new PrismaClient({ datasourceUrl: destUrl });

  try {
    const items = await (source as any)[table].findMany({
      take: limit,
      skip: offset,
    });

    if (items.length === 0) {
      return new Response(`Fin de la tabla ${table}. Todo migrado hasta el registro ${offset}.`, { status: 200 });
    }

    for (const item of items) {
      let where: any = { id: item.id };
      if (table === 'enrollment') where = { userId_courseId: { userId: item.userId, courseId: item.courseId } };
      if (table === 'videoProgress') where = { userId_dayId: { userId: item.userId, dayId: item.dayId } };
      if (table === 'siteConfig') where = { key: item.key };
      if (table === 'submission') where = { userId_dayId: { userId: item.userId, dayId: item.dayId } };
      if (table === 'deadlineException') where = { userId_dayId: { userId: item.userId, dayId: item.dayId } };
      if (table === 'attendanceLog') where = { userId_dateText_sheetName: { userId: item.userId, dateText: item.dateText, sheetName: item.sheetName } };

      await (dest as any)[table].upsert({
        where,
        update: item,
        create: item,
      });
    }

    const nextOffset = offset + limit;
    const nextUrl = `/api/restore-data-emergency?table=${table}&limit=${limit}&offset=${nextOffset}`;
    
    return new Response(`✅ Migrados ${items.length} registros de ${table} (desde ${offset} hasta ${nextOffset}).\nSiguiente bloque: ${nextUrl}`, { status: 200 });
    
  } catch (error: any) {
    return new Response(`❌ ERROR: ${error.message}`, { status: 500 });
  } finally {
    await source.$disconnect();
    await dest.$disconnect();
  }
}
