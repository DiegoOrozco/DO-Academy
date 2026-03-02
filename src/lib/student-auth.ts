import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function getStudent() {
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;

    if (!studentId) return null;

    try {
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                enrollments: {
                    select: { courseId: true }
                }
            }
        });

        if (!student || student.role !== "STUDENT") return null;
        return student;
    } catch (error) {
        return null;
    }
}
