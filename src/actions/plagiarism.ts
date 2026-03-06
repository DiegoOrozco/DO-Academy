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

        const day = await prisma.day.findUnique({
            where: { id: dayId },
            select: { similarityThreshold: true }
        });

        const threshold = day?.similarityThreshold || 0.6;
        console.log(`[Plagiarism] Analyzing day ${dayId} with threshold ${threshold}`);

        if (submissions.length < 2) return { success: true, similarities: [] };

        const similarities: any[] = [];

        for (let i = 0; i < submissions.length; i++) {
            for (let j = i + 1; j < submissions.length; j++) {
                const codeA = submissions[i].content || "";
                const codeB = submissions[j].content || "";
                const sim = stringSimilarity.compareTwoStrings(codeA, codeB);

                console.log(`[Plagiarism] Comparing ${submissions[i].user?.email} vs ${submissions[j].user?.email}: similarity ${sim.toFixed(4)}`);

                if (sim >= threshold) {
                    similarities.push({
                        studentA: submissions[i].user?.name || submissions[i].user?.email,
                        studentB: submissions[j].user?.name || submissions[j].user?.email,
                        similarity: Math.round(sim * 100),
                        codeA,
                        codeB,
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
