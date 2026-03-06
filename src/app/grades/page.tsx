import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Calendar, CheckCircle2, FileText, ChevronRight, ArrowLeft, BookOpen, BarChart3 } from "lucide-react";

export default async function GradesPage() {
    const student = await getStudent();
    if (!student) {
        redirect("/login");
    }

    // Fetch enrollments to get courses with their weights
    const enrollments = await prisma.enrollment.findMany({
        where: { userId: student.id },
        include: {
            course: true
        }
    });

    const submissions = await prisma.submission.findMany({
        where: { userId: student.id },
        include: {
            day: {
                include: {
                    week: {
                        include: { course: true }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // Helper to calculate student's grade in a specific course
    const calculateGrade = (course: any) => {
        const courseSubs = submissions.filter((s: any) => s.day.week.courseId === course.id);

        const calcAvg = (type: string) => {
            const typeSubs = courseSubs.filter((s: any) => s.day.assignmentType === type);
            if (typeSubs.length === 0) return 0;
            const sum = typeSubs.reduce((acc: number, s: any) => acc + (s.grade || 0), 0);
            return sum / typeSubs.length;
        };

        const qAvg = calcAvg("QUIZ");
        const lAvg = calcAvg("LAB");
        const fAvg = calcAvg("FORUM");
        const pAvg = calcAvg("PROJECT");

        const total =
            (qAvg * (course.weightQuiz / 100)) +
            (lAvg * (course.weightLab / 100)) +
            (fAvg * (course.weightForum / 100)) +
            (pAvg * (course.weightProject / 100));

        return {
            total: Math.round(total),
            qAvg: Math.round(qAvg),
            lAvg: Math.round(lAvg),
            fAvg: Math.round(fAvg),
            pAvg: Math.round(pAvg),
            subsCount: courseSubs.length,
            subs: courseSubs
        };
    };

    const courseGrades = enrollments.map(enr => ({
        course: enr.course,
        gradeData: calculateGrade(enr.course)
    }));

    return (
        <div className="min-h-screen bg-[var(--background)] pt-24 pb-20 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-5xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Volver al Dashboard
                </Link>

                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] shadow-lg shadow-blue-500/10">
                            <GraduationCap size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white">Mis Calificaciones</h1>
                            <p className="text-slate-400 font-medium">Revisa tu progreso ponderado por materia y el feedback de tus tareas.</p>
                        </div>
                    </div>
                </header>

                {courseGrades.length > 0 ? (
                    <div className="space-y-12">
                        {courseGrades.map(({ course, gradeData }) => (
                            <div key={course.id} className="space-y-6">
                                {/* Course Summary Card */}
                                <div className="glass-effect rounded-3xl border border-[var(--color-primary)]/30 p-8 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="flex items-start gap-4 flex-grow">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
                                                <BookOpen size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-white mb-2">{course.title}</h2>
                                                <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Quices ({(course as any).weightQuiz}%)
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Labs ({(course as any).weightLab}%)
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Foros ({(course as any).weightForum}%)
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Proyectos ({(course as any).weightProject}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 bg-black/20 p-5 rounded-2xl border border-white/5 flex-shrink-0">
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Entregas</p>
                                                <p className="text-2xl font-black text-white">{gradeData.subsCount}</p>
                                            </div>
                                            <div className="w-px h-12 bg-white/10"></div>
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Nota Final</p>
                                                <p className={`text-4xl font-black ${gradeData.total >= 70 ? 'text-emerald-400 text-shadow-glow' : 'text-amber-400'}`}>
                                                    {gradeData.total}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* List of Submissions for this Course */}
                                {gradeData.subs.length > 0 && (
                                    <div className="pl-4 md:pl-10 space-y-4 border-l-2 border-[var(--color-primary)]/20">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                            <BarChart3 size={16} /> Detalle de Entregas
                                        </h3>
                                        {gradeData.subs.map((sub: any) => (
                                            <div
                                                key={sub.id}
                                                className="glass-effect rounded-2xl border border-white/5 p-6 hover:border-white/20 transition-all group relative bg-black/10"
                                            >
                                                {/* Category Badge */}
                                                <div className="absolute top-4 right-4 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {sub.day.assignmentType || "LAB"}
                                                </div>

                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mr-16">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-base font-bold text-white group-hover:text-[var(--color-primary)] transition-colors">
                                                                Día {sub.day.order}: {sub.day.title}
                                                            </h4>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                                                    <CheckCircle2 size={12} />
                                                                    {sub.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                                                        <div className="text-center md:text-right">
                                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter mb-1">Nota</p>
                                                            <p className="text-2xl font-black text-white">{sub.grade || "--"}</p>
                                                        </div>
                                                        <Link
                                                            href={`/course/${course.id}`}
                                                            className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-glow-sm"
                                                        >
                                                            <ChevronRight size={20} />
                                                        </Link>
                                                    </div>
                                                </div>

                                                {sub.feedback && (
                                                    <div className="mt-6 pt-6 border-t border-white/5 text-sm">
                                                        <p className="text-slate-300 leading-relaxed italic mb-4">
                                                            "{sub.feedback.comentario}"
                                                        </p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Lo mejor</p>
                                                                {sub.feedback.feedback_positivo?.slice(0, 2).map((item: string, i: number) => (
                                                                    <p key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                                                        <span className="text-emerald-500">•</span> {item}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">A mejorar</p>
                                                                {sub.feedback.mejoras?.slice(0, 2).map((item: string, i: number) => (
                                                                    <p key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                                                        <span className="text-amber-500">•</span> {item}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-effect rounded-3xl p-16 text-center border border-dashed border-white/10">
                        <GraduationCap size={48} className="text-slate-700 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Aún no tienes cursos o entregas</h2>
                        <p className="text-slate-400 max-w-sm mx-auto">
                            Tus cursos inscritos y tareas calificadas aparecerán aquí una vez que comiences tu aprendizaje.
                        </p>
                        <Link
                            href="/"
                            className="inline-block mt-8 bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-blue-500/20"
                        >
                            Explorar Catálogo
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
