"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/auth-guards";
import { z } from "zod";
import crypto from "crypto";

const courseDataSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.string(),
    password: z.string().optional(),
    thumbnail: z.string().optional(),
    enableCopyPaste: z.boolean().optional().default(false),
    weightQuiz: z.union([z.number(), z.string()]).transform(v => parseInt(v.toString()) || 0),
    weightLab: z.union([z.number(), z.string()]).transform(v => parseInt(v.toString()) || 0),
    weightForum: z.union([z.number(), z.string()]).transform(v => parseInt(v.toString()) || 0),
    weightProject: z.union([z.number(), z.string()]).transform(v => parseInt(v.toString()) || 0),
    weightExam: z.union([z.number(), z.string()]).transform(v => parseInt(v.toString()) || 0),
    weeks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        isVisible: z.boolean().optional().default(true),
        days: z.array(z.object({
            id: z.string(),
            title: z.string(),
            videoId: z.string().nullable().optional(),
            materialUrl: z.string().nullable().optional(),
            isDeliveryDay: z.boolean().optional(),
            assignmentType: z.string().optional(),
            forumTopics: z.string().nullable().optional(),
            dueDate: z.string().nullable().optional(),
            availableFrom: z.string().nullable().optional(),
            assignmentUrl: z.string().nullable().optional(),
            gradingSeverity: z.number().optional(),
            isCodingExercise: z.boolean().optional(),
            exerciseDescription: z.string().nullable().optional(),
            testCases: z.any().optional(),
            expectedOutput: z.string().nullable().optional(),
            similarityThreshold: z.union([z.number(), z.string()]).transform(v => parseFloat(v.toString()) || 0.9).optional(),
            enablePlagiarism: z.boolean().optional(),
            codeTemplate: z.string().nullable().optional(),
            summaryUrl: z.string().nullable().optional(),
            isVisible: z.boolean().optional().default(true)
        }))
    }))
});

