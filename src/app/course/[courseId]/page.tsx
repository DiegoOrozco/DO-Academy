import prisma from "@/lib/prisma";
import CourseViewerClient from "./CourseViewerClient";
import { redirect } from "next/navigation";
import { getStudent } from "@/lib/student-auth";

export const dynamic = 'force-dynamic';

export default async function CourseViewerPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params;
    const student = await getStudent();

    if (!student) {
        redirect("/login");
    }

    const isAdmin = student.role === "ADMIN";
    const hasAccess = isAdmin || student.enrollments.some((e: any) => e.courseId === courseId && e.status === "ACTIVE");

    if (!hasAccess) {
        redirect(`/course/${courseId}/unlock`);
    }

    const studentId = student.id;

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
                            },
                            submissions: {
                                where: { userId: studentId },
                                orderBy: { createdAt: 'desc' },
                                take: 1
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
