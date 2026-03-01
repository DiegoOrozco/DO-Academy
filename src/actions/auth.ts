"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";

export async function unlockCourse(courseId: string, formData: FormData) {
    const password = formData.get("password") as string;
    const alias = formData.get("alias") as string;

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { password: true }
    });

    if (course && password === course.password) {
        const cookieStore = await cookies();
        cookieStore.set(`course_access_${courseId}`, "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        // Generate a valid User record in Prisma for the Q&A Forum
        const finalAlias = alias || "Estudiante Anónimo";
        const safeEmail = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}@doacademy.com`;

        const user = await prisma.user.create({
            data: {
                name: finalAlias,
                email: safeEmail,
                password: "guest",
                role: "STUDENT"
            }
        });

        cookieStore.set("student_id", user.id, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        redirect(`/course/${courseId}`);
    } else {
        redirect(`/course/${courseId}/unlock?error=incorrect`);
    }
}

export async function loginAdmin(formData: FormData) {
    const password = formData.get("password") as string;

    if (password === "admin123") {
        const cookieStore = await cookies();
        cookieStore.set("admin_session", "valid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        redirect("/admin");
    } else {
        redirect("/admin/login?error=incorrect");
    }
}