export async function saveCourseData(courseId: string, rawData: any) {
    try {
        await ensureAdmin();
        const data = courseDataSchema.parse(rawData);
        // 1. Update Core Course Settings
        await prisma.course.update({
            where: { id: courseId },
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
                password: data.password?.trim() || "",
                thumbnail: data.thumbnail,
                enableCopyPaste: !!data.enableCopyPaste,
                weightQuiz: data.weightQuiz ?? 20,
                weightLab: data.weightLab ?? 30,
                weightForum: data.weightForum ?? 10,
                weightProject: data.weightProject ?? 40,
                weightExam: data.weightExam ?? 0,
            } as any
        });

        // 2. We'll handle Weeks and Days manually to preserve IDs if possible
        // Get all existing weeks and days for this course to calculate what to delete
        const existingWeeks = await prisma.week.findMany({
            where: { courseId },
            select: { id: true }
        });

        const incomingWeekIds = data.weeks.map((w: any) => w.id);
        const weeksToDelete = existingWeeks.filter((w: any) => !incomingWeekIds.includes(w.id)).map((w: any) => w.id);

        // Delete removed weeks (Days and their relations will be handled below or by cascade)
        if (weeksToDelete.length > 0) {
            // Find all days belonging to these weeks to clean them up thoroughly
            const daysInDeletedWeeks = await prisma.day.findMany({
                where: { weekId: { in: weeksToDelete } },
                select: { id: true }
            });
            const daysInDeletedWeeksIds = daysInDeletedWeeks.map(d => d.id);

            if (daysInDeletedWeeksIds.length > 0) {
                await prisma.submission.deleteMany({ where: { dayId: { in: daysInDeletedWeeksIds } } });
                await prisma.videoProgress.deleteMany({ where: { dayId: { in: daysInDeletedWeeksIds } } });
                await prisma.reply.deleteMany({ where: { post: { dayId: { in: daysInDeletedWeeksIds } } } });
                await prisma.post.deleteMany({ where: { dayId: { in: daysInDeletedWeeksIds } } });
                await prisma.deadlineException.deleteMany({ where: { dayId: { in: daysInDeletedWeeksIds } } });
                await prisma.resource.deleteMany({ where: { dayId: { in: daysInDeletedWeeksIds } } });
            }

            await prisma.week.deleteMany({
                where: { id: { in: weeksToDelete } }
            });
        }

        // --- NEW: Global Day Deletion Protection ---
        // To allow moving days between weeks without deleting them, 
        // we find all days that are NOT in ANY of the incoming weeks.
        const allExistingDays = await prisma.day.findMany({
            where: { week: { courseId } },
            select: { id: true }
        });

        const allIncomingDayIds: string[] = [];
        data.weeks.forEach((w: any) => {
            w.days.forEach((d: any) => allIncomingDayIds.push(d.id));
        });

        const daysToDeleteGlobal = allExistingDays
            .filter((d: any) => !allIncomingDayIds.includes(d.id))
            .map((d: any) => d.id);

        if (daysToDeleteGlobal.length > 0) {
            // Explicitly delete ALL related records to ensure NO trace remains
            await prisma.submission.deleteMany({ where: { dayId: { in: daysToDeleteGlobal } } });
            await prisma.videoProgress.deleteMany({ where: { dayId: { in: daysToDeleteGlobal } } });
            await prisma.reply.deleteMany({ where: { post: { dayId: { in: daysToDeleteGlobal } } } });
            await prisma.post.deleteMany({ where: { dayId: { in: daysToDeleteGlobal } } });
            await prisma.deadlineException.deleteMany({ where: { dayId: { in: daysToDeleteGlobal } } });
            await prisma.resource.deleteMany({ where: { dayId: { in: daysToDeleteGlobal } } });

            await prisma.day.deleteMany({
                where: { id: { in: daysToDeleteGlobal } }
            });
        }

        // Upsert Weeks and Days using Parallel Promises
        const weekPromises = data.weeks.map(async (week: any, wIndex: number) => {
            const isNewWeek = week.id.startsWith("new-week");
            const finalWeekId = isNewWeek ? crypto.randomUUID() : week.id;

            const weekRecord = await prisma.week.upsert({
                where: { id: finalWeekId },
                update: {
                    title: week.title,
                    order: wIndex,
                    isVisible: week.isVisible
                },
                create: {
                    id: finalWeekId,
                    title: week.title,
                    order: wIndex,
                    isVisible: week.isVisible,
                    courseId: courseId
                }
            });

            // Handle Days for this week (Deletion already handled globally above)
            const dayPromises = week.days.map((day: any, dIndex: number) => {
                const isNewDay = day.id.startsWith("new-day");
                const finalDayId = isNewDay ? crypto.randomUUID() : day.id;

                return prisma.day.upsert({
                    where: { id: finalDayId },
                    update: {
                        title: day.title,
                        videoId: day.videoId || null,
                        materialUrl: day.materialUrl || null,
                        isDeliveryDay: !!day.isDeliveryDay,
                        assignmentType: day.assignmentType || "LAB",
                        forumTopics: day.forumTopics || null,
                        dueDate: day.dueDate ? new Date(day.dueDate) : null,
                        availableFrom: day.availableFrom ? new Date(day.availableFrom) : null,
                        assignmentUrl: day.assignmentUrl || null,
                        gradingSeverity: day.gradingSeverity || 1,
                        isCodingExercise: !!day.isCodingExercise,
                        exerciseDescription: day.exerciseDescription || null,
                        testCases: day.testCases || [],
                        expectedOutput: day.expectedOutput || null,
                        similarityThreshold: Number(day.similarityThreshold) || 0.9,
                        enablePlagiarism: !!day.enablePlagiarism,
                        codeTemplate: day.codeTemplate || null,
                        summaryUrl: day.summaryUrl || null,
                        isVisible: day.isVisible,
                        order: dIndex,
                        weekId: weekRecord.id // This handles moving the day to a different week!
                    } as any,
                    create: {
                        id: finalDayId,
                        title: day.title,
                        videoId: day.videoId || null,
                        materialUrl: day.materialUrl || null,
                        isDeliveryDay: !!day.isDeliveryDay,
                        assignmentType: day.assignmentType || "LAB",
                        forumTopics: day.forumTopics || null,
                        dueDate: day.dueDate ? new Date(day.dueDate) : null,
                        availableFrom: day.availableFrom ? new Date(day.availableFrom) : null,
                        assignmentUrl: day.assignmentUrl || null,
                        gradingSeverity: day.gradingSeverity || 1,
                        isCodingExercise: !!day.isCodingExercise,
                        exerciseDescription: day.exerciseDescription || null,
                        testCases: day.testCases || [],
                        expectedOutput: day.expectedOutput || null,
                        similarityThreshold: Number(day.similarityThreshold) || 0.9,
                        enablePlagiarism: !!day.enablePlagiarism,
                        codeTemplate: day.codeTemplate || null,
                        summaryUrl: day.summaryUrl || null,
                        isVisible: day.isVisible,
                        order: dIndex,
                        weekId: weekRecord.id
                    } as any
                });
            });

            await Promise.all(dayPromises);
        });

        await Promise.all(weekPromises);

        // Re-fetch the saved course to return to client for state sync
        const savedCourse = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                weeks: {
                    orderBy: { order: 'asc' },
                    include: {
                        days: { orderBy: { order: 'asc' } }
                    }
                }
            }
        });

        revalidatePath(`/admin/courses/${courseId}`);
        revalidatePath(`/admin/courses`);
        revalidatePath(`/course/${courseId}`);
        return { success: true, course: JSON.parse(JSON.stringify(savedCourse)) };

    } catch (error: any) {
        console.error("Save Course Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createEmptyCourse() {
    try {
        await ensureAdmin();
        const newCourse = await prisma.course.create({
            data: {
                id: crypto.randomUUID(),
                title: "Nuevo Curso",
                description: "Descripción breve de tu nuevo curso.",
                password: "",
                thumbnail: "/thumbnails/default.png",
                status: "draft"
            }
        });

        revalidatePath(`/admin/courses`);
        return { success: true, courseId: newCourse.id };
    } catch (error: any) {
        console.error("Create Course Error:", error);
        return { success: false, error: error.message };
    }
}
