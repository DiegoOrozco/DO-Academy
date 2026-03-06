"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { ensureAdmin } from "@/lib/auth-guards";

export async function resetStudentPassword(userId: string, newPassword: string) {
    await ensureAdmin();
    if (!userId || !newPassword) return { error: "Datos faltantes" };

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    revalidatePath(`/admin/students/${userId}`);
    return { success: true };
}

export async function toggleEnrollmentStatus(enrollmentId: string, status: string) {
    await ensureAdmin();
    await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status }
    });
    revalidatePath("/admin/students");
    return { success: true };
}

export async function unenrollStudent(enrollmentId: string) {
    await ensureAdmin();
    await prisma.enrollment.delete({
        where: { id: enrollmentId }
    });
    revalidatePath("/admin/students");
    return { success: true };
}

export async function verifyStudentManual(userId: string) {
    await ensureAdmin();
    await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true, verificationToken: null }
    });
    revalidatePath(`/admin/students/${userId}`);
    revalidatePath("/admin/students");
    return { success: true };
}
