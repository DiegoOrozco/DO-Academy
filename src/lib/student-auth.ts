import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifySession } from "./session";

export async function getStudent() {
    const cookieStore = await cookies();
    const studentSession = cookieStore.get("student_id")?.value;
    const studentId = verifySession(studentSession);
    const adminSession = cookieStore.get("admin_session")?.value;
    const isAdmin = verifySession(adminSession) === "valid";

    if (!studentId && !isAdmin) return null;

    if (isAdmin && !studentId) {
        // Return a mock student for admin preview
        return {
            id: "admin-preview",
            name: "Administrador (Vista Previa)",
            email: "admin@do-academy.com",
            role: "ADMIN",
            enrollments: [], // Admins have bypass logic in CourseViewerPage
            emailVerified: true
        } as any;
    }

    if (!studentId) return null;

    try {
        const student = await prisma.user.findUnique({
            where: { id: studentId as string },
            include: {
                enrollments: {
                    select: { courseId: true, status: true }
                }
            }
        });

        if (!student) return null;
        // Defensive check: ensure enrollments is an array
        const studentWithEnrollments = student as any;
        if (!studentWithEnrollments.enrollments) studentWithEnrollments.enrollments = [];
        return studentWithEnrollments;
    } catch (error) {
        return null;
    }
}
