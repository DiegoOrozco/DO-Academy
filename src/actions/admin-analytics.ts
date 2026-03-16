"use server";

import prisma from "@/lib/prisma";
import { ensureAdmin } from "@/lib/auth-guards";

export async function getCourseAnalyticsData(courseId: string) {
    try {
        await ensureAdmin();

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                weeks: {
                    orderBy: { order: "asc" },
                    include: {
                        days: {
                            where: { isDeliveryDay: true },
                            orderBy: { order: "asc" },
                            include: {
                                submissions: {
                                    select: {
                                        grade: true,
                                        status: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!course) throw new Error("Curso no encontrado");

        // 1. Process Delivery Performance (Day by Day)
        const deliveryPerformance = course.weeks.flatMap((week) =>
            week.days.map((day) => {
                const gradedSubmissions = day.submissions.filter(
                    (s) => s.grade !== null && s.status === "GRADED"
                );
                const averageGrade =
                    gradedSubmissions.length > 0
                        ? gradedSubmissions.reduce((acc, s) => acc + (s.grade || 0), 0) /
                          gradedSubmissions.length
                        : 0;

                return {
                    name: day.title,
                    fullName: `${week.title} - ${day.title}`,
                    average: Math.round(averageGrade * 10) / 10,
                    submissions: day.submissions.length,
                    graded: gradedSubmissions.length,
                    type: day.assignmentType,
                };
            })
        );

        // 2. Process Category Performance
        const categories = ["QUIZ", "LAB", "FORUM", "PROJECT"];
        const categoryWeights = {
            QUIZ: course.weightQuiz,
            LAB: course.weightLab,
            FORUM: course.weightForum,
            PROJECT: course.weightProject,
        };

        const categoryStats = categories
            .filter((cat) => (categoryWeights as any)[cat] > 0)
            .map((cat) => {
                const catDeliveries = deliveryPerformance.filter((d) => d.type === cat);
                const average =
                    catDeliveries.length > 0
                        ? catDeliveries.reduce((acc, d) => acc + d.average, 0) /
                          catDeliveries.length
                        : 0;

                return {
                    category: cat,
                    label: getCategoryLabel(cat),
                    average: Math.round(average * 10) / 10,
                    weight: (categoryWeights as any)[cat],
                    count: catDeliveries.length,
                };
            });

        // 3. Overall Stats
        const totalGradedDays = deliveryPerformance.filter((d) => d.graded > 0).length;
        const overallAverage =
            totalGradedDays > 0
                ? deliveryPerformance.reduce((acc, d) => acc + d.average, 0) /
                  deliveryPerformance.length
                : 0;

        return {
            success: true,
            data: {
                courseTitle: course.title,
                overallAverage: Math.round(overallAverage * 10) / 10,
                totalStudents: await prisma.enrollment.count({ where: { courseId } }),
                deliveryPerformance,
                categoryStats,
            },
        };
    } catch (error: any) {
        console.error("Analytics Error:", error);
        return { success: false, error: error.message };
    }
}

function getCategoryLabel(type: string) {
    switch (type) {
        case "QUIZ":
            return "Quices";
        case "LAB":
            return "Laboratorios";
        case "FORUM":
            return "Foros";
        case "PROJECT":
            return "Proyectos";
        default:
            return type;
    }
}
