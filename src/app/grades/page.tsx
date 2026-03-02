import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Calendar, CheckCircle2, FileText, ChevronRight, ArrowLeft } from "lucide-react";

export default async function GradesPage() {
    const student = await getStudent();
    if (!student) {
        redirect("/login");
    }

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

    return (
        <div className="min-h-screen bg-[var(--background)] pt-24 pb-20 px-6">
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
                            <p className="text-slate-400 font-medium">Sigue tu progreso y revisa el feedback de tus tareas.</p>
                        </div>
                    </div>
                </header>

                {submissions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {submissions.map((sub: any) => (
                            <div
                                key={sub.id}
                                className="glass-effect rounded-2xl border border-white/5 p-6 hover:border-white/20 transition-all group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-primary)] transition-colors">
                                                {sub.day.week.course.title}
                                            </h3>
                                            <p className="text-sm text-slate-400">
                                                Semana {sub.day.week.order} • Día {sub.day.order}: {sub.day.title}
                                            </p>
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

                                    <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                                        <div className="text-center md:text-right">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter mb-1">Nota</p>
                                            <p className="text-3xl font-black text-white">{sub.grade || "--"}</p>
                                        </div>
                                        <Link
                                            href={`/course/${sub.day.week.courseId}`}
                                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </Link>
                                    </div>
                                </div>

                                {sub.feedback && (
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Feedback del Profesor Virtual</p>
                                        <p className="text-sm text-slate-300 leading-relaxed italic mb-4">
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
                ) : (
                    <div className="glass-effect rounded-3xl p-16 text-center border border-dashed border-white/10">
                        <FileText size={48} className="text-slate-700 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Aún no tienes entregas</h2>
                        <p className="text-slate-400 max-w-sm mx-auto">
                            Tus tareas calificadas aparecerán aquí una vez que el profesor virtual las revise.
                        </p>
                        <Link
                            href="/"
                            className="inline-block mt-8 bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-blue-500/20"
                        >
                            Explorar Cursos
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
