"use client";

import { useState, useEffect, useTransition, memo } from "react";
import { Mail, Send, Users, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { sendMassEmail, getCoursesList } from "@/actions/admin-email";
import dynamic from "next/dynamic";

// Import Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
});
import "react-quill-new/dist/quill.snow.css";

// Separate the editor into a memoized component to prevent parent re-renders 
// from slowing down the typing experience.
const OptimizedEditor = memo(({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync with parent's reset (e.g. after successful send)
    useEffect(() => {
        if (value === "" && localValue !== "") {
            setLocalValue("");
        }
    }, [value, localValue]);

    // Debounce the parent update
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, 150); // Fast enough to not be noticed, slow enough to batch keystrokes
        return () => clearTimeout(timer);
    }, [localValue, onChange, value]);

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden min-h-[300px]">
            <ReactQuill
                theme="snow"
                value={localValue}
                onChange={setLocalValue}
                placeholder="Escribe aquí tu mensaje profesional..."
                modules={modules}
                className="h-full"
            />
        </div>
    );
});

OptimizedEditor.displayName = "OptimizedEditor";

export default function CommunicationsPage() {
    const [courses, setCourses] = useState<{ id: string, title: string }[]>([]);
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean, message?: string, count?: number } | null>(null);
    const [emailContent, setEmailContent] = useState("");

    useEffect(() => {
        getCoursesList().then(setCourses);
    }, []);

    const handleSubmit = async (formData: FormData) => {
        setResult(null);
        // Append the rich text content to formData
        formData.set("content", emailContent);

        startTransition(async () => {
            try {
                const res = await sendMassEmail(formData);
                setResult(res);
                if (res.success) {
                    setEmailContent(""); // Clear on success
                }
            } catch (err: any) {
                setResult({ success: false, message: err.message });
            }
        });
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Mail className="text-[var(--color-primary)]" size={32} />
                    Comunicados
                </h1>
                <p className="text-slate-400 max-w-2xl">
                    Envía avisos, actualizaciones o mensajes informativos a tus estudiantes directamente a su correo electrónico personal con formato profesional.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <form action={handleSubmit} className="glass-effect rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Enviar a:</label>
                            <select
                                name="courseId"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all" className="bg-slate-900">Todos los estudiantes registrados</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id} className="bg-slate-900">Estudiantes de: {c.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Asunto del Correo:</label>
                            <input
                                required
                                name="subject"
                                type="text"
                                placeholder="Ej: Nueva clase disponible o Recordatorio de entrega"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all font-bold"
                            />
                        </div>

                        <div className="space-y-2 quill-wrapper">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mensaje con Formato:</label>
                            <OptimizedEditor value={emailContent} onChange={setEmailContent} />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1 mt-2">
                                El texto se enviará tal cual lo ves con negritas, listas y enlaces.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-4 rounded-2xl bg-[var(--color-primary)] hover:bg-blue-600 text-white font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                        >
                            {isPending ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Enviando Comunicado...
                                </>
                            ) : (
                                <>
                                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Enviar Correo a Estudiantes
                                </>
                            )}
                        </button>

                        {result && (
                            <div className={`p-5 rounded-2xl border flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300 ${result.success ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                }`}>
                                {result.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                <div>
                                    <p className="font-black uppercase tracking-tighter text-sm">
                                        {result.success ? "¡Éxito al enviar!" : "Error en el envío"}
                                    </p>
                                    <p className="text-sm font-medium opacity-80 mt-1">
                                        {result.success ? `El comunicado se envió correctamente a ${result.count} estudiantes.` : result.message}
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Info Section */}
                <div className="space-y-6">
                    <div className="glass-effect rounded-3xl border border-white/10 p-6 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--color-primary)]">
                            <Info size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Consejos de Envío</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li className="flex gap-2">
                                <span className="text-[var(--color-primary)] text-lg leading-none">•</span>
                                Evita enviar demasiados correos en poco tiempo para que Gmail no marque tu cuenta como spam.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[var(--color-primary)] text-lg leading-none">•</span>
                                El formato del correo es limpio y profesional, similar al diseño de la plataforma.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[var(--color-primary)] text-lg leading-none">•</span>
                                Asegúrate de tener configurado tu **Google App Password** en las variables de entorno.
                            </li>
                        </ul>
                    </div>

                    <div className="glass-effect rounded-3xl border border-white/10 p-6 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-green-400">
                            <Users size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Prueba de Seguridad</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Antes de enviar un mensaje masivo, puedes inscribirte tú mismo en un curso de prueba y enviártelo para ver cómo queda el diseño.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .quill-wrapper .ql-toolbar {
                    background: rgba(255, 255, 255, 0.05);
                    border: none !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                    padding: 12px !important;
                }
                .quill-wrapper .ql-container {
                    border: none !important;
                    font-family: inherit;
                    font-size: 16px;
                    color: white;
                    min-height: 300px;
                }
                .quill-wrapper .ql-editor.ql-blank::before {
                    color: rgba(255, 255, 255, 0.3);
                    font-style: normal;
                }
                .quill-wrapper .ql-stroke {
                    stroke: #94a3b8 !important;
                }
                .quill-wrapper .ql-fill {
                    fill: #94a3b8 !important;
                }
                .quill-wrapper .ql-picker {
                    color: #94a3b8 !important;
                }
                .quill-wrapper .ql-active .ql-stroke {
                    stroke: white !important;
                }
                .quill-wrapper .ql-picker-options {
                    background-color: #0f172a !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                }
            `}</style>
        </div>
    );
}
