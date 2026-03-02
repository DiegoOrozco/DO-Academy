import prisma from "@/lib/prisma";
import { GraduationCap, Search, Filter, Download, User, Calendar, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function AdminGradesPage() {
    const submissions = await prisma.submission.findMany({
        include: {
            user: { select: { name: true, email: true } },
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Libro de Calificaciones</h1>
                    <p className="text-slate-400 mt-1">Supervisa y descarga el reporte de entregas calificadas por IA.</p>
                </div>

                <button
                    className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-xl shadow-blue-500/20 glow-accent"
                >
                    <Download size={20} />
                    Exportar Reporte (CSV)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-effect p-6 rounded-2xl border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Entregas</span>
                    <span className="text-3xl font-black text-white">{submissions.length}</span>
                </div>
                <div className="glass-effect p-6 rounded-2xl border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Promedio General</span>
                    <span className="text-3xl font-black text-white">
                        {submissions.length > 0
                            ? (submissions.reduce((acc: number, s: any) => acc + (s.grade || 0), 0) / submissions.length).toFixed(1)
                            : "0.0"}
                    </span>
                </div>
                <div className="glass-effect p-6 rounded-2xl border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Tasa de Aprobación</span>
                    <span className="text-3xl font-black text-white">
                        {submissions.length > 0
                            ? ((submissions.filter((s: any) => (s.grade || 0) >= 70).length / submissions.length) * 100).toFixed(0)
                            : "0"}%
                    </span>
                </div>
            </div>

            <div className="glass-effect rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02]">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por estudiante o curso..."
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-xl border border-white/10 transition-all text-xs font-bold uppercase tracking-widest">
                            <Filter size={14} />
                            Filtros
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.01]">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estudiante</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Curso / Día</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Nota</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {submissions.map((sub: any) => (
                                <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-white/5 group-hover:border-[var(--color-primary)]/30 transition-all">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white leading-none mb-1">{sub.user.name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{sub.user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm font-semibold text-slate-200 leading-none mb-1">{sub.day.week.course.title}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                            W{sub.day.week.order} • D{sub.day.order}: {sub.day.title}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-xs font-medium">{new Date(sub.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`text-lg font-black ${sub.grade >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                                            {sub.grade || "--"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="text-slate-500 hover:text-[var(--color-primary)] transition-colors p-2">
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {submissions.length === 0 && (
                    <div className="p-20 text-center">
                        <GraduationCap size={48} className="text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No hay entregas registradas todavía.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
