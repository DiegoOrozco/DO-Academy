import { getSiteConfig } from "@/lib/config";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { getStudent } from "@/lib/student-auth";
import { unstable_cache } from "next/cache";
import { calculateCourseGrade } from "@/lib/grades-utils";
import CourseCatalog from "@/components/CourseCatalog";
import NewsSlider from "@/components/NewsSlider";

const getCachedHomeConfig = unstable_cache(
    async () => await getSiteConfig("home"),
    ['home-config'],
    { revalidate: 3600 }
);

export default async function DashboardPage() {
    const student = await getStudent();

    const homeConfig = await getCachedHomeConfig() || {
        heroTitle: "Domina la Tecnología con DO Academy",
        heroSubtitle: "Accede a contenido exclusivo diseñado por expertos para llevar tus habilidades al siguiente nivel profesional.",
        heroButtonText: "Empezar Ahora",
        heroButtonLink: "/register",
        news: []
    };

    const allCourses = await prisma.course.findMany({
        where: { status: "published" },
        orderBy: { id: 'asc' },
        include: {
            weeks: {
                where: { isVisible: true },
                include: {
                    days: {
                        where: { isVisible: true },
                        include: {
                            submissions: { where: { userId: student?.id || "" } },
                            videoProgresses: { where: { userId: student?.id || "" } }
                        }
                    }
                }
            }
        }
    });

    const enrolledCourseIds = student?.enrollments.map((e: any) => e.courseId) || [];
    
    const stats = [
        { label: "ENFOQUE", n: "100%", sub: "CÓDIGO Y PROYECTOS" },
        { label: "NIVEL", n: "TECH", sub: "HERRAMIENTAS MODERNAS" },
        { label: "OBJETIVO", n: "PRO", sub: "IMPULSA TU CARRERA" }
    ];

    return (
        <div className="min-h-screen relative" style={{ background: 'var(--raw-bg)' }}>
            {/* Background Watermarks */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" style={{ opacity: 0.1 }}>
                <span className="raw-watermark top-[10%] left-[5%]">APRENDE</span>
                <span className="raw-watermark top-[40%] right-[10%]">PROGRAMA</span>
                <span className="raw-watermark bottom-[10%] left-[15%]">INNOVA</span>
            </div>

            <main className="relative z-10 pt-32 pb-40">
                {/* ── HERO SECTION ── */}
                <section className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-24 group">
                    <div className="space-y-6">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter mix-blend-difference mb-8">
                            {homeConfig.heroTitle.toUpperCase()}
                        </h1>
                        <p className="text-lg sm:text-xl font-bold text-white/40 max-w-xl leading-tight uppercase tracking-tight mix-blend-difference italic">
                            {homeConfig.heroSubtitle}
                        </p>
                    </div>

                    <div className="mt-16 flex flex-wrap gap-8 items-center">
                        <Link 
                            href={homeConfig.heroButtonLink || "/#catalog"} 
                            className="raw-btn bg-[#cde641] text-black h-20 px-12 text-lg font-black uppercase italic tracking-tighter flex items-center gap-4 hover:bg-white hover:text-black transition-all group shadow-[0_0_50px_rgba(205,230,65,0.2)]"
                        >
                            {homeConfig.heroButtonText || "Explorar Catálogo"}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </Link>
                        
                        <div className="flex gap-16 ml-auto hidden lg:flex">
                            {stats.map((stat, i) => (
                                <div key={i} className="text-right group cursor-crosshair">
                                    <div className="flex items-center justify-end gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#cde641] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.label}</span>
                                    </div>
                                    <span className="text-6xl font-black text-white tracking-tighter block mb-2">{stat.n}</span>
                                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest">{stat.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── PROFESSIONAL NEWS SLIDER (Udemy/Coursera Style) ── */}
                <section className="max-w-[1400px] mx-auto mb-32 relative px-6 lg:px-10">
                    <div className="mb-12 flex items-center justify-between border-b border-white/5 pb-8">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">TECH_INSIGHTS</h2>
                            <p className="text-[9px] font-bold text-white/30 tracking-[0.3em] uppercase">Actualidad & Futuro</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-[#cde641] animate-pulse" />
                             <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Live Updates</span>
                        </div>
                    </div>
                    
                    <NewsSlider 
                        news={Array.isArray(homeConfig.news) && homeConfig.news.length > 0 ? homeConfig.news : [
                            { title: "Dominando la IA Generativa", date: "NUEVO", grad: "from-blue-600 to-indigo-900", summary: "Aprende a construir agentes inteligentes con Gemini y OpenAI desde cero.", source: "DO Academy", search_url: "#", image_keyword: "artificial intelligence concept future" },
                            { title: "El Futuro del Desarrollo Web", date: "TENDENCIA", grad: "from-[#cde641] to-black", summary: "Descubre por qué Next.js 15 y React Server Components son el nuevo estándar.", source: "Tech Insights", search_url: "#", image_keyword: "modern web development programming code" }
                        ]} 
                    />
                </section>

                {/* Technical divider */}
                <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center gap-4 mt-32 mb-12">
                    <span className="raw-label" style={{ color: 'var(--raw-outline)', whiteSpace: 'nowrap' }}>+ CATÁLOGO_ACADÉMICO</span>
                    <div className="h-px flex-1" style={{ background: 'var(--raw-outline-dim)' }} />
                </div>

                {/* Course catalog */}
                <div id="catalog" className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-32">
                    <CourseCatalog
                        allCourses={allCourses.map(c => ({
                            id: c.id,
                            title: c.title,
                            description: c.description,
                            thumbnail: c.thumbnail,
                            status: c.status,
                            category: (c as any).category || "Programación",
                            progressPct: 0,
                            weeks: c.weeks
                        }))}
                        enrolledCourseIds={enrolledCourseIds}
                        student={student}
                    />
                </div>
            </main>

            {/* Bottom ticker banner strip */}
            <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#cde641] z-[40] flex items-center overflow-hidden select-none border-t border-black/10">
                <div className="flex whitespace-nowrap animate-marquee items-center gap-10">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-10">
                            <span className="text-[10px] font-black text-black">DO_ACADEMY_PLATFORM_V2.0</span>
                            <span className="text-[10px] font-black text-black opacity-30">//</span>
                            <span className="text-[10px] font-black text-black">APRENDIZAJE_ALTO_RENDIMIENTO</span>
                            <span className="text-[10px] font-black text-black opacity-30">//</span>
                            <span className="text-[10px] font-black text-black">IA_DRIVEN_CONTENT</span>
                            <span className="text-[10px] font-black text-black opacity-30">//</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
