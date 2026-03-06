"use client";

import { useState } from "react";
import { MessageSquare, CheckCircle, CornerDownRight, Clock } from "lucide-react";

import { Trash2 } from "lucide-react";
import { createReply, deletePost } from "@/actions/forum";

export default function AdminQAInboxClient({ initialQuestions }: { initialQuestions: any[] }) {
    const [activeTab, setActiveTab] = useState("pending");
    const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
    const [questions, setQuestions] = useState(initialQuestions);
    const [isReplying, setIsReplying] = useState<string | null>(null);

    const filteredQuestions = questions.filter(q => q.status === activeTab);

    const handleReply = async (id: string, e: React.FormEvent) => {
        e.preventDefault();
        const text = replyTexts[id] || "";
        if (!text.trim() || isReplying) return;

        setIsReplying(id);
        const res = await createReply(id, text);
        setIsReplying(null);

        if (res.success) {
            setQuestions(questions.map(q =>
                q.id === id ? { ...q, status: "resolved" } : q
            ));
            // Clear the specific reply text
            setReplyTexts(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        } else {
            alert("Error al enviar respuesta: " + res.error);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta pregunta?")) return;
        const res = await deletePost(postId);
        if (res.success) {
            setQuestions(questions.filter(q => q.id !== postId));
        } else {
            alert("Error al eliminar: " + res.error);
        }
    };

    return (
        <div className="flex flex-col gap-6 lg:h-[calc(100vh-80px)]">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">Q&A Inbox</h1>
                <p className="text-sm md:text-base text-[var(--text-secondary)]">Responde las dudas de tus estudiantes desde este panel centralizado.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-glass-border)]">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-6 py-4 text-sm font-semibold transition-all duration-300 ${activeTab === "pending"
                        ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                >
                    Pendientes de revisión
                    {questions.filter(q => q.status === "pending").length > 0 && (
                        <span className="ml-2 bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full text-xs">
                            {questions.filter(q => q.status === "pending").length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("resolved")}
                    className={`px-6 py-4 text-sm font-semibold transition-all duration-300 ${activeTab === "resolved"
                        ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                >
                    Resueltas
                </button>
            </div>

            {/* Inbox Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-10">
                {filteredQuestions.length === 0 ? (
                    <div className="glass-effect rounded-2xl p-10 flex flex-col items-center justify-center text-center border border-[var(--border-color)] h-64 bg-[var(--card-bg)]">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">¡Todo al día!</h3>
                        <p className="text-[var(--text-secondary)]">Excelente trabajo, no hay dudas pendientes por responder.</p>
                    </div>
                ) : (
                    filteredQuestions.map((q) => (
                        <div key={q.id} className="glass-effect rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col group transition-all hover:border-[var(--color-primary)]/30 bg-[var(--card-bg)]">

                            {/* Question Header */}
                            <div className="p-5 border-b border-[var(--border-color)] bg-black/5 flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm flex-shrink-0">
                                        {q.studentName.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">{q.studentName}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="font-semibold text-[var(--color-secondary)]">{q.courseName}</span>
                                            <span>&bull;</span>
                                            <span className="truncate max-w-[200px]">{q.day}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                    <Clock size={14} />
                                    {q.time}
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="ml-2 p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                        title="Eliminar pregunta"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 flex-shrink-0 text-slate-500">
                                        <MessageSquare size={20} />
                                    </div>
                                    <p className="text-slate-200 text-sm leading-relaxed">{q.content}</p>
                                </div>
                            </div>

                            {/* Reply Section (Only for Pending) */}
                            {q.status === "pending" && (
                                <div className="p-5 bg-[var(--color-background-dark)] border-t border-[var(--color-glass-border)]">
                                    <form onSubmit={(e) => handleReply(q.id, e)} className="flex flex-col gap-3">
                                        <div className="flex gap-3">
                                            <div className="mt-2 text-[var(--color-primary)]">
                                                <CornerDownRight size={20} />
                                            </div>
                                            <textarea
                                                value={replyTexts[q.id] || ""}
                                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                placeholder="Escribe tu respuesta como profesor..."
                                                className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] transition-all min-h-[80px] resize-y"
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="submit"
                                                disabled={!!isReplying}
                                                className="bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 glow-accent text-sm flex items-center gap-2"
                                            >
                                                {isReplying === q.id ? "Enviando..." : "Enviar Respuesta y Resolver"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                        </div>
                    ))
                )}
            </div>

        </div>
    );
}
