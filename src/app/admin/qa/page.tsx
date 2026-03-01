import prisma from "@/lib/prisma";
import AdminQAInboxClient from "./AdminQAInboxClient";

export const dynamic = 'force-dynamic';

export default async function AdminQAInboxPage() {
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { name: true, role: true } },
            replies: { select: { id: true } },
            day: {
                select: {
                    title: true,
                    week: {
                        select: {
                            course: { select: { id: true, title: true } }
                        }
                    }
                }
            }
        }
    });

    const formattedQuestions = posts.map(post => ({
        id: post.id,
        studentName: post.user.name || "Estudiante",
        courseId: post.day.week.course.id,
        courseName: post.day.week.course.title,
        day: post.day.title,
        content: post.content,
        time: new Date(post.createdAt).toLocaleDateString(),
        status: post.replies.length > 0 ? "resolved" : "pending"
    }));

    return <AdminQAInboxClient initialQuestions={formattedQuestions} />;
}
