"use server";

import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function getCoursesAndDays() {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

    const courses = await prisma.course.findMany({
        include: {
            weeks: {
                include: {
                    days: {
                        where: { isDeliveryDay: true }
                    }
                }
            }
        }
    });

    return courses;
}

export async function searchStudents(query: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

    if (!query) return [];

    const students = await prisma.user.findMany({
        where: {
            role: "STUDENT",
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } }
            ]
        },
        take: 10,
        select: { id: true, name: true, email: true }
    });

    return students;
}

export async function getExceptions() {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

    const exceptions = await prisma.deadlineException.findMany({
        include: {
            user: { select: { name: true, email: true } },
            day: {
                include: {
                    week: {
                        include: {
                            course: { select: { title: true } }
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return exceptions;
}

export async function saveException(data: { userId: string; dayId: string; newDueDate: Date }) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

    try {
        const result = await prisma.deadlineException.upsert({
            where: {
                userId_dayId: {
                    userId: data.userId,
                    dayId: data.dayId
                }
            },
            update: {
                newDueDate: data.newDueDate
            },
            create: {
                userId: data.userId,
                dayId: data.dayId,
                newDueDate: data.newDueDate
            }
        });

        revalidatePath("/admin/exceptions");
        return { success: true, exception: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteException(id: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

    try {
        await prisma.deadlineException.delete({
            where: { id }
        });
        revalidatePath("/admin/exceptions");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
