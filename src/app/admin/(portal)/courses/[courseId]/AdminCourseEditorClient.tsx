"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Settings, List, Plus, Trash2, GripVertical, Video, Link2, Loader2, FileText, Upload } from "lucide-react";
import { saveCourseData } from "@/actions/admin-course";
import { useRouter } from "next/navigation";

export default function AdminCourseEditorClient({ initialCourse }: { initialCourse: any }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("settings");
    const [isSaving, setIsSaving] = useState(false);

    // Initial state setup mapping Prisma format to Component format if necessary
    const [course, setCourse] = useState(() => ({
        ...initialCourse,
        thumbnail: initialCourse.thumbnail || "",
        password: initialCourse.password || "",
        weeks: initialCourse.weeks ? [...initialCourse.weeks] : []
    }));

    // --- Curriculum State Handlers ---
    const handleAddWeek = () => {
        const newWeek = {
            id: `w${Date.now()}`,
            title: `Semana ${course.weeks.length + 1}: Nueva Semana`,
            days: []
        };
        setCourse({ ...course, weeks: [...course.weeks, newWeek] });
    };

    const handleUpdateWeek = (weekId: string, newTitle: string) => {
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => w.id === weekId ? { ...w, title: newTitle } : w)
        });
    };

    const handleDeleteWeek = (weekId: string) => {
        if (confirm("¿Estás seguro de eliminar toda esta semana? Se borrarán todos sus días.")) {
            setCourse({
                ...course,
                weeks: course.weeks.filter((w: any) => w.id !== weekId)
            });
        }
    };

    const handleAddDay = (weekId: string) => {
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    const newDay = {
                        id: `d${Date.now()}`,
                        title: `Día ${w.days.length + 1}: Nuevo Tema`,
                        videoId: "",
                        materialUrl: "",
                        isDeliveryDay: false,
                        assignmentUrl: ""
                    };
                    return { ...w, days: [...w.days, newDay] };
                }
                return w;
            })
        });
    };

    const handleUpdateDay = (weekId: string, dayId: string, field: string, value: any) => {
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return {
                        ...w,
                        days: w.days.map((d: any) => d.id === dayId ? { ...d, [field]: value } : d)
                    };
                }
                return w;
            })
        });
    };

    const handleDeleteDay = (weekId: string, dayId: string) => {
        if (!confirm("¿Eliminar este día?")) return;
        setCourse({
            ...course,
            weeks: course.weeks.map((w: any) => {
                if (w.id === weekId) {
                    return { ...w, days: w.days.filter((d: any) => d.id !== dayId) };
                }
                return w;
            })
        });
    };

    const [isUploadingFile, setIsUploadingFile] = useState<string | null>(null);

    const handleUploadAssignment = async (weekId: string, dayId: string, file: File) => {
        setIsUploadingFile(dayId);
        try {
            const response = await fetch(`/api/admin/upload-assignment?filename=${file.name}`, {
                method: "POST",
                body: file,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error al subir archivo");
            }

            const blob = await response.json();
            handleUpdateDay(weekId, dayId, "assignmentUrl", blob.url);
        } catch (error: any) {
            alert("Error: " + error.message);
            console.error(error);
        } finally {
            setIsUploadingFile(null);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await saveCourseData(course.id, course);
            if (res.success) {
                alert("Cambios guardados correctamente en la Base de Datos!");
                router.refresh();
            } else {
                alert("Error al guardar: " + res.error);
            }
        } catch (error) {
            alert("Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 lg:h-[calc(100vh-80px)] overflow-visible lg:overflow-hidden">
            {/* Editor Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-glass-border)] pb-6">
                <div className="w-full sm:w-auto">
                    <Link
                        href="/admin/courses"
                        className="inline-flex items-center gap-2 text-[10px] md:text-xs text-[var(--color-primary)] hover:text-white transition-colors mb-2 font-semibold uppercase tracking-wider"
                    >
                        <ArrowLeft size={14} /> Volver a cursos
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3 truncate">
                        {course.title}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`${isSaving ? "opacity-70 cursor-not-allowed" : ""} w-full sm:w-auto bg-[var(--color-primary)] hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-300 glow-accent flex items-center justify-center gap-2`}
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span className="text-sm">{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
                </button>
            </div>

            {/* Editor Main Area Layout */}
            <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-visible lg:overflow-hidden">

                {/* Left Sidebar Tabs */}
                <div className="w-full lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible custom-scrollbar pb-2 lg:pb-0">
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap ${activeTab === "settings"
                            ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                            }`}
                    >
                        <Settings size={18} />
                        Ajustes del Curso
                    </button>

                    <button
                        onClick={() => setActiveTab("curriculum")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm whitespace-nowrap ${activeTab === "curriculum"
                            ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                            }`}
                    >
                        <List size={18} />
                        Currículo / Temario
                    </button>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 glass-effect rounded-2xl border border-[var(--color-glass-border)] overflow-visible lg:overflow-y-auto lg:custom-scrollbar p-4 sm:p-6">

                    {/* TAB 1: SETTINGS */}
                    {activeTab === "settings" && (
                        <div className="max-w-2xl space-y-6">
                            <h2 className="text-xl font-bold text-white mb-4">Ajustes Generales</h2>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Título del Curso</label>
                                <input
                                    type="text"
                                    value={course.title}
                                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Descripción (Visible en Dashboard)</label>
                                <textarea
                                    value={course.description}
                                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Estado de Publicación</label>
                                    <select
                                        value={course.status}
                                        onChange={(e) => setCourse({ ...course, status: e.target.value })}
                                        className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                    >
                                        <option value="draft">Borrador (Oculto)</option>
                                        <option value="published">Publicado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña de Acceso</label>
                                    <input
                                        type="text"
                                        value={course.password}
                                        onChange={(e) => setCourse({ ...course, password: e.target.value })}
                                        className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Los alumnos necesitan esto para entrar al curso.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">URL de Miniatura (Thumbnail)</label>
                                <input
                                    type="text"
                                    value={course.thumbnail}
                                    onChange={(e) => setCourse({ ...course, thumbnail: e.target.value })}
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB 2: CURRICULUM BUILDER */}
                    {activeTab === "curriculum" && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Editor de Temario</h2>
                                    <p className="text-sm text-slate-400">Agrega semanas y días. Luego haz click en "Guardar Cambios".</p>
                                </div>
                                <button
                                    onClick={handleAddWeek}
                                    className="bg-white/10 hover:bg-white/20 text-white font-semibold flex-shrink-0 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-white/10 w-full sm:w-auto"
                                >
                                    <Plus size={16} />
                                    Añadir Semana
                                </button>
                            </div>

                            <div className="space-y-4">
                                {course.weeks.map((week: any, wIndex: number) => (
                                    <div key={week.id} className="glass-effect border border-[var(--color-glass-border)] rounded-2xl overflow-hidden shadow-lg">

                                        {/* Week Header */}
                                        <div className="bg-slate-900/50 p-4 border-b border-[var(--color-glass-border)] flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <GripVertical className="text-slate-600 cursor-grab" size={20} />
                                                <input
                                                    type="text"
                                                    value={week.title}
                                                    onChange={(e) => handleUpdateWeek(week.id, e.target.value)}
                                                    className="bg-transparent border-none text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded px-2 w-full max-w-sm transition-all"
                                                    placeholder="Ej. Semana 1: Introducción"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleDeleteWeek(week.id)}
                                                className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                                title="Eliminar Semana"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        {/* Days List */}
                                        <div className="p-4 space-y-4">
                                            {week.days.map((day: any, dIndex: number) => (
                                                <div key={day.id} className="bg-black/30 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-4 relative group">

                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleDeleteDay(week.id, day.id)}
                                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-3 w-full pr-8">
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">Día {dIndex + 1}</span>
                                                        <input
                                                            type="text"
                                                            value={day.title}
                                                            onChange={(e) => handleUpdateDay(week.id, day.id, "title", e.target.value)}
                                                            className="bg-transparent border-b border-transparent text-white font-semibold focus:outline-none focus:border-[var(--color-primary)] px-1 w-full transition-all"
                                                            placeholder="Título de la lección"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                                <Video size={12} /> ID de YouTube
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={day.videoId || ""}
                                                                onChange={(e) => handleUpdateDay(week.id, day.id, "videoId", e.target.value)}
                                                                className="w-full bg-[rgba(0,0,0,0.5)] border border-slate-700/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                                                placeholder="Ej. dQw4w9WgXcQ"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                                <Link2 size={12} /> Enlace de Material (Ej. GitHub)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={day.materialUrl || ""}
                                                                onChange={(e) => handleUpdateDay(week.id, day.id, "materialUrl", e.target.value)}
                                                                className="w-full bg-[rgba(0,0,0,0.5)] border border-slate-700/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                                                placeholder="https://github.com/..."
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                                        <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                                            <div className="relative inline-flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only peer"
                                                                    checked={!!day.isDeliveryDay}
                                                                    onChange={(e) => handleUpdateDay(week.id, day.id, "isDeliveryDay", e.target.checked)}
                                                                />
                                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-white uppercase tracking-widest group-hover/toggle:text-[var(--color-primary)] transition-colors">Es día de entrega</span>
                                                        </label>

                                                        {day.isDeliveryDay && (
                                                            <div className="flex-1 w-full animate-in fade-in slide-in-from-left-2 duration-300">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText size={12} className="text-blue-400" />
                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enunciado (PDF/Doc)</label>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="file"
                                                                            id={`upload-${day.id}`}
                                                                            className="hidden"
                                                                            accept=".pdf,.doc,.docx"
                                                                            onChange={(e) => {
                                                                                const f = e.target.files?.[0];
                                                                                if (f) handleUploadAssignment(week.id, day.id, f);
                                                                            }}
                                                                        />
                                                                        <button
                                                                            disabled={!!isUploadingFile}
                                                                            onClick={() => document.getElementById(`upload-${day.id}`)?.click()}
                                                                            className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] hover:text-white transition-colors uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                                                                        >
                                                                            {isUploadingFile === day.id ? (
                                                                                <Loader2 size={12} className="animate-spin" />
                                                                            ) : (
                                                                                <Upload size={12} />
                                                                            )}
                                                                            {isUploadingFile === day.id ? "Subiendo..." : "Subir PDF"}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={day.assignmentUrl || ""}
                                                                    onChange={(e) => handleUpdateDay(week.id, day.id, "assignmentUrl", e.target.value)}
                                                                    className="w-full bg-[rgba(0,100,255,0.05)] border border-blue-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                                                                    placeholder="Subir archivo o pegar enlace externo..."
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add Day Button */}
                                            <button
                                                onClick={() => handleAddDay(week.id)}
                                                className="w-full py-3 border border-dashed border-slate-600 rounded-xl text-slate-400 text-sm font-medium hover:text-white hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} /> Agregar nuevo día
                                            </button>
                                        </div>

                                    </div>
                                ))}

                                {course.weeks.length === 0 && (
                                    <div className="p-10 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <List className="w-12 h-12 text-slate-600 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-300 mb-2">Currículo Vacío</h3>
                                        <p className="text-slate-500 max-w-sm mb-6">Comienza construyendo tu temario agregando una nueva semana.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
