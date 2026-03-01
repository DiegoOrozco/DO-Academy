"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit3, Eye, EyeOff, Search, Plus, Loader2 } from "lucide-react";
import { createEmptyCourse } from "@/actions/admin-course";

export default function AdminCoursesClient({ initialCourses }: { initialCourses: any[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCreating, setIsCreating] = useState(false);

    const filteredCourses = initialCourses.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateCourse = async () => {
        setIsCreating(true);
        try {
            const res = await createEmptyCourse();
            if (res.success && res.courseId) {
                router.push(`/admin/courses/${res.courseId}`);
            } else {
                alert("Error al crear curso: " + res.error);
                setIsCreating(false);
            }
        } catch (e) {
            alert("Error de conexión");
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Mis Cursos</h1>
                    <p className="text-slate-400">Gestiona el contenido, lecciones y visibilidad de tus cursos.</p>
                </div>
                <button
                    onClick={handleCreateCourse}
                    disabled={isCreating}
                    className={`${isCreating ? "opacity-70 cursor-not-allowed" : ""} bg-[var(--color-primary)] hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-300 glow-accent flex items-center gap-2`}
                >
                    {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    {isCreating ? "Creando..." : "Nuevo Curso"}
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
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[rgba(0,0,0,0.3)] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    >
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
                                src={course.thumbnail || "/thumbnails/01.png"}
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
                            <p className="text-sm text-slate-400 mb-4">{Math.floor(Math.random() * 100)} estudiantes inscritos</p>

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
