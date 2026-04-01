"use server";

import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import prisma from "@/lib/prisma";

/**
 * Guard to ensure a user is an admin
 * Throws an error or returns null if not authorized
 */
export async function ensureAdmin() {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const verifiedValue = verifySession(adminSession);

    // 1. Check for explicit admin session (shared password)
    if (verifiedValue === "valid") {
        return true;
    }

    // 2. Fallback: Check if user is logged in as a student but has ADMIN role in DB
    const studentSession = cookieStore.get("student_id")?.value;
    const studentId = verifySession(studentSession);

    if (studentId) {
        const user = await prisma.user.findUnique({
            where: { id: studentId },
            select: { role: true }
        });

        if (user?.role === "ADMIN") {
            return true;
        }
    }

    console.error("[AUTH DEBUG] Admin check failed. Session value:", adminSession ? "exists" : "missing", "Verified value:", verifiedValue);
    throw new Error("Unauthorized: Admin access required");
}

/**
 * Guard to ensure a user is a student
 * Returns the student object or throws if not authorized
 */
export async function ensureStudent() {
    const cookieStore = await cookies();
    const studentSession = cookieStore.get("student_id")?.value;
    const studentId = verifySession(studentSession);

    if (!studentId) {
        throw new Error("Unauthorized: Student access required");
    }

    const student = await prisma.user.findUnique({
        where: { id: studentId }
    });

    if (!student || student.role !== "STUDENT") {
        throw new Error("Unauthorized: User not found or invalid role");
    }

    return student;
}

/**
 * Optional guard to check if a student belongs to a specific course
 */
export async function ensureEnrollment(courseId: string) {
    const student = await ensureStudent();

    const enrollment = await prisma.enrollment.findUnique({
        where: {
            userId_courseId: {
                userId: student.id,
                courseId: courseId
            }
        }
    });

    if (!enrollment) {
        throw new Error("Unauthorized: Not enrolled in this course");
    }

    return { student, enrollment };
}
