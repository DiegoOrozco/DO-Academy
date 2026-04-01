"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { X, UploadCloud, FileText, Loader2, Sparkles, Download, FileDown, FileType, ChevronRight, ChevronLeft, Eye } from "lucide-react";
import { createPortal } from "react-dom";
import { customAIGradeAction } from "@/actions/admin-grading";
import { generateDocx, generatePdf, GradingResult } from "@/lib/doc-generators";

interface BatchAIGradingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BatchAIGradingModal({ isOpen, onClose }: BatchAIGradingModalProps) {
    const [mounted, setMounted] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [studentNames, setStudentNames] = useState<Record<number, string>>({});
    const [results, setResults] = useState<Record<number, GradingResult>>({});
    const [severity, setSeverity] = useState("1");
    const [isPending, startTransition] = useTransition();
    const [previewContent, setPreviewContent] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setFiles([]);
            setCurrentIndex(0);
            setStudentNames({});
            setResults({});
            setPreviewContent(null);
        }
    }, [isOpen]);

    // Update preview when current file changes
    useEffect(() => {
        if (files[currentIndex]) {
            const file = files[currentIndex];
            if (file.type.startsWith("text/") || file.name.endsWith(".py") || file.name.endsWith(".js") || file.name.endsWith(".ts") || file.name.endsWith(".sql")) {
                const reader = new FileReader();
                reader.onload = (e) => setPreviewContent(e.target?.result as string);
                reader.readAsText(file);
            } else if (file.type === "application/pdf") {
                setPreviewContent("[Vista previa de PDF no disponible en este modo, pero la IA lo analizará]");
            } else {
                setPreviewContent("[Archivo Binario / Imagen]");
            }
        } else {
            setPreviewContent(null);
        }
    }, [currentIndex, files]);

    if (!isOpen || !mounted) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setCurrentIndex(0);
        }
    };

    const handleProcessCurrent = () => {
        const file = files[currentIndex];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("severity", severity);
        formData.append("prompt", ""); // Can add a batch prompt if needed

        startTransition(async () => {
            const res = await customAIGradeAction(formData);
            if (res.success && res.result) {
                setResults(prev => ({ ...prev, [currentIndex]: res.result as GradingResult }));
            } else {
                alert("Error: " + res.error);
            }
        });
    };

    const handleNext = () => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const currentResult = results[currentIndex];
    const currentStudentName = studentNames[currentIndex] || "";

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="relative w-full max-w-6xl h-[90vh] glass-effect rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 bg-[#0f172a] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-500/20 rounded-xl">
                            <Sparkles className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Calificación IA en Lote</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Analiza múltiples entregas secuencialmente</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {files.length > 0 && (
                            <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Progreso</span>
                                <span className="text-sm font-black text-white">{currentIndex + 1} / {files.length}</span>
                            </div>
                        )}
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: File Selection & Preview */}
                    <div className="w-1/2 border-r border-white/5 flex flex-col bg-black/10">
                        {files.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 border border-purple-500/20">
                                    <UploadCloud size={40} className="text-purple-400" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Sube tus archivos</h4>
                                <p className="text-slate-400 text-sm mb-8 max-w-sm">Selecciona uno o más archivos de entrega para comenzar el proceso de calificación secuencial.</p>
                                <label className="cursor-pointer bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-purple-500/20 active:scale-95">
                                    Seleccionar Archivos
                                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Eye size={12} /> Previsualización del Documento
                                    </h4>
                                    <span className="text-[10px] font-mono text-slate-500">{files[currentIndex].name}</span>
                                </div>
                                <div className="flex-1 p-6 overflow-auto custom-scrollbar bg-black/40">
                                    <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                                        {previewContent || "Cargando previsualización..."}
                                    </pre>
                                </div>
                                <div className="p-4 bg-black/30 border-t border-white/5 flex justify-between items-center">
                                    <button 
                                        onClick={handlePrev} 
                                        disabled={currentIndex === 0}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 transition-all border border-white/10"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="flex gap-2">
                                        {files.map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-purple-500 w-4' : results[i] ? 'bg-emerald-500' : 'bg-white/20'}`}
                                            />
                                        ))}
                                    </div>
                                    <button 
                                        onClick={handleNext} 
                                        disabled={currentIndex === files.length - 1}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 transition-all border border-white/10"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Controls & Analysis */}
                    <div className="w-1/2 flex flex-col overflow-hidden bg-[#0f172a]">
                        {files.length > 0 && (
                            <div className="flex-1 overflow-auto p-8 space-y-8 custom-scrollbar">
                                {/* Student Info Section */}
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identificación del Estudiante</label>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                        <input
                                            type="text"
                                            value={currentStudentName}
                                            onChange={(e) => setStudentNames(prev => ({ ...prev, [currentIndex]: e.target.value }))}
                                            placeholder="Nombre completo del alumno..."
                                            className="relative w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-xl font-bold text-white focus:outline-none focus:border-purple-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Nivel de Exigencia</label>
                                        <select
                                            value={severity}
                                            onChange={(e) => setSeverity(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                                        >
                                            <option value="0">Nv 0: Consejos</option>
                                            <option value="1">Nv 1: Sintaxis y Básicos</option>
                                            <option value="2">Nv 2: Funcionalidad</option>
                                            <option value="3">Nv 3: Estilo y DRY</option>
                                            <option value="4">Nv 4: Profesionalismo</option>
                                            <option value="5">Nv 5: Élite Implacable</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <button
                                            onClick={handleProcessCurrent}
                                            disabled={isPending || !currentStudentName}
                                            className="w-full h-[54px] flex items-center justify-center gap-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-[0.15em] transition-all shadow-[0_10px_20px_-10px_rgba(168,85,247,0.5)] disabled:opacity-30 disabled:shadow-none"
                                        >
                                            {isPending ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                            {isPending ? "Analizando..." : "Ejecutar Análisis IA"}
                                        </button>
                                    </div>
                                </div>

                                {/* Results View */}
                                {currentResult && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-8">
                                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Resultado del Análisis</h5>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-4xl font-black text-white">{currentResult.nota}<span className="text-sm text-slate-500">/100</span></span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Comentario General</p>
                                                <p className="text-sm text-slate-300 italic leading-relaxed">{currentResult.comentario}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => generateDocx(currentResult, currentStudentName)}
                                                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 font-black text-[10px] uppercase tracking-widest transition-all"
                                                >
                                                    <FileType size={18} /> Generar Word
                                                </button>
                                                <button
                                                    onClick={() => generatePdf(currentResult, currentStudentName)}
                                                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/30 font-black text-[10px] uppercase tracking-widest transition-all"
                                                >
                                                    <FileDown size={18} /> Generar PDF
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-center pt-4">
                                            <button
                                                onClick={handleNext}
                                                disabled={currentIndex === files.length - 1}
                                                className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest border border-white/5 disabled:opacity-20 transition-all"
                                            >
                                                Siguiente Archivo
                                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {!files.length && (
                            <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-600">
                                <p className="text-xs font-bold uppercase tracking-widest italic">Esperando carga de archivos...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest max-w-sm">
                        * Los documentos se descargarán a tu dispositivo. El sistema no guarda copias de estos archivos procesados en lote para mayor privacidad.
                    </p>
                    <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-white hover:bg-white/5 transition-all text-xs uppercase border border-white/10">
                        Finalizar Sesión
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
