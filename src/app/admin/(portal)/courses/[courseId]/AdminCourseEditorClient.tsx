"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Settings, List, Plus, Trash2, GripVertical, Video, Link2, Loader2, FileText, Upload, ChevronDown, ChevronRight, Tags, Calendar, Code, Lock, ShieldAlert, Copy } from "lucide-react";
import { saveCourseData } from "@/actions/admin-course";
import { useRouter } from "next/navigation";

// DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable Wrapper Components ---

// --- Sortable Wrapper Components ---
import { createContext, useContext } from "react";

const SortableItemContext = createContext<{
    attributes: Record<string, any>;
    listeners: Record<string, any> | undefined;
    ref: (node: HTMLElement | null) => void;
}>({
    attributes: {},
    listeners: undefined,
    ref: () => { }
});

function SortableItem({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <SortableItemContext.Provider value={{ attributes, listeners, ref: setNodeRef }}>
            <div ref={setNodeRef} style={style} className={className}>
                {children}
            </div>
        </SortableItemContext.Provider>
    );
}

function DragHandle({ className, children }: { className?: string, children: React.ReactNode }) {
    const { attributes, listeners } = useContext(SortableItemContext);
    return (
        <div {...attributes} {...listeners} className={`cursor-grab active:cursor-grabbing ${className || ""}`}>
            {children}
        </div>
    );
}

