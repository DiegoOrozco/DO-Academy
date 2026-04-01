"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/auth-guards";
import { generateTechNewsAI } from "@/lib/gemini";

export async function updateSiteConfig(key: string, value: any) {
    try {
        await ensureAdmin();
        await prisma.siteConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });

        revalidatePath("/");
        revalidatePath("/about");
        revalidatePath("/admin/settings");

        return { success: true };
    } catch (error: any) {
        console.error("Update Site Config Error:", error);
        return { success: false, error: error.message };
    }
}

export async function refreshTechNewsAI() {
    try {
        await ensureAdmin();
        const news = await generateTechNewsAI();
        if (!news || news.length === 0) throw new Error("No news generated");

        const currentHome = await prisma.siteConfig.findUnique({ where: { key: "home" } });
        const homeValue = (currentHome?.value as any) || {};
        
        await prisma.siteConfig.upsert({
            where: { key: "home" },
            update: { value: { ...homeValue, news } },
            create: { key: "home", value: { news } }
        });

        revalidatePath("/");
        revalidatePath("/admin/settings");
        return { success: true, news };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
