import { getSiteConfig } from "@/lib/config";
import Link from "next/link";
import { Lock, PlayCircle, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/student-auth";
import { unstable_cache } from "next/cache";
import StudentDashboardStats from "@/components/StudentDashboardStats";
import { calculateCourseGrade } from "@/lib/grades-utils";

const getCachedHomeConfig = unstable_cache(
    async () => await getSiteConfig("home"),
    ['home-config'],
    { revalidate: 3600 } // Cache for 1 hour
);

export default async function DashboardPage() {
    const student = await getStudent();

    // Fetch cached data to reduce DB operations
    const homeConfig = await getCachedHomeConfig() || {
        heroTitle: "Domina la Tecnología con DO Academy",
        heroSubtitle: "Accede a contenido exclusivo diseñado por expertos para llevar tus habilidades al siguiente nivel profesional.",
        heroButtonText: "Empezar Ahora",
        heroButtonLink: "/register"
    };

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

    const enrolledCourseIds = student?.enrollments.map((e: any) => e.courseId) || [];
    const myCourses = allCourses.filter((c: any) => enrolledCourseIds.includes(c.id)).map(course => {
        const stats = student ? calculateCourseGrade(course, student.id) : { progressPct: 0 };
        return { ...course, progressPct: stats.progressPct };
    });
    const availableCourses = allCourses.filter((c: any) => !enrolledCourseIds.includes(c.id));

    return (
        <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[10%] w-[70%] h-[100%] bg-[var(--color-primary)] opacity-[0.12] blur-[150px] rounded-full"></div>
                <div className="absolute top-[10%] right-[-5%] w-[40%] h-[60%] bg-blue-400 opacity-[0.05] blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-[1500px] mx-auto px-6 lg:px-12 pt-20 pb-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Section: Hero / Welcome & Course Feed */}
                    <div className="lg:col-span-8 space-y-16">

                        {/* Compact Header */}
                        <header className="space-y-6">
                            {student ? (
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                                        <Sparkles size={14} className="text-[var(--color-primary)] animate-pulse" />
                                        <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">Panel del Estudiante</span>
                                    </div>
                                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
                                        Hola, <span className="bg-gradient-to-r from-[var(--color-primary)] to-emerald-400 bg-clip-text text-transparent">{student.name.split(' ')[0]}</span>
                                        <span className="block text-xl md:text-2xl text-slate-500 mt-2 font-bold tracking-normal italic opacity-60 italic">
                                            ¿Qué vamos a aprender hoy?
                                        </span>
                                    </h1>
                                </div>
                            ) : (
                                <div className="text-center md:text-left max-w-4xl py-10">
                                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.1]">
                                        {homeConfig.heroTitle?.split("DO Academy")[0]}
                                        <span className="text-[var(--color-primary)] drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                            {homeConfig.heroTitle?.includes("DO Academy") ? "DO Academy" : "DO Academy"}
                                        </span>
                                        {homeConfig.heroTitle?.split("DO Academy")[1]}
                                    </h1>
                                    <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed mb-10 max-w-2xl">
                                        {homeConfig.heroSubtitle}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <Link
                                            href={homeConfig.heroButtonLink || "/register"}
                                            className="bg-[var(--color-primary)] hover:bg-blue-600 text-white font-black py-5 px-10 rounded-2xl transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 group text-lg"
                                        >
                                            {homeConfig.heroButtonText || "Empezar Ahora"}
                                            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                        <Link
                                            href="/login"
                                            className="bg-white/5 hover:bg-white/10 text-white font-black py-5 px-10 rounded-2xl transition-all border border-white/10 flex items-center justify-center text-lg backdrop-blur-sm"
                                            style={{ WebkitBackdropFilter: 'blur(10px)' }}
                                        >
                                            Iniciar Sesión
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </header>

                        <main className="space-y-24">
                            {/* My Courses */}
                            {student && myCourses.length > 0 && (
                                <section id="my-courses" className="space-y-10 scroll-mt-24">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></div>
                                            Mis Cursos
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {myCourses.map((course: any) => (
                                            <Link
                                                key={course.id}
                                                href={`/course/${course.id}`}
                                                className="group glass-effect rounded-[2.5rem] border border-white/5 overflow-hidden transition-all duration-500 flex flex-col h-full bg-[#0A0D16] hover:bg-[#0D121F] hover:border-[var(--color-primary)]/30 shadow-2xl"
                                                style={{ WebkitBackdropFilter: 'blur(20px)' }}
                                            >
                                                <div className="relative h-48 overflow-hidden">
                                                    <img
                                                        src={course.image || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80`}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D16] to-transparent"></div>

                                                    {/* Progress Badge */}
                                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3" style={{ WebkitBackdropFilter: 'blur(10px)' }}>
                                                        <div className="relative w-10 h-10">
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                                                                <circle
                                                                    cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                                    strokeDasharray={100}
                                                                    strokeDashoffset={100 - (course.progressPct || 0)}
                                                                    className="text-[var(--color-primary)] transition-all duration-1000 ease-out"
                                                                />
                                                            </svg>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-[10px] font-black text-white">{Math.round(course.progressPct || 0)}%</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-wider">Completado</span>
                                                    </div>
                                                </div>

                                                <div className="p-8 flex flex-col flex-1">
                                                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 leading-tight tracking-tight">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-slate-400 text-sm mb-8 line-clamp-2 font-medium opacity-70 leading-relaxed">
                                                        {course.description}
                                                    </p>

                                                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between font-black text-[10px] uppercase tracking-[0.2em]">
                                                        <span className="text-slate-500 flex items-center gap-2">
                                                            <PlayCircle size={14} className="text-[var(--color-primary)]" />
                                                            Acceso Total
                                                        </span>
                                                        <span className="text-[var(--color-primary)] flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                            Empezar <ArrowRight size={14} />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Explore Catalog */}
                            <section id="explore-courses" className="space-y-10 scroll-mt-24">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-white/40 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-white/10 rounded-full"></div>
                                        Explorar Catálogo
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {availableCourses.map((course: any) => (
                                        <div
                                            key={course.id}
                                            className="group glass-effect rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-full bg-white/[0.02] opacity-70 hover:opacity-100 transition-all duration-500"
                                        >
                                            <div className="relative h-44 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                                                <img
                                                    src={course.image || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80`}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Lock size={32} className="text-white/20 group-hover:text-[var(--color-primary)]/40 transition-colors" />
                                                </div>
                                            </div>
                                            <div className="p-8 flex flex-col flex-1">
                                                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">{course.title}</h3>
                                                <p className="text-slate-500 text-sm mb-8 line-clamp-2 leading-relaxed">{course.description}</p>
                                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                                                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                        <Lock size={12} /> Requiere Inscripción
                                                    </div>
                                                    <Link
                                                        href={student ? `/course/${course.id}/unlock` : `/register?courseId=${course.id}`}
                                                        className="bg-white/5 hover:bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border border-white/10 shadow-lg"
                                                    >
                                                        Saber más
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </main>
                    </div>

                    {/* Right Section: Sidebar Stats & Calendar (Aligned Top-Right) */}
                    {student && (
                        <aside className="lg:col-span-4 h-fit lg:sticky lg:top-24 space-y-8">
                            <StudentDashboardStats studentId={student.id} />
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
}
