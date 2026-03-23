import prisma from "@/lib/prisma";
import AdminGradesClient from "./AdminGradesClient";
import { calculateCourseGrade } from "@/lib/grades-utils";

export default async function AdminGradesPage() {
    // Fetch all students with their enrollments and submissions.
    // We embed submissions inside each day (as grades-utils expects) via a per-student relation.
    const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            enrollments: {
                include: {
                    course: {
                        include: {
                            weeks: {
                                include: {
                                    days: {
                                        include: {
                                            submissions: true,      // all submissions for this day
                                            videoProgresses: true   // needed by calculateCourseGrade
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { name: "asc" }
    });

    // Build a flat deliverable list for a student+course so the admin UI can show the detail panel.
    const buildDeliverables = (student: any, course: any) => {
        const allDeliverables: any[] = [];
        course.weeks.forEach((w: any) => {
            w.days
                .filter((d: any) => d.isDeliveryDay && d.assignmentType)
                .forEach((d: any) => {
                    const sub = d.submissions?.find((s: any) => s.userId === student.id);
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
                });
        });
        return allDeliverables;
    };

    // Flatten data for table view: 1 row per Student per Course
    const tableData = students.flatMap((student) =>
        student.enrollments.map((enr: any) => {
            // Use the shared utility so EXAM and all rubrics are counted correctly
            const gradeData = calculateCourseGrade(enr.course, student.id);
            const deliverables = buildDeliverables(student, enr.course);
            return {
                studentId: student.id,
                name: student.name,
                email: student.email,
                courseId: enr.course.id,
                courseTitle: enr.course.title,
                gradeData: {
                    ...gradeData,
                    weights: {
                        QUIZ: enr.course.weightQuiz,
                        LAB: enr.course.weightLab,
                        FORUM: enr.course.weightForum,
                        PROJECT: enr.course.weightProject,
                        EXAM: enr.course.weightExam ?? 0
                    }
                },
                status: enr.status,
                submissions: deliverables
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
