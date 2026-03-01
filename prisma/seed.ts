import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
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

    // Clean existing user/social DB info to reset
    await prisma.reply.deleteMany();
    await prisma.post.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.user.deleteMany();

    console.log("Cleaned old user data.");

    // Seed dummy Users
    const admin = await prisma.user.create({
        data: {
            id: "admin_01",
            name: "Profesor Diego",
            email: "admin@doacademy.com",
            password: "hashedpassword",
            role: "ADMIN"
        }
    });

    const student1 = await prisma.user.create({
        data: {
            id: "student_01",
            name: "Estudiante Uno",
            email: "uno@example.com",
            password: "hashedpassword",
            role: "STUDENT"
        }
    });

    const student2 = await prisma.user.create({
        data: {
            id: "student_02",
            name: "Estudiante Dos",
            email: "dos@example.com",
            password: "hashedpassword",
            role: "STUDENT"
        }
    });

    console.log("Created dummy students.");

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

    // Seed Enrollments for testing
    await prisma.enrollment.createMany({
        data: [
            { userId: student1.id, courseId: "01" },
            { userId: student2.id, courseId: "01" }
        ]
    });

    // Seed Comments on Day 1 (d1_01)
    const post1 = await prisma.post.create({
        data: {
            id: "p1",
            content: "¡Excelente video! Me quedó clarísimo qué es programar.",
            userId: student1.id,
            dayId: "d1_01"
        }
    });

    await prisma.reply.create({
        data: {
            id: "r1",
            content: "Muchas gracias, me alegro que te sirviera.",
            userId: admin.id,
            postId: post1.id
        }
    });

    await prisma.post.create({
        data: {
            id: "p2",
            content: "Tengo una duda con la parte de los paradigmas.",
            userId: student2.id,
            dayId: "d1_01"
        }
    });

    console.log("Seeded enrollments and comments on course 01, day 1.");

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
