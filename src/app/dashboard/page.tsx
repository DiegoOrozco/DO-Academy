import Link from "next/link";
import { Lock, PlayCircle, BookOpen } from "lucide-react";

// Mock data to demonstrate the UI - in a real app this comes from Prisma
const MOCK_COURSES = [
    {
        id: "01",
        title: "01 - Fundamentos de programación",
        description: "Aprende las bases de la lógica de programación y la sintaxis fundamental para cualquier lenguaje.",
        thumbnail: "/thumbnails/01.png",
        progress: 100,
        hasAccess: true,
    },
    {
        id: "02",
        title: "02 - Programación Orientada a Objetos",
        description: "Domina el paradigma orientado a objetos creando clases, herencia y polimorfismo.",
        thumbnail: "/thumbnails/02.png",
        progress: 45,
        hasAccess: true,
    },
    {
        id: "03",
        title: "03 - Bases de datos",
        description: "Entiende el modelado y estructuración de datos utilizando tecnologías relacionales avanzadas.",
        thumbnail: "/thumbnails/03.png",
        progress: 0,
        hasAccess: true,
    },
    {
        id: "04",
        title: "04 - Programación Avanzada",
        description: "Algoritmos complejos, estructuras de datos avanzadas y patrones de diseño empresariales.",
        thumbnail: "/thumbnails/04.png",
        progress: 0,
        hasAccess: false,
    },
    {
        id: "05",
        title: "05 - Desarrollo Seguro",
        description: "Protege tus aplicaciones implementando principios sólidos de ciberseguridad.",
        thumbnail: "/thumbnails/05.png",
        progress: 0,
        hasAccess: false,
    },
    {
        id: "06",
        title: "06 - Desarrollo asistido por IA",
        description: "Multiplica tu productividad interactuando eficientemente con Inteligencia Artificial.",
        thumbnail: "/thumbnails/06.png",
        progress: 0,
        hasAccess: false,
    },
];

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] p-6 sm:p-10 pb-20 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[100%] bg-[var(--color-primary)] opacity-[0.15] blur-[150px] rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Mis Cursos</h1>
                        <p className="text-slate-400">Continúa tu aprendizaje en el portal premium.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="glass-effect px-4 py-2 rounded-full flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
                                J
                            </div>
                            <span className="text-sm font-medium text-slate-200">Juan Estudiante</span>
                        </div>
                        <Link
                            href="/login"
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Salir
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {MOCK_COURSES.map((course) => (
                        <div
                            key={course.id}
                            className="glass-effect rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:glow-accent hover:-translate-y-1 group"
                        >
                            {/* Thumbnail Area */}
                            <div className="h-48 relative overflow-hidden bg-slate-800">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!course.hasAccess ? "opacity-50 grayscale" : ""}`}
                                />

                                {/* Access Badge */}
                                {!course.hasAccess && (
                                    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
                                        <Lock size={14} className="text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Bloqueado</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Area */}
                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="text-xl font-bold text-white mb-3 leading-tight">{course.title}</h3>
                                <p className="text-slate-400 text-sm mb-6 flex-grow">{course.description}</p>

                                {course.hasAccess ? (
                                    <div className="space-y-4 mt-auto">
                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium text-slate-400">
                                                <span>Progreso</span>
                                                <span>{course.progress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[var(--color-secondary)] rounded-full transition-all duration-1000"
                                                    style={{ width: `${course.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/course/${course.id}`}
                                            className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300"
                                        >
                                            <PlayCircle size={18} />
                                            {course.progress > 0 ? "Continuar" : "Entrar al curso"}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="mt-auto">
                                        <div className="w-full flex items-center justify-center gap-2 bg-slate-800/50 text-slate-400 font-semibold py-3 px-4 rounded-xl border border-slate-700/50 cursor-not-allowed">
                                            <Lock size={18} />
                                            No tienes acceso
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
