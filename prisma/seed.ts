import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const COURSES = [
    {
        id: "01",
        title: "01 - Fundamentos de programación",
        description: "Aprende las bases de la lógica de programación y la sintaxis fundamental para cualquier lenguaje.",
        thumbnail: "/thumbnails/01.png",
        status: "published",
        password: "doacademy",
        weeks: [
            {
                id: "w1_01",
                title: "Semana 1: Lo Básico",
                order: 1,
                days: [
                    {
                        id: "d1_01",
                        title: "Día 1: ¿Qué es programar?",
                        order: 1,
                        videoId: "dQw4w9WgXcQ",
                        materialUrl: "https://github.com/DiegoOrozco",
                    }
                ]
            }
        ]
    },
    {
        id: "02",
        title: "02 - Programación Orientada a Objetos",
        description: "Domina el paradigma orientado a objetos creando clases, herencia y polimorfismo.",
        thumbnail: "/thumbnails/02.png",
        status: "published",
        password: "doacademy",
        weeks: []
    },
    {
        id: "03",
        title: "03 - Bases de datos",
        description: "Entiende el modelado y estructuración de datos utilizando tecnologías relacionales avanzadas.",
        thumbnail: "/thumbnails/03.png",
        status: "published",
        password: "doacademy",
        weeks: []
    },
    {
        id: "04",
        title: "04 - Programación Avanzada",
        description: "Algoritmos complejos, estructuras de datos avanzadas y patrones de diseño empresariales.",
        thumbnail: "/thumbnails/04.png",
        status: "draft",
        password: "doacademy",
        weeks: []
    },
    {
        id: "05",
        title: "05 - Desarrollo Seguro",
        description: "Protege tus aplicaciones implementando principios sólidos de ciberseguridad.",
        thumbnail: "/thumbnails/05.png",
        status: "draft",
        password: "doacademy",
        weeks: []
    },
    {
        id: "06",
        title: "06 - Desarrollo asistido por IA",
        description: "Multiplica tu productividad interactuando eficientemente con Inteligencia Artificial.",
        thumbnail: "/thumbnails/06.png",
        status: "published",
        password: "doacademy",
        weeks: []
    },
];

async function main() {
    console.log("Start seeding database...");

    for (const c of COURSES) {
        const course = await prisma.course.upsert({
            where: { id: c.id },
            update: {},
            create: {
                id: c.id,
                title: c.title,
                description: c.description,
                thumbnail: c.thumbnail,
                status: c.status,
                password: c.password,
                weeks: {
                    create: c.weeks.map((week) => ({
                        id: week.id,
                        title: week.title,
                        order: week.order,
                        days: {
                            create: week.days.map((day) => ({
                                id: day.id,
                                title: day.title,
                                order: day.order,
                                videoId: day.videoId,
                                materialUrl: day.materialUrl,
                            }))
                        }
                    }))
                }
            },
        });
        console.log(`Created/Upserted course: ${course.title}`);
    }

    console.log("Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
