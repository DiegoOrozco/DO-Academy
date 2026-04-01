import { NextResponse } from "next/server";
import { generateTechNewsAI } from "@/lib/gemini";
import { updateSiteConfig, getSiteConfig } from "@/lib/config";
import prisma from "@/lib/prisma";

// Esta ruta será llamada por un CRON JOB externo (ej: Vercel Cron, GitHub Actions, o un simple fetch)
// Para Vercel, añadiría en vercel.json: 
// { "crons": [{ "path": "/api/cron/news", "schedule": "0 12 * * *" }] } (12 UTC = aprox 6-7 AM en LATAM)

export async function GET(request: Request) {
    // Protección opcional por Token o Header de Vercel
    const authHeader = request.headers.get('authorization');
    
    try {
        console.log("CRON: Generando noticias tecnológicas automáticas...");
        const news = await generateTechNewsAI();

        if (news && news.length > 0) {
            // Obtener config actual de home
            const currentHome = await getSiteConfig("home") || {};
            
            // Actualizar solo las noticias
            const updatedHome = {
                ...currentHome,
                news: news
            };

            // Guardar en DB (usamos prisma directamente para saltar validaciones de sesión si es necesario)
            await prisma.siteConfig.upsert({
                where: { key: "home" },
                update: { value: updatedHome },
                create: { key: "home", value: updatedHome }
            });

            console.log("CRON: Noticias actualizadas con éxito.");
            return NextResponse.json({ success: true, count: news.length });
        }

        return NextResponse.json({ success: false, error: "No se generaron noticias" }, { status: 500 });
    } catch (error: any) {
        console.error("CRON ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
