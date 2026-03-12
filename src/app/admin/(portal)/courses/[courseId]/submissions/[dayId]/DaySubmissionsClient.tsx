"use client";

import React, { useState, useTransition } from "react";
import { ArrowLeft, Download, FileDown, Search, User, CheckCircle2, Clock, XCircle, Cpu, Loader2, Edit2, Check } from "lucide-react";
import Link from "next/link";
import { triggerAiGradingForDay, processNextPendingSubmission } from "@/actions/admin-grading";
import { updateManualGrade, deleteSubmission } from "@/actions/admin-grades";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface StudentSubmission {
    studentId: string;
    studentName: string;
    submissionId: string | null;
    content: string | null;
    fileName: string | null;
    status: string;
    grade: number | null | undefined;
    createdAt: Date | null;
}

function GradeEditor({ initialGrade, userId, dayId }: { initialGrade: number | null | undefined, userId: string, dayId: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [grade, setGrade] = useState(initialGrade !== null && initialGrade !== undefined ? String(initialGrade) : "");
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        const numGrade = Number(grade);
        if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) return;

        startTransition(async () => {
            const res = await updateManualGrade(userId, dayId, numGrade);
            if (res.success) {
                setIsEditing(false);
            } else {
                alert("Error al guardar nota: " + res.error);
            }
        });
    };

    if (isEditing) {
        return (
            <div className="flex items-center justify-center gap-2">
                <input
                    type="number"
                    min="0" max="100"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-14 bg-black/40 border border-[var(--color-primary)]/50 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-[var(--color-primary)]"
                    disabled={isPending}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors disabled:opacity-50"
                >
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-2 group/edit">
            <span className={`text-sm font-mono font-bold ${initialGrade !== null && initialGrade !== undefined ? 'text-white' : 'text-slate-500'}`}>
                {initialGrade !== null && initialGrade !== undefined ? `${initialGrade}/100` : "-/100"}
            </span>
            <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-md text-slate-500 hover:text-[var(--color-primary)] hover:bg-white/5 transition-all opacity-0 group-hover/edit:opacity-100"
                title="Editar Nota"
            >
                <Edit2 size={12} />
            </button>
        </div>
    );
}

