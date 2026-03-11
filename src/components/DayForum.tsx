"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, User, CornerDownRight, HelpCircle, Trash2, Clock, AlertCircle, ChevronDown, ChevronRight, Hash } from "lucide-react";

import { createPost, createReply, deletePost, deleteReply } from "@/actions/forum";

interface DayForumProps {
    day: any;
    studentId: string;
    courseId: string;
    userRole?: string;
    onPostCreated: () => void;
}

export default function DayForum({ day, studentId, courseId, userRole, onPostCreated }: DayForumProps) {
    const isAdmin = userRole === "ADMIN";
    const [newPost, setNewPost] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);

    // Reply state - now supports replying to any post or reply
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);

    // Track which topic sections are expanded
    const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

    const isDeliveryDay = !!day.isDeliveryDay && day.assignmentType === "FORUM";
    const topics = day.forumTopics ? day.forumTopics.split("\n").filter((t: string) => t.trim() !== "") : [];

    // Auto-expand all topics on mount
    useEffect(() => {
        setIsMounted(true);
        setExpandedTopics(topics.map((_: string, i: number) => `topic-${i}`));
    }, [day.forumTopics]);

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
            const res = await createPost(day.id, finalContent, courseId);
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
            const res = await createReply(postId, replyText);
            if (res.success) {
                setReplyText("");
                setReplyingTo(null);
                onPostCreated();
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

    const handleDeletePost = async (postId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este aporte y todas sus respuestas?")) return;
        try {
            const res = await deletePost(postId);
            if (res.success) {
                onPostCreated();
            } else {
                alert("Error al eliminar el aporte: " + res.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión");
        }
    };

    const handleDeleteReply = async (replyId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta respuesta?")) return;
        try {
            const res = await deleteReply(replyId);
            if (res.success) {
                onPostCreated();
            } else {
                alert("Error al eliminar la respuesta: " + res.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión");
        }
    };

    const formatDate = (date: any) => {
        if (!isMounted || !date) return "...";
        try {
            return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return "...";
        }
    };

    const toggleTopic = (topicKey: string) => {
        setExpandedTopics(prev =>
            prev.includes(topicKey) ? prev.filter(k => k !== topicKey) : [...prev, topicKey]
        );
    };

    // Extract topic from post content
    const getPostTopic = (content: string): string | null => {
        const match = content.match(/^\[Tema: (.+?)\]/);
        return match ? match[1] : null;
    };

    // Get content without the topic prefix
    const getPostContent = (content: string): string => {
        return content.replace(/^\[Tema: .+?\]\n\n/, "");
    };

    // Group posts by topic
    const allPosts = day.posts || [];
    const postsByTopic: Record<string, any[]> = {};
    const ungroupedPosts: any[] = [];

    allPosts.forEach((post: any) => {
        const topic = getPostTopic(post.content);
        if (topic) {
            if (!postsByTopic[topic]) postsByTopic[topic] = [];
            postsByTopic[topic].push(post);
        } else {
            ungroupedPosts.push(post);
        }
    });

    // Render a single post with its replies (recursive-ready)
    const renderPost = (post: any, isNested = false) => (
        <div key={post.id} className={`${isNested ? "ml-4 sm:ml-8 border-l-2 border-slate-700/50 pl-4" : ""} flex flex-col gap-2`}>
            <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col gap-2 hover:border-[var(--color-primary)]/20 transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${post.user?.role === "ADMIN" ? "bg-purple-600" : "bg-[var(--color-primary)]"}`}>
                        <User size={14} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
                            {post.user?.name || "Estudiante"}
                            {post.user?.role === "ADMIN" && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-[1px] rounded uppercase tracking-wider">Profesor</span>}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">{formatDate(post.createdAt)}</span>
                    </div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap pl-11">
                    {isNested ? post.content : getPostContent(post.content)}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => {
                            setReplyingTo(replyingTo === post.id ? null : post.id);
                            setReplyText("");
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                    >
                        <CornerDownRight size={12} />
                        Responder
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-xs font-semibold text-rose-500/50 hover:text-rose-500 transition-colors flex items-center gap-1"
                        >
                            <Trash2 size={12} />
                            Eliminar
                        </button>
                    )}
                </div>

                {/* Reply Input */}
                {replyingTo === post.id && (
                    <form onSubmit={(e) => handleReply(post.id, e)} className="flex gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            className="flex-grow bg-[var(--background)] border border-[var(--border-color)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] min-h-[50px] resize-y"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isReplying || !replyText.trim()}
                            className="bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 text-white p-3 rounded-lg flex items-center justify-center h-fit self-end"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                )}
            </div>

            {/* Replies */}
            {(post.replies || []).map((reply: any) => (
                <div key={reply.id} className="ml-4 sm:ml-8 border-l-2 border-[var(--color-primary)]/20 pl-4">
                    <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border-color)] flex flex-col gap-2 hover:border-[var(--color-primary)]/20 transition-colors shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${reply.user?.role === "ADMIN" ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300"}`}>
                                <User size={12} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-[var(--text-primary)] text-xs flex items-center gap-2">
                                    {reply.user?.name || "Estudiante"}
                                    {reply.user?.role === "ADMIN" && <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1 py-[1px] rounded uppercase">Profesor</span>}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)]">{formatDate(reply.createdAt)}</span>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap pl-9">{reply.content}</p>

                        {/* Reply to reply */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setReplyingTo(replyingTo === `reply-${reply.id}` ? null : `reply-${reply.id}`);
                                    setReplyText("");
                                }}
                                className="text-[10px] font-semibold text-slate-500 hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                            >
                                <CornerDownRight size={10} />
                                Responder
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => handleDeleteReply(reply.id)}
                                    className="text-[10px] font-semibold text-rose-500/50 hover:text-rose-500 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={10} />
                                    Eliminar
                                </button>
                            )}
                        </div>

                        {replyingTo === `reply-${reply.id}` && (
                            <form onSubmit={(e) => handleReply(post.id, e)} className="flex gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Respondiendo a ${reply.user?.name || "Estudiante"}...`}
                                    className="flex-grow bg-[rgba(0,0,0,0.5)] border border-slate-700/50 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] min-h-[40px] resize-y"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isReplying || !replyText.trim()}
                                    className="bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 text-white p-2 rounded-lg flex items-center justify-center h-fit self-end"
                                >
                                    <Send size={12} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

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

            {/* Posts grouped by topic */}
            <div className="flex flex-col gap-4 mt-2">
                {topics.length > 0 ? (
                    <>
                        {topics.map((topic: string, tIdx: number) => {
                            const topicKey = `topic-${tIdx}`;
                            const topicPosts = postsByTopic[topic] || [];
                            const isExpanded = expandedTopics.includes(topicKey);

                            return (
                                <div key={topicKey} className="rounded-xl border border-slate-700/50 overflow-hidden bg-black/20">
                                    {/* Topic Header */}
                                    <button
                                        onClick={() => toggleTopic(topicKey)}
                                        className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                                <Hash size={16} className="text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{topic}</h4>
                                                <span className="text-[10px] text-slate-500">{topicPosts.length} {topicPosts.length === 1 ? "participación" : "participaciones"}</span>
                                            </div>
                                        </div>
                                        {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                    </button>

                                    {/* Topic Thread */}
                                    {isExpanded && (
                                        <div className="p-4 flex flex-col gap-3 border-t border-slate-700/30 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {topicPosts.length > 0 ? (
                                                topicPosts.map((post: any) => renderPost(post))
                                            ) : (
                                                <p className="text-xs text-slate-500 italic text-center py-4">Nadie ha participado en este tema aún. ¡Sé el primero!</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Ungrouped posts (legacy or without topic) */}
                        {ungroupedPosts.length > 0 && (
                            <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-black/20">
                                <div className="p-4 bg-white/[0.02]">
                                    <h4 className="text-sm font-bold text-slate-400">Otros Aportes</h4>
                                </div>
                                <div className="p-4 flex flex-col gap-3 border-t border-slate-700/30">
                                    {ungroupedPosts.map((post: any) => renderPost(post))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    // No topics defined - flat list
                    allPosts.length > 0 ? (
                        allPosts.map((post: any) => renderPost(post))
                    ) : (
                        <div className="text-sm text-slate-500 italic p-8 text-center border border-dashed border-slate-700/50 rounded-xl bg-black/20">
                            Nadie ha participado aún. ¡Sé el primero en iniciar la discusión!
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