export default function AdminCourseEditorClient({ initialCourse }: { initialCourse: any }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"settings" | "curriculum">("curriculum");
    const [isSaving, setIsSaving] = useState(false);
    const [expandedWeeks, setExpandedWeeks] = useState<string[]>(initialCourse.weeks?.map((w: any) => w.id) || []);

    const toggleWeek = (weekId: string) => {
        setExpandedWeeks((prev) =>
            prev.includes(weekId) ? prev.filter((id) => id !== weekId) : [...prev, weekId]
        );
    };

    // Initial state setup mapping Prisma format to Component format if necessary
    const [course, setCourse] = useState(() => ({
        id: initialCourse.id,
        title: initialCourse.title,
        description: initialCourse.description || "",
        status: initialCourse.status || "published",
        password: initialCourse.password || "doacademy",
        thumbnail: initialCourse.thumbnail || "",
        weightQuiz: initialCourse.weightQuiz || 20,
        weightLab: initialCourse.weightLab || 30,
        weightForum: initialCourse.weightForum || 10,
        weightProject: initialCourse.weightProject || 40,
        weeks: initialCourse.weeks?.length > 0 ? initialCourse.weeks.map((w: any) => ({
            ...w,
            days: w.days?.length > 0 ? w.days.map((d: any) => ({ ...d })) : []
        })) : []
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

    const handleDuplicateWeek = (week: any) => {
        const newWeek = {
            ...week,
            id: `w${Date.now()}`,
            title: `${week.title} (Copia)`,
            days: week.days.map((day: any, index: number) => ({
                ...day,
                id: `d${Date.now()}-${index}`,
            }))
        };
        setCourse({ ...course, weeks: [...course.weeks, newWeek] });
        setExpandedWeeks(prev => [...prev, newWeek.id]);
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

    const handleFileUpload = async (weekId: string, dayId: string, file: File, field: string) => {
        setIsUploadingFile(`${dayId}-${field}`);
        try {
            const response = await fetch(`/api/admin/upload-file?filename=${file.name}`, {
                method: "POST",
                body: file,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error al subir archivo");
            }

            const blob = await response.json();
            handleUpdateDay(weekId, dayId, field, blob.url);
        } catch (error: any) {
            alert("Error: " + error.message);
            console.error(error);
        } finally {
            setIsUploadingFile(null);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        // Determine if we are dragging a week or a day
        const isActiveWeek = activeId.startsWith("w") || course.weeks.some((w: any) => w.id === activeId);
        const isOverWeek = overId.startsWith("w") || course.weeks.some((w: any) => w.id === overId);

        if (isActiveWeek) {
            // Reordering weeks
            const oldIndex = course.weeks.findIndex((w: any) => w.id === activeId);
            const newIndex = course.weeks.findIndex((w: any) => w.id === overId);

            if (oldIndex !== -1 && newIndex !== -1) {
                setCourse({
                    ...course,
                    weeks: arrayMove(course.weeks, oldIndex, newIndex)
                });
            }
        } else {
            // Reordering days
            let activeWeekId = "";
            let activeDayIndex = -1;
            let overWeekId = "";
            let overDayIndex = -1;

            course.weeks.forEach((w: any) => {
                const dIdx = w.days.findIndex((d: any) => d.id === activeId);
                if (dIdx !== -1) {
                    activeWeekId = w.id;
                    activeDayIndex = dIdx;
                }

                const oIdx = w.days.findIndex((d: any) => d.id === overId);
                if (oIdx !== -1) {
                    overWeekId = w.id;
                    overDayIndex = oIdx;
                }
            });

            // If we are dropping over a week directly (empty area of a week)
            if (isOverWeek && !overWeekId) {
                overWeekId = overId;
                overDayIndex = course.weeks.find((w: any) => w.id === overId)?.days.length || 0;
            }

            if (activeWeekId && overWeekId) {
                const newWeeks = [...course.weeks];
                const activeWeekIdx = newWeeks.findIndex(w => w.id === activeWeekId);
                const overWeekIdx = newWeeks.findIndex(w => w.id === overWeekId);

                const [movedDay] = newWeeks[activeWeekIdx].days.splice(activeDayIndex, 1);
                newWeeks[overWeekIdx].days.splice(overDayIndex === -1 ? newWeeks[overWeekIdx].days.length : overDayIndex, 0, movedDay);

                setCourse({
                    ...course,
                    weeks: newWeeks
                });
            }
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
                        <div className="flex flex-col items-start">
                            <span>Ajustes del Curso</span>
                            <span className="text-[9px] text-slate-500 font-normal">Porcentajes de Evaluación</span>
                        </div>
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

                            <div className="pt-6 border-t border-slate-800">
                                <h3 className="text-lg font-bold text-white mb-4">Porcentajes de Evaluación</h3>
                                <p className="text-sm text-slate-400 mb-6">Configura el peso de cada rubro. El total debe sumar 100%.</p>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-2">Quices (%)</label>
                                        <input
                                            type="number"
                                            value={course.weightQuiz}
                                            onChange={(e) => setCourse({ ...course, weightQuiz: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-2">Laboratorios (%)</label>
                                        <input
                                            type="number"
                                            value={course.weightLab}
                                            onChange={(e) => setCourse({ ...course, weightLab: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-2">Foros (%)</label>
                                        <input
                                            type="number"
                                            value={course.weightForum}
                                            onChange={(e) => setCourse({ ...course, weightForum: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-2">Proyectos (%)</label>
                                        <input
                                            type="number"
                                            value={course.weightProject}
                                            onChange={(e) => setCourse({ ...course, weightProject: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <span className="text-slate-400">Total:</span>
                                    <span className={`font-bold ${(course.weightQuiz + course.weightLab + course.weightForum + course.weightProject) === 100 ? "text-emerald-400" : "text-red-400"}`}>
                                        {course.weightQuiz + course.weightLab + course.weightForum + course.weightProject}%
                                    </span>
                                </div>
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

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={course.weeks.map((w: any) => w.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-4">
                                        {course.weeks.map((week: any, wIndex: number) => (
                                            <SortableItem key={week.id} id={week.id} className="glass-effect border border-[var(--color-glass-border)] rounded-2xl overflow-visible shadow-lg flex flex-col w-full">
                                                {/* Week Header */}
                                                <div className="bg-slate-900/50 p-4 border-b border-[var(--color-glass-border)] flex items-center justify-between gap-4 w-full">
                                                    <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
                                                        <button
                                                            onClick={() => toggleWeek(week.id)}
                                                            className="text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            {expandedWeeks.includes(week.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                        </button>
                                                        <DragHandle>
                                                            <GripVertical className="text-slate-600 hover:text-slate-400 transition-colors" size={18} />
                                                        </DragHandle>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <input
                                                            type="text"
                                                            value={week.title}
                                                            onChange={(e) => handleUpdateWeek(week.id, e.target.value)}
                                                            className="bg-transparent border-none text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded px-2 w-full max-w-sm transition-all"
                                                            placeholder="Ej. Semana 1: Introducción"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleDuplicateWeek(week)}
                                                            className="text-slate-500 hover:text-emerald-400 transition-colors p-2 rounded-lg hover:bg-emerald-500/10"
                                                            title="Duplicar Semana"
                                                        >
                                                            <Copy size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteWeek(week.id)}
                                                            className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                                            title="Eliminar Semana"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Days List (Collapsible) */}
                                                {expandedWeeks.includes(week.id) && (
                                                    <div className="p-4 space-y-4">
                                                        <SortableContext
                                                            items={week.days.map((d: any) => d.id)}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            {week.days.map((day: any, dIndex: number) => (
                                                                <SortableItem key={day.id} id={day.id} className="bg-black/30 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-4 relative group">

                                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                        <button
                                                                            onClick={() => handleDeleteDay(week.id, day.id)}
                                                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex items-center gap-3 w-full pr-8">
                                                                        <div className="flex items-center gap-2">
                                                                            <DragHandle>
                                                                                <GripVertical className="text-slate-600 hover:text-slate-400 transition-colors" size={16} />
                                                                            </DragHandle>
                                                                            <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded">Día {dIndex + 1}</span>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={day.title}
                                                                            onChange={(e) => handleUpdateDay(week.id, day.id, "title", e.target.value)}
                                                                            className="bg-transparent border-b border-transparent text-white font-semibold focus:outline-none focus:border-[var(--color-primary)] px-1 w-full transition-all"
                                                                            placeholder="Título de la lección"
                                                                        />
                                                                    </div>

                                                                    <div className="flex flex-col gap-4 mt-2">
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
                                                                            <div className="flex items-center justify-between">
                                                                                <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                                                    <Link2 size={12} /> Material Adicional (Ej. GitHub, PDF)
                                                                                </label>
                                                                                <div className="flex items-center gap-2">
                                                                                    <input
                                                                                        type="file"
                                                                                        id={`upload-material-${day.id}`}
                                                                                        className="hidden"
                                                                                        accept=".pdf,.doc,.docx,.zip,.rar,.md"
                                                                                        onChange={(e) => {
                                                                                            const f = e.target.files?.[0];
                                                                                            if (f) handleFileUpload(week.id, day.id, f, "materialUrl");
                                                                                        }}
                                                                                    />
                                                                                    <button
                                                                                        disabled={isUploadingFile === `${day.id}-materialUrl`}
                                                                                        onClick={() => document.getElementById(`upload-material-${day.id}`)?.click()}
                                                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] hover:text-white transition-colors uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                                                                                    >
                                                                                        {isUploadingFile === `${day.id}-materialUrl` ? (
                                                                                            <Loader2 size={12} className="animate-spin" />
                                                                                        ) : (
                                                                                            <Upload size={12} />
                                                                                        )}
                                                                                        {isUploadingFile === `${day.id}-materialUrl` ? "Subiendo..." : "Subir Archivo"}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                value={day.materialUrl || ""}
                                                                                onChange={(e) => handleUpdateDay(week.id, day.id, "materialUrl", e.target.value)}
                                                                                className="w-full bg-[rgba(0,0,0,0.5)] border border-slate-700/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                                                                placeholder="https://github.com/... o subir archivo"
                                                                            />
                                                                        </div>

                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                                                    <FileText size={12} className="text-[var(--color-primary)]" /> Resumen de la Clase (PDF)
                                                                                </label>
                                                                                <div className="flex items-center gap-2">
                                                                                    <input
                                                                                        type="file"
                                                                                        id={`upload-summary-${day.id}`}
                                                                                        className="hidden"
                                                                                        accept=".pdf"
                                                                                        onChange={(e) => {
                                                                                            const f = e.target.files?.[0];
                                                                                            if (f) handleFileUpload(week.id, day.id, f, "summaryUrl");
                                                                                        }}
                                                                                    />
                                                                                    <button
                                                                                        disabled={isUploadingFile === `${day.id}-summaryUrl`}
                                                                                        onClick={() => document.getElementById(`upload-summary-${day.id}`)?.click()}
                                                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] hover:text-white transition-colors uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                                                                                    >
                                                                                        {isUploadingFile === `${day.id}-summaryUrl` ? (
                                                                                            <Loader2 size={12} className="animate-spin" />
                                                                                        ) : (
                                                                                            <Upload size={12} />
                                                                                        )}
                                                                                        {isUploadingFile === `${day.id}-summaryUrl` ? "Subiendo..." : "Subir Resumen"}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                value={day.summaryUrl || ""}
                                                                                onChange={(e) => handleUpdateDay(week.id, day.id, "summaryUrl", e.target.value)}
                                                                                className="w-full bg-[rgba(0,0,0,0.5)] border border-slate-700/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                                                                placeholder="URL del PDF de resumen o subir archivo"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="pt-4 border-t border-slate-800 flex flex-col items-start gap-6">
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
                                                                            <div className="flex-1 w-full animate-in fade-in slide-in-from-left-2 duration-300 space-y-6">
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                    <div className="space-y-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Tags size={12} className="text-purple-400" />
                                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Asignación</label>
                                                                                        </div>
                                                                                        <select
                                                                                            value={day.assignmentType || "LAB"}
                                                                                            onChange={(e) => handleUpdateDay(week.id, day.id, "assignmentType", e.target.value)}
                                                                                            className="w-full bg-[rgba(255,255,255,0.05)] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-sans"
                                                                                        >
                                                                                            <option value="QUIZ">Quiz / Prueba Corta</option>
                                                                                            <option value="LAB">Laboratorio Práctico</option>
                                                                                            <option value="FORUM">Foro de Discusión</option>
                                                                                            <option value="PROJECT">Proyecto Final</option>
                                                                                        </select>
                                                                                    </div>

                                                                                    <div className="space-y-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Calendar size={12} className="text-rose-400" />
                                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fecha Límite (Deadline)</label>
                                                                                        </div>
                                                                                        <input
                                                                                            type="datetime-local"
                                                                                            value={day.dueDate ? new Date(day.dueDate).toISOString().slice(0, 16) : ""}
                                                                                            onChange={(e) => handleUpdateDay(week.id, day.id, "dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
                                                                                            className="w-full bg-[rgba(255,255,255,0.05)] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-all font-sans"
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                {day.assignmentType === "FORUM" && (
                                                                                    <div className="space-y-2">
                                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temas del Foro (Un tema por línea)</label>
                                                                                        <textarea
                                                                                            value={day.forumTopics || ""}
                                                                                            onChange={(e) => handleUpdateDay(week.id, day.id, "forumTopics", e.target.value)}
                                                                                            placeholder={"Tema 1: ¿Qué opinas de X?\nTema 2: ¿Cómo resolverías Y?"}
                                                                                            className="w-full h-24 bg-[rgba(255,255,255,0.05)] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-all resize-y font-sans"
                                                                                        />
                                                                                    </div>
                                                                                )}

                                                                                {day.assignmentType !== "FORUM" && (
                                                                                    <div className="space-y-6">
                                                                                        <div>
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
                                                                                                            if (f) handleFileUpload(week.id, day.id, f, "assignmentUrl");
                                                                                                        }}
                                                                                                    />
                                                                                                    <button
                                                                                                        disabled={isUploadingFile === `${day.id}-assignmentUrl`}
                                                                                                        onClick={() => (document.getElementById(`upload-${day.id}`) as HTMLInputElement)?.click()}
                                                                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] hover:text-white transition-colors uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                                                                                                    >
                                                                                                        {isUploadingFile === `${day.id}-assignmentUrl` ? (
                                                                                                            <Loader2 size={12} className="animate-spin" />
                                                                                                        ) : (
                                                                                                            <Upload size={12} />
                                                                                                        )}
                                                                                                        {isUploadingFile === `${day.id}-assignmentUrl` ? "Subiendo..." : "Subir PDF"}
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={day.assignmentUrl || ""}
                                                                                                onChange={(e) => handleUpdateDay(week.id, day.id, "assignmentUrl", e.target.value)}
                                                                                                className="w-full bg-[rgba(0,100,255,0.05)] border border-blue-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 mb-4 font-sans"
                                                                                                placeholder="Subir archivo o pegar enlace externo..."
                                                                                            />

                                                                                            <div className="pt-4 border-t border-slate-800 space-y-4">
                                                                                                <div className="flex flex-col sm:flex-row gap-6">
                                                                                                    <div className="flex-1 space-y-4">
                                                                                                        <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                                                                                            <div className="relative inline-flex items-center">
                                                                                                                <input
                                                                                                                    type="checkbox"
                                                                                                                    className="sr-only peer"
                                                                                                                    checked={!!day.enablePlagiarism}
                                                                                                                    onChange={(e) => handleUpdateDay(week.id, day.id, "enablePlagiarism", e.target.checked)}
                                                                                                                />
                                                                                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                                                                                            </div>
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <ShieldAlert size={14} className="text-amber-500" />
                                                                                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest group-hover/toggle:text-amber-400 transition-colors">Activar Detección de Plagio</span>
                                                                                                            </div>
                                                                                                        </label>

                                                                                                        {day.enablePlagiarism && (
                                                                                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 pl-4 border-l-2 border-amber-500/20">
                                                                                                                <div className="space-y-1">
                                                                                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                                                                                                        Sensibilidad ({Math.round((day.similarityThreshold || 0.6) * 100)}%)
                                                                                                                    </label>
                                                                                                                    <input
                                                                                                                        type="range"
                                                                                                                        min="0.1"
                                                                                                                        max="0.95"
                                                                                                                        step="0.05"
                                                                                                                        value={day.similarityThreshold || 0.6}
                                                                                                                        onChange={(e) => handleUpdateDay(week.id, day.id, "similarityThreshold", parseFloat(e.target.value))}
                                                                                                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                                                                                    />
                                                                                                                    <p className="text-[9px] text-slate-500">Menor valor = Más estricto.</p>
                                                                                                                </div>

                                                                                                                <Link
                                                                                                                    href={`/admin/plagiarism/${day.id}`}
                                                                                                                    className="inline-flex items-center gap-2 text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-all font-mono"
                                                                                                                >
                                                                                                                    <ShieldAlert size={12} /> Ver Reporte
                                                                                                                </Link>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>

                                                                                                    <div className="flex-1 space-y-2">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <Settings size={12} className="text-orange-400" />
                                                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nivel de Exigencia (IA)</label>
                                                                                                        </div>
                                                                                                        <select
                                                                                                            value={day.gradingSeverity || 1}
                                                                                                            onChange={(e) => handleUpdateDay(week.id, day.id, "gradingSeverity", parseInt(e.target.value))}
                                                                                                            className="w-full bg-[rgba(255,150,0,0.05)] border border-orange-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-all font-sans"
                                                                                                        >
                                                                                                            <option value={1}>Nivel 1: Introductorio</option>
                                                                                                            <option value={2}>Nivel 2: Estándar</option>
                                                                                                            <option value={3}>Nivel 3: Avanzado</option>
                                                                                                            <option value={4}>Nivel 4: Profesional</option>
                                                                                                            <option value={5}>Nivel 5: Élite</option>
                                                                                                        </select>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="pt-4 border-t border-slate-800 space-y-4">
                                                                                            <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                                                                                <div className="relative inline-flex items-center">
                                                                                                    <input
                                                                                                        type="checkbox"
                                                                                                        className="sr-only peer"
                                                                                                        checked={!!day.isCodingExercise}
                                                                                                        onChange={(e) => handleUpdateDay(week.id, day.id, "isCodingExercise", e.target.checked)}
                                                                                                    />
                                                                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <Code size={14} className="text-emerald-400" />
                                                                                                    <span className="text-xs font-bold text-white uppercase tracking-widest group-hover/toggle:text-emerald-400 transition-colors">Activar Ejercicio de Programación</span>
                                                                                                </div>
                                                                                            </label>

                                                                                            {day.isCodingExercise && (
                                                                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pl-6 border-l border-emerald-500/20 mt-4">
                                                                                                    <div className="space-y-1">
                                                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enunciado del Ejercicio</label>
                                                                                                        <textarea
                                                                                                            value={day.exerciseDescription || ""}
                                                                                                            onChange={(e) => handleUpdateDay(week.id, day.id, "exerciseDescription", e.target.value)}
                                                                                                            placeholder="Describe el problema que el alumno debe resolver..."
                                                                                                            className="w-full h-24 bg-black/40 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 transition-all resize-y font-sans"
                                                                                                        />
                                                                                                    </div>

                                                                                                    <div className="space-y-2">
                                                                                                        <div className="flex items-center justify-between">
                                                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Casos de Prueba (Input / Output)</label>
                                                                                                            <button
                                                                                                                onClick={() => {
                                                                                                                    const currentTestCases = Array.isArray(day.testCases) ? [...day.testCases] : [];
                                                                                                                    handleUpdateDay(week.id, day.id, "testCases", [...currentTestCases, { input: "", output: "" }]);
                                                                                                                }}
                                                                                                                className="text-xs text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded"
                                                                                                            >
                                                                                                                <Plus size={12} /> Añadir Caso
                                                                                                            </button>
                                                                                                        </div>
                                                                                                        {Array.isArray(day.testCases) && day.testCases.map((tc: any, tcIdx: number) => (
                                                                                                            <div key={tcIdx} className="flex gap-2 items-start bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                                                                                                <div className="flex-1 space-y-2">
                                                                                                                    <textarea
                                                                                                                        value={tc.input}
                                                                                                                        onChange={(e) => {
                                                                                                                            const newTc = [...day.testCases];
                                                                                                                            newTc[tcIdx].input = e.target.value;
                                                                                                                            handleUpdateDay(week.id, day.id, "testCases", newTc);
                                                                                                                        }}
                                                                                                                        placeholder="Entrada..."
                                                                                                                        className="w-full h-20 bg-black/40 border border-slate-700/50 rounded p-2 text-xs text-blue-300 font-mono focus:border-blue-500 focus:outline-none"
                                                                                                                    />
                                                                                                                    <textarea
                                                                                                                        value={tc.output}
                                                                                                                        onChange={(e) => {
                                                                                                                            const newTc = [...day.testCases];
                                                                                                                            newTc[tcIdx].output = e.target.value;
                                                                                                                            handleUpdateDay(week.id, day.id, "testCases", newTc);
                                                                                                                        }}
                                                                                                                        placeholder="Salida..."
                                                                                                                        className="w-full h-20 bg-black/40 border border-slate-700/50 rounded p-2 text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                                                                                                                    />
                                                                                                                </div>
                                                                                                                <button
                                                                                                                    onClick={() => {
                                                                                                                        const newTc = day.testCases.filter((_: any, i: number) => i !== tcIdx);
                                                                                                                        handleUpdateDay(week.id, day.id, "testCases", newTc);
                                                                                                                    }}
                                                                                                                    className="text-rose-500 hover:text-rose-400 p-2 bg-rose-500/10 rounded transition-colors"
                                                                                                                >
                                                                                                                    <Trash2 size={14} />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </SortableItem>
                                                            ))}
                                                            <button
                                                                onClick={() => handleAddDay(week.id)}
                                                                className="w-full border-2 border-dashed border-slate-700 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 text-slate-400 hover:text-[var(--color-primary)] font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                                                            >
                                                                <Plus size={16} /> Agregar Día a {week.title}
                                                            </button>
                                                        </SortableContext>
                                                    </div>
                                                )}
                                            </SortableItem>
                                        ))}

                                        {course.weeks.length === 0 && (
                                            <div className="p-10 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center">
                                                <List className="w-12 h-12 text-slate-600 mb-4" />
                                                <h3 className="text-lg font-bold text-slate-300 mb-2">Currículo Vacío</h3>
                                                <p className="text-slate-500 max-w-sm mb-6">Comienza construyendo tu temario agregando una nueva semana.</p>
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
}
