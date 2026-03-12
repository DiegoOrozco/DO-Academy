"use client";

import React, { useState } from "react";
import { ArrowLeft, Download, FileDown, Search, User, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";

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

    const filteredData = initialData.filter(s =>
        s.studentName.toLowerCase().includes(search.toLowerCase())
    );

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
            // Vercel Blob o URL externa
            // Para forzar la descarga con nombre personalizado desde el navegador con una URL externa
            // a veces necesitamos usar un fetch si el CORS lo permite, o simplemente abrirlo.
            // Pero como queremos el nombre específico:
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
                    // Fallback si falla fetch (CORS)
                    window.open(sub.content!, "_blank");
                });
        } else {
            // Contenido de texto (Código)
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
                }, index * 500); // 500ms delay to avoid browser blocking
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                <button
                    onClick={downloadAll}
                    className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all glow-accent mt-2 sm:mt-0"
                >
                    <FileDown size={18} />
                    Descargar Todo ({filteredData.filter(s => s.content).length})
                </button>
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
                                    {row.content ? (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                            <CheckCircle2 size={12} /> Entregado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/10 uppercase tracking-wider">
                                            <XCircle size={12} /> Pendiente
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-mono font-bold text-white">
                                        {row.grade !== null && row.grade !== undefined ? `${row.grade}/100` : "-"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center text-xs text-slate-400">
                                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {row.content && (
                                        <button
                                            onClick={() => handleDownload(row)}
                                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[var(--color-primary)] hover:text-white transition-colors bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10 hover:border-blue-500/30"
                                        >
                                            <Download size={14} /> Descargar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredData.length === 0 && (
                    <div className="p-10 text-center text-slate-500 italic">
                        No se encontraron estudiantes.
                    </div>
                )}
            </div>
        </div>
    );
}
