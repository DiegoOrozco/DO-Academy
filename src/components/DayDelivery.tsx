"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download, Code } from "lucide-react";
import StudentCodeEditor from "./StudentCodeEditor";
import { submitCodingExercise } from "@/actions/submissions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DayDeliveryProps {
    day: any;
    studentId: string;
    initialSubmission?: any;
}

export default function DayDelivery({ day, studentId, initialSubmission }: DayDeliveryProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [submission, setSubmission] = useState<any>(initialSubmission);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setSubmission(initialSubmission);
        setFile(null);
        setError(null);
    }, [day.id, initialSubmission]);

    const isDeliveryDay = !!day.isDeliveryDay;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            setFile(droppedFile);
            setError(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleSubmit = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("dayId", day.id);

        try {
            const response = await fetch("/api/grade-submission", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setSubmission(data);
            } else {
                setError(data.error || "Error al subir la tarea");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 mt-8 p-6 glass-effect rounded-2xl border border-[var(--color-glass-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText size={20} className="text-[var(--color-primary)]" />
                        {day.isCodingExercise ? "Laboratorio Proyectable" : "Zona de Entrega"}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {day.isCodingExercise
                            ? "Escribe tu solución en el editor, prueba el código y envía cuando estés listo."
                            : "Descarga el enunciado y sube tu solución para ser calificada por el Profesor Virtual."}
                    </p>
                </div>

                {!day.isCodingExercise && (
                    <a
                        href={day.assignmentUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-all text-sm font-semibold group ${!day.assignmentUrl ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <Download size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        Descargar Enunciado
                    </a>
                )}
            </div>

            {isDeliveryDay ? (
                <div className="space-y-4">
                    {day.isCodingExercise && day.exerciseDescription && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 px-1">
                                <FileText size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enunciado del Ejercicio</span>
                            </div>
                            <div className="p-6 bg-[#14181E] border border-slate-700/50 rounded-2xl mb-4 text-[14px] text-slate-300 leading-relaxed font-medium max-h-[300px] overflow-y-auto custom-scrollbar [&>p]:mb-3 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-emerald-400 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:mb-3 [&>code]:bg-slate-800 [&>code]:text-emerald-300 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-slate-900 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:mb-4 [&>pre>code]:bg-transparent [&>pre>code]:text-blue-300 [&>pre>code]:p-0 [&>strong]:text-white [&>a]:text-blue-400 [&>a]:underline">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {day.exerciseDescription}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {day.isCodingExercise && !submission ? (
                        <StudentCodeEditor
                            dayId={day.id}
                            userId={studentId}
                            initialCode={day.codeTemplate || ""}
                            testCases={day.testCases || []}
                            similarityThreshold={day.similarityThreshold || 0.9}
                            enablePlagiarism={day.enablePlagiarism}
                            onSuccess={async (grade) => {
                                window.location.reload();
                            }}
                        />
                    ) : !submission ? (
                        <div className="flex flex-col gap-4">
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${isDragging ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.01]" :
                                    file ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-slate-700 hover:border-slate-500 bg-black/20"
                                    }`}
                                onClick={() => document.getElementById("file-upload")?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".py,.sql,.pdf"
                                    onChange={handleFileChange}
                                />
                                {file ? (
                                    <>
                                        <CheckCircle2 size={32} className="text-[var(--color-primary)] mb-2" />
                                        <p className="text-white font-medium">{file.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">Haga clic para cambiar el archivo</p>
                                    </>
                                ) : isDragging ? (
                                    <>
                                        <Upload size={32} className="text-[var(--color-primary)] mb-2 animate-bounce" />
                                        <p className="text-[var(--color-primary)] font-medium">¡Suelta el archivo aquí!</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={32} className="text-slate-500 mb-2" />
                                        <p className="text-slate-300 font-medium">Arrastra tu tarea aquí o haz clic para subir</p>
                                        <p className="text-xs text-slate-500 mt-1">Formatos aceptados: .py, .sql, .pdf</p>
                                    </>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={!file || isUploading}
                                className="w-full bg-[var(--color-primary)] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        El profesor virtual está revisando tu código...
                                    </>
                                ) : (
                                    "Enviar Tarea"
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className={`border rounded-xl p-6 ${submission.status === "FAILED" ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${submission.status === "FAILED" ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"}`}>
                                        {submission.status === "FAILED" ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${submission.status === "FAILED" ? "text-red-400" : "text-white"}`}>
                                            {submission.status === "FAILED" ? "Error en la Calificación" : "¡Tarea Calificada!"}
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            {submission.status === "FAILED"
                                                ? "Hubo un problema procesando tu entrega. Intenta nuevamente o usa otro formato."
                                                : `Entregado el ${new Date(submission.createdAt).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>
                                {submission.status === "GRADED" && (
                                    <div className="text-center">
                                        <span className="text-2xl font-black text-white">{submission.grade || "0"}</span>
                                        <span className="text-xs text-slate-500 block uppercase font-bold tracking-tighter">Nota Final</span>
                                    </div>
                                )}
                            </div>

                            {submission.status === "GRADED" ? (
                                <div className="space-y-4 mt-6">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Comentario del Profesor</p>
                                        <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
                                            "{day.isCodingExercise ? submission.feedback?.text : submission.feedback?.comentario || "Sin comentarios."}"
                                        </p>
                                    </div>

                                    {!day.isCodingExercise && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-black/20 p-4 rounded-lg">
                                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Puntos Positivos</p>
                                                <ul className="text-xs text-slate-400 space-y-1">
                                                    {submission.feedback?.feedback_positivo?.map((item: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <span className="text-emerald-500 mt-0.5">•</span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-black/20 p-4 rounded-lg">
                                                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Oportunidades de Mejora</p>
                                                <ul className="text-xs text-slate-400 space-y-1">
                                                    {submission.feedback?.mejoras?.map((item: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <span className="text-amber-500 mt-0.5">•</span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => setSubmission(null)}
                                        className="text-xs text-slate-400 hover:text-white underline transition-colors"
                                    >
                                        Intentar subir de nuevo
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-black/20 border border-dashed border-slate-700 rounded-xl p-8 text-center">
                    <AlertCircle size={32} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium italic">
                        No hay entregas habilitadas para este día.
                    </p>
                </div>
            )}
        </div>
    );
}
