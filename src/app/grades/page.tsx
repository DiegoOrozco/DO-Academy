import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Calendar, CheckCircle2, FileText, ChevronRight, ArrowLeft, BookOpen, BarChart3 } from "lucide-react";
import CoursePieChart from "@/components/ui/CoursePieChart";
import { calculateCourseGrade } from "@/lib/grades-utils";

export default async function GradesPage() {
    const student = await getStudent();
    if (!student) {
        redirect("/login");
    }

    // Fetch enrollments with full course details for calculation
    const enrollments = await prisma.enrollment.findMany({
        where: { userId: student.id },
        include: {
            course: {
                include: {
                    weeks: {
                        where: { isVisible: true },
                        include: {
                            days: {
                                where: { isVisible: true },
                                include: {
                                    submissions: { where: { userId: student.id } },
                                    videoProgresses: { where: { userId: student.id } }
                                }
                            }
                        }
                    }
                }
            }
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

    const courseGrades = enrollments.map(enr => {
        const gradeData = calculateCourseGrade(enr.course, student.id);
        const courseSubs = submissions.filter((s: any) => s.day.week.courseId === enr.courseId);
        return {
            course: enr.course,
            gradeData: { ...gradeData, subs: courseSubs }
        };
    });

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
                                <div className="glass-effect rounded-[3rem] border border-[var(--color-primary)]/20 shadow-2xl relative overflow-hidden bg-[#0A0D16]" style={{ WebkitBackdropFilter: 'blur(30px)' }}>
                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>

                                    <div className="p-8 md:p-12 relative z-10">
                                        <div className="flex flex-col lg:flex-row items-center gap-12">
                                            {/* Left: Course Info & Total Score */}
                                            <div className="flex-1 w-full space-y-10">
                                                <div className="flex items-start gap-6">
                                                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[var(--color-primary)] to-blue-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 shrink-0">
                                                        <BookOpen size={32} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight leading-tight">{course.title}</h2>
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">En Curso</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between lg:justify-start lg:gap-20 bg-white/[0.02] rounded-3xl p-8 border border-white/[0.05] backdrop-blur-sm" style={{ WebkitBackdropFilter: 'blur(10px)' }}>
                                                    <div className="space-y-1 shrink-0">
                                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Nota Final</p>
                                                        <div className="flex items-baseline gap-3">
                                                            <span className={`text-5xl md:text-7xl font-black tabular-nums tracking-tighter ${gradeData.total >= 70 ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'text-amber-400'}`}>
                                                                {gradeData.total}
                                                            </span>
                                                            <span className="text-xl md:text-2xl text-slate-700 font-black">/100</span>
                                                        </div>
                                                    </div>

                                                    <div className="hidden sm:block w-px h-16 bg-white/10 shrink-0"></div>

                                                    <div className="space-y-1 shrink-0">
                                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Entregas</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tighter">{gradeData.subsCount}</span>
                                                            <span className="text-sm text-slate-600 font-bold uppercase tracking-widest">Tots</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Interactive Visualization */}
                                            <div className="lg:w-[480px] w-full bg-[#0D121F]/80 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative backdrop-blur-xl" style={{ WebkitBackdropFilter: 'blur(40px)' }}>
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                                            <BarChart3 size={18} />
                                                        </div>
                                                        <span className="text-xs font-black text-white uppercase tracking-[0.15em]">Rendimiento</span>
                                                    </div>
                                                </div>
                                                <CoursePieChart
                                                    data={{
                                                        LAB: gradeData.lAvg,
                                                        QUIZ: gradeData.qAvg,
                                                        FORUM: gradeData.fAvg,
                                                        PROJECT: gradeData.pAvg
                                                    }}
                                                    weights={{
                                                        LAB: (course as any).weightLab,
                                                        QUIZ: (course as any).weightQuiz,
                                                        FORUM: (course as any).weightForum,
                                                        PROJECT: (course as any).weightProject
                                                    }}
                                                    size={160}
                                                />
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
