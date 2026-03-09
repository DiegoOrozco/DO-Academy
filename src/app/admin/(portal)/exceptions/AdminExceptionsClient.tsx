"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Calendar, Trash2, Clock, X, Check, Loader2, AlertCircle } from "lucide-react";
import { searchStudents, saveException, deleteException } from "@/actions/exceptions";

export default function AdminExceptionsClient({
    courses,
    initialExceptions
}: {
    courses: any[],
    initialExceptions: any[]
}) {
    const [exceptions, setExceptions] = useState(initialExceptions);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [studentQuery, setStudentQuery] = useState("");
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isSearchingStudents, setIsSearchingStudents] = useState(false);

    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedDayId, setSelectedDayId] = useState("");

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter courses that have delivery days
    const coursesWithDeliveries = courses.filter(c =>
        c.weeks.some((w: any) => w.days.some((d: any) => d.isDeliveryDay || !!d.dueDate))
    );

    const activeCourse = courses.find(c => c.id === selectedCourseId);
    let allDeliveryDays: any[] = [];
    if (activeCourse) {
        activeCourse.weeks.forEach((w: any) => {
            w.days.filter((d: any) => d.isDeliveryDay || !!d.dueDate).forEach((d: any) => {
                allDeliveryDays.push({ ...d, weekTitle: w.title });
            });
        });
    }

    // Debounce student search
    useEffect(() => {
        if (!studentQuery || selectedStudent) {
            setStudents([]);
            return;
        }

        const delayFn = setTimeout(async () => {
            setIsSearchingStudents(true);
            try {
                const results = await searchStudents(studentQuery);
                setStudents(results);
            } catch (e) { }
            setIsSearchingStudents(false);
        }, 500);

        return () => clearTimeout(delayFn);
    }, [studentQuery, selectedStudent]);

    const handleCreateException = async () => {
        if (!selectedStudent || !selectedDayId || !selectedDate || !selectedTime) {
            setError("Por favor completa todos los campos.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const newDueDate = new Date(`${selectedDate}T${selectedTime}`);

        const result = await saveException({
            userId: selectedStudent.id,
            dayId: selectedDayId,
            newDueDate
        });

        if (result.success) {
            setIsModalOpen(false);
            window.location.reload();
        } else {
            setError(result.error || "Ocurrió un error.");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta excepción?")) return;
        const res = await deleteException(id);
        if (res.success) {
            setExceptions(prev => prev.filter(e => e.id !== id));
        } else {
            alert("Error al eliminar la excepción.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Excepciones de Fecha</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Otorga prórrogas de entrega a estudiantes específicos.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-[var(--color-primary)] hover:brightness-110 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Nueva Excepción
                </button>
            </div>

            <div className="glass-effect rounded-3xl border border-[var(--border-color)] overflow-hidden bg-[var(--card-bg)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/5">
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Estudiante</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Actividad</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Nueva Fecha Límite</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {exceptions.map((exc) => (
                                <tr key={exc.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-white leading-none mb-1">{exc.user.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{exc.user.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-300 leading-none mb-1">{exc.day.title}</p>
                                        <p className="text-[10px] text-[var(--color-primary)] font-bold">{exc.day.week?.course?.title || "Curso Desconocido"}</p>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-2 mt-2">
                                        <Calendar size={14} className="text-emerald-400" />
                                        <span className="text-sm font-bold text-emerald-400">
                                            {new Date(exc.newDueDate).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(exc.id)}
                                            className="text-slate-500 hover:text-rose-400 transition-colors p-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {exceptions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No hay excepciones de entrega registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#14181E] border border-slate-700/50 rounded-3xl w-full max-w-xl min-h-[500px] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center text-slate-300 relative bg-slate-800/20">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Clock className="text-[var(--color-primary)]" />
                                Otorgar Prórroga
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-bold flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2 relative">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estudiante</label>
                                {selectedStudent ? (
                                    <div className="flex items-center justify-between p-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl">
                                        <div>
                                            <p className="text-sm font-bold text-white">{selectedStudent.name}</p>
                                            <p className="text-xs text-[var(--color-primary)] opacity-80">{selectedStudent.email}</p>
                                        </div>
                                        <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre o correo..."
                                            value={studentQuery}
                                            onChange={(e) => setStudentQuery(e.target.value)}
                                            className="w-full bg-black/20 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                                        />
                                        {isSearchingStudents && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" size={18} />
                                        )}

                                        {students.length > 0 && !selectedStudent && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1F26] border border-slate-700 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto">
                                                {students.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => { setSelectedStudent(s); setStudentQuery(""); setStudents([]); }}
                                                        className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-slate-700/50 last:border-0 transition-colors"
                                                    >
                                                        <p className="text-sm font-bold text-white">{s.name}</p>
                                                        <p className="text-xs text-slate-400">{s.email}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Curso</label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedDayId(""); }}
                                    className="w-full bg-black/20 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all appearance-none"
                                >
                                    <option value="" disabled className="text-slate-500">Seleccionar Curso</option>
                                    {coursesWithDeliveries.map(c => (
                                        <option key={c.id} value={c.id} className="bg-[#1A1F26]">{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedCourseId && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Entrega</label>
                                    <select
                                        value={selectedDayId}
                                        onChange={(e) => setSelectedDayId(e.target.value)}
                                        className="w-full bg-black/20 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all appearance-none"
                                    >
                                        <option value="" disabled>Seleccionar Actividad</option>
                                        {allDeliveryDays.map(d => (
                                            <option key={d.id} value={d.id} className="bg-[#1A1F26]">
                                                {d.weekTitle} - {d.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nueva Fecha límite</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-black/20 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all [color-scheme:dark]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hora</label>
                                    <input
                                        type="time"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="w-full bg-black/20 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-700/50 bg-slate-800/20">
                            <button
                                onClick={handleCreateException}
                                disabled={isSubmitting || !selectedStudent || !selectedDayId || !selectedDate || !selectedTime}
                                className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Otorgar Excepción
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
