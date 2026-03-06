import prisma from "@/lib/prisma";
import stringSimilarity from "string-similarity";
import { ensureAdmin } from "@/lib/auth-guards";

export async function detectPlagiarism(dayId: string) {
    try {
        await ensureAdmin();
        const submissions = await prisma.submission.findMany({
            where: { dayId },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        if (submissions.length < 2) return { success: true, similarities: [] };

        const similarities: any[] = [];

        for (let i = 0; i < submissions.length; i++) {
            for (let j = i + 1; j < submissions.length; j++) {
                const sim = stringSimilarity.compareTwoStrings(
                    submissions[i].content || "",
                    submissions[j].content || ""
                );

                if (sim > 0.6) { // Only show significant similarities
                    similarities.push({
                        studentA: submissions[i].user?.name || submissions[i].user?.email,
                        studentB: submissions[j].user?.name || submissions[j].user?.email,
                        similarity: Math.round(sim * 100),
                        codeA: submissions[i].content,
                        codeB: submissions[j].content,
                    });
                }
            }
        }

        // Sort by highest similarity
        similarities.sort((a, b) => b.similarity - a.similarity);

        return { success: true, similarities };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
