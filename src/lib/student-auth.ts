import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifySession } from "./session";

export async function getStudent() {
    const cookieStore = await cookies();
    const studentSession = cookieStore.get("student_id")?.value;
    const studentId = verifySession(studentSession);

    if (!studentId) return null;

    try {
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                enrollments: {
                    select: { courseId: true, status: true }
                }
            }
        });

        if (!student) return null;
        // Defensive check: ensure enrollments is an array
        if (!student.enrollments) (student as any).enrollments = [];
        return student;
    } catch (error) {
        return null;
    }
}
