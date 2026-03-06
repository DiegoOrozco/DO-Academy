import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("\n🔍 --- PLAGIARISM INSPECTOR ---");

    // 1. Find the day "Día 3: Nuevo Tema"
    const targetDay = await prisma.day.findFirst({
        where: { title: { contains: "Día 3" } },
        include: {
            submissions: {
                include: {
                    user: { select: { name: true, email: true } }
                }
            }
        }
    });

    if (!targetDay) {
        console.log("❌ Target day 'Día 3' not found.");
        return;
    }

    console.log(`✅ Found Day: ${targetDay.title} (${targetDay.id})`);
    console.log(`📡 Plagiarism Enabled: ${targetDay.enablePlagiarism}`);
    console.log(`⚖️ Threshold: ${targetDay.similarityThreshold}`);
    console.log(`📥 Total Submissions: ${targetDay.submissions.length}`);

    if (targetDay.submissions.length < 2) {
        console.log("⚠️ Not enough submissions to compare.");
    }

    targetDay.submissions.forEach((s, i) => {
        console.log(`\nSubm #${i + 1} - Student: ${s.user.name} (${s.user.email})`);
        console.log(`📄 ID: ${s.id}`);
        console.log(`📋 Content Snippet: "${s.content?.substring(0, 100).replace(/\n/g, ' ')}..."`);
        console.log(`📏 Content Length: ${s.content?.length || 0}`);
    });

    // 2. Mock comparison
    if (targetDay.submissions.length >= 2) {
        console.log("\n🤖 --- MOCK COMPARISON (Threshold: " + (targetDay.similarityThreshold || 0.6) + ") ---");
        const stringSimilarity = require('string-similarity');
        const s1 = targetDay.submissions[0];
        const s2 = targetDay.submissions[1];

        if (s1.content && s2.content) {
            const similarity = stringSimilarity.compareTwoStrings(s1.content, s2.content);
            console.log(`Match Score [${s1.user.name} vs ${s2.user.name}]: ${(similarity * 100).toFixed(2)}%`);
            if (similarity >= (targetDay.similarityThreshold || 0.6)) {
                console.log("🚩 FLAG: Plagiarism Likely!");
            } else {
                console.log("✅ OK: Below threshold.");
            }
        }
    }
}

main()
    .catch(e => {
        console.error("❌ Error running inspector:", e);
    })
    .finally(() => prisma.$disconnect());
