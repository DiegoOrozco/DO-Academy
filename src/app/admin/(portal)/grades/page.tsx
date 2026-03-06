import prisma from "@/lib/prisma";
import AdminGradesClient from "./AdminGradesClient";

export default async function AdminGradesPage() {
    // Fetch all students with their enrollments and submissions
    const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            enrollments: {
                include: { course: true }
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

        const calcAvg = (type: string) => {
            const typeSubs = courseSubs.filter((s: any) => s.day.assignmentType === type);
            if (typeSubs.length === 0) return 0;
            const sum = typeSubs.reduce((acc: number, s: any) => acc + (s.grade || 0), 0);
            return sum / typeSubs.length;
        };

        const qAvg = calcAvg("QUIZ");
        const lAvg = calcAvg("LAB");
        const fAvg = calcAvg("FORUM");
        const pAvg = calcAvg("PROJECT");

        const total =
            (qAvg * (course.weightQuiz / 100)) +
            (lAvg * (course.weightLab / 100)) +
            (fAvg * (course.weightForum / 100)) +
            (pAvg * (course.weightProject / 100));

        return {
            total: Math.round(total),
            qAvg: Math.round(qAvg),
            lAvg: Math.round(lAvg),
            fAvg: Math.round(fAvg),
            pAvg: Math.round(pAvg),
            subsCount: courseSubs.length,
            courseSubs: courseSubs.map((s: any) => ({
                id: s.id,
                grade: s.grade,
                feedback: s.feedback,
                createdAt: s.createdAt,
                assignmentType: s.day.assignmentType,
                title: s.day.title
            }))
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
