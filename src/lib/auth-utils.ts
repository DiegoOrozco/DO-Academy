import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function getAuthUser() {
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;
    const adminSession = cookieStore.get("admin_session")?.value;

    if (adminSession === "valid") {
        return {
            id: "admin",
            name: "Administrador",
            role: "ADMIN",
            email: "admin@do-academy.com"
        };
    }

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

        if (!student) return null;
        return {
            ...student,
            role: "STUDENT"
        };
    } catch (error) {
        return null;
    }
}
