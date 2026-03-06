import prisma from '../src/lib/prisma';
import stringSimilarity from 'string-similarity';

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
        console.log(`📋 Content: "${s.content?.substring(0, 500).replace(/\n/g, ' ')}..."`);
        console.log(`📏 Content Length: ${s.content?.length || 0}`);
    });

    // 2. Mock comparison
    if (targetDay.submissions.length >= 2) {
        console.log("\n🤖 --- MOCK COMPARISON (Threshold: " + (targetDay.similarityThreshold || 0.6) + ") ---");
        for (let i = 0; i < targetDay.submissions.length; i++) {
            for (let j = i + 1; j < targetDay.submissions.length; j++) {
                const s1 = targetDay.submissions[i];
                const s2 = targetDay.submissions[j];

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
    }
}

main()
    .catch(e => {
        console.error("❌ Error running inspector:", e);
    })
    .finally(() => prisma.$disconnect());
