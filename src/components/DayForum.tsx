"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, User, Clock, AlertCircle, CornerDownRight } from "lucide-react";

import { createPost, createReply } from "@/actions/forum";

interface DayForumProps {
    day: any;
    studentId: string;
    courseId: string;
    onPostCreated: () => void;
}

export default function DayForum({ day, studentId, courseId, onPostCreated }: DayForumProps) {
    const [newPost, setNewPost] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>("");

    // Reply state
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);

    const isDeliveryDay = !!day.isDeliveryDay && day.assignmentType === "FORUM";
    const topics = day.forumTopics ? day.forumTopics.split("\n").filter((t: string) => t.trim() !== "") : [];

    useEffect(() => {
        if (!day.dueDate) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const due = new Date(day.dueDate).getTime();
            const difference = due - now;

            if (difference > 0) {
                const d = Math.floor(difference / (1000 * 60 * 60 * 24));
                const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${d}d ${h}h ${m}m restantes`);
            } else {
                setTimeLeft("Plazo finalizado");
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [day.dueDate]);

    if (!isDeliveryDay) return null;

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPost.trim().length < 50) {
            alert("Tu aporte es demasiado corto. Debe contener al menos 50 caracteres.");
            return;
        }
        if (!selectedTopic && topics.length > 0) {
            alert("Por favor selecciona un tema.");
            return;
        }
        if (isPosting) return;

        setIsPosting(true);
        try {
            const finalContent = selectedTopic ? `[Tema: ${selectedTopic}]\n\n${newPost}` : newPost;
            const res = await createPost(day.id, studentId, finalContent, courseId);
            if (res.success) {
                setNewPost("");
                setSelectedTopic("");
                onPostCreated();
            } else {
                alert("Error al publicar en el foro: " + res.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión");
        } finally {
            setIsPosting(false);
        }
    };

    const handleReply = async (postId: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || isReplying) return;

        setIsReplying(true);
        try {
            const res = await createReply(postId, replyText, studentId);
            if (res.success) {
                setReplyText("");
                setReplyingTo(null);
                onPostCreated(); // Refresh comments
            } else {
                alert("Error al enviar respuesta: " + res.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión");
        } finally {
            setIsReplying(false);
        }
    };

    const formatDate = (date: any) => {
        if (!date) return "...";
        try {
            return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return "...";
        }
    };

    return (
        <div className="flex flex-col gap-6 mt-8 p-6 glass-effect rounded-2xl border border-[var(--color-glass-border)] relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare size={20} className="text-purple-400" />
                        Foro de Discusión
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-lg">
                        Participa en la discusión. Tu post debe contener al menos 50 caracteres para ser válido.
                    </p>
                </div>
                {day.dueDate && (
                    <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/20 whitespace-nowrap text-sm font-semibold shadow-inner">
                        <Clock size={16} />
                        {timeLeft}
                    </div>
                )}
            </div>

            {/* Input Area */}
            {timeLeft !== "Plazo finalizado" ? (
                <div className="bg-black/20 p-4 rounded-xl border border-slate-700/50">
                    <form onSubmit={handlePost} className="flex flex-col gap-4">
                        {topics.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selecciona un Tema</label>
                                <select
                                    value={selectedTopic}
                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                    className="w-full bg-[rgba(255,255,255,0.05)] border border-slate-700/50 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-all"
                                >
                                    <option value="" disabled>-- Elige con qué tema vas a participar --</option>
                                    {topics.map((t: string, i: number) => (
                                        <option key={i} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="Escribe tu aporte principal aquí. (Mínimo 50 caracteres)..."
                            className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all min-h-[120px] resize-y"
                            required
                        />
                        <div className="flex justify-between items-center mt-1">
                            <span className={`text-xs ${newPost.length < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {newPost.length} / 50 caracteres mínimos
                            </span>
                            <button
                                type="submit"
                                disabled={isPosting || newPost.trim().length < 50 || (topics.length > 0 && !selectedTopic)}
                                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 shadow-lg shadow-purple-900/20"
                            >
                                {isPosting ? "Publicando..." : "Publicar Aporte"}
                                <Send size={14} />
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex items-center gap-3 bg-orange-500/10 text-orange-400 p-4 rounded-xl border border-orange-500/20">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">El plazo para participar en este foro ha finalizado.</span>
                </div>
            )}

            {/* Posts List */}
            <div className="flex flex-col gap-5 mt-4">
                {(day.posts || []).length > 0 ? (
                    (day.posts || []).map((post: any) => (
                        <div key={post.id} className="bg-black/30 p-5 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-3">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]">
                                    <User size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-200 text-sm">
                                        {post.user?.name || "Estudiante"}
                                        {post.user?.role === "ADMIN" && <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-[1px] rounded uppercase tracking-wider">Profesor</span>}
                                    </span>
                                    <span className="text-[11px] text-slate-500">{formatDate(post.createdAt)}</span>
                                </div>
                            </div>

                            <div className="pl-13 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap ml-1 border-l-2 border-slate-700/50 p-3 bg-white/[0.02] rounded-r-lg">
                                {post.content}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end mt-1">
                                <button
                                    onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                                    className="text-xs font-semibold text-slate-400 hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                                >
                                    <CornerDownRight size={14} />
                                    Responder
                                </button>
                            </div>

                            {/* Reply Input */}
                            {replyingTo === post.id && (
                                <form onSubmit={(e) => handleReply(post.id, e)} className="mt-3 pl-8 flex gap-3 animate-in fade-in slide-in-from-top-2">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Escribe tu respuesta..."
                                        className="flex-grow bg-[rgba(0,0,0,0.5)] border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] min-h-[60px] resize-y"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isReplying || !replyText.trim()}
                                        className="bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 text-white p-3 rounded-lg flex items-center justify-center h-fit self-end"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            )}

                            {/* Replies List */}
                            {(post.replies || []).length > 0 && (
                                <div className="mt-2 pl-4 sm:pl-10 flex flex-col gap-3 sm:border-l-2 border-[var(--color-primary)]/20">
                                    {(post.replies || []).map((reply: any) => (
                                        <div key={reply.id} className="bg-black/40 p-3 sm:p-4 rounded-xl border border-white/5 flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0 text-xs">
                                                <User size={14} />
                                            </div>
                                            <div className="flex flex-col flex-grow">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-slate-200 text-xs">
                                                        {reply.user?.name || "Estudiante"}
                                                        {reply.user?.role === "ADMIN" && <span className="ml-2 text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-[1px] rounded uppercase">Profesor</span>}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">{formatDate(reply.createdAt)}</span>
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-slate-500 italic p-8 text-center border border-dashed border-slate-700/50 rounded-xl bg-black/20">
                        Nadie ha participado aún. ¡Sé el primero en iniciar la discusión!
                    </div>
                )}
            </div>
        </div>
    );
}
