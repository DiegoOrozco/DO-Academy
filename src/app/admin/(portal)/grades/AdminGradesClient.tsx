"use client";

import React, { useState, useTransition } from "react";
import { GraduationCap, Search, Filter, Download, User, ChevronRight, BookOpen, ChevronDown, Check, Edit2, FileDown } from "lucide-react";
import { updateManualGrade } from "../../../../actions/admin-grades";
import FeedbackModal from "@/components/FeedbackModal";

function GradeEditor({ initialGrade, userId, dayId }: { initialGrade: number | null, userId: string, dayId: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [grade, setGrade] = useState(initialGrade !== null ? String(initialGrade) : "");
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        const numGrade = Number(grade);
        if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) return;

        startTransition(async () => {
            await updateManualGrade(userId, dayId, numGrade);
            setIsEditing(false);
        });
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min="0" max="100"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-16 bg-black/40 border border-[var(--color-primary)]/50 rounded-lg px-2 py-1 text-sm font-black text-white focus:outline-none"
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <Check size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group/edit">
            <span className={`text-sm font-black ${initialGrade !== null && initialGrade >= 70 ? 'text-emerald-400' : initialGrade !== null ? 'text-rose-400' : 'text-slate-500'}`}>
                {initialGrade !== null ? `${initialGrade}/100` : "-/100"}
            </span>
            <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all opacity-50 hover:opacity-100"
            >
                <Edit2 size={14} />
            </button>
        </div>
    );
}

