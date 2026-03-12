import prisma from "@/lib/prisma";
import AdminGradesClient from "./AdminGradesClient";

export default async function AdminGradesPage() {
    // Fetch all students with their enrollments and submissions
    const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            enrollments: {
                include: {
                    course: {
                        include: {
                            weeks: {
                                include: { days: true }
                            }
                        }
                    }
                }
            },
            submissions: {
                include: {
                    day: {
                        include: { week: true }
                    }
                }
            }
        },
        orderBy: { name: "asc" }
    });

    // Helper to calculate student's grade in a specific course
    const calculateGrade = (student: any, course: any) => {
        const courseSubs = student.submissions.filter((s: any) => s.day.week.courseId === course.id);

        const allDeliverables: any[] = [];
        let qEarned = 0, qCount = 0;
        let lEarned = 0, lCount = 0;
        let fEarned = 0, fCount = 0;
        let pEarned = 0, pCount = 0;

        course.weeks.forEach((w: any) => {
            w.days.filter((d: any) => d.isDeliveryDay && d.assignmentType).forEach((d: any) => {
                const sub = courseSubs.find((s: any) => s.dayId === d.id);
                const grade = sub?.grade || 0;

                allDeliverables.push({
                    id: sub?.id || `no-sub-${d.id}`,
                    dayId: d.id,
                    grade: sub?.grade !== null && sub?.grade !== undefined ? sub.grade : null,
                    feedback: sub?.feedback,
                    createdAt: sub?.createdAt || null,
                    assignmentType: d.assignmentType,
                    title: d.title,
                    content: sub?.content || null,
                    fileName: sub?.fileName || null
                });

                if (sub?.grade !== null && sub?.grade !== undefined) {
                    if (d.assignmentType === "QUIZ") { qEarned += grade; qCount++; }
                    if (d.assignmentType === "LAB") { lEarned += grade; lCount++; }
                    if (d.assignmentType === "FORUM") { fEarned += grade; fCount++; }
                    if (d.assignmentType === "PROJECT") { pEarned += grade; pCount++; }
                }
            });
        });

        const qAvg = qCount > 0 ? (qEarned / qCount) : null;
        const lAvg = lCount > 0 ? (lEarned / lCount) : null;
        const fAvg = fCount > 0 ? (fEarned / fCount) : null;
        const pAvg = pCount > 0 ? (pEarned / pCount) : null;

        let earnedScore = 0;
        let possibleWeight = 0;

        if (qAvg !== null) { earnedScore += qAvg * (course.weightQuiz / 100); possibleWeight += (course.weightQuiz / 100); }
        if (lAvg !== null) { earnedScore += lAvg * (course.weightLab / 100); possibleWeight += (course.weightLab / 100); }
        if (fAvg !== null) { earnedScore += fAvg * (course.weightForum / 100); possibleWeight += (course.weightForum / 100); }
        if (pAvg !== null) { earnedScore += pAvg * (course.weightProject / 100); possibleWeight += (course.weightProject / 100); }

        const total = earnedScore;

        return {
            total: Math.round(total),
            qAvg: qAvg !== null ? Math.round(qAvg) : 0,
            lAvg: lAvg !== null ? Math.round(lAvg) : 0,
            fAvg: fAvg !== null ? Math.round(fAvg) : 0,
            pAvg: pAvg !== null ? Math.round(pAvg) : 0,
            subsCount: courseSubs.length,
            courseSubs: allDeliverables
        };
    };

    // Flatten data for table view: 1 row per Student per Course
    const tableData = students.flatMap((student) =>
        student.enrollments.map((enr: any) => {
            const gradeData = calculateGrade(student, enr.course);
            return {
                studentId: student.id,
                name: student.name,
                email: student.email,
                courseId: enr.course.id,
                courseTitle: enr.course.title,
                gradeData: gradeData,
                status: enr.status,
                submissions: gradeData.courseSubs
            }
        })
    );

    const totalStudents = students.length;
    const avgScore = tableData.length > 0
        ? tableData.reduce((acc, row) => acc + row.gradeData.total, 0) / tableData.length
        : 0;
    const passRate = tableData.length > 0
        ? (tableData.filter(row => row.gradeData.total >= 70).length / tableData.length) * 100
        : 0;

    return (
        <AdminGradesClient
            tableData={tableData}
            totalStudents={totalStudents}
            avgScore={avgScore}
            passRate={passRate}
        />
    );
}
