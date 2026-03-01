"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, PlayCircle, FileText, Download, MessageSquare, Send } from "lucide-react";

// Mock Data
const COURSE_DATA = {
    id: "cm7yxy1",
    title: "Mastering Next.js 15 & App Router",
    weeks: [
        {
            id: "w1",
            title: "Semana 1: Fundamentos",
            days: [
                {
                    id: "d1",
                    title: "Día 1: Introducción a Server Components",
                    videoId: "2Qp1wJv78mU", // Next.js intro example
                    resources: [
                        { id: "r1", title: "Repositorio GitHub - Día 1", type: "GITHUB", url: "#" },
                        { id: "r2", title: "Slides de la clase", type: "DRIVE", url: "#" },
                    ],
                    qna: [
                        {
                            id: "q1",
                            author: "María Pérez",
                            initials: "M",
                            content: "¿Por qué no puedo usar useState en un Server Component?",
                            time: "Hace 2 horas",
                            replies: [
                                {
                                    id: "rep1",
                                    author: "Profesor",
                                    initials: "P",
                                    content: "Porque los Server Components se ejecutan en el servidor, donde no hay interactividad del cliente (como estados o efectos). Usa 'use client' en el archivo si necesitas useState.",
                                    time: "Hace 1 hora"
                                }
                            ]
                        }
                    ]
                },
                {
                    id: "d2",
                    title: "Día 2: Data Fetching",
                    videoId: "bBcg00S5L0M",
                    resources: [],
                    qna: []
                },
            ]
        },
        {
            id: "w2",
            title: "Semana 2: Casos Avanzados",
            days: [
                {
                    id: "d3",
                    title: "Día 3: Mutaciones y Server Actions",
                    videoId: "dDpZfOQBMaU",
                    resources: [],
                    qna: []
                }
            ]
        }
    ]
};

