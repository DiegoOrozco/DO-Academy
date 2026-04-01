"use server";

import prisma from "@/lib/prisma";
import { ensureAdmin } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";

export async function createGroupAction(courseId: string, name: string) {
    try {
        await ensureAdmin();
        const group = await prisma.group.create({
            data: {
                name,
                courseId
            }
        });
        revalidatePath(`/admin/courses/${courseId}`);
        return { success: true, group };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteGroupAction(groupId: string, courseId: string) {
    try {
        await ensureAdmin();
        await prisma.group.delete({
            where: { id: groupId }
        });
        revalidatePath(`/admin/courses/${courseId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateGroupMembersAction(groupId: string, userIds: string[], courseId: string) {
    try {
        await ensureAdmin();
        await prisma.group.update({
            where: { id: groupId },
            data: {
                members: {
                    set: userIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath(`/admin/courses/${courseId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCourseGroupsAction(courseId: string) {
    try {
        await ensureAdmin();
        const groups = await prisma.group.findMany({
            where: { courseId },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        return { success: true, groups };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCourseStudentsAction(courseId: string) {
    try {
        await ensureAdmin();
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        return { success: true, students: enrollments.map(e => e.user) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
