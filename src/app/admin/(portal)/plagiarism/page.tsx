import prisma from "@/lib/prisma";
import Link from "next/link";
import { ShieldAlert, BookOpen, Calendar, ArrowRight } from "lucide-react";

export default async function PlagiarismIndexPage() {
    const daysWithPlagiarism = await (prisma.day.findMany as any)({
        where: {
            OR: [
                { enablePlagiarism: true },
                { isCodingExercise: true }
            ],
            isDeliveryDay: true
        },
        include: {
            week: {
                include: {
                    course: {
                        select: { title: true }
                    }
                }
            },
            _count: {
                select: { submissions: true }
            }
        },
        orderBy: {
            week: {
                course: {
                    title: 'asc'
                }
            }
        }
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ShieldAlert className="text-amber-500" size={32} />
                    Centro de Control de Plagio
                </h1>
                <p className="text-slate-400 max-w-2xl">
                    Monitorea la integridad académica de tus cursos. Aquí encontrarás todos los días de entrega que tienen activa la detección de plagio o el análisis de código.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {daysWithPlagiarism.map((day: any) => (
                    <Link
                        key={day.id}
                        href={`/admin/plagiarism/${day.id}`}
                        className="glass-effect border border-[var(--color-glass-border)] rounded-2xl p-6 hover:border-[var(--color-primary)]/50 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary)] opacity-[0.03] blur-2xl rounded-full translate-x-12 -translate-y-12"></div>

                        <div className="flex flex-col h-full space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">
                                        <BookOpen size={12} />
                                        {day.week.course.title}
                                    </div>
                                    <h2 className="text-lg font-bold text-white group-hover:text-[var(--color-primary)] transition-colors">
                                        {day.title}
                                    </h2>
                                </div>
                                <div className="bg-slate-800/50 p-2 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                                    <ArrowRight size={20} />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Entregas</span>
                                    <span className="text-white font-mono">{day._count.submissions}</span>
                                </div>
                                <div className="w-px h-8 bg-slate-800"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Umbral AI</span>
                                    <span className="text-white font-mono">{Math.round((day.similarityThreshold || 0.6) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {daysWithPlagiarism.length === 0 && (
                    <div className="col-span-full p-20 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center">
                        <ShieldAlert size={48} className="text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-300">No hay activaciones registradas</h3>
                        <p className="text-slate-500 max-w-sm mt-2">
                            Ve al editor de cursos y activa "Detección de Plagio" o "Ejercicio de Programación" en los días de entrega para ver reportes aquí.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
