import prisma from "@/lib/prisma";
import { GraduationCap, Search, Filter, Download, User, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function AdminGradesPage() {
    // Fetch all students with their enrollments and submissions
    const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            enrollments: {
                include: { course: true }
            },
            submissions: {
                include: {
                    day: {
                        include: { week: true }
                    }
                }
            }
        },
        orderBy: { name: "asc" }
    });

    // Helper to calculate student's grade in a specific course
    const calculateGrade = (student: any, course: any) => {
        const courseSubs = student.submissions.filter((s: any) => s.day.week.courseId === course.id);

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
            subsCount: courseSubs.length
        };
    };

    // Flatten data for table view: 1 row per Student per Course
    const tableData = students.flatMap((student) =>
        student.enrollments.map((enr: any) => ({
            studentId: student.id,
            name: student.name,
            email: student.email,
            courseId: enr.course.id,
            courseTitle: enr.course.title,
            gradeData: calculateGrade(student, enr.course),
            status: enr.status
        }))
    );

    const totalStudents = students.length;
    const avgScore = tableData.length > 0
        ? tableData.reduce((acc, row) => acc + row.gradeData.total, 0) / tableData.length
        : 0;
    const passRate = tableData.length > 0
        ? (tableData.filter(row => row.gradeData.total >= 70).length / tableData.length) * 100
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Libro de Calificaciones</h1>
                    <p className="text-slate-400 mt-1">Supervisa y descarga el reporte de notas finales ponderadas.</p>
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
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estudiantes Activos</span>
                    <span className="text-3xl font-black text-white">{totalStudents}</span>
                </div>
                <div className="glass-effect p-6 rounded-2xl border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Promedio Global</span>
                    <span className="text-3xl font-black text-white">{avgScore.toFixed(1)}</span>
                </div>
                <div className="glass-effect p-6 rounded-2xl border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Tasa de Aprobación</span>
                    <span className="text-3xl font-black text-white">{passRate.toFixed(0)}%</span>
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
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Curso</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Desglose (Q/L/F/P)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Nota Final</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tableData.map((row, idx) => (
                                <tr key={`${row.studentId}-${row.courseId}-${idx}`} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-white/5 group-hover:border-[var(--color-primary)]/30 transition-all">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white leading-none mb-1">{row.name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{row.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <BookOpen size={16} className="text-[var(--color-primary)]" />
                                            <span className="text-sm font-semibold leading-none">{row.courseTitle}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">
                                            {row.gradeData.subsCount} Entregas Realizadas
                                        </p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
                                            <span title="Quices" className={row.gradeData.qAvg > 0 ? "text-purple-400" : ""}>{row.gradeData.qAvg}</span>/
                                            <span title="Labs" className={row.gradeData.lAvg > 0 ? "text-blue-400" : ""}>{row.gradeData.lAvg}</span>/
                                            <span title="Foros" className={row.gradeData.fAvg > 0 ? "text-emerald-400" : ""}>{row.gradeData.fAvg}</span>/
                                            <span title="Proyectos" className={row.gradeData.pAvg > 0 ? "text-amber-400" : ""}>{row.gradeData.pAvg}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`text-xl font-black ${row.gradeData.total >= 70 ? "text-emerald-400" : "text-rose-400"}`}>
                                            {row.gradeData.total || "0"}
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

                {tableData.length === 0 && (
                    <div className="p-20 text-center">
                        <GraduationCap size={48} className="text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No hay estudiantes o entregas registradas todavía.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
