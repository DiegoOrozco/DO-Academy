import prisma from "@/lib/prisma";
import AdminCourseEditorClient from "./AdminCourseEditorClient";
import { notFound } from "next/navigation";

export default async function CourseEditorPage({ params }: { params: { courseId: string } }) {
    const course = await prisma.course.findUnique({
        where: { id: params.courseId },
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

    return <AdminCourseEditorClient initialCourse={course} />;
}
