"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, PlayCircle, FileText, Download, MessageSquare, Send, User, Menu, X, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { createPost } from "@/actions/forum";
import DayDelivery from "@/components/DayDelivery";

export default function CourseViewerClient({ course, studentId }: { course: any, studentId: string }) {
    // If course has no weeks, safely fallback so UI doesn't crash
    const initialWeek = course.weeks?.[0] || { id: "0", title: "No content", days: [] };
    const initialDay = initialWeek.days?.[0] || { id: "0", title: "No content", videoId: "", materialUrl: "", posts: [], replies: [] };

    const [activeWeek, setActiveWeek] = useState(initialWeek);
    const [activeDay, setActiveDay] = useState(initialDay);
    const [newQuestion, setNewQuestion] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Sync active day with fresh server props to update comments automatically
    const dayFromCourse = course.weeks?.find((w: any) => w.id === activeWeek.id)?.days?.find((d: any) => d.id === activeDay.id);
    const activeDayData = dayFromCourse || activeDay;

    // Prevent hydration mismatches with dates and complex UI
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const formatDate = (date: any) => {
        if (!isMounted || !date) return "...";
        try {
            return new Date(date).toLocaleDateString();
        } catch {
            return "...";
        }
    };

    const handlePostQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim() || isPosting) return;

        setIsPosting(true);
        const res = await createPost(activeDayData.id, studentId, newQuestion, course.id);
        setIsPosting(false);

        if (res.success) {
            setNewQuestion("");
        } else {
            alert("Error publicando pregunta: " + res.error);
        }
    };

    // Accurate video progress via YouTube IFrame API
    const playerRef = useRef<any>(null);
    const playerDivRef = useRef<HTMLDivElement | null>(null);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastSentAtRef = useRef<number>(0);
    const lastSecondsRef = useRef<number>(0);
    const [usePlainIframe, setUsePlainIframe] = useState(false);

    const sendProgress = async (seconds: number, percent: number | null) => {
        const now = Date.now();
        // throttle ~4s or if almost identical second
        if (now - lastSentAtRef.current < 4000 && Math.abs(seconds - lastSecondsRef.current) < 1) return;
        lastSentAtRef.current = now;
        lastSecondsRef.current = seconds;
        try {
            await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dayId: activeDay.id, seconds: Math.floor(seconds), percent: percent ?? undefined })
            });
        } catch { }
    };

    const startPolling = () => {
        stopPolling();
        pollTimerRef.current = setInterval(() => {
            const p: any = playerRef.current;
            if (!p || typeof p.getCurrentTime !== "function") return;
            const sec = p.getCurrentTime() || 0;
            const dur = p.getDuration && p.getDuration() ? p.getDuration() : 0;
            const pct = dur > 0 ? Math.min(100, Math.round((sec / dur) * 100)) : null;
            sendProgress(sec, pct);
        }, 5000);
    };

    const stopPolling = () => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    };

    // Load YT script and instantiate player per active day
    useEffect(() => {
        if (!activeDay.videoId) return;
        let cancelled = false;

        const ensureYT = () => new Promise<void>((resolve) => {
            const w = window as any;
            if (w.YT && w.YT.Player) return resolve();
            // Avoid duplicate script tags
            if (!document.getElementById("yt-iframe-api")) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                tag.id = "yt-iframe-api";
                document.body.appendChild(tag);
            }
            const onReady = () => resolve();
            if (!w.onYouTubeIframeAPIReady) w.onYouTubeIframeAPIReady = onReady;
            else {
                const prev = w.onYouTubeIframeAPIReady;
                w.onYouTubeIframeAPIReady = () => { prev(); onReady(); };
            }
        });

        (async () => {
            try {
                await ensureYT();
                if (cancelled || !playerDivRef.current) return;
                try { playerRef.current?.destroy?.(); } catch { }
                playerRef.current = new (window as any).YT.Player(playerDivRef.current, {
                    videoId: activeDay.videoId,
                    playerVars: { rel: 0, modestbranding: 1 },
                    events: {
                        onReady: () => { startPolling(); },
                        onStateChange: (e: any) => {
                            const YT = (window as any).YT;
                            const p: any = playerRef.current;
                            const sec = p?.getCurrentTime ? p.getCurrentTime() : 0;
                            const dur = p?.getDuration ? p.getDuration() : 0;
                            const pct = dur > 0 ? Math.min(100, Math.round((sec / dur) * 100)) : null;
                            if (e.data === YT.PlayerState.PLAYING) startPolling();
                            else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.BUFFERING) { stopPolling(); sendProgress(sec, pct); }
                            else if (e.data === YT.PlayerState.ENDED) { stopPolling(); sendProgress(dur || sec, 100); }
                        }
                    }
                });
            } catch (err) {
                // If anything goes wrong, fall back to a plain iframe (no tracking)
                setUsePlainIframe(true);
            }
        })();

        return () => {
            cancelled = true;
            stopPolling();
            try { playerRef.current?.destroy?.(); } catch { }
            playerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDay.id, activeDay.videoId]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Top Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-[var(--color-glass-border)] bg-[var(--color-background-dark)]/80 backdrop-blur-md px-4 sm:px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <Link
                            href="/"
                            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 flex-shrink-0"
                        >
                            <ChevronLeft size={20} />
                            <span className="hidden xs:block">Catálogo</span>
                        </Link>
                        <div className="h-6 w-px bg-slate-700 mx-1 sm:mx-2 flex-shrink-0"></div>
                        <h1 className="text-sm sm:text-lg md:text-xl font-bold text-white truncate">{course.title}</h1>
                    </div>

                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden flex items-center gap-2 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-3 py-1.5 rounded-lg border border-[var(--color-primary)]/20 transition-all text-xs font-bold"
                    >
                        <BookOpen size={16} />
                        <span className="hidden sm:inline">Ver Contenido</span>
                    </button>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 relative">

                {/* Mobile Sidebar Overlay (Backdrop) */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Left Sidebar (Navigation) - Becomes a Drawer on Mobile */}
                <div className={`fixed inset-y-0 left-0 w-[280px] sm:w-80 bg-[var(--color-background-dark)] z-[70] lg:relative lg:z-10 lg:w-80 flex-shrink-0 flex flex-col gap-4 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                    }`}>
                    <div className="lg:hidden p-4 border-b border-[var(--color-glass-border)] flex items-center justify-between">
                        <span className="font-bold text-white uppercase tracking-widest text-xs">Contenido del Curso</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="glass-effect rounded-none lg:rounded-2xl overflow-hidden shadow-lg border-0 lg:border border-[var(--color-glass-border)] h-full lg:h-auto flex flex-col bg-slate-900/40">
                        <div className="p-4 border-b border-[var(--color-glass-border)] bg-black/20">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Contenido del Curso</h3>
                        </div>

                        <div className="flex flex-col overflow-y-auto custom-scrollbar flex-grow max-h-[calc(100vh-250px)] lg:max-h-[600px]">
                            {course.weeks?.map((week: any, wIdx: number) => {
                                const isCurrentWeek = activeWeek.id === week.id;
                                return (
                                    <div key={week.id} className="border-b border-slate-800/50 last:border-b-0">
                                        {/* Week Header / Toggle */}
                                        <button
                                            onClick={() => {
                                                setActiveWeek(week);
                                                // If switching to a week that's not current, pick its first day
                                                if (!isCurrentWeek) {
                                                    setActiveDay(week.days?.[0] || initialDay);
                                                }
                                            }}
                                            className={`w-full flex items-center justify-between p-4 text-left transition-all hover:bg-white/5 ${isCurrentWeek ? "bg-[var(--color-primary)]/5" : ""
                                                }`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrentWeek ? "text-[var(--color-primary)]" : "text-slate-500"
                                                    }`}>
                                                    Semana {wIdx + 1}
                                                </span>
                                                <span className={`font-bold text-sm leading-tight ${isCurrentWeek ? "text-white" : "text-slate-300"
                                                    }`}>
                                                    {week.title}
                                                </span>
                                            </div>
                                            <div className={`${isCurrentWeek ? "text-[var(--color-primary)]" : "text-slate-600"}`}>
                                                {isCurrentWeek ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </div>
                                        </button>

                                        {/* Days List (Collapsible) */}
                                        {isCurrentWeek && (
                                            <div className="bg-black/20 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                                {week.days?.map((day: any, dIdx: number) => {
                                                    const isActive = activeDay.id === day.id;
                                                    return (
                                                        <button
                                                            key={day.id}
                                                            onClick={() => {
                                                                setActiveDay(day);
                                                                if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                                            }}
                                                            className={`w-full flex items-start text-left gap-3 p-3 rounded-xl transition-all ${isActive
                                                                ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-white shadow-inner"
                                                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                                                }`}
                                                        >
                                                            <div className={`mt-0.5 ${isActive ? "text-[var(--color-primary)] shadow-glow-sm" : "text-slate-600"}`}>
                                                                <PlayCircle size={16} fill={isActive ? "currentColor" : "none"} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                                                                    Día {dIdx + 1}
                                                                </span>
                                                                <span className="text-sm font-medium line-clamp-2 leading-snug">
                                                                    {day.title}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-grow flex flex-col gap-6 lg:min-w-0">

                    {/* Main Content Header */}
                    <div className="mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                            <p className="text-[var(--color-secondary)] font-bold text-[10px] md:text-sm tracking-[0.2em] uppercase">
                                {activeWeek.title}
                            </p>
                            <span className="hidden sm:block text-slate-700">•</span>
                            <p className="text-slate-400 text-[10px] md:text-sm font-semibold">Día {activeWeek.days?.indexOf(activeDay) + 1}</p>
                        </div>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight">{activeDay.title}</h2>
                    </div>

                    {/* Video Player Embed */}
                    <div className="w-full aspect-video rounded-2xl overflow-hidden glass-effect border border-[var(--color-glass-border)] shadow-2xl relative bg-black/40">
                        {!isMounted ? (
                            <div className="absolute top-0 left-0 w-full h-full bg-black/20 animate-pulse" />
                        ) : activeDay.videoId ? (
                            usePlainIframe ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${activeDay.videoId}?rel=0&modestbranding=1`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute top-0 left-0 w-full h-full"
                                />
                            ) : (
                                <div ref={playerDivRef} className="absolute top-0 left-0 w-full h-full" />
                            )
                        ) : (
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-slate-500 bg-black/50">
                                No hay video disponible
                            </div>
                        )}
                    </div>
                    {/* Delivery Section (AI Grading) */}
                    <DayDelivery
                        day={activeDayData}
                        studentId={studentId}
                        initialSubmission={activeDayData.submissions?.[0]}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Resources Column */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-2 border-b border-[var(--color-glass-border)]">
                                <FileText size={18} className="text-[var(--color-primary)]" />
                                Materiales del Día
                            </h3>

                            {activeDay.materialUrl ? (
                                <div className="flex flex-col gap-3">
                                    <a
                                        href={activeDay.materialUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="glass-effect p-3 rounded-xl flex items-center justify-between group hover:border-[var(--color-primary)] transition-all"
                                    >
                                        <div className="flex items-center gap-3 truncate pr-4">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-300 group-hover:text-[var(--color-primary)] transition-colors">
                                                <Download size={14} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-200 truncate">Repositorio / Material</span>
                                        </div>
                                    </a>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 italic p-4 text-center border border-dashed border-slate-700 rounded-xl">
                                    No hay recursos adicionales.
                                </div>
                            )}
                        </div>

                        {/* Q&A Column placeholder */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-2 border-b border-[var(--color-glass-border)]">
                                <MessageSquare size={18} className="text-[var(--color-primary)]" />
                                Foro de Preguntas
                            </h3>

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
                                            disabled={isPosting}
                                            className="bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 glow-accent text-sm flex items-center gap-2"
                                        >
                                            {isPosting ? "Publicando..." : "Publicar Pregunta"}
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Posts List */}
                            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {(activeDayData.posts || []).length > 0 ? (
                                    (activeDayData.posts || []).map((post: any) => (
                                        <div key={post.id} className="glass-effect p-4 rounded-xl border border-[var(--color-glass-border)] flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-700">
                                                <User size={20} />
                                            </div>
                                            <div className="flex-grow flex flex-col gap-1 w-full">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-semibold text-white text-sm">
                                                        {post.user?.name || "Estudiante"}
                                                        {post.user?.role === "ADMIN" && <span className="ml-2 text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded-full">Profesor</span>}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{formatDate(post.createdAt)}</span>
                                                </div>
                                                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>


                                                {/* Replies */}
                                                {(post.replies || []).length > 0 && (
                                                    <div className="mt-4 flex flex-col gap-3 pl-4 border-l-2 border-[var(--color-primary)]/30">
                                                        {(post.replies || []).map((reply: any) => (
                                                            <div key={reply.id} className="flex gap-3 mt-1">
                                                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0 text-xs shadow-inner">
                                                                    <User size={12} />
                                                                </div>
                                                                <div className="flex-grow">
                                                                    <div className="flex items-baseline gap-2 mb-0.5">
                                                                        <span className="font-medium text-slate-200 text-xs">
                                                                            {reply.user?.name || "Estudiante"}
                                                                            {reply.user?.role === "ADMIN" && <span className="ml-2 text-[10px] bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-1.5 py-[1px] rounded flex-inline">Profesor</span>}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-500">{formatDate(reply.createdAt)}</span>
                                                                    </div>
                                                                    <p className="text-slate-400 text-sm leading-relaxed">{reply.content}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-slate-500 italic p-6 text-center border-t border-[var(--color-glass-border)]">
                                        No hay preguntas aún. ¡Sé el primero en preguntar!
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
