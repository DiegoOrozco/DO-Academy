import { getStudent } from "@/lib/student-auth";
import CourseCatalog from "@/components/CourseCatalog";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CoursesPage() {
    const student = await getStudent();

    const allCourses = await prisma.course.findMany({
        where: { status: "published" },
        orderBy: { id: 'asc' },
        include: {
            weeks: {
                where: { isVisible: true },
                include: {
                    days: {
                        where: { isVisible: true },
                        include: {
                            submissions: { where: { userId: student?.id || "" } },
                            videoProgresses: { where: { userId: student?.id || "" } }
                        }
                    }
                }
            }
        }
    });

    const enrolledCourseIds = student?.enrollments?.map((e: any) => e.courseId) || [];

    return (
        <div className="min-h-screen bg-[var(--background)] relative overflow-hidden flex flex-col pt-32 pb-40 px-6 lg:px-10">
            {/* Header */}
            <div className="max-w-[1400px] w-full mx-auto flex items-center gap-4 mb-16">
                <Link href="/" className="raw-btn bg-white/5 hover:bg-white/10 text-[var(--test-slate)] px-4 py-3 rounded-full flex items-center justify-center transition-all">
                    <ArrowLeft size={16} color="white" />
                </Link>
                <div className="flex-1 flex flex-col">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">EXPLORA EL CATÁLOGO</h1>
                    <p className="text-sm md:text-base font-bold text-white/40 uppercase tracking-widest italic" style={{ color: "var(--raw-accent)" }}>TECNOLOGÍAS MODERNAS Y DESARROLLOS PREMIUM</p>
                </div>
            </div>

            {/* Catalog */}
            <div className="max-w-[1400px] w-full mx-auto">
                <CourseCatalog
                    allCourses={allCourses.map(c => ({
                        id: c.id,
                        title: c.title,
                        description: c.description,
                        thumbnail: c.thumbnail,
                        status: c.status,
                        category: (c as any).category || "Programación",
                        progressPct: 0,
                        weeks: c.weeks
                    }))}
                    enrolledCourseIds={enrolledCourseIds}
                    student={student}
                />
            </div>
        </div>
    );
}
