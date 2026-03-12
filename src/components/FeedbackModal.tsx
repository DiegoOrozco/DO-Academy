"use client";

import { X, CheckCircle2, AlertCircle, MessageSquare, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    dayTitle: string;
    feedback: any;
    grade: number | null | undefined;
}

export default function FeedbackModal({
    isOpen,
    onClose,
    studentName,
    dayTitle,
    feedback,
    grade
}: FeedbackModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const isObject = typeof feedback === 'object' && feedback !== null;
    const comment = isObject ? feedback.comentario || feedback.text : feedback;
    const positives = isObject ? (Array.isArray(feedback.feedback_positivo) ? feedback.feedback_positivo : []) : [];
    const improvements = isObject ? (Array.isArray(feedback.mejoras) ? feedback.mejoras : []) : [];

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-2xl glass-effect rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200 bg-[#0f172a]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{studentName}</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{dayTitle}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                             <div className={`text-2xl font-black ${(grade ?? 0) >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {grade !== null && grade !== undefined ? `${grade}/100` : "-/100"}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Nota Final</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-xl border border-white/5"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 custom-scrollbar">
                    {/* General Comment */}
                    {comment && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <MessageSquare size={18} />
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400/80">Comentario General</h4>
                            </div>
                            <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-slate-300 text-sm leading-relaxed italic">
                                "{comment}"
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Positives */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle2 size={18} />
                                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400/80">Aspectos Positivos</h4>
                            </div>
                            <div className="space-y-3">
                                {positives.length > 0 ? positives.map((p: string, i: number) => (
                                    <div key={i} className="flex gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-100/90 text-sm">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        {p}
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-xs italic">No se registraron aspectos positivos destacados.</p>
                                )}
                            </div>
                        </div>

                        {/* Improvements */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertCircle size={18} />
                                <h4 className="text-xs font-black uppercase tracking-widest text-amber-400/80">Oportunidades de Mejora</h4>
                            </div>
                            <div className="space-y-3">
                                {improvements.length > 0 ? improvements.map((p: string, i: number) => (
                                    <div key={i} className="flex gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-amber-100/90 text-sm">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                        {p}
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-xs italic">No se detectaron mejoras críticas necesarias.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Technical Summary / Plagiarism check hint */}
                    {isObject && feedback.resumen_codigo && (
                        <div className="space-y-2 pt-4 border-t border-white/5">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Firma Técnica del Código</h4>
                            <p className="text-[10px] text-slate-500 font-mono bg-black/20 p-3 rounded-lg border border-white/5 uppercase tracking-tighter">
                                {feedback.resumen_codigo}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95"
                    >
                        Cerrar Vista
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
