import Link from "next/link";
import { Lock, PlayCircle, BookOpen } from "lucide-react";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/student-auth";
import { logoutStudent } from "@/actions/auth";

export default async function DashboardPage() {
    const student = await getStudent();

    // Fetch all published courses
    const allCourses = await prisma.course.findMany({
        where: { status: "published" },
        orderBy: { id: 'asc' }
    });

    const enrolledCourseIds = student?.enrollments.map(e => e.courseId) || [];

    const myCourses = allCourses.filter(c => enrolledCourseIds.includes(c.id));
    const availableCourses = allCourses.filter(c => !enrolledCourseIds.includes(c.id));

    return (
        <div className="min-h-screen bg-[var(--background)] p-6 sm:p-10 pb-20 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[100%] bg-[var(--color-primary)] opacity-[0.15] blur-[150px] rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">DO Academy</h1>
                        {student ? (
                            <p className="text-slate-400 font-medium tracking-wide">
                                Hola, <span className="text-white font-bold">{student.name}</span>. 👋 ¡Qué bueno verte de nuevo!
                            </p>
                        ) : (
                            <p className="text-slate-400">Catálogo de cursos premium. Inicia sesión para ver tu progreso.</p>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        {student ? (
                            <form action={logoutStudent}>
                                <button type="submit" className="text-sm font-semibold text-slate-500 hover:text-red-400 transition-colors">
                                    Cerrar Sesión
                                </button>
                            </form>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-sm font-semibold text-white hover:text-[var(--color-primary)] transition-colors">
                                    Iniciar Sesión
                                </Link>
                                <Link href="/register" className="bg-[var(--color-secondary)] hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all shadow-lg shadow-emerald-500/20">
                                    Registrarse
                                </Link>
                            </div>
                        )}
                        <span className="w-px h-6 bg-slate-800 hidden sm:block"></span>
                        <Link
                            href="/admin/login"
                            className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-[var(--color-primary)] transition-colors bg-slate-900/50 px-3 py-1.5 rounded-md border border-slate-800"
                        >
                            Admin
                        </Link>
                    </div>
                </header>

                {/* My Courses Section */}
                {student && myCourses.length > 0 && (
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-8 bg-[var(--color-secondary)] rounded-full"></div>
                            <h2 className="text-2xl font-bold text-white">Mis Cursos</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {myCourses.map((course) => (
                                <CourseCard key={course.id} course={course} hasAccess={true} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Catalog Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1.5 h-8 bg-[var(--color-primary)] rounded-full shadow-[0_0_10px_var(--color-primary)]"></div>
                        <h2 className="text-2xl font-bold text-white">
                            {student && myCourses.length > 0 ? "Explorar más cursos" : "Catálogo de Cursos"}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {availableCourses.map((course) => (
                            <CourseCard key={course.id} course={course} hasAccess={false} />
                        ))}
                    </div>
                    {availableCourses.length === 0 && !student && (
                        <div className="p-20 text-center glass-effect rounded-3xl border border-dashed border-slate-700">
                            <p className="text-slate-500 italic">No hay cursos disponibles en el catálogo en este momento.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function CourseCard({ course, hasAccess }: { course: any, hasAccess: boolean }) {
    return (
        <div className="glass-effect rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:glow-accent hover:-translate-y-1 group">
            <div className="h-48 relative overflow-hidden bg-slate-800">
                <img
                    src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
                    alt={course.title}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!hasAccess ? "opacity-40 grayscale" : ""}`}
                />
                {!hasAccess && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2 shadow-2xl">
                            <Lock size={16} className="text-[var(--color-primary)]" />
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Contenido Privado</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-[var(--color-primary)] transition-colors">{course.title}</h3>
                <p className="text-slate-400 text-sm mb-6 flex-grow line-clamp-3">{course.description}</p>

                {hasAccess ? (
                    <div className="space-y-4 mt-auto">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-slate-400">
                                <span>Progreso</span>
                                <span>0%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--color-secondary)] rounded-full transition-all duration-1000" style={{ width: `0%` }}></div>
                            </div>
                        </div>

                        <Link
                            href={`/course/${course.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20"
                        >
                            <PlayCircle size={18} />
                            Entrar al curso
                        </Link>
                    </div>
                ) : (
                    <Link
                        href={`/course/${course.id}/unlock`}
                        className="mt-auto w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl border border-slate-700 transition-all duration-300"
                    >
                        <Lock size={18} />
                        Desbloquear
                    </Link>
                )}
            </div>
        </div>
    );
}
