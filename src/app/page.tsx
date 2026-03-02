import { getSiteConfig } from "@/lib/config";
import Link from "next/link";
import { Lock, PlayCircle, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/student-auth";

export default async function DashboardPage() {
    const student = await getStudent();
    const homeConfig = await getSiteConfig("home") || {
        heroTitle: "Domina la Tecnología con DO Academy",
        heroSubtitle: "Accede a contenido exclusivo diseñado por expertos para llevar tus habilidades al siguiente nivel profesional.",
        heroButtonText: "Empezar Ahora",
        heroButtonLink: "/register"
    };

    // Fetch all published courses
    const allCourses = await prisma.course.findMany({
        where: { status: "published" },
        orderBy: { id: 'asc' }
    });

    const enrolledCourseIds = student?.enrollments.map((e: any) => e.courseId) || [];

    const myCourses = allCourses.filter((c: any) => enrolledCourseIds.includes(c.id));
    const availableCourses = allCourses.filter((c: any) => !enrolledCourseIds.includes(c.id));

    return (
        <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[10%] w-[70%] h-[100%] bg-[var(--color-primary)] opacity-[0.12] blur-[150px] rounded-full"></div>
                <div className="absolute top-[10%] right-[-5%] w-[40%] h-[60%] bg-blue-400 opacity-[0.05] blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-24 md:pt-32 pb-12 md:pb-20 relative z-10">
                {/* Hero Section */}
                <header className="mb-12 md:mb-20 text-center md:text-left max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
                        <Sparkles size={14} />
                        Plataforma Premium
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-[1.1]">
                        {homeConfig.heroTitle?.split("DO Academy")[0]}
                        <span className="text-[var(--color-primary)]">
                            {homeConfig.heroTitle?.includes("DO Academy") ? "DO Academy" : ""}
                        </span>
                        {homeConfig.heroTitle?.split("DO Academy")[1]}
                    </h1>
                    {student ? (
                        <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed mb-8">
                            Hola, <span className="text-white font-bold">{student.name}</span>. 👋 Tienes <span className="text-white font-bold">{myCourses.length}</span> cursos activos.
                        </p>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl">
                                {homeConfig.heroSubtitle}
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                                <Link
                                    href={homeConfig.heroButtonLink || "/register"}
                                    className="bg-[var(--color-primary)] hover:bg-blue-600 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 group"
                                >
                                    {homeConfig.heroButtonText || "Empezar Ahora"}
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="bg-white/5 hover:bg-white/10 text-white font-black py-4 px-8 rounded-2xl transition-all border border-white/10 flex items-center justify-center"
                                >
                                    Iniciar Sesión
                                </Link>
                            </div>
                        </div>
                    )}
                </header>

                <main className="space-y-20">
                    {/* My Courses */}
                    {student && myCourses.length > 0 && (
                        <section id="my-courses" className="space-y-8 scroll-mt-24">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></div>
                                    Mis Cursos
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myCourses.map((course: any) => (
                                    <Link
                                        key={course.id}
                                        href={`/course/${course.id}`}
                                        className="group glass-effect rounded-3xl border border-white/10 overflow-hidden hover:border-[var(--color-primary)]/50 transition-all duration-500 flex flex-col h-full"
                                    >
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={course.image || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80`}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                                            <div className="absolute bottom-4 left-4">
                                                <span className="bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-emerald-500/30">
                                                    Enrolled
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                                                {course.title}
                                            </h3>
                                            <p className="text-slate-400 text-sm mb-6 line-clamp-2 font-medium">
                                                {course.description}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                                    <PlayCircle size={14} className="text-[var(--color-primary)]" />
                                                    {course.lessonsCount || 0} Lecciones
                                                </div>
                                                <button className="text-[var(--color-primary)] font-bold text-sm flex items-center gap-1 group/btn">
                                                    Continuar
                                                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Available Courses */}
                    <section id="explore-courses" className="space-y-8 scroll-mt-24">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-500/30 rounded-full"></div>
                                Explorar Cursos
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableCourses.map((course: any) => (
                                <div
                                    key={course.id}
                                    className="group glass-effect rounded-3xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-500 flex flex-col h-full relative"
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={course.image || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80`}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 grayscale-[50%]"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Lock size={32} className="text-white/30" />
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1 opacity-70">
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-slate-400 text-sm mb-6 line-clamp-2 font-medium">
                                            {course.description}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                                <BookOpen size={14} />
                                                Cerrado
                                            </div>
                                            <Link
                                                href={student ? `/course/${course.id}/unlock` : `/register?courseId=${course.id}`}
                                                className="bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border border-white/10"
                                            >
                                                Inscribirse
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
