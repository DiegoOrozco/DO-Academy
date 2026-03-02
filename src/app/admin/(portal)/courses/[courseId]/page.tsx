import prisma from "@/lib/prisma";
import AdminCourseEditorClient from "./AdminCourseEditorClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function CourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            weeks: {
                orderBy: { order: 'asc' },
                include: {
                    days: {
                        orderBy: { order: 'asc' }
                    }
                }
            }
        }
    });

    if (!course) {
        return notFound();
    }

    const safeCourse = JSON.parse(JSON.stringify(course));

    return <AdminCourseEditorClient initialCourse={safeCourse} />;
}
