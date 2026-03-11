import prisma from "@/lib/prisma";
import Link from "next/link";
import { Clock, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getUpcomingDeadlines } from "@/lib/grades-utils";

interface StudentDashboardProps {
    studentId: string;
}

export default async function StudentDashboardStats({ studentId }: StudentDashboardProps) {
    if (!studentId) return null;

    const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
            enrollments: {
                where: { status: "ACTIVE" },
                include: {
                    course: {
                        include: {
                            weeks: {
                                where: { isVisible: true },
                                include: {
                                    days: {
                                        where: { isVisible: true },
                                        include: {
                                            submissions: { where: { userId: studentId } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            deadlineExceptions: true
        }
    });

    if (!student || student.enrollments.length === 0) return null;

    const upcomingDeadlines = getUpcomingDeadlines(student, new Date());

    return (
        <div className="glass-effect rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col h-full bg-[#0D121F]/80 backdrop-blur-3xl" style={{ WebkitBackdropFilter: 'blur(40px)' }}>
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-glow-sm">
                        <Clock size={24} className="text-orange-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-md uppercase tracking-[0.1em]">Próximas Entregas</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Calendario Semanal</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-[10px] font-black border border-orange-500/30">
                    {upcomingDeadlines.length}
                </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {upcomingDeadlines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 px-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-dashed border-white/10 opacity-40">
                            <CheckCircle size={40} className="text-emerald-400/40" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">Sin tareas pendientes</p>
                        <p className="text-[10px] text-slate-600 font-bold mt-2 italic">¡Disfruta tu tiempo libre!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {upcomingDeadlines.map((deadline, idx) => (
                            <Link
                                key={`${deadline.id}-${idx}`}
                                href={`/course/${deadline.courseId}?dayId=${deadline.id}`}
                                className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/10 relative overflow-hidden bg-black/20"
                            >
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-[#1A1F2C] border border-white/5 flex flex-col items-center justify-center shrink-0 shadow-xl group-hover:border-orange-500/30 transition-all">
                                        <span className="text-[9px] text-orange-500/70 font-black uppercase tracking-tighter">{format(deadline.dueDate, "MMM", { locale: es })}</span>
                                        <span className="text-2xl font-black text-white leading-none tracking-tighter">{format(deadline.dueDate, "d", { locale: es })}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-white text-md leading-tight group-hover:text-orange-400 transition-colors truncate pr-2 tracking-tight">
                                            {deadline.title}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate mt-1">{deadline.courseName}</p>
                                    </div>
                                </div>
                                <div className="shrink-0 relative z-10">
                                    {deadline.isSubmitted ? (
                                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-glow-sm">
                                            <CheckCircle size={14} className="text-emerald-400" />
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-glow-sm">
                                            <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Pendiente</span>
                                        </div>
                                    )}
                                </div>
                                {/* Progress background decoration */}
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-orange-500/40 transition-all duration-300" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <Link href="/grades" className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group">
                    Ver Registro de Notas
                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
            </div>
        </div>
    );
}