export default function AdminGradesClient({
    tableData,
    totalStudents,
    avgScore,
    passRate
}: {
    tableData: any[],
    totalStudents: number,
    avgScore: number,
    passRate: number
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [selectedFeedback, setSelectedFeedback] = useState<{ sub: any; name: string } | null>(null);

    // Simplistic filter just for demonstration or actual basic filtering
    // You can expand this to filter by course or status
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const handleDownload = (content: string, fileName: string) => {
        if (!content) return;

        if (content.startsWith("http")) {
            // It's a URL (Blob storage)
            // Add ?download=1 for Vercel Blob if it's a direct link, or just open it
            const downloadUrl = content.includes('vercel-storage.com') ? `${content}?download=1` : content;
            window.open(downloadUrl, "_blank");
        } else {
            // It's raw content (Old data or coding exercise)
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName || "download.txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const downloadAll = (submissions: any[]) => {
        const validSubs = (submissions || []).filter(s => s.content);
        if (validSubs.length === 0) {
            alert("No hay archivos para descargar.");
            return;
        }

        validSubs.forEach((sub, index) => {
            setTimeout(() => {
                handleDownload(sub.content, sub.fileName || `entrega-${index}.txt`);
            }, index * 400); // 400ms delay between downloads
        });
    };

    const toggleRow = (id: string) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
        );
    };

    const filteredData = tableData.filter(row => {
        const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());

        // Example filter logic: active/inactive or passed/failed
        // If no filter active, just match search
        return matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Libro de Calificaciones</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Supervisa y descarga el reporte de notas finales ponderadas.</p>
                </div>

                <button
                    className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-xl shadow-blue-500/20 glow-accent"
                >
                    <Download size={20} />
                    Exportar Reporte (CSV)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-effect p-6 rounded-2xl border border-[var(--border-color)] flex flex-col gap-1 bg-[var(--card-bg)]">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Estudiantes Activos</span>
                    <span className="text-3xl font-black text-[var(--text-primary)]">{totalStudents}</span>
                </div>
                <div className="glass-effect p-6 rounded-2xl border border-[var(--border-color)] flex flex-col gap-1 bg-[var(--card-bg)]">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Promedio Global</span>
                    <span className="text-3xl font-black text-[var(--text-primary)]">{avgScore.toFixed(1)}</span>
                </div>
                <div className="glass-effect p-6 rounded-2xl border border-[var(--border-color)] flex flex-col gap-1 bg-[var(--card-bg)]">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Tasa de Aprobación</span>
                    <span className="text-3xl font-black text-[var(--text-primary)]">{passRate.toFixed(0)}%</span>
                </div>
            </div>

            <div className="glass-effect rounded-3xl border border-[var(--border-color)] overflow-hidden bg-[var(--card-bg)]">
                <div className="p-6 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/5">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por estudiante o curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/5">
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Estudiante</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Curso</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">Desglose (Q/L/F/P)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">Nota Final</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-right">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filteredData.map((row, idx) => {
                                const rowKey = `${row.studentId}-${row.courseId}-${idx}`;
                                const isExpanded = expandedRows.includes(rowKey);

                                return (
                                    <React.Fragment key={rowKey}>
                                        <tr
                                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                            onClick={() => toggleRow(rowKey)}
                                        >
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
                                                <button className={`text-slate-500 hover:text-[var(--color-primary)] transition-all p-2 rounded-full hover:bg-white/5 ${isExpanded ? "rotate-90 bg-white/5 text-[var(--color-primary)]" : ""}`}>
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Expanded Details Row */}
                                        {isExpanded && (
                                            <tr className="bg-black/40 border-t-0 shadow-inner">
                                                <td colSpan={5} className="px-6 py-6 border-b border-slate-800">
                                                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex justify-between items-center">
                                                            <span>Detalle de Entregas</span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); downloadAll(row.submissions); }}
                                                                className="flex items-center gap-1.5 text-[var(--color-primary)] hover:text-blue-400 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                                                            >
                                                                <FileDown size={14} />
                                                                <span className="text-[10px] font-black uppercase">Descargar Todo</span>
                                                            </button>
                                                        </h4>
                                                        {(row.submissions || []).length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {row.submissions.map((sub: any, i: number) => (
                                                                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-[var(--color-primary)]/50 transition-colors">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                                                                                ${sub.assignmentType === 'QUIZ' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : ''}
                                                                                ${sub.assignmentType === 'LAB' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
                                                                                ${sub.assignmentType === 'FORUM' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                                                                                ${sub.assignmentType === 'PROJECT' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                                                                                ${sub.assignmentType === 'PRACTICE' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : ''}
                                                                            `}>
                                                                                {sub.assignmentType === 'PRACTICE' ? 'PRÁCTICA' : sub.assignmentType}
                                                                            </span>
                                                                            <GradeEditor
                                                                                initialGrade={sub.grade}
                                                                                userId={row.studentId}
                                                                                dayId={sub.dayId}
                                                                            />
                                                                        </div>
                                                                        <p className="text-sm font-medium text-white line-clamp-1" title={sub.title}>{sub.title}</p>
                                                                        <div className="flex justify-between items-center mt-1">
                                                                            <p className="text-[10px] uppercase font-bold text-slate-500">
                                                                                {sub.grade === null ? "Sin Entrega" : "Entregado"}
                                                                            </p>
                                                                            {sub.content && (
                                                                                <button
                                                                                    onClick={() => handleDownload(sub.content, sub.fileName)}
                                                                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[var(--color-primary)] hover:text-white transition-colors"
                                                                                >
                                                                                    <Download size={12} />
                                                                                    Descargar
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div 
                                            className="text-[10px] text-slate-400 mt-1 line-clamp-3 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors group/f"
                                            onClick={(e) => { e.stopPropagation(); setSelectedFeedback({ sub, name: row.name }); }}
                                            title="Click para ver feedback completo"
                                        >
                                                                            {typeof sub.feedback === 'object' ? (
                                                                                <>
                                                                                    {sub.feedback.text ? sub.feedback.text : (
                                                                                        <>
                                                                                            {sub.feedback.feedback_positivo && <p><span className="text-emerald-400 font-bold">+</span> {Array.isArray(sub.feedback.feedback_positivo) ? sub.feedback.feedback_positivo[0] : sub.feedback.feedback_positivo}</p>}
                                                                                            {sub.feedback.mejoras && <p><span className="text-amber-400 font-bold">-</span> {Array.isArray(sub.feedback.mejoras) ? sub.feedback.mejoras[0] : sub.feedback.mejoras}</p>}
                                                                                        </>
                                                                                    )}
                                                                                    <div className="text-[9px] text-[var(--color-primary)] font-bold mt-1 opacity-0 group-hover/f:opacity-100 transition-opacity">VER DETALLE →</div>
                                                                                </>
                                                                            ) : (
                                                                                sub.feedback || "Sin feedback asociado a esta entrega."
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-700/50 rounded-xl bg-black/20">
                                                                No hay entregas registradas para este curso.
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredData.length === 0 && (
                    <div className="p-20 text-center">
                        <GraduationCap size={48} className="text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No se encontraron resultados para tu búsqueda.</p>
                    </div>
                )}
            </div>

            {selectedFeedback && (
                <FeedbackModal
                    isOpen={!!selectedFeedback}
                    onClose={() => setSelectedFeedback(null)}
                    studentName={selectedFeedback.name}
                    dayTitle={selectedFeedback.sub.title}
                    feedback={selectedFeedback.sub.feedback}
                    grade={selectedFeedback.sub.grade}
                />
            )}
        </div>
    );
}
