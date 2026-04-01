"use client";

import { useState, useMemo } from "react";
import { Search, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import CoursePreviewModal from "./CoursePreviewModal";

interface Day {
    id: string;
    title: string;
    order: number;
}

interface Week {
    id: string;
    title: string;
    days: Day[];
}

interface Course {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    status: string;
    category: string;
    progressPct?: number;
    weeks?: Week[];
}

interface CourseCatalogProps {
    allCourses: Course[];
    enrolledCourseIds: string[];
    student: any;
}

export default function CourseCatalog({ allCourses, enrolledCourseIds, student }: CourseCatalogProps) {
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
    const [previewCourse, setPreviewCourse] = useState<Course | null>(null);

    // Sync search with URL param on mount
    useEffect(() => {
        const querySearch = searchParams.get("search");
        if (querySearch) {
            setSearch(querySearch);
            // After setting search, scroll to catalog 
            const catalog = document.getElementById("catalog");
            if (catalog) {
                catalog.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [searchParams]);

    const categories = useMemo(() => {
        const cats = new Set(allCourses.map(c => c.category));
        return ["Todas", ...Array.from(cats)].sort();
    }, [allCourses]);

    const filteredCourses = useMemo(() => {
        return allCourses.filter(course => {
            const matchesSearch =
                course.title.toLowerCase().includes(search.toLowerCase()) ||
                (course.description?.toLowerCase().includes(search.toLowerCase()) || false);
            const matchesCategory = selectedCategory === "Todas" || course.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allCourses, search, selectedCategory]);

    const myCourses = filteredCourses.filter(c => enrolledCourseIds.includes(c.id));
    const availableCourses = filteredCourses.filter(c => !enrolledCourseIds.includes(c.id));

    return (
        <div className="space-y-10">

            {/* ── SEARCH + FILTER BAR ── */}
            <div
                className="sticky top-14 z-30 flex flex-col gap-3 py-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-10 lg:px-10"
                style={{
                    background: 'rgba(14,14,19,0.95)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid var(--raw-outline-dim)',
                }}
            >
                {/* Search */}
                <div className="relative w-full">
                    <Search
                        size={15}
                        className="absolute left-4 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--raw-slate)' }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar cursos por nombre o descripción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full text-sm outline-none"
                        style={{
                            background: 'var(--raw-surface-low)',
                            border: '1px solid var(--raw-outline-dim)',
                            borderRadius: 0,
                            paddingLeft: '2.5rem',
                            paddingRight: '1rem',
                            paddingTop: '0.75rem',
                            paddingBottom: '0.75rem',
                            color: 'var(--raw-on-surface)',
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '0.875rem',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--raw-accent)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--raw-outline-dim)'}
                    />
                </div>

                {/* Category buttons — horizontal scroll on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <span className="raw-label flex-shrink-0 hidden md:block" style={{ color: 'var(--raw-outline)' }}>FILTRAR:</span>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest transition-all"
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                padding: '6px 14px',
                                whiteSpace: 'nowrap',
                                borderRadius: selectedCategory === cat ? 0 : '9999px',
                                background: selectedCategory === cat ? 'var(--raw-accent)' : 'transparent',
                                color: selectedCategory === cat ? 'var(--raw-bg)' : 'var(--raw-slate)',
                                border: selectedCategory === cat ? '1px solid var(--raw-accent)' : '1px solid var(--raw-outline-dim)',
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center gap-4">
                <div className="h-px flex-1" style={{ background: 'var(--raw-outline-dim)' }} />
                <p className="raw-label" style={{ color: 'var(--raw-outline)', whiteSpace: 'nowrap' }}>
                    {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''}
                </p>
                <div className="h-px flex-1" style={{ background: 'var(--raw-outline-dim)' }} />
            </div>

            {/* ── MY COURSES ── */}
            {student && myCourses.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="raw-label" style={{ color: 'var(--raw-accent)' }}>// MIS CURSOS</span>
                        <div className="h-px flex-1" style={{ background: 'var(--raw-outline-dim)' }} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {myCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/course/${course.id}`}
                                className="group raw-card flex flex-col overflow-hidden"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-full overflow-hidden" style={{ height: '160px', background: 'var(--raw-surface-highest)' }}>
                                    {course.thumbnail ? (
                                        <Image
                                            src={course.thumbnail}
                                            alt={course.title}
                                            fill
                                            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="font-black text-4xl" style={{ color: 'var(--raw-outline-dim)' }}>
                                                {course.title.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    {/* Category pill overlay */}
                                    <div className="absolute top-3 left-3">
                                        <span
                                            className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                                            style={{ background: 'var(--raw-accent)', color: 'var(--raw-bg)' }}
                                        >
                                            {course.category}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <ArrowRight
                                            size={14}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ color: 'var(--raw-accent)' }}
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3
                                        className="font-black leading-tight mb-1 group-hover:text-[var(--raw-accent)] transition-colors"
                                        style={{ fontSize: '1rem', color: 'var(--raw-on-surface)', letterSpacing: '-0.01em' }}
                                    >
                                        {course.title}
                                    </h3>
                                    <p
                                        className="text-xs line-clamp-2 mb-4 flex-1"
                                        style={{ color: 'var(--raw-slate)' }}
                                    >
                                        {course.description}
                                    </p>

                                    {/* Progress */}
                                    <div>
                                        <div className="flex justify-between mb-1.5">
                                            <span className="raw-label">progreso</span>
                                            <span className="text-[10px] font-black" style={{ color: 'var(--raw-accent)' }}>
                                                {Math.round(course.progressPct || 0)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1" style={{ background: 'var(--raw-surface-highest)' }}>
                                            <div
                                                className="h-full"
                                                style={{ width: `${course.progressPct || 0}%`, background: 'var(--raw-accent)' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── AVAILABLE COURSES ── */}
            <section className="space-y-4">
                {student && myCourses.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="raw-label" style={{ color: 'var(--raw-slate)' }}>// CATÁLOGO</span>
                        <div className="h-px flex-1" style={{ background: 'var(--raw-outline-dim)' }} />
                    </div>
                )}

                {availableCourses.length === 0 ? (
                    <div className="py-20 text-center" style={{ border: '1px dashed var(--raw-outline-dim)' }}>
                        <p className="raw-label">No se encontraron cursos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableCourses.map((course, i) => (
                            <div
                                key={course.id}
                                className="group raw-card flex flex-col overflow-hidden relative cursor-pointer"
                                style={{ background: 'var(--raw-surface-low)', border: '1px solid var(--raw-outline-dim)', transition: 'all 0.3s ease' }}
                                onClick={() => setPreviewCourse(course)}
                            >
                                {/* Thumbnail */}
                                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--raw-surface-highest)' }}>
                                    {course.thumbnail ? (
                                        <Image src={course.thumbnail} alt={course.title} fill className="object-cover group-hover:scale-105 transition-all duration-500 opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="font-black text-6xl" style={{ color: 'var(--raw-outline-dim)' }}>
                                                {course.title.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-black/50 backdrop-blur-md rounded border border-white/10" style={{ color: 'var(--raw-accent)' }}>
                                            {course.category}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 
                                        className="font-bold leading-tight mb-2 group-hover:text-[var(--raw-accent)] transition-colors line-clamp-2"
                                        style={{ fontSize: '1.25rem', color: 'var(--raw-on-surface)' }}
                                    >
                                        {course.title}
                                    </h3>
                                    <p className="text-[13px] line-clamp-2 mb-6 flex-1" style={{ color: 'var(--raw-slate)' }}>
                                        {course.description || "Sin descripción disponible."}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className="w-3 h-3 text-[var(--raw-accent)]" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                </svg>
                                            ))}
                                        </div>
                                        <button 
                                            className="text-[10px] font-black uppercase tracking-widest border border-[var(--raw-outline-dim)] group-hover:bg-[var(--raw-accent)] group-hover:text-black group-hover:border-[var(--raw-accent)] px-4 py-2 rounded transition-all"
                                            style={{ color: 'var(--raw-on-surface)' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewCourse(course);
                                            }}
                                        >
                                            Ver Curso
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Preview Modal */}
            {previewCourse && (
                <CoursePreviewModal 
                    course={previewCourse} 
                    onClose={() => setPreviewCourse(null)} 
                    student={student}
                />
            )}
        </div>
    );
}
