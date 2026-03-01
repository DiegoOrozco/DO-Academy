import { Users, BookOpen, MessageSquare, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Visión General</h1>
                <p className="text-slate-400">Bienvenido al portal de administración, Diego.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-effect p-6 rounded-2xl flex flex-col gap-4 border border-[var(--color-glass-border)]">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full flex items-center gap-1">
                            <TrendingUp size={12} />
                            +12%
                        </span>
                    </div>
                    <div>
                        <h3 className="text-slate-400 text-sm font-medium mb-1">Estudiantes Activos</h3>
                        <p className="text-3xl font-bold text-white">1,248</p>
                    </div>
                </div>

                <div className="glass-effect p-6 rounded-2xl flex flex-col gap-4 border border-[var(--color-glass-border)]">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-emerald-400/20 text-emerald-400 flex items-center justify-center">
                            <BookOpen size={20} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-400 text-sm font-medium mb-1">Cursos Publicados</h3>
                        <p className="text-3xl font-bold text-white">6</p>
                    </div>
                </div>

                <div className="glass-effect p-6 rounded-2xl flex flex-col gap-4 border border-[var(--color-glass-border)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                            <MessageSquare size={20} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-slate-400 text-sm font-medium mb-1">Dudas Pendientes</h3>
                        <p className="text-3xl font-bold text-white">4</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] p-6 mt-4">
                <h2 className="text-xl font-bold text-white mb-6">Actividad Reciente</h2>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2 glow-accent"></div>
                        <div>
                            <p className="text-sm text-slate-200">
                                <span className="font-semibold text-white">María Pérez</span> publicó una duda en <span className="font-semibold text-[var(--color-primary)]">01 - Fundamentos de programación</span>.
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Hace 1 hora</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <div>
                            <p className="text-sm text-slate-200">
                                <span className="font-semibold text-white">Carlos López</span> completó <span className="font-semibold text-emerald-400">03 - Bases de datos</span>.
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Hace 3 horas</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-slate-500 mt-2"></div>
                        <div>
                            <p className="text-sm text-slate-200">
                                Nueva inscripción: <span className="font-semibold text-white">Laura Gómez</span> se unió a DO Academy.
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Hace 5 horas</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