export default function DaySubmissionsClient({
    courseId,
    dayId,
    courseTitle,
    dayTitle,
    initialData
}: {
    courseId: string;
    dayId: string;
    courseTitle: string;
    dayTitle: string;
    initialData: StudentSubmission[];
}) {
    const [search, setSearch] = useState("");
    const [isAiGrading, setIsAiGrading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const filteredData = initialData.filter(s =>
        s.studentName.toLowerCase().includes(search.toLowerCase())
    );

    const handleDeleteSubmission = async (studentId: string) => {
        if (!confirm("¿Seguro que deseas ELIMINAR la entrega de este estudiante? El archivo se borrará permanentemente de la nube y el estudiante podrá volver a subir su tarea.")) {
            return;
        }

        setIsDeleting(studentId);
        try {
            const res = await deleteSubmission(studentId, dayId);
            if (res.success) {
                // Success: revalidation will update the UI
            } else {
                alert("Error al eliminar: " + res.error);
            }
        } catch (error) {
            alert("Error de conexión.");
        } finally {
            setIsDeleting(null);
        }
    };

    const router = useRouter();

    const [processingUser, setProcessingUser] = useState<string | null>(null);

    const handleAiGrading = async () => {
        if (!confirm("¿Deseas iniciar la revisión con IA para todas las entregas de este día? El proceso se ejecutará estudiante por estudiante para asegurar la calidad.")) {
            return;
        }

        setIsAiGrading(true);
        setProcessingUser("Iniciando cola...");
        try {
            // 1. Mark as PENDING
            const triggerRes: any = await triggerAiGradingForDay(dayId);
            if (!triggerRes.success) {
                alert("Error al iniciar: " + triggerRes.error);
                setIsAiGrading(false);
                setProcessingUser(null);
                return;
            }

            const pendingCount = triggerRes.totalPending || 0;
            if (pendingCount === 0) {
                alert("No hay entregas para calificar en este día.");
                setIsAiGrading(false);
                setProcessingUser(null);
                return;
            }

            // 2. Process one-by-one on the client to avoid timeouts
            let processed = 0;
            let finished = false;

            while (!finished) {
                setProcessingUser(`Buscando siguiente entrega (${processed + 1}/${pendingCount})...`);
                const res: any = await processNextPendingSubmission(dayId);

                if (res.processed) {
                    processed++;
                    // Try to find the student name if returned (need to update action if possible)
                    setProcessingUser(`Calificando entrega ${processed}...`);
                    router.refresh(); // Refresh UI to show the new grade in table
                } else {
                    finished = true;
                    if (res.quotaExceeded) {
                        alert("Cuota de IA excedida. El proceso se detendrá, pero las entregas restantes siguen en cola.");
                    }
                }
            }

            alert(`Proceso finalizado. Se han procesado las entregas de este día.`);
        } catch (error) {
            console.error("AI Grading failed:", error);
            alert("Error de conexión durante el proceso.");
        } finally {
            setIsAiGrading(false);
            setProcessingUser(null);
            router.refresh();
        }
    };

    const handleDownload = (sub: StudentSubmission) => {
        if (!sub.content) return;

        const studentCleanName = sub.studentName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
        const dayCleanTitle = dayTitle.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

        // Determinar extensión
        let extension = "txt";
        if (sub.fileName?.includes(".")) {
            extension = sub.fileName.split(".").pop() || "txt";
        } else if (sub.content.startsWith("http") && sub.content.includes(".pdf")) {
            extension = "pdf";
        }

        const newFileName = `${studentCleanName}_${dayCleanTitle}.${extension}`;

        if (sub.content.startsWith("http")) {
            fetch(sub.content)
                .then(resp => resp.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.style.display = "none";
                    a.href = url;
                    a.download = newFileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                })
                .catch(() => {
                    window.open(sub.content!, "_blank");
                });
        } else {
            const blob = new Blob([sub.content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = newFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const downloadAll = () => {
        const submissions = filteredData.filter(s => s.content);
        if (submissions.length === 0) {
            alert("No hay entregas para descargar.");
            return;
        }

        if (confirm(`¿Descargar ${submissions.length} entregas? El navegador puede pedirte permiso para descargas múltiples.`)) {
            submissions.forEach((sub, index) => {
                setTimeout(() => {
                    handleDownload(sub);
                }, index * 500);
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <Link
                        href={`/admin/courses/${courseId}`}
                        className="inline-flex items-center gap-2 text-xs text-[var(--color-primary)] hover:text-white transition-colors mb-2 font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft size={14} /> Volver al Curso
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-1">Entregas: {dayTitle}</h1>
                    <p className="text-sm text-slate-400">{courseTitle}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={handleAiGrading}
                        disabled={isAiGrading}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 min-w-[200px]"
                    >
                        {isAiGrading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {processingUser || "Procesando..."}
                            </>
                        ) : (
                            <>
                                <Cpu size={18} />
                                Revisión IA (Cola)
                            </>
                        )}
                    </button>

                    <button
                        onClick={downloadAll}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all glow-accent"
                    >
                        <FileDown size={18} />
                        Descargar Todo ({initialData.filter(s => s.content).length})
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Buscar estudiante..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                />
            </div>

            {/* Table */}
            <div className="glass-effect rounded-2xl border border-[var(--color-glass-border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 uppercase tracking-widest text-[10px] font-black text-slate-400">
                                <th className="px-6 py-4">Estudiante</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Nota</th>
                                <th className="px-6 py-4 text-center">Fecha</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredData.map((row) => (
                                <tr key={row.studentId} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-[var(--color-primary)]/20 group-hover:text-[var(--color-primary)] transition-all">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{row.studentName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {row.status === "PENDING" ? (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider animate-pulse">
                                                <Clock size={12} /> Pendiente IA
                                            </span>
                                        ) : row.content ? (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                                <CheckCircle2 size={12} /> Entregado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/10 uppercase tracking-wider">
                                                <XCircle size={12} /> No Entrega
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <GradeEditor
                                            initialGrade={row.grade}
                                            userId={row.studentId}
                                            dayId={dayId}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs text-slate-400 font-mono">
                                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {row.content && (
                                                <button
                                                    onClick={() => handleDownload(row)}
                                                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[var(--color-primary)] hover:text-white transition-colors bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10 hover:border-blue-500/30"
                                                >
                                                    <Download size={14} /> Descargar
                                                </button>
                                            )}

                                            {row.submissionId && (
                                                <button
                                                    onClick={() => handleDeleteSubmission(row.studentId)}
                                                    disabled={isDeleting === row.studentId}
                                                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-400 hover:text-white transition-colors bg-rose-500/5 px-3 py-1.5 rounded-lg border border-rose-500/10 hover:border-rose-500/30 disabled:opacity-50"
                                                    title="Eliminar entrega"
                                                >
                                                    {isDeleting === row.studentId ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredData.length === 0 && (
                    <div className="p-10 text-center text-slate-500 italic">
                        No se encontraron estudiantes registrados.
                    </div>
                )}
            </div>
        </div>
    );
}
