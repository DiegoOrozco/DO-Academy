import prisma from "@/lib/prisma";
import CourseViewerClient from "./CourseViewerClient";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function CourseViewerPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value || "student_01"; // Fallback to our dummy seed student

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            weeks: {
                orderBy: { order: 'asc' },
                include: {
                    days: {
                        orderBy: { order: 'asc' },
                        include: {
                            posts: {
                                orderBy: { createdAt: 'desc' },
                                include: {
                                    user: { select: { name: true, role: true } },
                                    replies: {
                                        orderBy: { createdAt: 'asc' },
                                        include: { user: { select: { name: true, role: true } } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!course) {
        return <div className="p-10 text-white text-center">Curso no encontrado en la base de datos local.</div>;
    }

    const safeCourse = JSON.parse(JSON.stringify(course));

    return <CourseViewerClient course={safeCourse} studentId={studentId} />;
}
