import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { unlockCourse } from "../../../../actions/auth";

export default async function UnlockCoursePage({
    params,
    searchParams,
}: {
    params: { courseId: string };
    searchParams: { error?: string };
}) {
    const { courseId } = await params;
    const cookieStore = await cookies();
    const hasAccess = cookieStore.has(`course_access_${courseId}`);

    if (hasAccess) {
        redirect(`/course/${courseId}`);
    }

    // Bind server action
    const unlockAction = unlockCourse.bind(null, courseId);

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[100%] bg-[var(--color-primary)] opacity-[0.15] blur-[150px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={16} /> Volver al catálogo
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-2xl glass-effect mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                        <Lock className="w-10 h-10 text-slate-300" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Curso Privado</h1>
                    <p className="text-slate-400 font-medium tracking-wide">Ingresa la contraseña para desbloquear el contenido.</p>
                </div>

                {/* Lock Card */}
                <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-[var(--color-glass-border)]">
                    {searchParams?.error === "incorrect" && (
                        <div className="mb-4 bg-red-500/20 text-red-500 text-sm p-3 rounded-lg border border-red-500/30 text-center font-medium">
                            Contraseña incorrecta. Inténtalo de nuevo.
                        </div>
                    )}

                    <form action={unlockAction} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Tu Alias o Nombre (opcional)
                            </label>
                            <input
                                type="text"
                                name="alias"
                                className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                placeholder="Ej. Hacker Anon"
                            />
                            <p className="text-xs text-slate-500 mt-1">Se usará para el foro de preguntas.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Contraseña del Curso
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-glass-border)] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[var(--color-primary)] hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 glow-accent mt-4 flex items-center justify-center gap-2"
                        >
                            <Lock size={18} />
                            Desbloquear Ahora
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <p className="text-xs text-slate-500">
                            Contraseña de prueba para todos los cursos: <strong>doacademy</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