export default function CourseViewerPage({ params }: { params: { courseId: string } }) {
    const [activeWeek, setActiveWeek] = useState(COURSE_DATA.weeks[0]);
    const [activeDay, setActiveDay] = useState(COURSE_DATA.weeks[0].days[0]);
    const [newQuestion, setNewQuestion] = useState("");

    const handlePostQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;
        // Mock posting question logic
        alert("Pregunta publicada: " + newQuestion);
        setNewQuestion("");
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Top Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-[var(--color-glass-border)] bg-[var(--color-background-dark)]/80 backdrop-blur-md px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft size={20} />
                            Volver al Dashboard
                        </Link>
                        <div className="h-6 w-px bg-slate-700 mx-2"></div>
                        <h1 className="text-xl font-bold text-white hidden sm:block">{COURSE_DATA.title}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
                            J
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8">

                {/* Left Sidebar (Navigation) */}
                <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">

                    <div className="glass-effect rounded-2xl overflow-hidden shadow-lg border border-[var(--color-glass-border)]">
                        {/* Week Selector Tabs */}
                        <div className="flex overflow-x-auto custom-scrollbar border-b border-[var(--color-glass-border)] bg-black/20">
                            {COURSE_DATA.weeks.map(week => (
                                <button
                                    key={week.id}
                                    onClick={() => {
                                        setActiveWeek(week);
                                        setActiveDay(week.days[0]);
                                    }}
                                    className={`flex-shrink-0 px-4 py-3 text-sm font-semibold transition-colors ${activeWeek.id === week.id
                                            ? "active-tab"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                        }`}
                                >
                                    {week.id.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Days List */}
                        <div className="flex flex-col p-2 gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {activeWeek.days.map((day, idx) => {
                                const isActive = activeDay.id === day.id;
                                return (
                                    <button
                                        key={day.id}
                                        onClick={() => setActiveDay(day)}
                                        className={`flex items-start text-left gap-3 p-3 rounded-xl transition-all ${isActive
                                                ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-white"
                                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                            }`}
                                    >
                                        <div className={`mt-0.5 ${isActive ? "text-[var(--color-primary)]" : "text-slate-500"}`}>
                                            <PlayCircle size={18} fill={isActive ? "currentColor" : "none"} />
                                        </div>
                                        <div>
                                            <span className="font-semibold block leading-tight text-sm mb-1">
                                                Día {idx + 1}
                                            </span>
                                            <span className="text-xs line-clamp-2 leading-snug">
                                                {day.title.replace(`Día ${idx + 1}: `, '')}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-grow flex flex-col gap-6 lg:min-w-0">

                    {/* Main Content Header */}
                    <div className="mb-2">
                        <h2 className="text-3xl font-bold text-white mb-2">{activeDay.title}</h2>
                        <p className="text-[var(--color-secondary)] font-medium text-sm tracking-wide uppercase">
                            {activeWeek.title}
                        </p>
                    </div>

                    {/* Video Player Embed */}
                    <div className="w-full aspect-video rounded-2xl overflow-hidden glass-effect border border-[var(--color-glass-border)] shadow-2xl relative">
                        <iframe
                            src={`https://www.youtube.com/embed/${activeDay.videoId}?rel=0&modestbranding=1`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full"
                        ></iframe>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Resources Column */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-2 border-b border-[var(--color-glass-border)]">
                                <FileText size={18} className="text-[var(--color-primary)]" />
                                Materiales del Día
                            </h3>

                            {activeDay.resources.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {activeDay.resources.map(res => (
                                        <a
                                            key={res.id}
                                            href={res.url}
                                            className="glass-effect p-3 rounded-xl flex items-center justify-between group hover:border-[var(--color-primary)] transition-all"
                                        >
                                            <div className="flex items-center gap-3 truncate pr-4">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-300 group-hover:text-[var(--color-primary)] transition-colors">
                                                    <Download size={14} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-200 truncate">{res.title}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-700 rounded-xl">
                                    No hay recursos adicionales para esta clase.
                                </div>
                            )}
                        </div>

                        {/* Q&A Column */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-2 border-b border-[var(--color-glass-border)]">
                                <MessageSquare size={18} className="text-[var(--color-primary)]" />
                                Foro de Preguntas
                            </h3>

                            {/* Add Question Form */}
                            <div className="glass-effect p-4 rounded-xl border border-[var(--color-glass-border)] mb-2">
                                <form onSubmit={handlePostQuestion}>
                                    <textarea
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        placeholder="Escribe tu duda aquí..."
                                        className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all min-h-[100px] resize-y"
                                        required
                                    />
                                    <div className="flex justify-end mt-3">
                                        <button
                                            type="submit"
                                            className="bg-[var(--color-primary)] hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 glow-accent text-sm flex items-center gap-2"
                                        >
                                            Publicar Pregunta
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Questions List */}
                            <div className="flex flex-col gap-4 pb-10">
                                {activeDay.qna.length > 0 ? (
                                    activeDay.qna.map(q => (
                                        <div key={q.id} className="flex flex-col gap-3">
                                            {/* Main Question */}
                                            <div className="glass-effect p-4 rounded-xl border border-[var(--color-glass-border)]">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs flex-shrink-0">
                                                        {q.initials}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-sm text-slate-200 block">{q.author}</span>
                                                        <span className="text-xs text-slate-500 block">{q.time}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-300 ml-11">{q.content}</p>
                                            </div>

                                            {/* Replies */}
                                            {q.replies.map(r => (
                                                <div key={r.id} className="ml-11 glass-effect p-4 rounded-xl border border-[var(--color-glass-border)]/50 bg-black/20">
                                                    <div className="flex items-start gap-3 mb-2">
                                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[var(--color-primary)]/30">
                                                            {r.initials}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-sm text-[var(--color-primary)] block">{r.author}</span>
                                                            <span className="text-xs text-slate-500 block">{r.time}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-300 ml-11">{r.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-slate-500 italic p-8 text-center border border-dashed border-slate-700 rounded-xl">
                                        Se el primero en hacer una pregunta en esta clase.
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
}
