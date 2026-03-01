import prisma from "@/lib/prisma";
import CourseViewerClient from "./CourseViewerClient";
import { redirect } from "next/navigation";

export default async function CourseViewerPage({ params }: { params: { courseId: string } }) {
    const course = await prisma.course.findUnique({
        where: { id: params.courseId },
        include: {
            weeks: {
                orderBy: { order: 'asc' },
                include: {
                    days: {
                        orderBy: { order: 'asc' },
                    }
                }
            }
        }
    });

    if (!course) {
        return <div className="p-10 text-white text-center">Curso no encontrado en la base de datos local.</div>;
    }

    const safeCourse = JSON.parse(JSON.stringify(course));

    return <CourseViewerClient course={safeCourse} />;
}
