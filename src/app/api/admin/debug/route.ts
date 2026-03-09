import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export async function GET() {
    const courses = await prisma.course.findMany({
        include: {
            weeks: {
                include: {
                    days: {
                        where: { isDeliveryDay: true }
                    }
                }
            }
        }
    });

    const coursesWithDeliveries = courses.filter(c =>
        c.weeks.some((w: any) => w.days.some((d: any) => d.isDeliveryDay))
    );

    return NextResponse.json({
        totalCourses: courses.length,
        coursesWithDeliveries: coursesWithDeliveries.length,
        coursesWaitWhat: coursesWithDeliveries
    });
}
