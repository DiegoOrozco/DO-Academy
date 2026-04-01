"use client";

import { useState, useTransition, useEffect } from "react";
import { X, UploadCloud, FileText, Loader2, Sparkles, Download, FileDown, FileType } from "lucide-react";
import { createPortal } from "react-dom";
import { customAIGradeAction } from "@/actions/admin-grading";
import { generateDocx, generatePdf, GradingResult } from "@/lib/doc-generators";

interface AIGradingUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName?: string;
}

export default function AIGradingUploadModal({ isOpen, onClose, studentName }: AIGradingUploadModalProps) {
    const [mounted, setMounted] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [severity, setSeverity] = useState("1");
    const [prompt, setPrompt] = useState("");
    const [isPending, startTransition] = useTransition();
    const [lastResult, setLastResult] = useState<GradingResult | null>(null);
    const [inputStudentName, setInputStudentName] = useState(studentName || "");

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setInputStudentName(studentName || "");
            setLastResult(null);
            setFile(null);
        }
    }, [isOpen, studentName]);

    if (!isOpen || !mounted) return null;

    const handleUpload = () => {
        if (!file) return alert("Selecciona un archivo primero.");
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("severity", severity);
        formData.append("prompt", prompt);

        startTransition(async () => {
            const res = await customAIGradeAction(formData);
            if (res.success && res.result) {
                setLastResult(res.result as GradingResult);
                alert("Análisis completado. Puedes descargar los documentos ahora.");
            } else {
                alert("Error: " + res.error);
            }
        });
    };

    const handleDocx = async () => {
        if (lastResult) {
            await generateDocx(lastResult, inputStudentName);
        }
    };

    const handlePdf = () => {
        if (lastResult) {
            generatePdf(lastResult, inputStudentName);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative w-full max-w-lg glass-effect rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200 bg-[#0f172a]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                            <Sparkles className="text-purple-400" size={20} />
                            Evaluación IA Personalizada
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">Genera retroalimentación automática y descarga en Word/PDF.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Nombre del Estudiante</label>
                        <input
                            type="text"
                            value={inputStudentName}
                            onChange={(e) => setInputStudentName(e.target.value)}
                            placeholder="Nombre completo"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Archivo de Entrega</label>
                        <div className="relative group p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/50 bg-black/40 text-center transition-all cursor-pointer">
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-2 text-purple-400">
                                    <FileText size={32} />
                                    <p className="text-sm font-bold truncate max-w-[250px]">{file.name}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-purple-400 transition-colors">
                                    <UploadCloud size={32} />
                                    <p className="text-sm font-bold">Selecciona el archivo</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Instrucciones Especiales y/o Enunciado</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Añade el enunciado del problema, reglas o detalles específicos a revisar (ej. Revisa miniciosamente variables en inglés)..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all min-h-[100px] resize-y custom-scrollbar"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Exigencia</label>
                            <select
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                            >
                                <option value="0">Nv 0: Consejos</option>
                                <option value="1">Nv 1: Sintaxis</option>
                                <option value="2">Nv 2: Funcional</option>
                                <option value="3">Nv 3: Académico</option>
                                <option value="4">Nv 4: Profesional</option>
                                <option value="5">Nv 5: Élite</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Acción</label>
                            <button
                                onClick={handleUpload}
                                disabled={isPending || !file}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
                            >
                                {isPending ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                {isPending ? "Analizando..." : "Analizar con IA"}
                            </button>
                        </div>
                    </div>

                    {lastResult && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in zoom-in-95">
                            <p className="text-center text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">¡Análisis Listo! Descargar en:</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleDocx}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all"
                                >
                                    <FileType size={16} /> Word (.docx)
                                </button>
                                <button
                                    onClick={handlePdf}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all"
                                >
                                    <FileDown size={16} /> PDF (.pdf)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-all text-xs uppercase">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
