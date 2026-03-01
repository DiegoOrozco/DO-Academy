"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, Eye, EyeOff, Search, Plus } from "lucide-react";

// Reuse Mock Data for Admin
const ADMIN_COURSES = [
    { id: "01", title: "01 - Fundamentos de programación", students: 120, status: "published", thumbnail: "/thumbnails/01.png" },
    { id: "02", title: "02 - Programación Orientada a Objetos", students: 85, status: "published", thumbnail: "/thumbnails/02.png" },
    { id: "03", title: "03 - Bases de datos", students: 102, status: "published", thumbnail: "/thumbnails/03.png" },
    { id: "04", title: "04 - Programación Avanzada", students: 45, status: "draft", thumbnail: "/thumbnails/04.png" },
    { id: "05", title: "05 - Desarrollo Seguro", students: 12, status: "draft", thumbnail: "/thumbnails/05.png" },
    { id: "06", title: "06 - Desarrollo asistido por IA", students: 200, status: "published", thumbnail: "/thumbnails/06.png" },
];

export default function AdminCoursesPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCourses = ADMIN_COURSES.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Mis Cursos</h1>
                    <p className="text-slate-400">Gestiona el contenido, lecciones y visibilidad de tus cursos.</p>
                </div>
                <button className="bg-[var(--color-primary)] hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-300 glow-accent flex items-center gap-2">
                    <Plus size={18} />
                    Nuevo Curso
                </button>
            </div>

            {/* Toolbar */}
            <div className="glass-effect p-4 rounded-xl flex flex-col sm:flex-row gap-4 border border-[var(--color-glass-border)]">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cursos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <select className="bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-[var(--color-primary)] transition-all">
                        <option value="all">Todos los estados</option>
                        <option value="published">Publicados</option>
                        <option value="draft">Borradores</option>
                    </select>
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="glass-effect rounded-2xl overflow-hidden border border-[var(--color-glass-border)] group flex flex-col">

                        <div className="h-40 relative overflow-hidden bg-slate-800">
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute top-3 right-3 flex gap-2">
                                {course.status === "published" ? (
                                    <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                                        <Eye size={12} /> Publicado
                                    </span>
                                ) : (
                                    <span className="bg-slate-700/90 backdrop-blur-sm text-slate-300 text-[10px] uppercase font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                                        <EyeOff size={12} /> Oculto
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-transparent to-black/20">
                            <h3 className="text-lg font-bold text-white mb-2 leading-tight line-clamp-2">{course.title}</h3>
                            <p className="text-sm text-slate-400 mb-4">{course.students} estudiantes inscritos</p>

                            <div className="mt-auto flex gap-3 pt-4 border-t border-slate-700/30">
                                <Link
                                    href={`/admin/courses/${course.id}`}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/5"
                                >
                                    <Edit3 size={16} />
                                    Editar Contenido
                                </Link>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
}
