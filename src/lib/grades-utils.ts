import { isAfter, isBefore, addDays } from "date-fns";

export interface CourseGradeData {
    total: number;
    qAvg: number;
    lAvg: number;
    fAvg: number;
    pAvg: number;
    eAvg: number;
    subsCount: number;
    progressPct: number;
}

export function calculateCourseGrade(course: any, studentId: string, studentExceptions: any[] = []): CourseGradeData {
    let totalVideos = 0;
    let completedVideos = 0;
    let totalDeliverables = 0;
    let completedDeliverables = 0;

    const courseRubricCount = { LAB: 0, PROJECT: 0, QUIZ: 0, FORUM: 0, EXAM: 0 };
    const courseRubricEarned = { LAB: 0, PROJECT: 0, QUIZ: 0, FORUM: 0, EXAM: 0 };

    course.weeks.forEach((week: any) => {
        week.days.forEach((day: any) => {
            // Video Progress
            if (day.videoId) {
                totalVideos++;
                const activeProgress = day.videoProgresses?.find((p: any) => p.userId === studentId);
                if (activeProgress && (activeProgress.percent ?? 0) >= 90) {
                    completedVideos++;
                }
            }

            // Deliverables & Grades
            if (day.isDeliveryDay && day.assignmentType) {
                totalDeliverables++;
                const type = day.assignmentType as "LAB" | "PROJECT" | "QUIZ" | "FORUM" | "EXAM";
                const submission = day.submissions?.find((s: any) => s.userId === studentId);

                if (submission) {
                    completedDeliverables++;
                    if (submission.grade !== null) {
                        courseRubricEarned[type] += submission.grade;
                    }
                }
                courseRubricCount[type] += 1;
            }
        });
    });

    const calcRubricAvg = (earned: number, count: number) => count > 0 ? (earned / count) : 0;

    const lAvg = calcRubricAvg(courseRubricEarned.LAB, courseRubricCount.LAB);
    const pAvg = calcRubricAvg(courseRubricEarned.PROJECT, courseRubricCount.PROJECT);
    const qAvg = calcRubricAvg(courseRubricEarned.QUIZ, courseRubricCount.QUIZ);
    const fAvg = calcRubricAvg(courseRubricEarned.FORUM, courseRubricCount.FORUM);
    const eAvg = calcRubricAvg(courseRubricEarned.EXAM, courseRubricCount.EXAM);

    const totalGrade =
        (lAvg * ((course.weightLab ?? 30) / 100)) +
        (pAvg * ((course.weightProject ?? 40) / 100)) +
        (qAvg * ((course.weightQuiz ?? 20) / 100)) +
        (fAvg * ((course.weightForum ?? 10) / 100)) +
        (eAvg * ((course.weightExam ?? 0) / 100));

    const totalItems = totalVideos + totalDeliverables;
    const completedItems = completedVideos + completedDeliverables;
    const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
        total: Math.round(totalGrade),
        qAvg: Math.round(qAvg),
        lAvg: Math.round(lAvg),
        fAvg: Math.round(fAvg),
        pAvg: Math.round(pAvg),
        eAvg: Math.round(eAvg),
        subsCount: completedDeliverables,
        progressPct
    };
}

export function getUpcomingDeadlines(student: any, now: Date) {
    const IN_TWO_WEEKS = addDays(now, 14);
    const deadlines: any[] = [];

    student.enrollments.forEach((enrollment: any) => {
        const course = enrollment.course;
        course.weeks.forEach((week: any) => {
            week.days.forEach((day: any) => {
                if (day.isDeliveryDay && day.assignmentType) {
                    const submission = day.submissions?.find((s: any) => s.userId === student.id);
                    const exception = student.deadlineExceptions?.find((e: any) => e.dayId === day.id);
                    const activeDueDate = exception ? exception.newDueDate : day.dueDate;

                    if (activeDueDate && isAfter(new Date(activeDueDate), addDays(now, -1)) && isBefore(new Date(activeDueDate), IN_TWO_WEEKS)) {
                        deadlines.push({
                            id: day.id,
                            title: day.title,
                            courseId: course.id,
                            courseName: course.title,
                            dueDate: new Date(activeDueDate),
                            type: day.assignmentType,
                            isSubmitted: !!submission
                        });
                    }
                }
            });
        });
    });

    return deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
