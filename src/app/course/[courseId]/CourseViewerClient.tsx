"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, PlayCircle, FileText, Download, MessageSquare, Send, User, Menu, X, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { createPost } from "@/actions/forum";
import DayDelivery from "@/components/DayDelivery";
import DayForum from "@/components/DayForum";
import VideoQA from "@/components/VideoQA";

export default function CourseViewerClient({ course, studentId, userRole }: { course: any, studentId: string, userRole?: string }) {
    // If course has no weeks, safely fallback so UI doesn't crash
    const initialWeek = course.weeks?.[0] || { id: "0", title: "No content", days: [] };
    const initialDay = initialWeek.days?.[0] || { id: "0", title: "No content", videoId: "", materialUrl: "", posts: [], replies: [] };

    const [activeWeek, setActiveWeek] = useState(initialWeek);
    const [activeDay, setActiveDay] = useState(initialDay);
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
            <header className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--header-bg)] backdrop-blur-md px-4 sm:px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <Link
                            href="/"
                            className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-2 flex-shrink-0"
                        >
                            <ChevronLeft size={20} />
                            <span className="hidden xs:block">Catálogo</span>
                        </Link>
                        <div className="h-6 w-px bg-[var(--border-color)] mx-1 sm:mx-2 flex-shrink-0"></div>
                        <h1 className="text-sm sm:text-lg md:text-xl font-bold text-[var(--text-primary)] truncate">{course.title}</h1>
                    </div>

                    {/* Mobile Toggle Button */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/asistencia"
                            className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all text-xs font-bold glow-emerald-sm animate-pulse-subtle"
                        >
                            <User size={16} />
                            <span>Asistencia</span>
                        </Link>

                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden flex items-center gap-2 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-3 py-1.5 rounded-lg border border-[var(--color-primary)]/20 transition-all text-xs font-bold"
                        >
                            <BookOpen size={16} />
                            <span className="hidden sm:inline">Ver Contenido</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 relative">

                {/* Mobile Sidebar Overlay (Backdrop) */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Left Sidebar (Navigation) - Becomes a Drawer on Mobile */}
                <div className={`fixed inset-y-0 left-0 w-[280px] sm:w-80 bg-[var(--sidebar-bg)] z-[70] lg:relative lg:z-10 lg:w-80 flex-shrink-0 flex flex-col gap-4 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                    }`}>
                    <div className="lg:hidden p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                        <span className="font-bold text-[var(--text-primary)] uppercase tracking-widest text-xs">Contenido del Curso</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="glass-effect rounded-none lg:rounded-2xl overflow-hidden shadow-lg border-0 lg:border border-[var(--border-color)] h-full lg:h-auto flex flex-col bg-[var(--card-bg)]">
                        <div className="p-4 border-b border-[var(--border-color)] bg-black/5">
                            <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Contenido del Curso</h3>
                        </div>

                        <div className="flex flex-col overflow-y-auto custom-scrollbar flex-grow max-h-[calc(100vh-250px)] lg:max-h-[600px]">
                            {course.weeks?.map((week: any, wIdx: number) => {
                                const isCurrentWeek = activeWeek.id === week.id;
                                return (
                                    <div key={week.id} className="border-b border-[var(--border-color)] last:border-b-0">
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
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrentWeek ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"
                                                    }`}>
                                                    Semana {wIdx + 1}
                                                </span>
                                                <span className={`font-bold text-sm leading-tight ${isCurrentWeek ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]"
                                                    }`}>
                                                    {week.title}
                                                </span>
                                            </div>
                                            <div className={`${isCurrentWeek ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"}`}>
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
                                                                ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--text-primary)] shadow-sm"
                                                                : "text-[var(--text-secondary)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--text-primary)]"
                                                                }`}
                                                        >
                                                            <div className={`mt-0.5 ${isActive ? "text-[var(--color-primary)]" : "text-[var(--text-secondary)]"}`}>
                                                                <PlayCircle size={16} fill={isActive ? "currentColor" : "none"} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-0.5">
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
                            <span className="hidden sm:block text-[var(--border-color)]">•</span>
                            <p className="text-[var(--text-secondary)] text-[10px] md:text-sm font-semibold">Día {activeWeek.days?.indexOf(activeDay) + 1}</p>
                        </div>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[var(--text-primary)] leading-tight">{activeDay.title}</h2>
                    </div>

                    {/* Video Player Embed or AI Placeholder */}
                    <div className="w-full aspect-video rounded-2xl overflow-hidden glass-effect border border-[var(--border-color)] shadow-2xl relative bg-black/5">
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
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center relative overflow-hidden">
                                <img
                                    src="/placeholder-ai.png"
                                    alt="Clase sin video"
                                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                                />
                                <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[4px]"></div>
                                <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                                        <PlayCircle size={32} className="text-white opacity-50" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl md:text-2xl font-black text-white">{activeDay.title}</h3>
                                        <p className="text-sm text-blue-100/60 font-medium">Esta clase no cuenta con video interactivo aún.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Delivery / Forum Section */}
                    {activeDayData.assignmentType === "FORUM" ? (
                        <DayForum
                            day={activeDayData}
                            studentId={studentId}
                            courseId={course.id}
                            userRole={userRole}
                            onPostCreated={() => {
                                window.location.reload();
                            }}
                        />
                    ) : (
                        <>
                            <DayDelivery
                                day={activeDayData}
                                studentId={studentId}
                                initialSubmission={activeDayData.submissions?.[0]}
                            />
                            {/* Video Q&A for non-forum days */}
                            <VideoQA
                                day={activeDayData}
                                studentId={studentId}
                                courseId={course.id}
                                userRole={userRole}
                                onPostCreated={() => {
                                    window.location.reload();
                                }}
                            />
                        </>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Resources Column */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                                <FileText size={18} className="text-[var(--color-primary)]" />
                                Materiales del Día
                            </h3>

                            {activeDay.summaryUrl || activeDay.materialUrl ? (
                                <div className="flex flex-col gap-3">
                                    {activeDay.summaryUrl && (
                                        <a
                                            href={activeDay.summaryUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="glass-effect p-3 rounded-xl flex items-center justify-between group border border-orange-500/20 hover:border-orange-500 transition-all bg-orange-500/5"
                                        >
                                            <div className="flex items-center gap-3 truncate pr-4">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 text-orange-400 group-hover:text-orange-300 transition-colors">
                                                    <FileText size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-orange-200 truncate">Resumen clase (PDF)</span>
                                            </div>
                                            <Download size={14} className="text-orange-400/50 group-hover:text-orange-400 transition-colors" />
                                        </a>
                                    )}

                                    {activeDay.materialUrl && (
                                        <a
                                            href={activeDay.materialUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="glass-effect p-3 rounded-xl flex items-center justify-between group border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-all bg-[var(--card-bg)]"
                                        >
                                            <div className="flex items-center gap-3 truncate pr-4">
                                                <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
                                                    <Download size={14} />
                                                </div>
                                                <span className="text-sm font-medium text-[var(--text-primary)] truncate">Repositorio / Material</span>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-[var(--text-muted)] italic p-4 text-center border border-dashed border-[var(--border-color)] rounded-xl">
                                    No hay recursos adicionales.
                                </div>
                            )}
                        </div>

                        {/* Resources column now spans full grid or just the start */}
                    </div>
                </div>
            </main>
        </div>
    );
}
