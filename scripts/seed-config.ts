import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding site configuration...");

    // Home Config
    await prisma.siteConfig.upsert({
        where: { key: "home" },
        update: {},
        create: {
            key: "home",
            value: {
                heroTitle: "Domina la Tecnología con DO Academy",
                heroSubtitle: "Accede a contenido exclusivo diseñado por expertos para llevar tus habilidades al siguiente nivel profesional.",
                heroButtonText: "Empezar Ahora",
                heroButtonLink: "/register"
            }
        }
    });

    // About Config
    await prisma.siteConfig.upsert({
        where: { key: "about" },
        update: {},
        create: {
            key: "about",
            value: {
                name: "Diego Orozco",
                title: "Creador de Experiencias Digitales & Mentor Tech",
                bioParagraphs: [
                    "Apasionado por la educación y el desarrollo de software. He dedicado los últimos años a construir plataformas que ayudan a miles de estudiantes a dominar nuevas tecnologías.",
                    "En DO Academy, mi misión es democratizar el acceso al conocimiento técnico de alta calidad, creando no solo cursos, sino experiencias de aprendizaje que transformen carreras.",
                    "Creo firmemente que la tecnología es la herramienta más poderosa para el cambio social y personal. Mi enfoque combina el rigor técnico con una pedagogía moderna y accesible."
                ],
                stats: [
                    { label: "Años Exp.", value: "8+" },
                    { label: "Cursos", value: "12" },
                    { label: "Estudiantes", value: "5k+" },
                    { label: "Cafés/Día", value: "3" }
                ],
                socialLinks: [
                    { platform: "GitHub", url: "#" },
                    { platform: "LinkedIn", url: "#" },
                    { platform: "Twitter", url: "#" },
                    { platform: "Instagram", url: "#" }
                ],
                contactEmail: "diego@doacademy.com",
                contactWhatsapp: "#"
            }
        }
    });

    console.log("Seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
