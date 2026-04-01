import prisma from "@/lib/prisma";
import DaySubmissionsClient from "./DaySubmissionsClient";
import { notFound } from "next/navigation";

export default async function DaySubmissionsPage({
    params
}: {
    params: Promise<{ courseId: string; dayId: string }>
}) {
    const { courseId, dayId } = await params;

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
    });

    const day = await prisma.day.findUnique({
        where: { id: dayId },
        select: { title: true }
    });

    if (!course || !day) return notFound();

    // Get all students enrolled in this course
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

    // Fetch course groups to check for group submissions
    const groups = await (prisma as any).group.findMany({
        where: { courseId },
        include: { members: { select: { id: true } } }
    });

    // Get all submissions for this day
    const allSubmissions = await prisma.submission.findMany({
        where: { dayId }
    });

    // Merge data
    const tableData = enrollments.map(e => {
        // Find individual submission
        let sub = (allSubmissions as any[]).find(s => s.userId === e.user.id);
        
        // If not found, check if their group submitted anything
        if (!sub) {
            const userGroup = (groups as any[]).find(g => g.members.some((m: any) => m.id === e.user.id));
            if (userGroup) {
                sub = (allSubmissions as any[]).find(s => s.groupId === userGroup.id);
            }
        }

        return {
            studentId: e.user.id,
            studentName: e.user.name || e.user.email,
            submissionId: sub?.id || null,
            content: sub?.content || null,
            fileName: sub?.fileName || null,
            status: sub?.status || "NO_SUBMISSION",
            grade: sub?.grade,
            feedback: sub?.feedback,
            createdAt: sub?.createdAt || null
        };
    });

    return (
        <div className="p-6 md:p-10">
            <DaySubmissionsClient
                courseId={courseId}
                dayId={dayId}
                courseTitle={course.title}
                dayTitle={day.title}
                initialData={tableData}
            />
        </div>
    );
}
