"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPost(dayId: string, userId: string, content: string, courseId: string) {
    try {
        await prisma.post.create({
            data: {
                content,
                dayId,
                userId
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
        // Teacher reply using hardcoded admin user for now or find admin
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

        if (!adminUser) return { success: false, error: "No Admin User found" };

        const reply = await prisma.reply.create({
            data: {
                content,
                postId,
                userId: adminUser.id
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
