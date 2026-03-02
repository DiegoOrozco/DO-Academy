"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

import bcrypt from "bcryptjs";

export async function registerStudent(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        redirect("/register?error=missing");
    }

    let success = false;
    try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "STUDENT"
            }
        });

        const cookieStore = await cookies();
        cookieStore.set("student_id", user.id, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        revalidatePath("/");
        success = true;
    } catch (error: any) {
        if (error.digest?.includes('NEXT_REDIRECT')) throw error;
        console.error("Registration error:", error);
        redirect("/register?error=exists");
    }

    if (success) {
        redirect("/");
    }
}

export async function loginStudent(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    let loginSuccess = false;
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user && user.role === "STUDENT") {
            // Verify the hashed password
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                const cookieStore = await cookies();
                cookieStore.set("student_id", user.id, {
                    httpOnly: true,
                    path: "/",
                    maxAge: 60 * 60 * 24 * 30,
                });
                revalidatePath("/");
                loginSuccess = true;
            } else {
                redirect("/login?error=incorrect");
            }
        } else {
            redirect("/login?error=incorrect");
        }
    } catch (error: any) {
        if (error.digest?.includes('NEXT_REDIRECT')) throw error;
        console.error("Login error:", error);
        redirect("/login?error=db");
    }

    if (loginSuccess) {
        redirect("/");
    }
}

export async function logoutStudent() {
    const cookieStore = await cookies();
    cookieStore.delete("student_id");
    redirect("/login");
}

export async function unlockCourse(courseId: string, formData: FormData) {
    const password = formData.get("password") as string;

    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;

    if (!studentId) {
        redirect("/login");
    }

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, password: true }
    });

    if (course && password === course.password) {
        // Create actual Enrollment in DB
        let enrollmentSuccess = false;
        try {
            await prisma.enrollment.upsert({
                where: {
                    userId_courseId: {
                        userId: studentId,
                        courseId: courseId
                    }
                },
                create: {
                    userId: studentId,
                    courseId: courseId
                },
                update: {} // Do nothing if already exists
            });

            // Keep legacy cookie for quick UI checks but DB is the source of truth now
            cookieStore.set(`course_access_${courseId}`, "true", {
                httpOnly: true,
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
            });
            revalidatePath(`/course/${courseId}`);
            revalidatePath("/");
            enrollmentSuccess = true;
        } catch (err: any) {
            if (err.digest?.includes('NEXT_REDIRECT')) throw err;
            console.error("Unlock error:", err);
            redirect(`/course/${courseId}/unlock?error=db`);
        }

        if (enrollmentSuccess) {
            redirect(`/course/${courseId}`);
        }
    } else {
        redirect(`/course/${courseId}/unlock?error=incorrect`);
    }
}

export async function loginAdmin(formData: FormData) {
    const password = formData.get("password") as string;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

    if (password === ADMIN_PASSWORD) {
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

export async function logoutAdmin() {
    const cookieStore = await cookies();
    // Remove admin session and send back to login page
    cookieStore.delete("admin_session");
    redirect("/admin/login");
}
