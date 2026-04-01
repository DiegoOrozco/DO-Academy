"use client";

import { X, Play, FileText, CheckCircle2, Calendar, Layout, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Day {
    id: string;
    title: string;
    order: number;
}

interface Week {
    id: string;
    title: string;
    days: Day[];
}

interface CoursePreviewModalProps {
    course: {
        id: string;
        title: string;
        description: string | null;
        thumbnail: string | null;
        weeks?: Week[];
    };
    onClose: () => void;
    student: any;
}

export default function CoursePreviewModal({ course, onClose, student }: CoursePreviewModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Fully prevent scroll
        document.body.style.overflow = "hidden";
        document.body.style.height = "100vh";
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        
        return () => {
            document.body.style.overflow = "auto";
            document.body.style.height = "auto";
            window.removeEventListener("keydown", handleEsc);
        };
    }, [onClose]);

    if (!course || !mounted) return null;

    const modalContent = (
        <div 
            className="fixed inset-0 flex items-center justify-center p-4 md:p-12"
            style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            {/* Backdrop: SOLID BLACK with slight opacity for ultra focus */}
            <div 
                className="absolute inset-0 bg-[#000000] opacity-98 backdrop-blur-3xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Main Modal Container */}
            <div 
                className="relative w-full max-w-[1200px] h-full max-h-[90vh] bg-[#09090b] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col lg:flex-row animate-in zoom-in-95 scale-in-95 fade-in duration-500"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
                {/* Close Button UI */}
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 z-[100] w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-[#cde641] border border-white/10 rounded-full transition-all duration-500 hover:rotate-90 group shadow-2xl"
                >
                    <X size={28} className="text-white group-hover:text-black transition-colors" />
                </button>

                {/* LEFT SIDE: Identity & Features */}
                <div className="w-full lg:w-[42%] flex flex-col border-r border-white/5 h-full bg-gradient-to-b from-[#111115] to-[#09090b] overflow-y-auto custom-scrollbar">
                    {/* Course Visual */}
                    <div className="relative aspect-[16/10] lg:aspect-auto lg:h-[450px] overflow-hidden group">
                        {course.thumbnail ? (
                            <Image 
                                src={course.thumbnail} 
                                alt={course.title} 
                                fill 
                                className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                                <span className="text-[140px] font-black text-white/5 select-none">{course.title.charAt(0)}</span>
                            </div>
                        )}
                        
                        {/* Overlay Gradients */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />

                        {/* Floating Play Icon */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-24 h-24 rounded-full bg-[#cde641] text-black flex items-center justify-center shadow-[0_0_50px_rgba(205,230,65,0.4)] scale-110 animate-pulse-subtle">
                                <Play size={36} fill="currentColor" strokeWidth={0} />
                            </div>
                        </div>
                    </div>

                    <div className="p-10 lg:p-14 space-y-10 flex-1 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#cde641]/10 border border-[#cde641]/20 rounded-full">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#cde641] px-1">Academy Pro</span>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-[0.9] text-white">
                                {course.title}
                            </h2>
                            <p className="text-lg leading-relaxed text-white/50 font-medium">
                                {course.description || "Desarrolla habilidades de élite con una metodología basada en proyectos de alto rendimiento."}
                            </p>
                        </div>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-y border-white/5">
                            {[
                                { icon: Layout, text: "Acceso total" },
                                { icon: Calendar, text: "A tu ritmo" },
                                { icon: Award, text: "Certificado" },
                                { icon: Play, text: "Video HD" }
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <f.icon size={16} className="text-[#cde641]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">{f.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8">
                            <Link
                                href={student ? `/course/${course.id}/unlock` : `/register?courseId=${course.id}`}
                                className="raw-btn-primary w-full py-7 text-[13px] shadow-[0_25px_50px_rgba(205,230,65,0.25)] hover:bg-[#ffffff] hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {student ? "INSCRIBIRME AHORA →" : "INICIAR MI CAMINO →"}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Dynamic Syllabus Content */}
                <div className="flex-1 flex flex-col h-full bg-[#050508] overflow-hidden">
                    <div className="p-10 lg:p-14 border-b border-white/5 bg-gradient-to-r from-black/20 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[#cde641]/5 flex items-center justify-center border border-[#cde641]/20 shadow-inner">
                                <FileText size={24} className="text-[#cde641]" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black tracking-[0.3em] text-[#cde641] opacity-70 uppercase mb-1 block">Syllabus_</span>
                                <h3 className="text-xl font-black tracking-tight text-white uppercase">Estructura del Programa</h3>
                            </div>
                        </div>
                        <div className="hidden lg:flex flex-col items-end opacity-20">
                            <span className="text-[10px] font-black uppercase tracking-widest">DO ACADEMY</span>
                            <span className="text-[8px] font-medium uppercase tracking-widest">Technical Preview v2.1</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 lg:p-14 custom-scrollbar">
                        <div className="space-y-16">
                            {course.weeks && course.weeks.length > 0 ? (
                                course.weeks.map((week, idx) => (
                                    <div key={week.id} className="relative group/week">
                                        {/* Vertical connector line */}
                                        <div className="absolute left-6 top-14 bottom-[-40px] w-px bg-gradient-to-b from-white/10 to-transparent last:hidden" />
                                        
                                        <div className="flex items-center gap-6 mb-10">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-[#cde641] border border-white/10 shadow-lg group-hover/week:border-[#cde641]/50 transition-all duration-500">
                                                {String(idx + 1).padStart(2, '0')}
                                            </div>
                                            <h4 className="text-sm font-black uppercase tracking-[0.25em] text-white/90">
                                                {week.title}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 pl-16">
                                            {week.days.map((day) => (
                                                <div 
                                                    key={day.id} 
                                                    className="flex items-center gap-6 p-6 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/20 transition-all cursor-default group/day"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[10px] font-black text-white/20 border border-white/5 group-hover/day:border-[#cde641]/40 group-hover/day:text-[#cde641] transition-all">
                                                        {day.order}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-white/60 group-hover/day:text-white transition-colors">
                                                            {day.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-1 h-1 rounded-full bg-[#cde641] animate-pulse" />
                                                            <span className="text-[9px] uppercase tracking-widest text-[#cde641] font-bold opacity-60">Mastery Lesson</span>
                                                        </div>
                                                    </div>
                                                    <div className="opacity-0 group-hover/day:opacity-100 transition-opacity">
                                                        <Play size={14} className="text-[#cde641]" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-40 flex flex-col items-center justify-center opacity-10 text-center">
                                    <Layout size={80} strokeWidth={0.5} className="mb-8" />
                                    <p className="text-xs font-black uppercase tracking-[0.5em]">Content Pending</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
