"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveCourseData(courseId: string, data: any) {
    try {
        // 1. Update Core Course Settings
        await prisma.course.update({
            where: { id: courseId },
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
                password: data.password,
                thumbnail: data.thumbnail,
                weightQuiz: parseInt(data.weightQuiz) || 20,
                weightLab: parseInt(data.weightLab) || 30,
                weightForum: parseInt(data.weightForum) || 10,
                weightProject: parseInt(data.weightProject) || 40,
            }
        });

        // 2. We'll handle Weeks and Days manually to preserve IDs if possible
        // Get all existing weeks and days for this course to calculate what to delete
        const existingWeeks = await prisma.week.findMany({
            where: { courseId },
            select: { id: true }
        });

        const incomingWeekIds = data.weeks.map((w: any) => w.id);
        const weeksToDelete = existingWeeks.filter((w: any) => !incomingWeekIds.includes(w.id)).map((w: any) => w.id);

        // Delete removed weeks (Days will cascade if schema has onDelete: Cascade)
        if (weeksToDelete.length > 0) {
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
                    order: wIndex
                },
                create: {
                    id: finalWeekId,
                    title: week.title,
                    order: wIndex,
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
                        assignmentUrl: day.assignmentUrl || null,
                        gradingSeverity: day.gradingSeverity || 1,
                        isCodingExercise: !!day.isCodingExercise,
                        exerciseDescription: day.exerciseDescription || null,
                        testCases: day.testCases || [],
                        expectedOutput: day.expectedOutput || null,
                        similarityThreshold: parseFloat(day.similarityThreshold) || 0.9,
                        enablePlagiarism: !!day.enablePlagiarism,
                        codeTemplate: day.codeTemplate || null,
                        summaryUrl: day.summaryUrl || null,
                        order: dIndex,
                        weekId: weekRecord.id // This handles moving the day to a different week!
                    },
                    create: {
                        id: finalDayId,
                        title: day.title,
                        videoId: day.videoId || null,
                        materialUrl: day.materialUrl || null,
                        isDeliveryDay: !!day.isDeliveryDay,
                        assignmentType: day.assignmentType || "LAB",
                        forumTopics: day.forumTopics || null,
                        dueDate: day.dueDate ? new Date(day.dueDate) : null,
                        assignmentUrl: day.assignmentUrl || null,
                        gradingSeverity: day.gradingSeverity || 1,
                        isCodingExercise: !!day.isCodingExercise,
                        exerciseDescription: day.exerciseDescription || null,
                        testCases: day.testCases || [],
                        expectedOutput: day.expectedOutput || null,
                        similarityThreshold: parseFloat(day.similarityThreshold) || 0.9,
                        enablePlagiarism: !!day.enablePlagiarism,
                        codeTemplate: day.codeTemplate || null,
                        summaryUrl: day.summaryUrl || null,
                        order: dIndex,
                        weekId: weekRecord.id
                    }
                });
            });

            await Promise.all(dayPromises);
        });

        await Promise.all(weekPromises);

        revalidatePath(`/admin/courses/${courseId}`);
        revalidatePath(`/admin/courses`);
        revalidatePath(`/course/${courseId}`);
        return { success: true };

    } catch (error: any) {
        console.error("Save Course Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createEmptyCourse() {
    try {
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
