"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureAdmin, ensureStudent } from "@/lib/auth-guards";

export async function createPost(dayId: string, content: string, courseId: string) {
    try {
        const student = await ensureStudent();

        await prisma.post.create({
            data: {
                content,
                dayId,
                userId: student.id
            }
        });

        revalidatePath(`/course/${courseId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Create Post Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createReply(postId: string, content: string) {
    try {
        const cookieStore = await (await import("next/headers")).cookies();
        const adminSession = cookieStore.get("admin_session")?.value;
        const isAdmin = (await import("@/lib/session")).verifySession(adminSession) === "valid";

        let actualUserId: string;

        if (isAdmin) {
            const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (!adminUser) return { success: false, error: "No Admin User found" };
            actualUserId = adminUser.id;
        } else {
            const student = await ensureStudent();
            actualUserId = student.id;
        }

        const reply = await prisma.reply.create({
            data: {
                content,
                postId,
                userId: actualUserId
            },
            include: {
                post: {
                    include: {
                        day: {
                            include: {
                                week: {
                                    select: { courseId: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const courseId = reply.post.day.week.courseId;

        // Revalidate admin and the specific course for the student
        revalidatePath(`/admin/qa`);
        if (courseId) {
            revalidatePath(`/course/${courseId}`);
        }
        revalidatePath("/");

        return { success: true };
    } catch (error: any) {
        console.error("Create Reply Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deletePost(postId: string) {
    try {
        await ensureAdmin();
        await prisma.post.delete({
            where: { id: postId }
        });
        revalidatePath("/");
        revalidatePath("/admin/qa");
        return { success: true };
    } catch (error: any) {
        console.error("Delete Post Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteReply(replyId: string) {
    try {
        await ensureAdmin();
        await prisma.reply.delete({
            where: { id: replyId }
        });
        revalidatePath("/");
        revalidatePath("/admin/qa");
        return { success: true };
    } catch (error: any) {
        console.error("Delete Reply Error:", error);
        return { success: false, error: error.message };
    }
}
