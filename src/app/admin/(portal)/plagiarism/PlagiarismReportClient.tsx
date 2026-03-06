"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Users, Code, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import { detectPlagiarism } from "@/actions/plagiarism";

export default function PlagiarismReportClient({ dayId, dayTitle }: { dayId: string, dayTitle: string }) {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReports() {
            const res = await detectPlagiarism(dayId);
            if (res.success) {
                setReports(res.similarities || []);
            } else {
                setError(res.error || "Error al cargar reporte");
            }
            setIsLoading(false);
        }
        fetchReports();
    }, [dayId]);

    if (isLoading) return <div className="p-10 text-center animate-pulse text-slate-500 uppercase tracking-widest font-bold">Analizando similitudes...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <ShieldAlert size={32} className="text-rose-500" />
                        Reporte de Plagio
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Análisis de originalidad para: <span className="text-emerald-400">{dayTitle}</span></p>
                </div>
                <div className="flex items-center gap-4 bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-700/50">
                    <div className="text-center border-r border-slate-700 px-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase">Alertas</p>
                        <p className="text-xl font-black text-rose-500">{reports.filter(r => r.similarity > 80).length}</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase">Total Cruces</p>
                        <p className="text-xl font-black text-white">{reports.length}</p>
                    </div>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="p-20 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-3xl text-center">
                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No se detectó plagio</h3>
                    <p className="text-slate-400 mt-2">Todos los alumnos han entregado códigos con baja similitud entre sí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reports.map((report, idx) => (
                        <div key={idx} className={`glass-effect rounded-2xl border transition-all overflow-hidden ${report.similarity > 85 ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-700/50 bg-white/5'
                            }`}>
                            <div className="p-6 flex items-center justify-between bg-black/20">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="text-slate-500" />
                                        <span className="font-bold text-white">{report.studentA}</span>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-600" />
                                    <div className="flex items-center gap-3">
                                        <Users size={18} className="text-slate-500" />
                                        <span className="font-bold text-white">{report.studentB}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${report.similarity > 85 ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-amber-500/20 text-amber-500'
                                        }`}>
                                        {report.similarity}% Similitud
                                    </div>
                                    {report.similarity > 85 && <AlertTriangle size={20} className="text-rose-500 animate-pulse" />}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 h-64 border-t border-slate-700/50">
                                <div className="p-4 bg-black/40 overflow-auto border-r border-slate-700/50 font-mono text-[11px] text-slate-300">
                                    <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <Code size={12} /> Código de {report.studentA}
                                    </div>
                                    <pre>{report.codeA}</pre>
                                </div>
                                <div className="p-4 bg-black/40 overflow-auto font-mono text-[11px] text-slate-300">
                                    <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <Code size={12} /> Código de {report.studentB}
                                    </div>
                                    <pre>{report.codeB}</pre>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
