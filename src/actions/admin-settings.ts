"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "@/lib/auth-guards";

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
