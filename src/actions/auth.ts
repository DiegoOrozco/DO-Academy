"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Mock passwords for courses
const COURSE_PASSWORDS: Record<string, string> = {
    "01": "doacademy",
    "02": "doacademy",
    "03": "doacademy",
    "04": "doacademy",
    "05": "doacademy",
    "06": "doacademy",
};

export async function unlockCourse(courseId: string, formData: FormData) {
    const password = formData.get("password") as string;
    const alias = formData.get("alias") as string;

    if (password === COURSE_PASSWORDS[courseId]) {
        const cookieStore = await cookies();
        cookieStore.set(`course_access_${courseId}`, "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        if (alias) {
            cookieStore.set("student_alias", alias, {
                httpOnly: true,
                path: "/",
            });
        }

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
