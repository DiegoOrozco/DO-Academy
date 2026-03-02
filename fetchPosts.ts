import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
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

        console.log(posts.length);
        const formattedQuestions = posts.map(post => ({
            id: post.id,
            studentName: post.user?.name || "Estudiante",
            courseId: post.day?.week?.course?.id,
            courseName: post.day?.week?.course?.title,
            day: post.day?.title,
            content: post.content,
            time: new Date(post.createdAt).toLocaleDateString(),
            status: post.replies.length > 0 ? "resolved" : "pending"
        }));

        console.log("Success! Formatted questions:", formattedQuestions.slice(0, 1));
    } catch (err) {
        console.error("Error:", err);
    }
}
main();
