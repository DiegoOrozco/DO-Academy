"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, User, Clock, AlertCircle, RefreshCw } from "lucide-react";

import { createPost } from "@/actions/forum";

interface DayForumProps {
    day: any;
    studentId: string;
    courseId: string;
    onPostCreated: () => void;
}

export default function DayForum({ day, studentId, courseId, onPostCreated }: DayForumProps) {
    const [newPost, setNewPost] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>("");

    const isDeliveryDay = !!day.isDeliveryDay && day.assignmentType === "FORUM";

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
        const interval = setInterval(updateTimer, 60000); // UI update every minute
        return () => clearInterval(interval);
    }, [day.dueDate]);

    if (!isDeliveryDay) return null;

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() || isPosting) return;

        setIsPosting(true);
        try {
            const res = await createPost(day.id, studentId, newPost, courseId);
            if (res.success) {
                setNewPost("");
                onPostCreated();
            } else {
                alert("Error al publicar en el foro: " + res.error);
            }
        } catch (error) {
            console.error("Error posting to forum:", error);
            alert("Error de conexión");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 mt-8 p-6 glass-effect rounded-2xl border border-[var(--color-glass-border)] relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare size={20} className="text-purple-400" />
                        Foro Evaluado
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-lg">
                        Participa en la discusión respondiendo al tema central. Tu participación vale el 50% de la nota, y la calidad de tu aporte será evaluada por la IA para el 50% restante.
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
                    <form onSubmit={handlePost}>
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="Escribe tu aporte principal aquí..."
                            className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all min-h-[120px] resize-y"
                            required
                        />
                        <div className="flex justify-end mt-3">
                            <button
                                type="submit"
                                disabled={isPosting || !newPost.trim()}
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
        </div>
    );
}
